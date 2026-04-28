import React, { useState } from 'react'
import { useIsMobile } from '../lib/useMediaQuery.js'

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

function WineGlassIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2h8l-1 6a5 5 0 0 1-6 0L8 2z"/>
      <line x1="12" y1="13" x2="12" y2="20"/>
      <line x1="8" y1="20" x2="16" y2="20"/>
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

export default function Layout({ page, setPage, children, onSignOut, userEmail }) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Mobile top bar */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gold)' }}>
            <WineGlassIcon size={22} />
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 600 }}>
              Wine Cellar
            </div>
          </div>
          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', padding: 8, cursor: 'pointer', display: 'flex' }}
          >
            <HamburgerIcon />
          </button>
        </header>

        {/* Drawer */}
        {drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, animation: 'fadeIn 0.2s ease' }}
            />
            <aside style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100%',
              width: '78%',
              maxWidth: 320,
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.25rem',
              paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
              animation: 'slideIn 0.25s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: 'var(--gold)' }}>Menu</div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: 4 }}
                >✕</button>
              </div>

              <nav style={{ flex: 1 }}>
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setPage(id); setDrawerOpen(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '0.85rem 0.875rem',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      background: page === id ? 'rgba(201,168,76,0.12)' : 'transparent',
                      color: page === id ? 'var(--gold)' : 'var(--text)',
                      fontSize: '0.95rem',
                      fontWeight: page === id ? 500 : 400,
                      textAlign: 'left',
                    }}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </nav>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                {userEmail && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userEmail}
                  </div>
                )}
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '0.55rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', width: '100%' }}
                  >
                    Sign out
                  </button>
                )}
              </div>
            </aside>
          </>
        )}

        {/* Main content */}
        <main style={{ flex: 1, background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
      }}>
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

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
