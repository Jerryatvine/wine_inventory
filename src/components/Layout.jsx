import React from 'react'

const NAV_ITEMS = [
  { id: 'cellar', label: 'My Cellar', icon: CellarIcon },
]

function CellarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13 0h-3a2 2 0 0 1-2-2v-3"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function WineGlassIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2h8l-1 6a5 5 0 0 1-6 0L8 2z"/>
      <line x1="12" y1="13" x2="12" y2="20"/>
      <line x1="8" y1="20" x2="16" y2="20"/>
    </svg>
  )
}

export default function Layout({ page, setPage, children, onSignOut, userEmail }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gold)' }}>
            <WineGlassIcon />
            <div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.2 }}>
                Wine Cellar
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Collection Manager
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                background: page === id ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: page === id ? 'var(--gold)' : 'var(--muted)',
                fontSize: '0.875rem',
                fontWeight: page === id ? 500 : 400,
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          {userEmail && (
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </div>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 5, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', width: '100%', transition: 'color 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'var(--muted)' }}
              onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--border)' }}
            >
              Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
