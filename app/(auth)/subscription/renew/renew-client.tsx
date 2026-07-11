'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

interface RazorpayFailureResponse {
  error: { description: string; [key: string]: unknown }
}

interface RazorpayOptions {
  [key: string]: unknown
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}

const PLAN_NAME = 'starter'
const PLAN_PRICE = 999
function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }

export default function SubscriptionRenewClient() {
  const [companyName, setCompanyName] = useState('')
  const [companyId, setCompanyId]     = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [activating, setActivating]   = useState(false)
  const [error, setError]             = useState('')
  const [daysLeft, setDaysLeft]       = useState(0)
  const [isExpired, setIsExpired]     = useState(false)

  useEffect(() => {
    // Load Razorpay script
    if (!document.querySelector('script[src*="razorpay"]')) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }

    async function loadCompany() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, companies(name)')
          .eq('id', user.id)
          .single()

        if (!profile?.company_id) return

        setCompanyId(profile.company_id)

        const profileData = profile as unknown as {
          company_id: string
          companies?: { name?: string } | { name?: string }[] | null
        }
        const companiesField = profileData.companies
        const resolvedName = Array.isArray(companiesField)
          ? companiesField[0]?.name
          : companiesField?.name
        setCompanyName(resolvedName || '')

        const { data: sub } = await supabase
          .from('company_subscriptions')
          .select('trial_ends_at, status')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (sub?.trial_ends_at) {
          const expiry = new Date(sub.trial_ends_at)
          const now    = new Date()
          const diff   = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (diff <= 0) {
            setIsExpired(true)
            setDaysLeft(Math.abs(diff))
          } else {
            setIsExpired(false)
            setDaysLeft(diff)
          }
        }
      } catch (e) {
        console.error('loadCompany error:', e)
      }
    }
    loadCompany()
  }, [])

  // Webhook activate చేసేదాకా poll చేయి (max ~20 seconds)
  async function waitForActivation(company_id: string): Promise<boolean> {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const res = await fetch(`/api/subscription/status?company_id=${company_id}`)
        const data = await res.json()
        if (data.status === 'active') return true
      } catch {
        // ignore, retry
      }
    }
    return false
  }

  async function handlePayment() {
    if (!companyId) { setError('Company not loaded. Please refresh.'); return }
    setLoading(true); setError('')

    try {
      // Step 1: Razorpay Subscription create చేయి (recurring, Orders API కాదు)
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, planName: PLAN_NAME }),
      })

      const subscription = await res.json()

      if (!res.ok || !subscription.id) {
        throw new Error(subscription.error || subscription.message || `Subscription creation failed (${res.status})`)
      }

      // Step 2: Prefill కోసం user profile fetch చేయి
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile }  = await supabase
        .from('profiles').select('full_name, email, phone').eq('id', user!.id).single()

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!rzpKey) throw new Error('Payment gateway not configured. Contact support.')

      // Step 3: Razorpay Checkout — subscription_id తో open చేయి (order_id కాదు)
      const options: RazorpayOptions = {
        key: rzpKey,
        subscription_id: subscription.id,
        name: 'GK CRM',
        description: 'Interior Design — Starter Plan',
        prefill: {
          name:    profile?.full_name || '',
          email:   profile?.email    || '',
          contact: profile?.phone    || '',
        },
        theme: { color: '#B8860B' },
        handler: async (_response: RazorpaySuccessResponse) => {
          // ⚠️ ఇక్కడ DB update చేయట్లేదు — activation Razorpay webhook
          // (app/api/webhooks/razorpay/route.ts) ద్వారా server-side జరుగుతుంది.
          // Client ఇక్కడ కేవలం webhook confirm చేసేదాకా wait చేసి redirect చేస్తుంది.
          setLoading(false)
          setActivating(true)

          const activated = await waitForActivation(companyId)

          if (activated) {
            window.location.href = '/dashboard/industries/interior-design'
          } else {
            // Webhook ఇంకా రాలేదు — payment success అయ్యింది, కానీ activation delay అవుతోంది
            setActivating(false)
            setError('Payment received! Activation is taking longer than usual — refresh this page in a minute, or contact support@gkcrm.in if it doesn\'t update.')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }

      if (!window.Razorpay) throw new Error('Payment gateway not loaded. Please refresh.')
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (r: RazorpayFailureResponse) => {
        setError('Payment failed: ' + (r.error?.description || 'Unknown error'))
        setLoading(false)
      })
      setLoading(false)
      rzp.open()

    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'))
      setLoading(false)
    }
  }

  const features = ['Lead pipeline', 'Client management', 'Quotations (PDF)', 'Email support']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ping    { 75%,100%{transform:scale(2);opacity:0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .slide-up { animation: slideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .float    { animation: float 3s ease-in-out infinite; }
        .spin     { animation: spin 1s linear infinite; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'DM Sans', sans-serif", display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ borderBottom:'1px solid #E2D9C8', padding:'16px 32px', display:'flex', alignItems:'center', gap:10, background:'#F5F0E8' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#1C1712,#2d2822)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:'#F59E0B' }}>G</div>
          <div>
            <p style={{ margin:0, fontSize:15, color:'#1C1712', fontFamily:'Playfair Display, serif' }}>GK · CRM</p>
            <p style={{ margin:0, fontSize:8, color:'#B8860B', letterSpacing:'2px', textTransform:'uppercase', fontWeight:600 }}>Premium Suite</p>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px' }}>
          <div style={{ width:'100%', maxWidth:480 }}>

            {activating ? (
              <div className="slide-up" style={{ textAlign:'center', background:'#fff', borderRadius:20, padding:'48px 24px', boxShadow:'0 4px 24px rgba(28,23,18,0.07)' }}>
                <div className="spin" style={{ width:40, height:40, border:'3px solid #FDE68A', borderTopColor:'#B8860B', borderRadius:'50%', margin:'0 auto 20px' }} />
                <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:22, color:'#1C1712', margin:'0 0 8px' }}>Activating your plan...</h2>
                <p style={{ fontSize:13, color:'#9A8F82', margin:0 }}>Payment received. This usually takes a few seconds.</p>
              </div>
            ) : (
            <>
            {/* Title */}
            <div className="slide-up" style={{ textAlign:'center', marginBottom:32 }}>
              <div className="float" style={{ fontSize:52, marginBottom:16 }}>⏰</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:20, padding:'4px 14px', marginBottom:16 }}>
                <div style={{ position:'relative', width:6, height:6 }}>
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#F59E0B', opacity:0.4, animation:'ping 1.5s infinite' }} />
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#F59E0B' }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'#92400E', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                  {isExpired ? 'Trial Ended' : `${daysLeft} Days Left`}
                </span>
              </div>
              <h1 style={{ fontFamily:'Playfair Display, serif', fontSize:36, fontWeight:700, color:'#1C1712', margin:'0 0 10px', lineHeight:1.2 }}>
                {isExpired ? <>Your free trial<br /><span style={{ color:'#B8860B', fontStyle:'italic' }}>has ended</span></> : <>Renew your<br /><span style={{ color:'#B8860B', fontStyle:'italic' }}>subscription</span></>}
              </h1>
              {companyName && (
                <p style={{ fontSize:14, color:'#7A6E60', margin:0 }}>
                  <strong style={{ color:'#1C1712' }}>{companyName}</strong>
                  {isExpired && daysLeft > 0 && <span style={{ color:'#9A8F82' }}> · {daysLeft} day{daysLeft > 1 ? 's' : ''} ago</span>}
                </p>
              )}
            </div>

            {/* Plan card */}
            <div className="slide-up" style={{ background:'#fff', border:'1px solid #E2D9C8', borderRadius:20, padding:24, marginBottom:16, boxShadow:'0 4px 24px rgba(28,23,18,0.07)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🛋️</div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#1C1712' }}>Interior Design</p>
                  <p style={{ margin:0, fontSize:12, color:'#9A8F82' }}>Starter Plan · 10 users</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:0, fontSize:26, fontWeight:800, color:'#1C1712', letterSpacing:'-0.02em' }}>{fmt(PLAN_PRICE)}</p>
                  <p style={{ margin:0, fontSize:11, color:'#9A8F82' }}>per month</p>
                </div>
              </div>
              <div style={{ height:1, background:'#F0EBE1', marginBottom:16 }} />
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {features.map(f => (
                  <span key={f} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#B8860B', background:'#FEF9EE', border:'1px solid #FDE68A', padding:'5px 12px', borderRadius:20 }}>
                    <span style={{ color:'#B8860B', fontWeight:700 }}>✓</span> {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Payment card */}
            <div className="slide-up" style={{ background:'#1C1712', borderRadius:20, padding:24, boxShadow:'0 8px 40px rgba(28,23,18,0.15)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>Due today</span>
                <span style={{ fontSize:32, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>{fmt(PLAN_PRICE)}</span>
              </div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'right', margin:'0 0 20px' }}>
                ≈ {fmt(Math.round(PLAN_PRICE / 30))}/day · Renews monthly automatically
              </p>

              {error && (
                <div style={{ fontSize:12, color:'#FCA5A5', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', padding:'10px 14px', borderRadius:12, marginBottom:14 }}>
                  ⚠ {error}
                </div>
              )}

              <button onClick={handlePayment} disabled={loading || !companyId}
                style={{
                  width:'100%', padding:'15px 0', borderRadius:14, border:'none',
                  background: loading ? 'rgba(184,134,11,0.5)' : 'linear-gradient(135deg,#B8860B,#D97706)',
                  color:'#fff', fontSize:15, fontWeight:700,
                  cursor: loading || !companyId ? 'not-allowed' : 'pointer',
                  marginBottom:10, letterSpacing:'0.01em',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(184,134,11,0.35)',
                  transition:'all 0.2s',
                }}>
                {loading ? '⏳ Processing...' : !companyId ? 'Loading...' : `Pay ${fmt(PLAN_PRICE)} & Continue →`}
              </button>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>🔒</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>Secure recurring payment via Razorpay · Cancel anytime</span>
              </div>
            </div>

            <p style={{ textAlign:'center', fontSize:12, color:'#9A8F82', marginTop:20 }}>
              Need help? Contact{' '}
              <a href="mailto:support@gkcrm.in" style={{ color:'#B8860B', fontWeight:600, textDecoration:'none' }}>support@gkcrm.in</a>
            </p>
            </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
