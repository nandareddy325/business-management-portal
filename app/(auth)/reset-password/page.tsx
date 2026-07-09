'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const hash = window.location.hash
  if (hash && hash.includes('access_token')) {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount/route-driven sync, not a render-time side effect
    setReady(true)
  }
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })  
    return () => authListener.subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch fn is stable-in-practice, only rerun on listed deps
  }, [])

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4' }
    if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/4' }
    if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' }
    return { label: 'Medium', color: 'bg-amber-400', width: 'w-3/4' }
  }

  const strength = passwordStrength(password)

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
    <div className="min-h-screen flex bg-[#F7F5F1]">

      {/* ── Left Side ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-black text-white">G</div>
            <div>
              <p className="font-serif text-[16px] text-[#1C1712] tracking-wide">GK · CRM</p>
              <p className="text-[8px] text-[#B8860B] uppercase tracking-[2.5px] font-bold">Premium Suite</p>
            </div>
          </div>

          {success ? (
            /* ── Success State ── */
            <div>
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mb-6 text-3xl">✅</div>
              <h1 className="text-3xl font-bold text-[#1C1712] mb-2">Password Updated!</h1>
              <p className="text-[#7A6E60] mb-2">Your password has been reset successfully.</p>
              <p className="text-sm text-[#9A8F82]">Redirecting to login...</p>
            </div>
          ) : !ready ? (
            /* ── Verifying State ── */
            <div>
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mb-6">
                <div className="w-7 h-7 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-[#1C1712] mb-2">Verifying Link...</h1>
              <p className="text-[#7A6E60] mb-2">Please wait while we verify your reset link.</p>
              <p className="text-sm text-[#9A8F82]">Make sure you clicked the link from your email.</p>
            </div>
          ) : (
            /* ── Form State ── */
            <div>
              <p className="text-sm font-bold text-[#B8860B] uppercase tracking-widest mb-3">PASSWORD RESET</p>
              <h1 className="text-3xl font-bold text-[#1C1712] mb-2">Set New Password</h1>
              <p className="text-[#7A6E60] mb-8">Enter a strong new password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="Min 8 characters"
                      className="w-full bg-white border border-[#E2D9C8] rounded-xl px-4 py-3 pr-11 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors shadow-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8F82] hover:text-[#1C1712] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {strength && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-[#E2D9C8] rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                      </div>
                      <p className="text-[11px] text-[#9A8F82]">Strength: <span className="font-semibold">{strength.label}</span></p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError('') }}
                      placeholder="Repeat password"
                      className="w-full bg-white border border-[#E2D9C8] rounded-xl px-4 py-3 pr-11 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors shadow-sm"
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8F82] hover:text-[#1C1712] transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Match indicator */}
                  {confirm && password && (
                    <p className={`text-xs flex items-center gap-1 mt-1.5 ${password === confirm ? 'text-emerald-600' : 'text-red-500'}`}>
                      {password === confirm
                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> Passwords match</>
                        : <><AlertCircle className="w-3.5 h-3.5" /> Passwords don&apos;t match</>
                      }
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                  </p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#1C1712] hover:bg-[#2d2822] disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {loading ? 'Updating...' : 'Update Password →'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* ── Right Side — Dark Panel ── */}
      <div className="hidden lg:flex w-[45%] bg-[#1C1712] flex-col justify-between p-12 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-10">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white text-xs font-semibold tracking-wide">LIVE & TRUSTED</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-3">
            Almost<br />there!
          </h2>
          <p className="text-[#B8860B] text-2xl font-semibold mb-4">New password, fresh start.</p>
          <p className="text-white/50 text-sm leading-relaxed">
            Set a strong password and get back to managing your leads and team in seconds.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { icon: '🔐', title: 'Use 8+ Characters', desc: 'Longer passwords are more secure' },
            { icon: '💡', title: 'Mix it up', desc: 'Add uppercase letters and numbers' },
            { icon: '🛡️', title: 'Keep it unique', desc: 'Don\'t reuse passwords from other sites' },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-white text-sm font-semibold">{f.title}</p>
                <p className="text-white/40 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex gap-8 pt-6 border-t border-white/10">
          <div>
            <p className="text-white text-xl font-bold">3,800+</p>
            <p className="text-white/40 text-xs uppercase tracking-wider">Companies</p>
          </div>
          <div>
            <p className="text-white text-xl font-bold">₹120Cr+</p>
            <p className="text-white/40 text-xs uppercase tracking-wider">Revenue</p>
          </div>
          <div>
            <p className="text-white text-xl font-bold">99.9%</p>
            <p className="text-white/40 text-xs uppercase tracking-wider">Uptime</p>
          </div>
        </div>

      </div>
    </div>
  )
}