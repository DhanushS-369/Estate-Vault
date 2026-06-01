import { useState, useEffect } from 'react';
import { vaultAPI } from '../utils/api';
import { Alert, PrimaryButton, PageLoader } from '../components/UI';

const ASSET_TYPES = [
  { key: 'password', label: 'Password', icon: 'KEY' },
  { key: 'document', label: 'Docs', icon: 'DOC' },
  { key: 'crypto', label: 'Crypto', icon: 'BTC' },
  { key: 'note', label: 'Note', icon: 'TXT' },
  { key: 'other', label: 'Other', icon: 'BOX' },
];

const ASSET_ICONS = ASSET_TYPES.reduce((acc, type) => ({ ...acc, [type.key]: type.icon }), {});
const MAX_DOCUMENT_SIZE = 6 * 1024 * 1024;

const inputStyle = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  padding: '10px 12px',
  fontSize: 12,
  color: 'var(--bright)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: 10,
  letterSpacing: '0.15em',
  color: 'var(--muted)',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const compactData = (data) => Object.entries(data).reduce((next, [key, value]) => {
  if (typeof value === 'string' && value.trim()) next[key] = value.trim();
  else if (value && typeof value === 'object') next[key] = value;
  return next;
}, {});

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: 'vertical', minHeight: rows * 24 }}
      />
    </div>
  );
}

function AssetTypeButton({ type, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 102,
        minHeight: 68,
        background: selected ? 'rgba(201,168,76,0.12)' : 'var(--surface)',
        border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 4,
        color: selected ? 'var(--gold)' : 'var(--muted)',
        fontSize: 10,
        cursor: 'pointer',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <span style={{
        width: 34,
        height: 22,
        border: `1px solid ${selected ? 'var(--gold)' : 'var(--border2)'}`,
        color: selected ? 'var(--gold)' : 'var(--bright)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        letterSpacing: 0,
      }}>
        {type.icon}
      </span>
      {type.label}
    </button>
  );
}

export default function Vault() {
  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ assetType: 'password', label: '', data: {} });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const res = await vaultAPI.getVault();
      setVault(res.data.vault);
    } catch {
      setAlert({ type: 'error', msg: 'Failed to load vault.' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setData = (key, value) => {
    setForm(f => ({ ...f, data: { ...f.data, [key]: value } }));
  };

  const setAssetType = (assetType) => {
    setForm({ assetType, label: '', data: {} });
  };

  const readDocumentFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleDocumentFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_DOCUMENT_SIZE) {
      setAlert({ type: 'error', msg: 'Document must be 6MB or smaller.' });
      return;
    }

    try {
      const content = await readDocumentFile(file);
      setData('documentFile', {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        content,
      });
      if (!form.label.trim()) {
        setForm(f => ({ ...f, label: file.name.replace(/\.[^.]+$/, '') }));
      }
    } catch {
      setAlert({ type: 'error', msg: 'Could not read the selected document.' });
    }
  };

  const getValidationError = () => {
    const data = compactData(form.data);
    if (!form.label.trim()) return 'Label is required.';
    if (form.assetType === 'password' && !data.password) return 'Password assets need a password.';
    if (form.assetType === 'document' && !data.documentFile && !data.documentNumber) return 'Add a document file or document ID.';
    if (form.assetType === 'crypto' && !data.walletAddress && !data.seedPhrase && !data.privateKey) return 'Crypto assets need a wallet address, seed phrase, or private key.';
    if (form.assetType === 'note' && !data.note) return 'Note assets need note content.';
    if (form.assetType === 'other' && Object.keys(data).length === 0) return 'Add at least one detail for this asset.';
    return '';
  };

  const handleAdd = async () => {
    const validationError = getValidationError();
    if (validationError) return setAlert({ type: 'error', msg: validationError });

    setSaving(true);
    try {
      await vaultAPI.addAsset({
        assetType: form.assetType,
        label: form.label.trim(),
        data: compactData(form.data),
      });
      await load();
      setShowAdd(false);
      setForm({ assetType: 'password', label: '', data: {} });
      setAlert({ type: 'success', msg: 'Asset added and encrypted.' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to add asset.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return;
    try {
      await vaultAPI.deleteAsset(id);
      await load();
    } catch {
      setAlert({ type: 'error', msg: 'Delete failed.' });
    }
  };

  const renderTypeFields = () => {
    if (form.assetType === 'password') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Field label="Account / App" value={form.data.account} onChange={v => setData('account', v)} placeholder="Gmail, Instagram, bank portal" />
          <Field label="Username / Email" value={form.data.username} onChange={v => setData('username', v)} placeholder="name@example.com" />
          <Field label="Password" type="password" value={form.data.password} onChange={v => setData('password', v)} placeholder="Stored encrypted" />
          <Field label="Login URL" value={form.data.url} onChange={v => setData('url', v)} placeholder="https://..." />
          <Field label="Recovery Email" value={form.data.recoveryEmail} onChange={v => setData('recoveryEmail', v)} placeholder="Optional" />
          <TextAreaField label="Notes" value={form.data.notes} onChange={v => setData('notes', v)} placeholder="Backup codes, recovery details, extra context" rows={3} />
        </div>
      );
    }

    if (form.assetType === 'document') {
      const file = form.data.documentFile;
      return (
        <>
          <button
            type="button"
            onClick={() => document.getElementById('vault-document-file')?.click()}
            style={{
              width: '100%',
              minHeight: 118,
              marginBottom: 16,
              background: 'var(--surface)',
              border: '1px dashed var(--border2)',
              borderRadius: 4,
              color: file ? 'var(--green)' : 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <span style={{
              width: 42,
              height: 42,
              border: `1px solid ${file ? 'var(--green)' : 'var(--gold)'}`,
              color: file ? 'var(--green)' : 'var(--gold)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              lineHeight: 1,
            }}>
              ^
            </span>
            <span>
              <span style={{ display: 'block', color: 'var(--bright)', fontSize: 13, marginBottom: 4 }}>
                {file ? file.name : 'Upload document'}
              </span>
              <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                {file ? `${Math.ceil(file.size / 1024)} KB encrypted in vault` : 'PDF, image, Word file, or text file'}
              </span>
            </span>
          </button>
          <input
            id="vault-document-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={e => handleDocumentFile(e.target.files?.[0])}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Field label="Document Type" value={form.data.documentType} onChange={v => setData('documentType', v)} placeholder="Will, deed, policy, certificate" />
            <Field label="Issuer / Authority" value={form.data.issuer} onChange={v => setData('issuer', v)} placeholder="Bank, government office, insurer" />
            <Field label="Document ID" value={form.data.documentNumber} onChange={v => setData('documentNumber', v)} placeholder="Policy number, certificate ID" />
            <Field label="Expiry Date" type="date" value={form.data.expiryDate} onChange={v => setData('expiryDate', v)} />
            <TextAreaField label="Notes" value={form.data.notes} onChange={v => setData('notes', v)} placeholder="Where originals are kept, renewal instructions" rows={3} />
          </div>
        </>
      );
    }

    if (form.assetType === 'crypto') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Field label="Wallet / Exchange" value={form.data.walletName} onChange={v => setData('walletName', v)} placeholder="Ledger, MetaMask, Coinbase" />
          <Field label="Network / Chain" value={form.data.network} onChange={v => setData('network', v)} placeholder="Bitcoin, Ethereum, Solana" />
          <Field label="Wallet Address" value={form.data.walletAddress} onChange={v => setData('walletAddress', v)} placeholder="Public address" />
          <Field label="Account Email" value={form.data.accountEmail} onChange={v => setData('accountEmail', v)} placeholder="Exchange login email" />
          <TextAreaField label="Seed Phrase" value={form.data.seedPhrase} onChange={v => setData('seedPhrase', v)} placeholder="Recovery phrase, stored encrypted" rows={3} />
          <TextAreaField label="Private Key / Notes" value={form.data.privateKey} onChange={v => setData('privateKey', v)} placeholder="Private key, passphrase, hardware wallet location" rows={3} />
        </div>
      );
    }

    if (form.assetType === 'note') {
      return <TextAreaField label="Secure Note" value={form.data.note} onChange={v => setData('note', v)} placeholder="Write the private note to encrypt in your vault" rows={7} />;
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <Field label="Reference" value={form.data.reference} onChange={v => setData('reference', v)} placeholder="Asset reference" />
        <Field label="Location" value={form.data.location} onChange={v => setData('location', v)} placeholder="Where this can be found" />
        <TextAreaField label="Details" value={form.data.details} onChange={v => setData('details', v)} placeholder="Anything your nominee should know" rows={5} />
      </div>
    );
  };

  const renderAssetValue = (key, value) => {
    if (!value) return null;
    if (key === 'documentFile' && value.content) {
      return (
        <a href={value.content} download={value.name} style={{ color: 'var(--gold)', textDecoration: 'none' }}>
          {value.name}
        </a>
      );
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--bright)' }}>
            {vault?.vaultName || 'My Estate Vault'}
          </div>
          <div style={{ fontSize: 11, color: vault?.isLocked ? 'var(--red)' : 'var(--green)', marginTop: 4, letterSpacing: '0.1em' }}>
            {vault?.isLocked ? 'Locked' : 'Active'} - {vault?.assetCount || 0} assets
          </div>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--gold)', borderRadius: 2, color: 'var(--gold)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' }}
        >
          {showAdd ? 'Cancel' : '+ Add Asset'}
        </button>
      </div>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      {showAdd && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 4, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>New Asset</div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {ASSET_TYPES.map(type => (
              <AssetTypeButton
                key={type.key}
                type={type}
                selected={form.assetType === type.key}
                onClick={() => setAssetType(type.key)}
              />
            ))}
          </div>

          <Field
            label="Label / Name"
            value={form.label}
            onChange={value => setForm(f => ({ ...f, label: value }))}
            placeholder={
              form.assetType === 'password' ? 'Gmail account' :
              form.assetType === 'document' ? 'Life insurance policy' :
              form.assetType === 'crypto' ? 'Ledger Bitcoin wallet' :
              'Private asset'
            }
          />

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            {renderTypeFields()}
          </div>

          <PrimaryButton onClick={handleAdd} loading={saving} loadingText="Encrypting and saving...">
            Encrypt & Save
          </PrimaryButton>
        </div>
      )}

      {vault?.assets?.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: 2 }}>
          <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 12, letterSpacing: '0.2em' }}>SECURE</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'var(--bright)', marginBottom: 8 }}>Vault is empty</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Add passwords, documents, crypto keys, and notes - all encrypted at rest</div>
        </div>
      )}

      {vault?.assets?.map(asset => (
        <div key={asset.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === asset.id ? null : asset.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{ width: 36, height: 24, border: '1px solid var(--border2)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, letterSpacing: 0, flex: '0 0 auto' }}>
                {ASSET_ICONS[asset.assetType] || 'BOX'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--bright)', wordBreak: 'break-word' }}>{asset.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{asset.assetType}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '0 0 auto' }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{expanded === asset.id ? 'Collapse' : 'Open'}</span>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(asset.id); }}
                style={{ padding: '4px 10px', background: 'rgba(196,85,85,0.1)', border: '1px solid rgba(196,85,85,0.3)', borderRadius: 2, color: '#c45555', fontSize: 10, cursor: 'pointer', letterSpacing: '0.08em' }}
              >
                Delete
              </button>
            </div>
          </div>
          {expanded === asset.id && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', background: 'var(--surface)' }}>
              {Object.entries(asset).filter(([k]) => !['id', 'assetType', 'label', 'createdAt', 'error'].includes(k)).map(([k, v]) => {
                const rendered = renderAssetValue(k, v);
                return rendered ? (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.1em' }}>{k}</span>
                    <span style={{ color: 'var(--bright)', maxWidth: '65%', wordBreak: 'break-all', textAlign: 'right' }}>{rendered}</span>
                  </div>
                ) : null;
              })}
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
                Added {new Date(asset.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
