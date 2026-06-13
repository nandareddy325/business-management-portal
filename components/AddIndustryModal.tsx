'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

declare global { interface Window { Razorpay: any } }

const ALL_INDUSTRIES = [
  { id: 'interior-design', slug: 'interior-design', name: 'Interior Design', icon: '🛋️', desc: 'Projects, leads & vendors', color: '#9333EA' },
  { id: 'real-estate',     slug: 'real-estate',     name: 'Real Estate',     icon: '🏠', desc: 'Properties, site visits & deals', color: '#2563EB' },
  { id: 'hospital',        slug: 'hospital',         name: 'Hospital',        icon: '🏥', desc: 'Patients, doctors & billing', color: '#DC2626' },
  { id: 'b2b-business',    slug: 'b2b-business',    name: 'B2B Business',    icon: '🤝', desc: 'Leads, pipeline & invoices', color: '#D97706' },
  { id: 'clinics',         slug: 'clinics',          name: 'Clinics',         icon: '🩺', desc: 'Patients & prescriptions', color: '#059669' },
]

const PLANS = [
  { id: 'starter',    label: 'Starter',      price: 999,  users: '3 users',  color: '#16a34a', bg: '#f0fdf4', features: ['500 leads/month', 'Basic reports', 'Email support'] },
  { id: 'pro',        label: 'Professional', price: 2499, users: '10 users', color: '#7c3aed', bg: '#f5f3ff', features: ['Unlimited leads', 'Pipeline + HRMS', 'Priority support'] },
  { id: 'enterprise', label: 'Enterprise',   price: 5999, users: 'Unlimited',color: '#B8860B', bg: '#fffbeb', features: ['Custom branding', 'API access', 'Dedicated manager'] },
]

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }

interface Props {
  activeIndustrySlugs: string[]  // already added industries
  companyId: string
  onSuccess: () => void
  onClose: () => void
}

export default function AddIndustryModal({ activeIndustrySlugs, companyId, onSuccess, onClose }: Props) {
  const router = useRouter()
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filter out already active industries
  const availableIndustries = ALL_INDUSTRIES.filter(i => !activeIndustrySlugs.includes(i.slug))

  useEffect(() => {
    // Load Razorpay
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const selectedInd = ALL_INDUSTRIES.find(i => i.id === selectedIndustry)
  const selectedPlanData = PLANS.find(p => p.id === selectedPlan)

  async function handlePayAndAdd() {
    if (!selectedIndustry || !selectedPlan) { setError('Industry and plan select cheyyi'); return }
    setLoading(true); setError('')

    try {
      // Create Razorpay order
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPlanData!.price * 100,
          companyId,
          planConfig: { [selectedIndustry]: selectedPlan },
        }),
      })
      const order = await res.json()
      if (!order.id) throw new Error('Order create failed')

      const { data: { user } } = await supabase.auth.getUser()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'GK CRM',
        description: `Add ${selectedInd?.name} — ${selectedPlanData?.label}`,
        order_id: order.id,
        prefill: { email: user?.email || '' },
        theme: { color: '#B8860B' },
        handler: async (response: any) => {
          // Verify payment
          await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, companyId, planConfig: { [selectedIndustry]: selectedPlan } }),
          })

          // Add industry to company
          await fetch('/api/industries/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, industrySlug: selectedIndustry, plan: selectedPlan }),
          })

          onSuccess()
          router.refresh()
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err: any) {
      setError(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  if (availableIndustries.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-4xl mb-4">🎉</p>
          <h3 className="font-bold text-[#1C1712] text-lg mb-2">All industries active!</h3>
          <p className="text-[#7A6E60] text-sm mb-6">Anni 5 industries already nee account lo active ga unnai.</p>
          <button onClick={onClose} className="bg-[#1C1712] text-white px-6 py-3 rounded-xl text-sm font-bold">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2D9C8]">
          <div>
            <h2 className="font-bold text-[#1C1712] text-lg">Add New Industry</h2>
            <p className="text-xs text-[#9A8F82] mt-0.5">{availableIndustries.length} industries available to add</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center text-[#7A6E60] hover:bg-[#E2D9C8] transition-colors">✕</button>
        </div>

        <div className="p-6">

          {/* Step 1: Select Industry */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-[#9A8F82] uppercase tracking-wider mb-3">1. Choose Industry</p>
            <div className="flex flex-col gap-2">
              {availableIndustries.map(ind => {
                const sel = selectedIndustry === ind.id
                return (
                  <button key={ind.id} onClick={() => { setSelectedIndustry(ind.id); setSelectedPlan(null) }}
                    className="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
                    style={{
                      background: sel ? '#fff' : '#FAFAF8',
                      borderColor: sel ? `${ind.color}60` : '#E2D9C8',
                      boxShadow: sel ? `0 4px 16px ${ind.color}15` : 'none',
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: sel ? `${ind.color}15` : '#F5F0E8' }}>
                      {ind.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1C1712]">{ind.name}</p>
                      <p className="text-[11px] text-[#9A8F82]">{ind.desc}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: sel ? ind.color : '#DDD6CE', background: sel ? ind.color : 'transparent' }}>
                      {sel && <svg width="8" height="6" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Select Plan (only shown after industry selected) */}
          {selectedIndustry && (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-[#9A8F82] uppercase tracking-wider mb-3">
                2. Choose Plan for {selectedInd?.name}
              </p>
              <div className="flex gap-3">
                {PLANS.map(p => {
                  const sel = selectedPlan === p.id
                  return (
                    <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                      className="flex-1 p-3 rounded-xl border text-center transition-all"
                      style={{
                        border: sel ? `2px solid ${p.color}` : '1.5px solid #E2D9C8',
                        background: sel ? p.bg : '#FAFAF8',
                      }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: sel ? p.color : '#9A8F82' }}>{p.label}</p>
                      <p className="text-lg font-bold" style={{ color: sel ? '#1C1712' : '#7A6E60' }}>{fmt(p.price)}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: sel ? '#7A6E60' : '#9A8F82' }}>{p.users}</p>
                      {sel && (
                        <div className="mt-2 flex flex-col gap-1">
                          {p.features.map(f => <p key={f} className="text-[9px]" style={{ color: p.color }}>✓ {f}</p>)}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedIndustry && selectedPlan && (
            <div className="bg-[#1C1712] rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60 text-sm">Adding</span>
                <span className="text-white font-bold text-sm">{selectedInd?.icon} {selectedInd?.name}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/60 text-sm">Plan</span>
                <span className="text-white font-bold text-sm">{selectedPlanData?.label}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-white/60 text-sm">Monthly charge</span>
                <span className="text-[#B8860B] font-bold text-xl">{fmt(selectedPlanData?.price || 0)}/mo</span>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl mb-4">⚠ {error}</p>}

          {/* CTA */}
          <button
            onClick={handlePayAndAdd}
            disabled={!selectedIndustry || !selectedPlan || loading}
            className="w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: selectedIndustry && selectedPlan ? '#B8860B' : '#E2D9C8',
              color: selectedIndustry && selectedPlan ? '#fff' : '#9A8F82',
            }}>
            {loading ? 'Processing...' : selectedIndustry && selectedPlan ? `Pay ${fmt(selectedPlanData?.price || 0)} & Add Industry →` : 'Select industry & plan above'}
          </button>

          <p className="text-center text-xs text-[#9A8F82] mt-3">Secure payment via Razorpay</p>
        </div>
      </div>
    </div>
  )
}