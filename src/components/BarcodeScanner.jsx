import React, { useState, useRef, useEffect } from 'react'

export default function BarcodeScanner({ onResult, onClose }) {
  const [status, setStatus] = useState('idle') // idle | scanning | looking_up | found | error
  const [message, setMessage] = useState('')
  const videoRef = useRef()
  const readerRef = useRef()
  const streamRef = useRef()

  const stopScanner = () => {
    readerRef.current?.reset()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  const startScanning = async () => {
    setStatus('scanning')
    setMessage('')
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      videoRef.current.srcObject = stream

      reader.decodeFromStream(stream, videoRef.current, async (result, err) => {
        if (result) {
          const upc = result.getText()
          stopScanner()
          setStatus('looking_up')
          setMessage(`Found barcode: ${upc}. Looking up wine…`)
          await lookupUPC(upc)
        }
      })
    } catch (e) {
      setStatus('error')
      setMessage(e.message || 'Camera unavailable')
    }
  }

  const lookupUPC = async (upc) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${upc}.json`)
      const data = await res.json()
      if (data.status === 1) {
        const p = data.product
        const wine = {
          name: p.product_name || '',
          producer: p.brands || '',
          country: p.countries_tags?.[0]?.replace('en:', '') || '',
          notes: p.generic_name || '',
        }
        const vintage = p.product_name?.match(/\b(19|20)\d{2}\b/)?.[0]
        if (vintage) wine.vintage = parseInt(vintage)
        setStatus('found')
        setMessage(`Found: ${wine.name || upc}`)
        onResult(wine)
      } else {
        setStatus('error')
        setMessage(`Barcode ${upc} not found in database. You can enter details manually.`)
        onResult({ name: '' })
      }
    } catch {
      setStatus('error')
      setMessage('Lookup failed. Check your internet connection.')
      onResult({ name: '' })
    }
  }

  useEffect(() => () => stopScanner(), [])

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
      padding: '2rem',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '1.5rem',
        width: '100%',
        maxWidth: 480,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', margin: 0 }}>
            Scan Barcode
          </h3>
          <button className="btn-ghost" onClick={handleClose} style={{ padding: '4px 10px' }}>✕</button>
        </div>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: '#000',
            display: status === 'scanning' ? 'block' : 'none',
            minHeight: 200,
          }}
        />

        {status !== 'scanning' && (
          <div style={{
            height: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed var(--border)',
            borderRadius: 8,
            gap: 12,
            color: 'var(--muted)',
            fontSize: '0.85rem',
            textAlign: 'center',
            padding: '1rem',
          }}>
            {status === 'idle' && <>
              <div style={{ fontSize: '2rem' }}>🔍</div>
              <div>Point your camera at a wine bottle barcode</div>
            </>}
            {status === 'looking_up' && <div>
              <div style={{ marginBottom: 8 }}>⏳</div>
              <div>{message}</div>
            </div>}
            {(status === 'found' || status === 'error') && <div style={{ color: status === 'found' ? 'var(--gold)' : '#e05555' }}>
              {message}
            </div>}
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', gap: 8, justifyContent: 'center' }}>
          {(status === 'idle' || status === 'error') && (
            <button className="btn-primary" onClick={startScanning}>
              {status === 'error' ? 'Try Again' : 'Start Scanning'}
            </button>
          )}
          {status === 'scanning' && (
            <button className="btn-ghost" onClick={() => { stopScanner(); setStatus('idle') }}>
              Stop
            </button>
          )}
          <button className="btn-ghost" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
