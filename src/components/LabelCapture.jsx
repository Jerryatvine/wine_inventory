import React, { useState, useRef, useCallback } from 'react'
import { api } from '../api.js'

export default function LabelCapture({ currentPhoto, onPhotoChange }) {
  const [tab, setTab] = useState('upload')
  const [stream, setStream] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()
  const videoRef = useRef()
  const canvasRef = useRef()

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { path } = await api.uploadPhoto(file)
      onPhotoChange(path)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }, [onPhotoChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }, [handleFile])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
      setCapturing(true)
    } catch {
      setError('Camera access denied or unavailable.')
    }
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setCapturing(false)
  }

  const captureFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      stopCamera()
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      await handleFile(file)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
        <button className={`tab-btn ${tab === 'upload' ? 'active' : ''}`} onClick={() => { stopCamera(); setTab('upload') }}>
          Upload
        </button>
        <button className={`tab-btn ${tab === 'camera' ? 'active' : ''}`} onClick={() => setTab('camera')}>
          Camera
        </button>
      </div>

      {error && (
        <div style={{ fontSize: '0.8rem', color: '#e05555', marginBottom: 8 }}>{error}</div>
      )}

      {tab === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 8,
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Uploading...</div>
          ) : currentPhoto ? (
            <div>
              <img src={currentPhoto} alt="Label" style={{ maxHeight: 120, borderRadius: 6, marginBottom: 8 }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Click or drop to replace</div>
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📷</div>
              Drop an image or click to browse
            </div>
          )}
        </div>
      )}

      {tab === 'camera' && (
        <div style={{ textAlign: 'center' }}>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {capturing ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: '#000' }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                <button className="btn-primary" onClick={captureFrame}>Capture</button>
                <button className="btn-ghost" onClick={stopCamera}>Cancel</button>
              </div>
            </>
          ) : (
            <div style={{ padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 8 }}>
              {currentPhoto && (
                <img src={currentPhoto} alt="Label" style={{ maxHeight: 100, borderRadius: 6, marginBottom: 10 }} />
              )}
              <div>
                <button className="btn-ghost" onClick={startCamera}>Open Camera</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
