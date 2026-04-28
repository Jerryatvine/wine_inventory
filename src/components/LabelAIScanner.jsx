import React, { useState, useRef, useEffect } from 'react'
import { api } from '../api.js'

// Downscale an image File/Blob to a max long-edge dimension and return a JPEG blob.
// Wine labels don't need >1280px; this keeps the request payload small and the
// AI cost predictable. (Opus 4.7 charges per image token; full-res can be 3x.)
async function downscaleImage(file, maxDim = 1280, quality = 0.85) {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * ratio)
  const h = Math.round(bitmap.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // result is "data:image/jpeg;base64,XXXX" — strip the prefix
      const result = reader.result
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function LabelAIScanner({ onResult, onClose }) {
  const [tab, setTab] = useState('camera')
  const [stream, setStream] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [status, setStatus] = useState('idle') // idle | analyzing | done | error
  const [message, setMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileRef = useRef()
  const videoRef = useRef()

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setCapturing(false)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
      setCapturing(true)
      setStatus('idle')
      setMessage('')
    } catch (e) {
      setStatus('error')
      setMessage('Camera unavailable. Make sure you granted permission.')
    }
  }

  const captureFromCamera = async () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      stopCamera()
      await analyze(blob)
    }, 'image/jpeg', 0.92)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    await analyze(file)
  }

  const analyze = async (fileOrBlob) => {
    setStatus('analyzing')
    setMessage('Analyzing label…')
    setPreviewUrl(URL.createObjectURL(fileOrBlob))

    try {
      const downscaled = await downscaleImage(fileOrBlob)
      const base64 = await blobToBase64(downscaled)

      const res = await fetch('/api/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: 'image/jpeg' }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Scan failed.')
        return
      }
      if (!data.is_wine_label) {
        setStatus('error')
        setMessage(data.message || "That doesn't look like a wine label.")
        return
      }

      // Also upload the photo so it can be the wine's label_photo
      let photoPath = null
      try {
        const photoFile = new File([downscaled], 'label.jpg', { type: 'image/jpeg' })
        const uploaded = await api.uploadPhoto(photoFile)
        photoPath = uploaded.path
      } catch (e) {
        // Photo upload failed — not fatal, the user can re-attach later
        console.warn('Photo upload failed:', e)
      }

      setStatus('done')
      setMessage(`Found: ${data.name || data.producer || 'wine'} (${data.confidence} confidence)`)

      onResult({
        name: data.name,
        producer: data.producer,
        vintage: data.vintage,
        varietal: data.varietal,
        region: data.region,
        country: data.country,
        ...(photoPath ? { label_photo: photoPath } : {}),
      })
    } catch (e) {
      console.error(e)
      setStatus('error')
      setMessage(e.message || 'Scan failed.')
    }
  }

  useEffect(() => () => stopCamera(), [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '1.25rem',
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', margin: 0 }}>
            Scan Label with AI
          </h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '4px 10px' }}
          >✕</button>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.85rem' }}>
          Take a photo of the front label — the AI will read producer, vintage, varietal, and region.
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: '0.85rem' }}>
          <button className={`tab-btn ${tab === 'camera' ? 'active' : ''}`} onClick={() => { setTab('camera') }}>
            Camera
          </button>
          <button className={`tab-btn ${tab === 'upload' ? 'active' : ''}`} onClick={() => { stopCamera(); setTab('upload') }}>
            Upload
          </button>
        </div>

        {tab === 'camera' && (
          <div style={{ textAlign: 'center' }}>
            {capturing ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: '#000', maxHeight: '50vh' }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                  <button className="btn-primary" onClick={captureFromCamera} disabled={status === 'analyzing'}>
                    Capture & Analyze
                  </button>
                  <button className="btn-ghost" onClick={stopCamera}>Cancel</button>
                </div>
              </>
            ) : (
              <div style={{ padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📸</div>
                <button className="btn-primary" onClick={startCamera} disabled={status === 'analyzing'}>
                  Open Camera
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'upload' && (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 8,
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>🖼️</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Tap to choose a label photo</div>
          </div>
        )}

        {/* Status */}
        {(status !== 'idle' || previewUrl) && (
          <div style={{
            marginTop: '0.85rem',
            padding: '0.75rem',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            {previewUrl && (
              <img src={previewUrl} alt="preview" style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, fontSize: '0.85rem', minWidth: 0 }}>
              {status === 'analyzing' && <div style={{ color: 'var(--gold)' }}>⏳ {message}</div>}
              {status === 'done' && <div style={{ color: 'var(--gold)' }}>✓ {message}</div>}
              {status === 'error' && <div style={{ color: '#e07070' }}>✗ {message}</div>}
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {status === 'done' && (
            <button type="button" className="btn-primary" onClick={handleClose}>Done</button>
          )}
          {status === 'error' && (
            <button type="button" className="btn-ghost" onClick={() => { setStatus('idle'); setMessage(''); setPreviewUrl(null) }}>
              Try Again
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
