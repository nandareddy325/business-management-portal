'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

declare global { interface Window { Razorpay: any } }

const ALL_INDUSTRIES = [
  { id: 'interior-design', label: 'Interior Design', icon: '🛋️', desc: 'Projects, leads & vendors' },
  { id: 'real-estate',     label: 'Real Estate',     icon: '🏠', desc: 'Properties, site visits & deals' },
  { id: 'hospital',        label: 'Hospital',         icon: '🏥', desc: 'Patients, doctors & billing' },
  { id: 'b2b-business',    label: 'B2B Business',    icon: '🤝', desc: 'Leads, pipeline & invoices' },
  { id: 'clinics',         label: 'Clinics',          icon: '🩺', desc: 'Patients & prescriptions' },
]

const PLANS = [
  { id: 'starter',    label: 'Starter',      price: 999,  users: '3 users',   color: '#16a34a', bg: '#f0fdf4', features: ['500 leads/month', 'Basic reports', 'Email support'] },
  { id: 'pro',        label: 'Professional', price: 2499, users: '10 users',  color: '#7c3aed', bg: '#f5f3ff', features: ['Unlimited leads', 'Pipeline + HRMS', 'Priority support'] },
  { id: 'enterprise', label: 'Enterprise',   price: 5999, users: 'Unlimited', color: '#B8860B', bg: '#fffbeb', features: ['Custom branding', 'API access', 'Dedicated manager'] },
]

const BUNDLE_DISCOUNT = 0.10
function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }

export default function OnboardingPage() {
  const router = useRouter()
  const [industries, setIndustries] = useState<string[]>([])
  const [pendingSignup, setPendingSignup] = useState<any>(null)
  const [planState, setPlanState] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('gk_signup_industries')
    const pending = localStorage.getItem('gk_pending_signup')
    if (!saved) { router.push('/signup'); return }
    const parsed: string[] = JSON.parse(saved)
    setIndustries(parsed)
    if (pending) setPendingSignup(JSON.parse(pending))
    const init: Record<string, string | null> = {}
    parsed.forEach(id => init[id] = null)
    setPlanState(init)
  }, [])

  function selectPlan(indId: string, planId: string) {
    setPlanState(prev => ({ ...prev, [indId]: planId }))
  }

  const planGroups: Record<string, string[]> = {}
  PLANS.forEach(p => planGroups[p.id] = [])
  industries.forEach(indId => {
    const plan = planState[indId]
    if (plan) planGroups[plan].push(indId)
  })

  const summaryRows: { plan: typeof PLANS[0]; indIds: string[]; base: number; discount: number; final: number }[] = []
  let grandTotal = 0
  let totalSavings = 0

  PLANS.forEach(p => {
    const group = planGroups[p.id]
    if (!group.length) return
    const base = p.price * group.length
    const discount = group.length > 1 ? Math.round(base * BUNDLE_DISCOUNT) : 0
    const final = base - discount
    grandTotal += final
    totalSavings += discount
    summaryRows.push({ plan: p, indIds: group, base, discount, final })
  })

  const allSelected = industries.every(id => planState[id] !== null)

  // ── Create Supabase account after payment ──
  async function createAccount(status: 'trial' | 'active') {
    if (!pendingSignup) throw new Error('No signup data found')

    const { fullName, companyName, email, phone, password, industries: signupIndustries } = pendingSignup

    // 1. ── Get user — signUp first, fallback to signIn ──
    let userId: string | null = null

    const { data: authData, error: signupError } = await supabase.auth.signUp({ email, password })

    if (!signupError && authData?.user) {
      // ✅ Fresh new user — signup success
      userId = authData.user.id

    } else if (
      signupError?.message?.toLowerCase().includes('already registered') ||
      signupError?.message?.toLowerCase().includes('already exists') ||
      signupError?.message?.toLowerCase().includes('user already')
    ) {
      // 🔁 User already exists — sign in instead
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password })

      if (signInError || !signInData?.user) {
        throw new Error('Email already registered. Correct password enter చేయండి.')
      }
      userId = signInData.user.id

    } else if (signupError) {
      throw signupError
    }

    if (!userId) throw new Error('Could not get user ID')

    // 2. ── Existing company check ──
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle()

    if (existingProfile?.company_id) {
      // ✅ Already has company — just add NEW industries to existing company
      const companyId = existingProfile.company_id

      for (const slug of (signupIndustries || industries)) {
        const { data: ind } = await supabase
          .from('industries').select('id').eq('slug', slug).single()
        if (ind?.id) {
          await supabase.from('company_industries').upsert({
            company_id: companyId,
            industry_id: ind.id,
            plan: planState[slug] || 'starter',
            is_active: true,
          }, { onConflict: 'company_id,industry_id' })
        }
      }

      localStorage.removeItem('gk_pending_signup')
      localStorage.removeItem('gk_signup_industries')
      localStorage.removeItem('gk_company_id')

      return companyId
    }

    // 3. ── New user — Create company ──
    const { data: company, error: ce } = await supabase
      .from('companies')
      .insert({ name: companyName, plan: status })
      .select().single()
    if (ce) throw ce

    const companyId = company.id

    // 4. ── Save industries with plans ──
    for (const slug of (signupIndustries || industries)) {
      const { data: ind } = await supabase.from('industries').select('id').eq('slug', slug).single()
      if (ind?.id) {
        await supabase.from('company_industries').upsert({
          company_id: companyId,
          industry_id: ind.id,
          plan: planState[slug] || 'starter',
          is_active: true,
        }, { onConflict: 'company_id,industry_id' })
      }
    }

    // 5. ── Create profile ──
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      company_id: companyId,
      full_name: fullName,
      email,
      phone,
      role: 'tenant_admin',
    })
    if (profileErr) console.error('Profile upsert error:', profileErr)

    // 6. ── Save subscription ──
    await supabase.from('company_subscriptions').insert({
      company_id: companyId,
      plan_config: planState,
      status,
      trial_ends_at: status === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
      total_amount: grandTotal,
    })

    // 7. ── Cleanup localStorage ──
    localStorage.removeItem('gk_pending_signup')
    localStorage.removeItem('gk_signup_industries')
    localStorage.removeItem('gk_company_id')

    return companyId
  }

  function redirectAfterOnboarding() {
    if (industries.length === 1) {
      window.location.href = `/dashboard/industries/${industries[0]}`
    } else {
      window.location.href = '/dashboard'
    }
  }

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  async function handleFreeTrial() {
    if (!allSelected) { setError('Anni industries ki plan select cheyyandi'); return }
    setLoading(true); setError('')
    try {
      await createAccount('trial')
      redirectAfterOnboarding()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  async function handleCheckout() {
    if (!allSelected) { setError('Anni industries ki plan select cheyyandi'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal * 100, companyId: 'pending', planConfig: planState }),
      })
      const order = await res.json()
      if (!order.id) throw new Error(order.error || 'Order create failed')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'GK CRM',
        description: `${industries.length} Industry Plan`,
        order_id: order.id,
        prefill: {
          name: pendingSignup?.fullName || '',
          email: pendingSignup?.email || '',
          contact: pendingSignup?.phone || '',
        },
        theme: { color: '#B8860B' },
        modal: { ondismiss: () => { setLoading(false); setPaying(false) } },
        handler: async (response: any) => {
          setPaying(true)
          try {
            const companyId = await createAccount('active')
            await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, companyId, planConfig: planState }),
            })
            redirectAfterOnboarding()
          } catch (e: any) {
            setError(e.message || 'Account creation failed after payment')
            setPaying(false)
            setLoading(false)
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        setError('Payment failed: ' + response.error.description)
        setLoading(false); setPaying(false)
      })
      setLoading(false)
      rzp.open()
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
      setLoading(false)
    }
  }

  if (!industries.length) return (
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

        <div className="border-b border-[#E2D9C8] px-8 py-5 flex items-center justify-between" style={{ background: '#F5F0E8' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: '#1C1712', color: '#F59E0B' }}>G</div>
            <div>
              <p className="font-serif text-base text-[#1C1712] leading-none" style={{ fontFamily: 'Playfair Display, serif' }}>GK · CRM</p>
              <p className="text-[8px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Premium Suite</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded-full bg-emerald-500" />
            <div className="w-6 h-1 rounded-full bg-emerald-500" />
            <div className="w-6 h-1 rounded-full bg-[#B8860B]" />
            <span className="text-[11px] text-[#9A8F82] ml-2 font-medium">Step 3 of 3 — Choose Plan & Pay</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-12 slide-up">
            <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[4px] mb-3">Almost done!</p>
            <h1 className="font-serif text-4xl text-[#1C1712] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Choose a plan for each industry
            </h1>
            <p className="text-[#7A6E60] text-sm">
              {industries.length} {industries.length === 1 ? 'industry' : 'industries'} selected · Same plan lo multiple industries → 10% bundle discount
            </p>
            {pendingSignup && (
              <p className="text-[#9A8F82] text-xs mt-2">
                Setting up for <strong>{pendingSignup.companyName}</strong> · Account created after payment
              </p>
            )}
          </div>

          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px', alignItems: 'start' }}>

            <div className="flex flex-col gap-4">
              {industries.map((indId, idx) => {
                const ind = ALL_INDUSTRIES.find(i => i.id === indId)!
                if (!ind) return null
                const selectedPlan = planState[indId]
                return (
                  <div key={indId} className="slide-up" style={{ animationDelay: `${idx * 0.08}s`, opacity: 0 }}>
                    <div style={{ background: '#fff', border: '1px solid #E2D9C8', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 12px rgba(28,23,18,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <span style={{ fontSize: 26 }}>{ind.icon}</span>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#1C1712', margin: 0 }}>{ind.label}</p>
                          <p style={{ fontSize: 12, color: '#9A8F82', margin: 0 }}>{ind.desc}</p>
                        </div>
                        {selectedPlan && (
                          <div style={{ marginLeft: 'auto', fontSize: 11, background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                            ✓ Plan selected
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {PLANS.map(p => {
                          const sel = selectedPlan === p.id
                          return (
                            <button key={p.id} onClick={() => selectPlan(indId, p.id)}
                              style={{
                                flex: 1, padding: '12px 8px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                                border: sel ? `2px solid ${p.color}` : '1.5px solid #E2D9C8',
                                background: sel ? p.bg : '#FAFAF8',
                              }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: sel ? p.color : '#9A8F82', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label}</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: sel ? '#1C1712' : '#7A6E60' }}>{fmt(p.price)}</div>
                              <div style={{ fontSize: 10, color: sel ? '#7A6E60' : '#9A8F82', marginTop: 2 }}>{p.users}</div>
                              {sel && (
                                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {p.features.map(f => <div key={f} style={{ fontSize: 10, color: p.color }}>✓ {f}</div>)}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ position: 'sticky', top: 24 }}>
              <div style={{ background: '#1C1712', borderRadius: 20, padding: 26, boxShadow: '0 8px 40px rgba(28,23,18,0.18)' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 18, fontWeight: 600, textTransform: 'uppercase' }}>
                  Your plan summary
                </div>

                {summaryRows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Select plans above ☝️</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {summaryRows.map(row => (
                      <div key={row.plan.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, background: row.plan.bg, color: row.plan.color, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{row.plan.label}</span>
                            {row.discount > 0 && <span style={{ fontSize: 10, background: '#052e16', color: '#4ade80', padding: '2px 8px', borderRadius: 20 }}>-10%</span>}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{fmt(row.final)}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {row.indIds.map(id => {
                            const ind = ALL_INDUSTRIES.find(i => i.id === id)!
                            if (!ind) return null
                            return <span key={id} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6 }}>{ind.icon} {ind.label}</span>
                          })}
                        </div>
                        {row.discount > 0 && <div style={{ fontSize: 11, color: '#4ade80', marginTop: 6 }}>Bundle save: {fmt(row.discount)}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {totalSavings > 0 && (
                  <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#4ade80' }}>Total savings</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{fmt(totalSavings)}/mo</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Total / month</span>
                    <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{fmt(grandTotal)}</span>
                  </div>
                  {grandTotal > 0 && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginTop: 2 }}>
                      ≈ {fmt(Math.round(grandTotal / 30))}/day
                    </div>
                  )}
                </div>

                {error && (
                  <div style={{ fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '10px 12px', borderRadius: 10, marginBottom: 12 }}>
                    <p style={{ margin: 0 }}>⚠ {error}</p>
                    {error.includes('password') && (
                      <button
                        onClick={() => router.push('/login')}
                        style={{ marginTop: 6, fontSize: 11, color: '#fbbf24', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        → Login page కి వెళ్ళండి
                      </button>
                    )}
                  </div>
                )}

                <button onClick={handleCheckout} disabled={!allSelected || loading}
                  style={{
                    width: '100%', padding: 14, borderRadius: 12, border: 'none', marginBottom: 10,
                    cursor: allSelected && !loading ? 'pointer' : 'not-allowed',
                    background: allSelected ? '#B8860B' : 'rgba(255,255,255,0.06)',
                    color: allSelected ? '#fff' : 'rgba(255,255,255,0.2)',
                    fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? '⏳ Creating order...' : allSelected ? `Pay ${fmt(grandTotal)} →` : 'Select all plans first'}
                </button>

                <button onClick={handleFreeTrial} disabled={!allSelected || loading}
                  style={{
                    width: '100%', padding: 12, borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: allSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                    fontSize: 13, fontWeight: 500,
                    cursor: allSelected && !loading ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}>
                  {loading ? '⏳ Creating account...' : 'Start 14-day free trial instead'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
                  Account created after payment · No credit card for trial
                </p>
              </div>

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PLANS.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#EDE8DC', border: '1px solid #DDD6C8', borderRadius: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
                    <span style={{ fontSize: 12, color: '#7A6E60', flex: 1 }}>{p.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1C1712' }}>{fmt(p.price)}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}