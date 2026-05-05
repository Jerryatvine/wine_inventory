import React from 'react'

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

const DRINK_STATUS = {
  drink_now: { label: 'Ready', color: '#7ab87a', bg: 'rgba(122,184,122,0.15)' },
  hold: { label: 'Hold', color: '#c9a84c', bg: 'rgba(201,168,76,0.15)' },
  past_peak: { label: 'Past peak', color: '#e07070', bg: 'rgba(224,112,112,0.15)' },
  non_aging: { label: 'Drink young', color: '#7aa8c9', bg: 'rgba(122,168,201,0.15)' },
}

export default function WineCard({ wine, onEdit, onDelete }) {
  const { name, producer, vintage, varietal, region, country, quantity, rating, label_photo, ai_notes } = wine
  const drinkWindow = ai_notes?.drink_window
  const status = drinkWindow ? DRINK_STATUS[drinkWindow.status] : null

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Label photo */}
      <div style={{
        height: 160,
        background: 'var(--wine-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {label_photo ? (
          <img
            src={label_photo}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.2">
            <path d="M8 2h8l-1 6a5 5 0 0 1-6 0L8 2z"/>
            <line x1="12" y1="13" x2="12" y2="20"/>
            <line x1="8" y1="20" x2="16" y2="20"/>
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {vintage && (
              <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>
                {vintage}
              </div>
            )}
            <div style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text)',
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {name}
            </div>
          </div>
          {rating && (
            <span className="rating-badge" style={{ flexShrink: 0 }}>
              <StarIcon /> {rating}
            </span>
          )}
        </div>

        {producer && (
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{producer}</div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {varietal && <Chip>{varietal}</Chip>}
          {region && <Chip>{region}</Chip>}
          {country && <Chip>{country}</Chip>}
        </div>

        {status && (
          <div
            title={drinkWindow.recommendation}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              alignSelf: 'flex-start',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              background: status.bg,
              color: status.color,
              border: `1px solid ${status.color}40`,
              marginTop: 2,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 2h8l-1 6a5 5 0 0 1-6 0L8 2z"/>
              <line x1="12" y1="13" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="20" x2="16" y2="20" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {status.label}
            {drinkWindow.start_year && drinkWindow.end_year && (
              <span style={{ fontWeight: 400, opacity: 0.8 }}>
                · {drinkWindow.start_year}–{drinkWindow.end_year}
              </span>
            )}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            {quantity} {quantity === 1 ? 'bottle' : 'bottles'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onEdit(wine)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                borderRadius: 5,
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'var(--muted)' }}
              onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--border)' }}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(wine)}
              style={{
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--muted)',
                borderRadius: 5,
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.target.style.color = '#e05555'}
              onMouseLeave={e => e.target.style.color = 'var(--muted)'}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ children }) {
  return (
    <span style={{
      fontSize: '0.68rem',
      padding: '2px 7px',
      borderRadius: 99,
      background: 'rgba(74,42,42,0.6)',
      border: '1px solid var(--border)',
      color: 'var(--muted)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
