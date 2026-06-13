'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email required'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F1] px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-black text-white">G</div>
          <div>
            <p className="font-serif text-[16px] text-[#1C1712] tracking-wide">GK · CRM</p>
            <p className="text-[8px] text-[#B8860B] uppercase tracking-[2.5px] font-bold">Premium Suite</p>
          </div>
        </div>

        <div className="bg-white border border-[#E2D9C8] rounded-2xl p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📧</div>
              <h1 className="text-xl font-bold text-[#1C1712] mb-2">Check your email</h1>
              <p className="text-sm text-[#7A6E60] mb-6">
                Password reset link sent to <span className="font-semibold text-[#1C1712]">{email}</span>
              </p>
              <Link href="/login" className="text-sm text-[#B8860B] hover:underline font-medium">
                ← Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#1C1712] mb-1">Forgot Password?</h1>
              <p className="text-sm text-[#7A6E60] mb-6">Enter your email to receive a reset link</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="your@email.com"
                    className="w-full bg-[#F7F5F1] border border-[#E2D9C8] rounded-xl px-4 py-3 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors"
                  />
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#1C1712] hover:bg-[#2d2822] disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-sm text-[#7A6E60] mt-5">
                Remember your password?{' '}
                <Link href="/login" className="text-[#B8860B] hover:underline font-medium">Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}