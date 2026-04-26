import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
import Layout from './components/Layout.jsx'
import WineList from './components/WineList.jsx'
import Auth from './components/Auth.jsx'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [page, setPage] = useState('cellar')
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Loading…</div>
      </div>
    )
  }

  if (!session) return <Auth />

  return (
    <Layout page={page} setPage={setPage} onSignOut={handleSignOut} userEmail={session.user.email}>
      {page === 'cellar' && <WineList toast={toast} />}

      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 100 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? '✓ ' : '✗ '}{t.message}
          </div>
        ))}
      </div>
    </Layout>
  )
}
