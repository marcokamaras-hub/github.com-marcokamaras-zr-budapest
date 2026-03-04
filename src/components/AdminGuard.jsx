import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'

/**
 * Wraps admin routes — redirects to /admin/login if no Supabase session exists.
 * Listens for auth state changes so magic-link redirects work seamlessly.
 */
export default function AdminGuard({ children }) {
  const [session, setSession]   = useState(undefined) // undefined = still loading
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setChecking(false)
    })

    // Listen for sign-in / sign-out events (magic link callback lands here)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setChecking(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F3F0' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#3D4F3D' }} />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
