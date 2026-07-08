'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PLAN_ID = 'pro'
const PLAN_PRICE = 10000

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }

interface PendingSignup {
  fullName: string
  companyName: string
  email: string
  phone: string
  password: string
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayFailureResponse {
  error: { description: string; [key: string]: unknown }
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}

export default function OnboardingPage() {
  const router = useRouter()
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('gk_signup_industries')
    const pending = localStorage.getItem('gk_pending_signup')
    if (!saved || !pending) { router.push('/signup'); return }
    setPendingSignup(JSON.parse(pending))
  }, [router])

  // Load Razorpay script
  useEffect(() => {
    if (document.querySelector('script[src*="razorpay"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  async function createAccount(status: 'trial' | 'active') {
    if (!pendingSignup) throw new Error('No signup data found')
    const { fullName, companyName, email, phone, password } = pendingSignup

    let userId: string | null = null
    const { data: authData, error: signupError } = await supabase.auth.signUp({ email, password })

    if (!signupError && authData?.user) {
      userId = authData.user.id
    } else if (signupError?.message?.toLowerCase().includes('already')) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError || !signInData?.user) throw new Error('Email already registered. Correct password enter చేయండి.')
      userId = signInData.user.id
    } else if (signupError) {
      throw signupError
    }

    if (!userId) throw new Error('Could not get user ID')

    // Check existing company
    const { data: existingProfile } = await supabase.from('profiles').select('company_id').eq('id', userId).maybeSingle()
    if (existingProfile?.company_id) {
      localStorage.removeItem('gk_pending_signup')
      localStorage.removeItem('gk_signup_industries')
      return existingProfile.company_id
    }

    // Create company
    const { data: company, error: ce } = await supabase.from('companies').insert({ name: companyName, plan: status }).select().single()
    if (ce) throw ce
    const companyId = company.id

    // Add interior-design industry
    const { data: ind } = await supabase.from('industries').select('id').eq('slug', 'interior-design').single()
    if (ind?.id) {
      await supabase.from('company_industries').upsert({
        company_id: companyId, industry_id: ind.id, plan: PLAN_ID, is_active: true,
      }, { onConflict: 'company_id,industry_id' })
    }

    // Create profile
    await supabase.from('profiles').upsert({
      id: userId, company_id: companyId, full_name: fullName, email, phone, role: 'tenant_admin',
    })

    // Save subscription
    await supabase.from('company_subscriptions').insert({
      company_id: companyId,
      plan_config: { 'interior-design': PLAN_ID },
      status,
      trial_ends_at: status === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
      total_amount: PLAN_PRICE,
    })

    localStorage.removeItem('gk_pending_signup')
    localStorage.removeItem('gk_signup_industries')
    return companyId
  }

  async function handleFreeTrial() {
    setLoading(true); setError('')
    try {
      await createAccount('trial')
      window.location.href = '/dashboard/industries/interior-design'
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create account'))
      setLoading(false)
    }
  }

  async function handleCheckout() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: PLAN_PRICE * 100, companyId: 'pending', planConfig: { 'interior-design': PLAN_ID } }),
      })
      const order = await res.json()
      if (!order.id) throw new Error(order.error || 'Order create failed')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'GK CRM',
        description: 'Interior Design — Professional Plan',
        order_id: order.id,
        prefill: { name: pendingSignup?.fullName || '', email: pendingSignup?.email || '', contact: pendingSignup?.phone || '' },
        theme: { color: '#B8860B' },
        modal: { ondismiss: () => { setLoading(false); setPaying(false) } },
        handler: async (response: RazorpaySuccessResponse) => {
          setPaying(true)
          try {
            const companyId = await createAccount('active')
            await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, companyId, planConfig: { 'interior-design': PLAN_ID } }),
            })
            window.location.href = '/dashboard/industries/interior-design'
          } catch (e: unknown) {
            setError(getErrorMessage(e, 'Account creation failed after payment'))
            setPaying(false); setLoading(false)
          }
        },
      }

      const RazorpayCtor = (window as unknown as { Razorpay: new (options: unknown) => RazorpayInstance }).Razorpay
      const rzp = new RazorpayCtor(options)
      rzp.on('payment.failed', (response: RazorpayFailureResponse) => {
        setError('Payment failed: ' + response.error.description)
        setLoading(false); setPaying(false)
      })
      setLoading(false)
      rzp.open()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Checkout failed'))
      setLoading(false)
    }
  }

  if (!pendingSignup) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0E8' }}>
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .slide-up { animation: slideUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      <div className="min-h-screen" style={{ background: '#F5F0E8', fontFamily: "'DM Sans', sans-serif" }}>

        {paying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(28,23,18,0.7)' }}>
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-10 h-10 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold text-[#1C1712]">Creating your account...</p>
              <p className="text-sm text-[#9A8F82] mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-[#E2D9C8] px-8 py-5 flex items-center justify-between" style={{ background: '#F5F0E8' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: '#1C1712', color: '#F59E0B' }}>G</div>
            <div>
              <p className="text-base text-[#1C1712] leading-none" style={{ fontFamily: 'Playfair Display, serif' }}>GK · CRM</p>
              <p className="text-[8px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Premium Suite</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded-full bg-emerald-500" />
            <div className="w-6 h-1 rounded-full bg-emerald-500" />
            <div className="w-6 h-1 rounded-full bg-[#B8860B]" />
            <span className="text-[11px] text-[#9A8F82] ml-2 font-medium">Step 3 of 3 — Confirm &amp; Pay</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10 slide-up">
            <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[4px] mb-3">Almost done!</p>
            <h1 className="text-4xl text-[#1C1712] mb-3" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>
              Confirm your plan
            </h1>
            <p className="text-[#7A6E60] text-sm">
              Setting up for <strong>{pendingSignup.companyName}</strong>
            </p>
          </div>

          {/* Plan summary card */}
          <div className="slide-up" style={{ background: '#fff', border: '1px solid #E2D9C8', borderRadius: 20, padding: '28px 28px', boxShadow: '0 2px 12px rgba(28,23,18,0.06)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>🛋️</span>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1C1712', margin: 0 }}>Interior Design</p>
                <p style={{ fontSize: 12, color: '#9A8F82', margin: 0 }}>Projects, leads &amp; vendors</p>
              </div>
              <div style={{ marginLeft: 'auto', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Professional</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1712' }}>{fmt(PLAN_PRICE)}</div>
                <div style={{ fontSize: 10, color: '#7A6E60' }}>10 users / month</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Unlimited leads', 'Pipeline + HRMS', 'Priority support', 'Finance'].map(f => (
                <span key={f} style={{ fontSize: 11, background: '#fffbeb', color: '#B8860B', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>✓ {f}</span>
              ))}
            </div>
          </div>

          {/* Dark summary */}
          <div style={{ background: '#1C1712', borderRadius: 20, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Total / month</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{fmt(PLAN_PRICE)}</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginBottom: 20 }}>
              ≈ {fmt(Math.round(PLAN_PRICE / 30))}/day
            </div>

            {error && (
              <div style={{ fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '10px 12px', borderRadius: 10, marginBottom: 12 }}>
                ⚠ {error}
              </div>
            )}

            <button onClick={handleCheckout} disabled={loading}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none', marginBottom: 10,
                background: loading ? 'rgba(184,134,11,0.5)' : '#B8860B',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? '⏳ Processing...' : `Pay ${fmt(PLAN_PRICE)} →`}
            </button>

            <button onClick={handleFreeTrial} disabled={loading}
              style={{
                width: '100%', padding: 12, borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              Start 14-day free trial instead
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
              Account created after confirmation
            </p>
          </div>
        </div>
      </div>
    </>
  )
}