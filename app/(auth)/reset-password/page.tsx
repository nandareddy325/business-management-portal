'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }

    setSuccess(true)
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F1] px-4">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-black text-white">G</div>
          <div>
            <p className="font-serif text-[16px] text-[#1C1712] tracking-wide">GK · CRM</p>
            <p className="text-[8px] text-[#B8860B] uppercase tracking-[2.5px] font-bold">Premium Suite</p>
          </div>
        </div>

        <div className="bg-white border border-[#E2D9C8] rounded-2xl p-8 shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-[#1C1712] mb-2">Password Updated!</h1>
              <p className="text-sm text-[#7A6E60]">Redirecting to login...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#7A6E60]">Verifying reset link...</p>
              <p className="text-xs text-[#9A8F82] mt-2">Make sure you clicked the link from your email</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#1C1712] mb-1">Reset Password</h1>
              <p className="text-sm text-[#7A6E60] mb-6">Enter your new password</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">New Password</label>
                  <input type="password" value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Min 8 characters"
                    className="w-full bg-[#F7F5F1] border border-[#E2D9C8] rounded-xl px-4 py-3 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input type="password" value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                    placeholder="Repeat password"
                    className="w-full bg-[#F7F5F1] border border-[#E2D9C8] rounded-xl px-4 py-3 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-[#1C1712] hover:bg-[#2d2822] disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}