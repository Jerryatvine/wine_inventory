import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import WineCard from './WineCard.jsx'
import WineForm from './WineForm.jsx'

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}

function ListIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
}

function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}

function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 160 }} />
      <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 18, width: '80%' }} />
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
      </div>
    </div>
  )
}

export default function WineList({ toast }) {
  const [wines, setWines] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('')
  const [varietal, setVarietal] = useState('')
  const [sort, setSort] = useState('created_at')
  const [order, setOrder] = useState('desc')
  const [filters, setFilters] = useState({ countries: [], varietals: [] })
  const [formWine, setFormWine] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadWines = useCallback(async () => {
    try {
      const params = { sort, order }
      if (q) params.q = q
      if (country) params.country = country
      if (varietal) params.varietal = varietal
      const data = await api.getWines(params)
      setWines(data)
    } catch {
      toast('Failed to load wines', 'error')
    } finally {
      setLoading(false)
    }
  }, [q, country, varietal, sort, order, toast])

  useEffect(() => {
    api.getFilters().then(setFilters).catch(() => {})
  }, [wines])

  useEffect(() => {
    const t = setTimeout(loadWines, q ? 250 : 0)
    return () => clearTimeout(t)
  }, [loadWines, q])

  const handleSave = (saved) => {
    setShowForm(false)
    setFormWine(null)
    setWines(prev => {
      const exists = prev.find(w => w.id === saved.id)
      if (exists) return prev.map(w => w.id === saved.id ? saved : w)
      return [saved, ...prev]
    })
    toast(formWine ? 'Wine updated' : 'Wine added', 'success')
  }

  const handleEdit = (wine) => {
    setFormWine(wine)
    setShowForm(true)
  }

  const handleDelete = (wine) => setDeleteTarget(wine)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.deleteWine(deleteTarget.id)
      setWines(prev => prev.filter(w => w.id !== deleteTarget.id))
      toast('Wine removed', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
    setDeleteTarget(null)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 600, margin: 0, color: 'var(--text)' }}>
            My Cellar
          </h1>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
            {loading ? '…' : `${wines.length} ${wines.length === 1 ? 'bottle' : 'bottles'}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setFormWine(null); setShowForm(true) }} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <PlusIcon /> Add Wine
        </button>
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search wines…"
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        <select value={country} onChange={e => setCountry(e.target.value)} style={{ flex: '0 1 160px' }}>
          <option value="">All countries</option>
          {filters.countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={varietal} onChange={e => setVarietal(e.target.value)} style={{ flex: '0 1 180px' }}>
          <option value="">All varietals</option>
          {filters.varietals.map(v => <option key={v} value={v}>{v}</option>)}
        </select>

        <select value={`${sort}:${order}`} onChange={e => { const [s, o] = e.target.value.split(':'); setSort(s); setOrder(o) }} style={{ flex: '0 1 160px' }}>
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="name:asc">Name A–Z</option>
          <option value="vintage:desc">Vintage (new)</option>
          <option value="vintage:asc">Vintage (old)</option>
          <option value="rating:desc">Highest rated</option>
        </select>

        <div style={{ display: 'flex', gap: 4, borderRadius: 7, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {['grid', 'list'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? 'var(--gold)' : 'transparent',
                border: 'none',
                color: view === v ? '#1a0f0f' : 'var(--muted)',
                padding: '0.45rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
            >
              {v === 'grid' ? <GridIcon /> : <ListIcon />}
            </button>
          ))}
        </div>
      </div>

      {/* Wine Grid / List */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : wines.length === 0 ? (
        <EmptyState onAdd={() => { setFormWine(null); setShowForm(true) }} filtered={!!(q || country || varietal)} />
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {wines.map(wine => (
            <WineCard key={wine.id} wine={wine} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <TableView wines={wines} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <WineForm
          wine={formWine}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setFormWine(null) }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <>
          <div className="slide-over-backdrop" onClick={() => setDeleteTarget(null)} />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '1.5rem',
            zIndex: 60,
            width: 360,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', marginBottom: 8 }}>Remove Wine?</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              "{deleteTarget.name}" will be permanently removed from your cellar.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Remove</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState({ onAdd, filtered }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍷</div>
      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', color: 'var(--text)', marginBottom: 8 }}>
        {filtered ? 'No wines match your filters' : 'Your cellar is empty'}
      </div>
      <div style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {filtered ? 'Try adjusting your search or filters.' : 'Start adding wines to your collection.'}
      </div>
      {!filtered && (
        <button className="btn-primary" onClick={onAdd}>Add Your First Wine</button>
      )}
    </div>
  )
}

function TableView({ wines, onEdit, onDelete }) {
  const cols = ['Name', 'Producer', 'Vintage', 'Varietal', 'Region', 'Country', 'Qty', 'Rating', '']
  return (
    <div style={{ overflow: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {cols.map(c => (
              <th key={c} style={{ padding: '0.6rem 0.875rem', textAlign: 'left', color: 'var(--muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {wines.map((wine, i) => (
            <tr key={wine.id} style={{ borderBottom: i < wines.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {[wine.name, wine.producer, wine.vintage, wine.varietal, wine.region, wine.country, wine.quantity, wine.rating ? `★ ${wine.rating}` : '–'].map((val, j) => (
                <td key={j} style={{ padding: '0.65rem 0.875rem', color: j === 0 ? 'var(--text)' : 'var(--muted)', fontWeight: j === 0 ? 500 : 400, whiteSpace: j < 2 ? 'nowrap' : 'nowrap' }}>{val ?? '–'}</td>
              ))}
              <td style={{ padding: '0.65rem 0.875rem', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => onEdit(wine)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 5, padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => onDelete(wine)} style={{ background: 'none', border: 'none', color: 'var(--muted)', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>✕</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
