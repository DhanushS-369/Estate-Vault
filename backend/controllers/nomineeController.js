const crypto = require('crypto');
const Nominee = require('../models/Nominee');
const User = require('../models/User');
const { auditLog, AUDIT_ACTIONS } = require('../config/audit');
const { sendEmail, emailTemplates } = require('../config/email');

const getPublicFrontendUrl = () => {
  const configured = process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || '';
  const origins = configured.split(',').map(origin => origin.trim().replace(/\/+$/, '')).filter(Boolean);
  return origins.find(origin => origin.startsWith('https://')) || origins[0] || 'http://localhost:3000';
};

const getPublicBackendUrl = (req) => {
  const configured = process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  if (configured) return configured.trim().replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderNomineeResponsePage = ({ title, message, tone = 'success', portalUrl }) => {
  const color = tone === 'success' ? '#4caf7d' : tone === 'error' ? '#c45555' : '#c9a84c';
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safePortalUrl = portalUrl ? escapeHtml(portalUrl) : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#08080b; color:#c8c8d8; font-family:Arial,sans-serif; }
    main { width:min(440px, calc(100vw - 40px)); border:1px solid #2d2d38; background:#101017; padding:36px; box-sizing:border-box; }
    .brand { color:#c9a84c; letter-spacing:4px; font-size:18px; margin-bottom:28px; text-align:center; }
    h1 { color:${color}; font-size:26px; font-weight:400; margin:0 0 12px; }
    p { color:#9a9aaa; font-size:14px; line-height:1.7; margin:0 0 20px; }
    a { display:block; border:1px solid #c9a84c; color:#c9a84c; text-decoration:none; text-align:center; padding:13px 16px; letter-spacing:2px; font-size:11px; text-transform:uppercase; }
  </style>
</head>
<body>
  <main>
    <div class="brand">ESTATE VAULT</div>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    ${safePortalUrl ? `<a href="${safePortalUrl}">Open Nominee Portal</a>` : ''}
  </main>
</body>
</html>`;
};

const acceptNomineeByToken = async (token) => {
  if (!token) return { status: 400, success: false, error: 'Token required.' };

  const nominee = await Nominee.findOne({ invitationToken: token });
  if (!nominee) return { status: 404, success: false, error: 'Invalid or expired invitation.' };
  if (nominee.invitationExpiry < new Date()) {
    return { status: 400, success: false, error: 'Invitation has expired. Ask the vault owner to re-invite you.' };
  }
  if (nominee.status === 'accepted') {
    return { status: 400, success: false, error: 'Nomination already accepted.' };
  }

  await Nominee.findByIdAndUpdate(nominee._id, {
    status: 'accepted',
    invitationToken: null,
    invitationExpiry: null,
  });

  const owner = await User.findById(nominee.vaultOwnerId);
  if (owner) {
    const { subject, html } = emailTemplates.nomineeAccepted(owner.fullName, nominee.fullName, nominee.email);
    await sendEmail({ to: owner.email, subject, html }).catch(() => {});
  }

  return {
    status: 200,
    success: true,
    message: 'Nomination accepted. The vault owner has been notified.',
    nominee,
    owner,
  };
};

const declineNomineeByToken = async (token) => {
  if (!token) return { status: 400, success: false, error: 'Token required.' };

  const nominee = await Nominee.findOne({ invitationToken: token });
  if (!nominee) return { status: 404, success: false, error: 'Invalid or expired invitation.' };

  await Nominee.findByIdAndUpdate(nominee._id, {
    status: 'declined',
    invitationToken: null,
    invitationExpiry: null,
  });

  const owner = await User.findById(nominee.vaultOwnerId);
  if (owner) {
    const { subject, html } = emailTemplates.nomineeDeclined(owner.fullName, nominee.fullName, nominee.email);
    await sendEmail({ to: owner.email, subject, html }).catch(() => {});
  }

  return {
    status: 200,
    success: true,
    message: 'Nomination declined. The vault owner has been notified.',
    nominee,
    owner,
  };
};

// ── GET /api/nominees ──────────────────────────────
const getNominees = async (req, res) => {
  try {
    const nominees = await Nominee.find({ vaultOwnerId: req.userId })
      .sort({ priorityLevel: 1, createdAt: 1 });
    return res.json({ success: true, nominees });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch nominees.' });
  }
};

// ── POST /api/nominees ─────────────────────────────
const addNominee = async (req, res) => {
  try {
    const { fullName, email, relationship, priorityLevel, phone } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, error: 'Full name and email are required.' });
    }

    // Max 1 primary, 1 secondary
    const existingCount = await Nominee.countDocuments({ vaultOwnerId: req.userId, priorityLevel });
    if (existingCount >= 1) {
      const label = priorityLevel === 1 ? 'primary' : 'secondary';
      return res.status(400).json({ success: false, error: `You already have a ${label} nominee. Remove them first.` });
    }

    // Prevent self-nomination
    const owner = await User.findById(req.userId);
    if (owner.email === email.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'You cannot add yourself as a nominee.' });
    }

    // Invitation token (expires in 7 days, used only for accept/decline)
    const invitationToken  = crypto.randomBytes(32).toString('hex');
    const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Persistent nominee portal access token (never expires — tied to this nominee record)
    const nomineeAccessToken = crypto.randomBytes(40).toString('hex');

    const nomineeUser = await User.findOne({ email: email.toLowerCase() });

    const nominee = await Nominee.create({
      vaultOwnerId:     req.userId,
      fullName,
      email:            email.toLowerCase(),
      relationship,
      priorityLevel:    priorityLevel || 1,
      phone,
      invitationToken,
      invitationExpiry,
      nomineeAccessToken,
      nomineeUserId:    nomineeUser?._id || null,
    });

    // Email links hit the backend directly so nominees do not need Vercel access.
    const backendUrl = getPublicBackendUrl(req);
    const acceptUrl  = `${backendUrl}/api/nominees/respond?token=${invitationToken}&action=accept`;
    const declineUrl = `${backendUrl}/api/nominees/respond?token=${invitationToken}&action=decline`;

    const { subject, html } = emailTemplates.nomineeInvite(fullName, owner.fullName, acceptUrl, declineUrl);
    await sendEmail({ to: email, subject, html });

    await auditLog({
      userId: req.userId,
      action: AUDIT_ACTIONS.NOMINEE_ADDED,
      metadata: { email, priorityLevel },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Nominee added. An invitation email has been sent — they must accept before they can act as nominee.',
      nominee,
    });
  } catch (err) {
    console.error('addNominee error:', err);
    return res.status(500).json({ success: false, error: 'Failed to add nominee.' });
  }
};

// ── DELETE /api/nominees/:nomineeId ───────────────
const removeNominee = async (req, res) => {
  try {
    const nominee = await Nominee.findOneAndDelete({
      _id: req.params.nomineeId,
      vaultOwnerId: req.userId,
    });
    if (!nominee) return res.status(404).json({ success: false, error: 'Nominee not found.' });

    await auditLog({
      userId: req.userId,
      action: 'NOMINEE_REMOVED',
      metadata: { nomineeId: req.params.nomineeId },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Nominee removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to remove nominee.' });
  }
};

// ── POST /api/nominees/accept ──────────────────────
// Nominee clicks "Accept" link in email
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await acceptNomineeByToken(token);
    if (!result.success) {
      return res.status(result.status).json({ success: false, error: result.error });
    }

    const portalUrl = `${getPublicFrontendUrl()}/nominee-portal?token=${result.nominee.nomineeAccessToken}&owner=${encodeURIComponent(result.owner?.email || '')}`;
    return res.json({
      success: true,
      message: result.message,
      portalToken: result.nominee.nomineeAccessToken,
      portalUrl,
    });
  } catch (err) {
    console.error('acceptInvitation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to accept invitation.' });
  }
};

// ── POST /api/nominees/decline ─────────────────────
// Nominee clicks "Decline" link in email
const declineInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await declineNomineeByToken(token);
    if (!result.success) {
      return res.status(result.status).json({ success: false, error: result.error });
    }

    return res.json({ success: true, message: result.message });
  } catch (err) {
    console.error('declineInvitation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to decline invitation.' });
  }
};

// ── Used by deadman scheduler ──────────────────────
const respondToInvitation = async (req, res) => {
  try {
    const { token } = req.query;
    const action = req.query.action === 'decline' ? 'decline' : 'accept';
    const result = action === 'decline'
      ? await declineNomineeByToken(token)
      : await acceptNomineeByToken(token);

    if (!result.success) {
      return res
        .status(result.status)
        .send(renderNomineeResponsePage({
          title: 'Invitation Problem',
          message: result.error,
          tone: 'error',
        }));
    }

    const portalUrl = action === 'accept'
      ? `${getPublicFrontendUrl()}/nominee-portal?token=${result.nominee.nomineeAccessToken}&owner=${encodeURIComponent(result.owner?.email || '')}`
      : '';

    return res.send(renderNomineeResponsePage({
      title: action === 'accept' ? 'Nomination Accepted' : 'Nomination Declined',
      message: result.message,
      tone: action === 'accept' ? 'success' : 'info',
      portalUrl,
    }));
  } catch (err) {
    console.error('respondToInvitation error:', err);
    return res.status(500).send(renderNomineeResponsePage({
      title: 'Invitation Problem',
      message: 'Failed to process this invitation. Please ask the vault owner to resend it.',
      tone: 'error',
    }));
  }
};

const resolveActiveNominee = async (vaultOwnerId) => {
  let nominee = await Nominee.findOne({ vaultOwnerId, priorityLevel: 1, status: 'accepted' });
  if (!nominee) nominee = await Nominee.findOne({ vaultOwnerId, priorityLevel: 2, status: 'accepted' });
  return nominee;
};

module.exports = {
  getNominees,
  addNominee,
  removeNominee,
  acceptInvitation,
  declineInvitation,
  respondToInvitation,
  resolveActiveNominee,
};
