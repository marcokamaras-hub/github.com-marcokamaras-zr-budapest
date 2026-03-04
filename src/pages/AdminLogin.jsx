import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function AdminLogin() {
  const navigate  = useNavigate()
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)

  // If already logged in, redirect straight to admin
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/admin', { replace: true })
    })
  }, [navigate])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#F5F3F0' }}
    >
      <div className="w-full max-w-sm space-y-8 px-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <img
            src="https://mbbxrfjgqvximrbumbop.supabase.co/storage/v1/object/public/public/images/zrlogo_clean.png"
            alt="ZR Logo"
            className="h-14 mx-auto object-contain"
          />
          <p
            className="text-xs tracking-widest uppercase mt-3"
            style={{ color: '#3D4F3D' }}
          >
            Admin Access
          </p>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center space-y-4 py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color: '#3D4F3D' }} />
            <h2 className="text-lg font-semibold tracking-widest uppercase" style={{ color: '#3D4F3D' }}>
              Check your email
            </h2>
            <p className="text-sm text-gray-500">
              We sent a magic link to <strong>{email}</strong>.
              <br />Click it to sign in — no password needed.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-xs underline text-gray-400 hover:text-gray-600"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ── Login form ── */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs tracking-widest uppercase" style={{ color: '#3D4F3D' }}>
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs tracking-widest uppercase"
              style={{ background: '#3D4F3D', color: '#fff' }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Sending…' : 'Send magic link'}
            </Button>

            <p className="text-center text-xs text-gray-400">
              A sign-in link will be sent to your email.
              <br />No password required.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
