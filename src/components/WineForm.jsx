import React, { useState, useEffect } from 'react'
import { api } from '../api.js'
import LabelCapture from './LabelCapture.jsx'
import LabelAIScanner from './LabelAIScanner.jsx'

const EMPTY = {
  name: '', producer: '', vintage: '', varietal: '', region: '',
  country: '', quantity: 1, price: '', rating: '', notes: '', label_photo: '',
}

export default function WineForm({ wine, onSave, onClose }) {
  const [form, setForm] = useState(wine ? { ...wine, vintage: wine.vintage ?? '', price: wine.price ?? '', rating: wine.rating ?? '' } : EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showAIScanner, setShowAIScanner] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const setVal = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleAIResult = (data) => {
    // Don't auto-close — the LabelAIScanner shows a "Done" button so the user can review the status first.
    setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== null && v !== undefined)) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Wine name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        vintage: form.vintage ? parseInt(form.vintage) : null,
        price: form.price ? parseFloat(form.price) : null,
        rating: form.rating ? parseInt(form.rating) : null,
        quantity: parseInt(form.quantity) || 1,
      }
      const saved = wine
        ? await api.updateWine(wine.id, payload)
        : await api.createWine(payload)
      onSave(saved)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {showAIScanner && (
        <LabelAIScanner onResult={handleAIResult} onClose={() => setShowAIScanner(false)} />
      )}

      <div className="slide-over-backdrop" onClick={onClose} />
      <div className="slide-over-panel">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', margin: 0 }}>
            {wine ? 'Edit Wine' : 'Add Wine'}
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowAIScanner(true)}
              className="btn-ghost"
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', borderColor: 'var(--gold)' }}
              title="Take a photo of the label and let AI fill in the details"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l1.5 4.5h4.5l-3.6 2.6 1.4 4.4L12 11l-3.8 2.5 1.4-4.4L6 6.5h4.5z"/>
                <circle cx="12" cy="18" r="2"/>
              </svg>
              Scan Label
            </button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ background: '#2a1010', border: '1px solid #5a2020', borderRadius: 6, padding: '0.6rem 0.875rem', fontSize: '0.85rem', color: '#e07070' }}>
              {error}
            </div>
          )}

          <Field label="Wine Name *">
            <input value={form.name} onChange={set('name')} placeholder="e.g. Château Margaux" autoFocus />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Producer">
              <input value={form.producer} onChange={set('producer')} placeholder="Estate / Winery" />
            </Field>
            <Field label="Vintage">
              <input type="number" value={form.vintage} onChange={set('vintage')} placeholder="e.g. 2019" min="1800" max={new Date().getFullYear()} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Varietal">
              <input value={form.varietal} onChange={set('varietal')} placeholder="e.g. Cabernet Sauvignon" />
            </Field>
            <Field label="Region">
              <input value={form.region} onChange={set('region')} placeholder="e.g. Bordeaux" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Country">
              <input value={form.country} onChange={set('country')} placeholder="e.g. France" />
            </Field>
            <Field label="Quantity">
              <input type="number" value={form.quantity} onChange={set('quantity')} min="0" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Price ($)">
              <input type="number" value={form.price} onChange={set('price')} placeholder="0.00" min="0" step="0.01" />
            </Field>
            <Field label="Rating (1–100)">
              <input type="number" value={form.rating} onChange={set('rating')} placeholder="e.g. 92" min="1" max="100" />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={set('notes')} placeholder="Tasting notes, pairings, occasions…" rows={3} style={{ resize: 'vertical' }} />
          </Field>

          <Field label="Label Photo">
            <LabelCapture currentPhoto={form.label_photo} onPhotoChange={(path) => setVal('label_photo', path)} />
          </Field>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : wine ? 'Save Changes' : 'Add Wine'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  )
}
