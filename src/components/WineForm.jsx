import React, { useState, useEffect } from 'react'
import { api } from '../api.js'
import LabelCapture from './LabelCapture.jsx'
import LabelAIScanner from './LabelAIScanner.jsx'

const EMPTY = {
  name: '', producer: '', vintage: '', varietal: '', region: '',
  country: '', quantity: 1, price: '', rating: '', notes: '', label_photo: '',
}

export default function WineForm({ wine, onSave, onClose }) {
  const [form, setForm] = useState(wine ? {
    ...wine,
    vintage: wine.vintage ?? '',
    price: wine.price ?? '',
    rating: wine.rating ?? '',
    ai_notes: wine.ai_notes ?? null,
  } : { ...EMPTY, ai_notes: null })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [showAIScanner, setShowAIScanner] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const setVal = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleAIResult = (data) => {
    // Don't auto-close — the LabelAIScanner shows a "Done" button so the user can review the status first.
    setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== null && v !== undefined)) }))
  }

  const handleGenerateNotes = async () => {
    if (!form.name.trim()) { setError('Add at least the wine name first.'); return }
    setGenerating(true)
    setError(null)
    try {
      const aiNotes = await api.generateWineNotes(form)
      setForm(f => ({ ...f, ai_notes: aiNotes }))
    } catch (e) {
      setError(`AI notes failed: ${e.message}`)
    } finally {
      setGenerating(false)
    }
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
        ai_notes: form.ai_notes,
        ai_notes_at: form.ai_notes?.generated_at ?? null,
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

          <AINotesSection
            aiNotes={form.ai_notes}
            generating={generating}
            onGenerate={handleGenerateNotes}
          />

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

const STATUS_LABELS = {
  drink_now: { label: 'Ready to drink', color: '#7ab87a', bg: 'rgba(122,184,122,0.12)' },
  hold: { label: 'Hold', color: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  past_peak: { label: 'Past peak', color: '#e07070', bg: 'rgba(224,112,112,0.12)' },
  non_aging: { label: 'Drink young', color: '#7aa8c9', bg: 'rgba(122,168,201,0.12)' },
}

function AINotesSection({ aiNotes, generating, onGenerate }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
        <label style={{ marginBottom: 0 }}>AI Tasting Notes</label>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          style={{
            background: 'none',
            border: '1px solid var(--gold)',
            color: 'var(--gold)',
            borderRadius: 5,
            padding: '3px 10px',
            fontSize: '0.72rem',
            cursor: generating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            opacity: generating ? 0.6 : 1,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.5 4.5h4.5l-3.6 2.6 1.4 4.4L12 11l-3.8 2.5 1.4-4.4L6 6.5h4.5z"/>
          </svg>
          {generating ? 'Thinking…' : aiNotes ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {!aiNotes && !generating && (
        <div style={{
          padding: '0.875rem 1rem',
          background: 'rgba(201,168,76,0.04)',
          border: '1px dashed var(--border)',
          borderRadius: 8,
          fontSize: '0.8rem',
          color: 'var(--muted)',
          lineHeight: 1.5,
        }}>
          Click <strong style={{ color: 'var(--gold)' }}>Generate</strong> and AI will write tasting notes,
          a recommended drinking window, and food pairings for this wine.
        </div>
      )}

      {generating && (
        <div style={{
          padding: '1rem',
          background: 'rgba(201,168,76,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontSize: '0.85rem',
          color: 'var(--muted)',
          textAlign: 'center',
        }}>
          ✨ Consulting the sommelier…
        </div>
      )}

      {aiNotes && !generating && (
        <div style={{
          background: 'rgba(201,168,76,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
        }}>
          {/* Drink Window */}
          {aiNotes.drink_window && (() => {
            const dw = aiNotes.drink_window
            const status = STATUS_LABELS[dw.status] || STATUS_LABELS.drink_now
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{
                    background: status.bg,
                    color: status.color,
                    border: `1px solid ${status.color}40`,
                    padding: '2px 9px',
                    borderRadius: 99,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                  }}>
                    {status.label}
                  </span>
                  {(dw.start_year || dw.end_year) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {dw.start_year ?? '—'} – {dw.end_year ?? '—'}
                      {dw.peak_year && ` · peak ${dw.peak_year}`}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  {dw.recommendation}
                </div>
              </div>
            )
          })()}

          {/* Tasting Notes */}
          {aiNotes.tasting_notes && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6, fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap' }}>
              {aiNotes.tasting_notes}
            </div>
          )}

          {/* Food Pairings */}
          {aiNotes.food_pairings?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontWeight: 500 }}>
                Pair with
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {aiNotes.food_pairings.map((p, i) => (
                  <span key={i} style={{
                    fontSize: '0.74rem',
                    padding: '3px 9px',
                    borderRadius: 99,
                    background: 'rgba(74,42,42,0.6)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
