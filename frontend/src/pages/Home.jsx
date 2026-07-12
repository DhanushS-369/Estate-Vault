import { Link } from 'react-router-dom';

const securityItems = [
  { label: 'Encrypted Vault', text: 'Store passwords, accounts, documents, and recovery details behind authenticated access.' },
  { label: 'Email Verification', text: 'New accounts and sign-ins use one-time email codes before vault access is granted.' },
  { label: "Dead Man's Switch", text: 'A scheduled check-in flow can notify trusted nominees when the owner is inactive.' },
  { label: 'Nominee Control', text: 'Nominees receive secure invitations and must be approved before sensitive actions continue.' },
];

const steps = [
  'Create your Estate Vault account',
  'Add digital assets and important recovery details',
  'Choose trusted nominees',
  'Keep control while your legacy plan stays ready',
];

const navLink = {
  color: 'var(--muted)',
  textDecoration: 'none',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <nav style={{
        minHeight: 64,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(15,15,20,0.96)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, letterSpacing: '3px', color: 'var(--gold)' }}>
            ESTATE VAULT
          </div>
          <div style={{ fontSize: 8, color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 2 }}>
            Secure Digital Legacy Platform
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/login" style={{ ...navLink, padding: '8px 10px' }}>Sign In</Link>
          <Link to="/register" style={{
            ...navLink,
            color: 'var(--gold)',
            border: '1px solid var(--gold)',
            borderRadius: 2,
            padding: '9px 14px',
          }}>
            Sign Up
          </Link>
        </div>
      </nav>

      <main>
        <section style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 44,
          alignItems: 'center',
          maxWidth: 1180,
          margin: '0 auto',
          padding: '68px 28px 36px',
        }}>
          <div>
            <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>
              Private planning for digital inheritance
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(44px, 7vw, 78px)',
              lineHeight: 0.96,
              fontWeight: 300,
              color: 'var(--bright)',
              maxWidth: 760,
              marginBottom: 24,
            }}>
              Estate Vault
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.9, color: '#aaaabb', maxWidth: 660, marginBottom: 32 }}>
              A secure digital legacy platform for keeping important accounts, documents, recovery notes, and nominee instructions organized for the people you trust.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 34 }}>
              <Link to="/register" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 20px',
                color: '#0a0a0b',
                background: 'var(--gold)',
                border: '1px solid var(--gold)',
                borderRadius: 2,
                textDecoration: 'none',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}>
                Create Vault
              </Link>
              <Link to="/login" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 20px',
                color: 'var(--gold)',
                border: '1px solid var(--border2)',
                borderRadius: 2,
                textDecoration: 'none',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}>
                Sign In
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, maxWidth: 660 }}>
              {['OTP verified access', 'Trusted nominee flow', 'Secure asset storage'].map(item => (
                <div key={item} style={{ borderTop: '1px solid var(--border2)', paddingTop: 12, color: 'var(--muted)', fontSize: 11, lineHeight: 1.7 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            border: '1px solid var(--border)',
            background: 'linear-gradient(180deg, #111118 0%, #0d0d12 100%)',
            borderRadius: 2,
            minHeight: 430,
            padding: 24,
            boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 18, marginBottom: 20 }}>
              <div>
                <div style={{ color: 'var(--bright)', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Security Overview</div>
                <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 6 }}>Vault readiness display</div>
              </div>
              <div style={{ border: '1px solid rgba(76,175,125,0.35)', color: 'var(--green)', padding: '5px 8px', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Protected
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {securityItems.map((item, index) => (
                <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 14, alignItems: 'start', padding: '14px 0', borderBottom: index === securityItems.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    border: '1px solid var(--border2)',
                    color: 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                  }}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div style={{ color: 'var(--bright)', fontSize: 13, marginBottom: 5 }}>{item.label}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.7 }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '42px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 36, alignItems: 'start' }}>
            <div>
              <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>How it helps</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 300, color: 'var(--bright)', lineHeight: 1.1 }}>
                Keep essential digital information ready, private, and transferable only through the right process.
              </h2>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {steps.map((step, index) => (
                <div key={step} style={{ display: 'grid', gridTemplateColumns: '38px 1fr', gap: 14, alignItems: 'center', border: '1px solid var(--border)', background: '#0b0b10', padding: 16 }}>
                  <span style={{ color: 'var(--gold)', fontSize: 11 }}>{String(index + 1).padStart(2, '0')}</span>
                  <span style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 28px', color: 'var(--muted)', fontSize: 11 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span>Estate Vault</span>
          <a
            href="mailto:dhanushs1810@gmail.com?subject=Estate%20Vault%20Feedback%20or%20Grievance"
            style={{ color: 'var(--gold)', textDecoration: 'none' }}
          >
            Feedback or grievances: dhanushs1810@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
