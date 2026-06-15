'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchLeads, insertLeadsBulk } from '@/lib/supabase-helpers'
// AddLeadModal inline — no external import needed

const PIPELINE_STAGES = [
  { key: 'new',             label: 'New Lead',       icon: '🎯', color: '#64748B', light: '#F8FAFC', border: '#E2E8F0', accent: '#64748B' },
  { key: 'called',          label: 'Called',         icon: '📞', color: '#7C3AED', light: '#F5F3FF', border: '#DDD6FE', accent: '#7C3AED' },
  { key: 'interested',      label: 'Interested',     icon: '✨', color: '#0891B2', light: '#ECFEFF', border: '#A5F3FC', accent: '#0891B2' },
  { key: 'followup',        label: 'Follow Up',      icon: '🔄', color: '#D97706', light: '#FFFBEB', border: '#FDE68A', accent: '#D97706' },
  { key: 'sitevisit',       label: 'Site Visit',     icon: '🏠', color: '#EA580C', light: '#FFF7ED', border: '#FED7AA', accent: '#EA580C' },
  { key: 'quotation',       label: 'Quotation',      icon: '💰', color: '#2563EB', light: '#EFF6FF', border: '#BFDBFE', accent: '#2563EB' },
  { key: 'won',             label: 'Won',            icon: '✅', color: '#16A34A', light: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A' },
  { key: 'project_started', label: 'Project On',     icon: '🚀', color: '#0F766E', light: '#F0FDFA', border: '#99F6E4', accent: '#0F766E' },
  { key: 'lost',            label: 'Lost',           icon: '❌', color: '#DC2626', light: '#FEF2F2', border: '#FECACA', accent: '#DC2626' },
]

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]

type Lead = {
  id: string; name: string; phone: string; email: string
  requirement: string; budget: string; source: string; status: string; pipeline: string; date: string
}

const ini = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
const getStg = (key: string) => PIPELINE_STAGES.find(s => s.key === key) || PIPELINE_STAGES[0]

// ── Call Popup ─────────────────────────────────────────────
function CallPopup({ lead, onClose, onUpdatePipeline }: {
  lead: Lead; onClose: () => void; onUpdatePipeline: (id: string, stage: string) => void
}) {
  const [phase, setPhase] = useState<'pre' | 'calling' | 'post'>('pre')
  const [seconds, setSeconds] = useState(0)
  const [outcome, setOutcome] = useState('')
  const [note, setNote] = useState(lead.requirement !== '—' ? lead.requirement : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timer = useRef<any>(null)
  const stg = getStg(lead.pipeline)
  const g = GRADIENTS[lead.name.charCodeAt(0) % GRADIENTS.length]
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const startCall = () => {
    setPhase('calling')
    timer.current = setInterval(() => setSeconds(d => d + 1), 1000)
    window.location.href = `tel:${lead.phone}`
  }
  const endCall = () => { clearInterval(timer.current); setPhase('post') }
  useEffect(() => () => clearInterval(timer.current), [])

  const handleSave = async () => {
    if (!outcome) return
    setSaving(true)
    const stageMap: Record<string, string> = {
      interested: 'interested', followup: 'followup', sitevisit: 'sitevisit', notinterested: 'lost', called: 'called',
    }
    try {
      await supabase.from('leads').update({ pipeline_stage: stageMap[outcome] || 'called', notes: note, status: outcome === 'notinterested' ? 'Lost' : 'Active' }).eq('id', lead.id)
      onUpdatePipeline(lead.id, stageMap[outcome] || 'called')
      setSaved(true)
      setTimeout(onClose, 1200)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const outcomes = [
    { id: 'interested', label: '✨ Interested', color: '#67E8F9', desc: 'Showing interest' },
    { id: 'followup', label: '🔄 Follow Up', color: '#FCD34D', desc: 'Call back needed' },
    { id: 'sitevisit', label: '🏠 Site Visit', color: '#FB923C', desc: 'Wants to visit' },
    { id: 'notinterested', label: '❌ Not Interested', color: '#F87171', desc: 'Mark as lost' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: '#FEFCF8', border: '1px solid #E2D9C8', boxShadow: '0 24px 60px rgba(28,23,18,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="relative p-6 text-center" style={{ background: 'linear-gradient(135deg, #1C1712 0%, #2d2218 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #B8860B, transparent 60%)' }} />
          <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>✕</button>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-lg font-black text-white" style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 8px 24px ${g[0]}50` }}>
            {ini(lead.name)}
          </div>
          <p className="text-white font-bold text-lg">{lead.name}</p>
          <p className="font-mono text-base mt-1" style={{ color: '#F59E0B' }}>{lead.phone}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: stg.light, color: stg.color, border: `1px solid ${stg.border}` }}>
            {stg.icon} {stg.label}
          </span>
          {phase === 'calling' && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono text-sm">{fmt(seconds)}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-4 grid grid-cols-3 gap-2 border-b border-[#F0EBE0]">
          {[{ l: 'Budget', v: lead.budget }, { l: 'Source', v: lead.source }, { l: 'Added', v: lead.date }].map(x => (
            <div key={x.l} className="rounded-xl p-2.5 text-center" style={{ background: '#F7F5F1', border: '1px solid #EDE8E0' }}>
              <p className="text-[8px] text-[#9A8F82] uppercase tracking-wider font-bold">{x.l}</p>
              <p className="text-xs font-bold text-[#1C1712] mt-0.5 truncate">{x.v || '—'}</p>
            </div>
          ))}
        </div>

        {/* Requirement */}
        {lead.requirement && lead.requirement !== '—' && (
          <div className="px-4 py-3 border-b border-[#F0EBE0]">
            <p className="text-[9px] text-[#9A8F82] uppercase tracking-wider font-bold mb-1">Requirement</p>
            <p className="text-xs text-[#4A4035] leading-relaxed">{lead.requirement}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 space-y-3">
          {phase === 'pre' && (
            <>
              <button onClick={startCall} className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
                📞 Call Now — {lead.phone}
              </button>
              <button onClick={() => navigator.clipboard.writeText(lead.phone)} className="w-full py-2.5 rounded-xl text-xs font-bold text-[#7A6E60] hover:text-[#1C1712] transition-colors border border-[#E8E2D8] hover:bg-[#F5F0E8]">
                📋 Copy Number
              </button>
              <button onClick={onClose} className="w-full text-[#B8B0A0] text-xs hover:text-[#1C1712] py-1.5 transition-colors">Cancel</button>
            </>
          )}
          {phase === 'calling' && (
            <button onClick={endCall} className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', boxShadow: '0 8px 24px rgba(220,38,38,0.3)' }}>
              📵 End Call — {fmt(seconds)}
            </button>
          )}
          {phase === 'post' && (
            <>
              <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-wider">Call Outcome *</p>
              <div className="grid grid-cols-2 gap-2">
                {outcomes.map(o => (
                  <button key={o.id} onClick={() => setOutcome(o.id)} className="p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{ background: outcome === o.id ? `${o.color}12` : '#F7F5F1', border: `2px solid ${outcome === o.id ? o.color : '#E8E2D8'}`, boxShadow: outcome === o.id ? `0 4px 12px ${o.color}20` : 'none' }}>
                    <p className="text-xs font-black" style={{ color: outcome === o.id ? o.color : '#1C1712' }}>{o.label}</p>
                    <p className="text-[9px] text-[#9A8F82] mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Notes about this call..." rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none resize-none border-2 border-[#E8E2D8] focus:border-[#B8860B] transition-colors"
                style={{ background: '#F7F5F1' }} />
              <button onClick={handleSave} disabled={!outcome || saving || saved} className="w-full py-3.5 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
                style={{ background: saved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #1C1712, #2d2822)', boxShadow: '0 8px 24px rgba(28,23,18,0.2)' }}>
                {saved ? '✅ Saved!' : saving ? '⏳ Saving...' : '💾 Save & Update Stage'}
              </button>
              {!outcome && <p className="text-center text-[10px] text-[#9A8F82]">⚠ Select an outcome first</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add Lead Modal ─────────────────────────────────────────
const SOURCES = [
  'Instagram', 'Facebook', 'WhatsApp', 'Google Ads', 'YouTube',
  'LinkedIn', 'Justdial', 'IndiaMART', 'UrbanClap', 'Housing.com',
  '99acres', 'MagicBricks', 'Direct Walk-In', 'Referral',
  'SMS Campaign', 'Flyers', 'Hoardings', 'Newspaper Ads',
  'Lokal App', 'Email Campaign', 'Other',
]

const PROPERTY_TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Duplex', 'Penthouse', 'Commercial', 'Custom']

const BUDGET_RANGES = [
  'Under ₹5L', '₹5L - ₹10L', '₹10L - ₹20L', '₹20L - ₹50L',
  '₹50L - ₹1Cr', '₹1Cr - ₹2Cr', 'Above ₹2Cr', 'Custom',
]

function AddLeadModal({ isOpen, onClose, onLeadsAdded, industry }: {
  isOpen: boolean; onClose: () => void; onLeadsAdded: (leads: any[]) => void; industry: string
}) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: '', budget: '',
    interest: '', property_type: '', location: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setForm({ name: '', phone: '', email: '', source: '', budget: '', interest: '', property_type: '', location: '' })
    setError('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name required'); return }
    if (!form.phone.trim() || form.phone.length < 10) { setError('Valid phone number required'); return }
    setLoading(true)
    try {
      const fullPhone = form.phone.startsWith('+91') ? form.phone : `+91${form.phone}`
      await onLeadsAdded([{ ...form, phone: fullPhone }])
      reset()
    } catch (e) { setError('Failed to add lead') }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={handleClose} />
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#FEFCF8', border: '1px solid #E2D9C8', boxShadow: '0 24px 60px rgba(28,23,18,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{ background: '#FEFCF8', borderBottom: '1px solid #F0EBE0' }}>
          <div>
            <h2 className="font-bold text-[#1C1712] text-base">Add New Lead</h2>
            <p className="text-[11px] text-[#9A8F82] mt-0.5">Interior Design · New enquiry</p>
          </div>
          <button onClick={handleClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9A8F82] hover:text-[#1C1712] bg-[#F5F0E8]">✕</button>
        </div>

        <div className="p-5 space-y-4">

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="e.g. Rajesh Kumar" value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError('') }}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none border border-[#E8E2D8] focus:border-[#B8860B] transition-colors"
                style={{ background: '#F7F5F1' }} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              {/* ✅ +91 prefix box */}
              <div className="flex rounded-xl overflow-hidden border border-[#E8E2D8] focus-within:border-[#B8860B] transition-colors" style={{ background: '#F7F5F1' }}>
                <div className="flex items-center px-3 text-sm font-bold text-[#7A6E60] border-r border-[#E8E2D8] bg-[#EDE8DC] flex-shrink-0">
                  +91
                </div>
                <input type="tel" placeholder="9876543210" value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })); setError('') }}
                  className="flex-1 px-3 py-2.5 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none bg-transparent" />
              </div>
            </div>
          </div>

          {/* Source + Property Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">Lead Source</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none border border-[#E8E2D8] focus:border-[#B8860B] transition-colors appearance-none"
                style={{ background: '#F7F5F1' }}>
                <option value="">Select source...</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">Property Type</label>
              <select value={form.property_type} onChange={e => setForm(f => ({ ...f, property_type: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none border border-[#E8E2D8] focus:border-[#B8860B] transition-colors appearance-none"
                style={{ background: '#F7F5F1' }}>
                <option value="">Select type...</option>
                {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Budget + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">Budget</label>
              <select value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none border border-[#E8E2D8] focus:border-[#B8860B] transition-colors appearance-none"
                style={{ background: '#F7F5F1' }}>
                <option value="">Select budget...</option>
                {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">Location</label>
              <input type="text" placeholder="e.g. Hyderabad, Banjara Hills" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none border border-[#E8E2D8] focus:border-[#B8860B] transition-colors"
                style={{ background: '#F7F5F1' }} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">Email (optional)</label>
            <input type="email" placeholder="customer@email.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none border border-[#E8E2D8] focus:border-[#B8860B] transition-colors"
              style={{ background: '#F7F5F1' }} />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">Requirements</label>
            <textarea rows={3} placeholder="Customer wants modular kitchen, wooden flooring, budget flexible..." value={form.interest}
              onChange={e => setForm(f => ({ ...f, interest: e.target.value }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none border border-[#E8E2D8] focus:border-[#B8860B] transition-colors resize-none"
              style={{ background: '#F7F5F1' }} />
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-xl text-xs text-red-600 font-medium" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              ⚠ {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={handleClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#7A6E60] border border-[#E8E2D8] hover:bg-[#F5F0E8] transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #1C1712, #2d2822)', boxShadow: '0 4px 16px rgba(28,23,18,0.2)' }}>
              {loading ? '⏳ Adding...' : '+ Add Lead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────
export default function InteriorDesignDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlStage = searchParams.get('stage')

  const [userName, setUserName] = useState('User')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState(urlStage || 'all')
  const [activeTab, setActiveTab] = useState<'list' | 'board'>('list')
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [callLead, setCallLead] = useState<Lead | null>(null)
  const [moveModal, setMoveModal] = useState<Lead | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  useEffect(() => { setStageFilter(urlStage || 'all'); if (urlStage) setActiveTab('list') }, [urlStage])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])
        const realLeads = await fetchLeads('interior-design')
        if (realLeads.length > 0) {
          setLeads(realLeads.map((l: any) => ({
            id: l.id, name: l.lead_name || l.name || '', phone: l.phone || '',
            email: l.email || '', requirement: l.interest || l.notes || '—',
            budget: l.budget || '—', status: l.status || 'New',
            pipeline: l.pipeline_stage || 'new', source: l.source || '—', date: l.date || 'Today',
          })))
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    init()
  }, [router])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const stage = e.detail?.stage
      setStageFilter(stage === 'all' || !stage ? 'all' : stage)
      setActiveTab('list')
    }
    window.addEventListener('sidebar-stage-change', handler as EventListener)
    return () => window.removeEventListener('sidebar-stage-change', handler as EventListener)
  }, [])

  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const todayLeads = leads.filter(l => l.date === 'Today' || l.date === todayStr)
  const wonLeads = leads.filter(l => l.pipeline === 'won' || l.pipeline === 'project_started')
  const activeLeads = leads.filter(l => !['won', 'lost', 'project_started'].includes(l.pipeline))
  const followupsDue = leads.filter(l => l.pipeline === 'followup')
  const siteVisits = leads.filter(l => l.pipeline === 'sitevisit')
  const quotationsPending = leads.filter(l => l.pipeline === 'quotation')
  const winRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0

  const filteredLeads = leads.filter(l => {
    const ms = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
    const mf = stageFilter === 'all' ? true : l.pipeline === stageFilter
    return ms && mf
  })

  const updatePipeline = async (leadId: string, stage: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipeline: stage } : l))
    await supabase.from('leads').update({ pipeline_stage: stage }).eq('id', leadId)
    setMoveModal(null); setCallLead(null)
  }

  const handleLeadsAdded = async (newLeads: any[]) => {
    try {
      const validLeads = newLeads.filter(l => l.name?.trim() && l.phone?.trim())
      if (!validLeads.length) { setLeadModalOpen(false); return }
      const phones = validLeads.map(l => l.phone.trim())
      const { data: existing } = await supabase.from('leads').select('phone').in('phone', Array.from(new Set(phones)))
      const existingPhones = new Set((existing || []).map((e: any) => e.phone))
      const fresh = validLeads.filter(l => !existingPhones.has(l.phone.trim()))
      if (!fresh.length) { setLeadModalOpen(false); return }
      const inserted = await insertLeadsBulk(fresh.map(l => ({ name: l.name, phone: l.phone, email: l.email || '', source: l.source || '', interest: l.interest || '', budget: l.budget || '', status: l.status || 'new', pipeline_stage: 'new', industry: 'interior-design' })))
      if (inserted.length > 0) setLeads(prev => [...inserted.map((l: any) => ({ id: l.id, name: l.lead_name || l.name || '', phone: l.phone || '', email: l.email || '', requirement: l.interest || '—', budget: l.budget || '—', status: l.status || 'New', pipeline: l.pipeline_stage || 'new', source: l.source || '—', date: 'Today' })), ...prev])
    } catch (err) { console.error(err) }
    finally { setLeadModalOpen(false) }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <style>{`
        .dash-bg { background: #F5F0E8; min-height: 100vh; }
        .glass { background: #FFFFFF; border: 1px solid #E8E2D8; }
        .glass-hover:hover { background: #FDFAF8; border-color: #D5CFC3; }
        .scroll-x { scrollbar-width: none; }
        .scroll-x::-webkit-scrollbar { display: none; }
      `}</style>

      <main className="dash-bg flex-1 p-4 md:p-6 space-y-5">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1C1712]">{greeting}, {userName} 👋</h1>
            <p className="text-sm mt-1 text-[#9A8F82]">
              {leads.length} leads total · {activeLeads.length} active · {winRate}% conversion
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setActiveTab(t => t === 'list' ? 'board' : 'list')}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all glass glass-hover text-white/60 hover:text-white">
              {activeTab === 'list' ? '⬡ Board' : '≡ List'}
            </button>
            <button onClick={() => setLeadModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-black text-white"
              style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 4px 20px rgba(184,134,11,0.4)' }}>
              + Add Lead
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ROW 1 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Follow-ups Due', value: followupsDue.length, icon: '🔄', color: '#FCD34D', sub: 'Need callback', onClick: () => { setStageFilter('followup'); setActiveTab('list') } },
            { label: 'Site Visits',    value: siteVisits.length,   icon: '🏠', color: '#FB923C', sub: 'Scheduled',    onClick: () => { setStageFilter('sitevisit'); setActiveTab('list') } },
            { label: 'Quotations',     value: quotationsPending.length, icon: '💰', color: '#60A5FA', sub: 'Pending', onClick: () => { setStageFilter('quotation'); setActiveTab('list') } },
            { label: 'Won Deals',      value: wonLeads.length,     icon: '✅', color: '#4ADE80', sub: `${winRate}% rate` },
          ].map((card, i) => (
            <button key={i} onClick={card.onClick}
              className={`glass glass-hover rounded-2xl p-4 text-left transition-all group ${card.onClick ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ borderColor: card.onClick ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{card.icon}</span>
                {card.onClick && <span className="text-[10px] text-white/20 group-hover:text-white/50 transition-colors">→</span>}
              </div>
              <p className="text-3xl font-black text-[#1C1712] mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{card.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: card.color }}>{card.label}</p>
              <p className="text-[10px] mt-0.5 text-[#B8B0A0]">{card.sub}</p>
            </button>
          ))}
        </div>

        {/* ── KPI ROW 2 — thin bar ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today's Leads", value: todayLeads.length, color: '#60A5FA' },
            { label: 'Active Pipeline', value: activeLeads.length, color: '#FCD34D' },
            { label: 'Total Leads', value: leads.length, color: '#A78BFA' },
          ].map((s, i) => (
            <div key={i} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── PIPELINE STRIP ── */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#9A8F82] uppercase tracking-widest">Pipeline</p>
            <p className="text-[10px] text-[#B8B0A0]">{leads.length} leads</p>
          </div>
          <div className="flex gap-2 scroll-x overflow-x-auto pb-1">
            {PIPELINE_STAGES.map(stage => {
              const count = leads.filter(l => l.pipeline === stage.key).length
              const pct = leads.length > 0 ? (count / leads.length) * 100 : 0
              const active = stageFilter === stage.key
              return (
                <button key={stage.key}
                  onClick={() => { setStageFilter(s => s === stage.key ? 'all' : stage.key); setActiveTab('list') }}
                  className="flex-1 min-w-[72px] p-2.5 rounded-xl text-center transition-all relative overflow-hidden"
                  style={{
                    background: active ? `${stage.accent}25` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? stage.accent + '60' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: active ? `0 0 20px ${stage.accent}25` : 'none',
                  }}>
                  <p className="text-base mb-1">{stage.icon}</p>
                  <p className="text-lg font-black text-[#1C1712]">{count}</p>
                  <p className="text-[7px] font-bold uppercase leading-tight mt-0.5" style={{ color: active ? stage.color : '#9A8F82' }}>{stage.label}</p>
                  {/* progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: stage.accent }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {activeTab === 'list' && (
          <div className="glass rounded-2xl overflow-hidden">
            {/* Filters */}
            <div className="px-5 py-4 border-b border-[#F0EBE0] flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setStageFilter('all')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: stageFilter === 'all' ? '#1C1712' : '#F5F0E8', color: stageFilter === 'all' ? 'white' : '#7A6E60', border: '1px solid #E8E2D8' }}>
                  All {leads.length}
                </button>
                {PIPELINE_STAGES.map(s => {
                  const c = leads.filter(l => l.pipeline === s.key).length
                  if (!c) return null
                  return (
                    <button key={s.key} onClick={() => setStageFilter(s.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: stageFilter === s.key ? `${s.accent}25` : 'rgba(255,255,255,0.04)',
                        color: stageFilter === s.key ? s.color : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${stageFilter === s.key ? s.accent + '50' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                      {s.icon} {c}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl pl-8 pr-8 py-2 text-xs text-[#1C1712] placeholder:text-[#C4BAB0] outline-none bg-[#F7F5F1] border border-[#E8E2D8] focus:border-[#B8860B] transition-colors" />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A8F82] text-xs">🔍</span>
                  {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A8F82] hover:text-red-500 text-xs">✕</button>}
                </div>
                <button onClick={() => setLeadModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'rgba(184,134,11,0.2)', border: '1px solid rgba(184,134,11,0.3)', color: '#FCD34D' }}>
                  + Add
                </button>
              </div>
            </div>

            {/* Active filter banner */}
            {stageFilter !== 'all' && (
              <div className="px-5 py-2 flex items-center gap-2" style={{ background: `${getStg(stageFilter).accent}10`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>{getStg(stageFilter).icon}</span>
                <p className="text-xs font-semibold" style={{ color: getStg(stageFilter).color }}>
                  {getStg(stageFilter).label} — {filteredLeads.length} leads
                </p>
                <button onClick={() => setStageFilter('all')} className="ml-auto text-[10px] text-white/30 hover:text-white/60">✕ Clear</button>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-white/30">Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">{leads.length === 0 ? '🎯' : '🔍'}</p>
                <p className="text-sm font-bold text-white/60">{leads.length === 0 ? 'No leads yet' : 'No results'}</p>
                <p className="text-xs text-white/30 mt-1">{leads.length === 0 ? 'Add your first lead' : 'Try clearing filter'}</p>
                {leads.length === 0 && (
                  <button onClick={() => setLeadModalOpen(true)} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'rgba(184,134,11,0.2)', border: '1px solid rgba(184,134,11,0.3)' }}>
                    + Add First Lead
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto scroll-x">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['#', 'Lead', 'Phone', 'Requirement', 'Budget', 'Stage', 'Date', ''].map((h, i) => (
                        <th key={i} className="text-left text-[9px] font-black uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5 text-[#9A8F82] border-b border-[#F0EBE0]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead, i) => {
                      const stg = getStg(lead.pipeline)
                      const g = GRADIENTS[i % GRADIENTS.length]
                      const isHov = hoveredRow === lead.id
                      return (
                        <tr key={lead.id}
                          onMouseEnter={() => setHoveredRow(lead.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className="transition-all"
                          style={{ borderBottom: '1px solid #F7F5F1', background: isHov ? '#FDFAF8' : 'white' }}>
                          <td className="pl-5 pr-2 py-3.5">
                            <span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span>
                          </td>
                          <td className="pl-2 pr-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 4px 12px ${g[0]}40` }}>
                                {ini(lead.name)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#1C1712]">{lead.name}</p>
                                <p className="text-[10px] text-[#B8B0A0]">{lead.email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-mono font-semibold text-[#1C1712]">{lead.phone}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs max-w-[120px] truncate text-[#7A6E60]">{lead.requirement}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs font-bold text-[#1C1712]">{lead.budget}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                              style={{ background: `${stg.accent}18`, border: `1px solid ${stg.accent}40`, color: stg.color }}>
                              {stg.icon} {stg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-[10px] whitespace-nowrap text-[#B8B0A0]">{lead.date}</p>
                          </td>
                          <td className="pr-5 pl-2 py-3.5">
                            <div className={`flex gap-1.5 items-center transition-all duration-200 ${isHov ? 'opacity-100' : 'opacity-0'}`}>
                              <button onClick={() => setMoveModal(lead)}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 bg-[#F5F0E8] text-[#1C1712] border border-[#E8E2D8]">
                                Move
                              </button>
                              <button onClick={() => setCallLead(lead)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110"
                                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredLeads.length > 0 && (
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] text-[#9A8F82]">
                  <span className="text-[#1C1712] font-bold">{filteredLeads.length}</span> of <span className="text-[#1C1712] font-bold">{leads.length}</span> leads
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── BOARD VIEW ── */}
        {activeTab === 'board' && (
          <div className="flex gap-3 overflow-x-auto scroll-x pb-4" style={{ minHeight: 420 }}>
            {PIPELINE_STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.pipeline === stage.key)
              return (
                <div key={stage.key} className="flex-shrink-0 w-60 flex flex-col rounded-2xl overflow-hidden"
                  style={{ background: '#fff', border: '1px solid #E8E2D8', boxShadow: '0 2px 12px rgba(28,23,18,0.06)' }}>

                  {/* Column header */}
                  <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                    style={{ background: stage.light, borderBottom: `2px solid ${stage.accent}` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: `${stage.accent}18`, border: `1px solid ${stage.accent}30` }}>
                        {stage.icon}
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: stage.color }}>{stage.label}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: stageLeads.length > 0 ? stage.accent : '#D5CFC3' }}>
                      {stageLeads.length}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-2.5 flex flex-col gap-2 overflow-y-auto" style={{ minHeight: 200, background: '#FAFAF8' }}>
                    {stageLeads.map((lead, i) => {
                      const g = GRADIENTS[i % GRADIENTS.length]
                      return (
                        <div key={lead.id} onClick={() => setMoveModal(lead)}
                          className="rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 group"
                          style={{ background: '#fff', border: '1px solid #EDE8E0', boxShadow: '0 1px 6px rgba(28,23,18,0.06)' }}>

                          {/* Card top accent */}
                          <div className="h-1 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${g[0]}, ${g[1]})` }} />

                          <div className="p-3">
                            {/* Lead name + avatar */}
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 8px ${g[0]}40` }}>
                                {ini(lead.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-[#1C1712] truncate">{lead.name}</p>
                                <p className="text-[10px] text-[#9A8F82] font-mono">{lead.phone}</p>
                              </div>
                            </div>

                            {/* Budget pill */}
                            {lead.budget !== '—' && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg mb-2"
                                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <span className="text-[9px]">💰</span>
                                <span className="text-[10px] font-bold text-amber-700">{lead.budget}</span>
                              </div>
                            )}

                            {/* Requirement */}
                            {lead.requirement && lead.requirement !== '—' && (
                              <p className="text-[10px] text-[#9A8F82] mb-2.5 line-clamp-2 leading-relaxed">{lead.requirement}</p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #F0EBE0' }}>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px]">📍</span>
                                <span className="text-[9px] text-[#B8B0A0] font-medium truncate max-w-[70px]">{lead.source !== '—' ? lead.source : lead.date}</span>
                              </div>
                              <button onClick={e => { e.stopPropagation(); setCallLead(lead) }}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 2px 8px rgba(16,185,129,0.4)' }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Empty state */}
                    {!stageLeads.length && (
                      <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: stage.light, border: `1px dashed ${stage.border}` }}>
                          {stage.icon}
                        </div>
                        <p className="text-[10px] font-medium text-[#C4BAB0]">No leads here</p>
                      </div>
                    )}
                  </div>

                  {/* Column footer */}
                  {stageLeads.length > 0 && (
                    <div className="px-3 py-2 flex-shrink-0 flex items-center justify-between"
                      style={{ background: stage.light, borderTop: `1px solid ${stage.border}` }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: stage.color }}>
                        {stageLeads.length} lead{stageLeads.length > 1 ? 's' : ''}
                      </p>
                      <button onClick={() => { setStageFilter(stage.key); setActiveTab('list') }}
                        className="text-[9px] font-bold hover:underline transition-all"
                        style={{ color: stage.color }}>
                        View all →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── MODALS ── */}
        {callLead && <CallPopup lead={callLead} onClose={() => setCallLead(null)} onUpdatePipeline={updatePipeline} />}

        {moveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setMoveModal(null)} />
            <div className="relative w-full max-w-xs rounded-3xl overflow-hidden" style={{ background: '#FEFCF8', border: '1px solid #E8E2D8', boxShadow: '0 32px 80px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="px-5 py-4 flex items-center justify-between sticky top-0" style={{ background: '#FEFCF8', borderBottom: '1px solid #F0EBE0' }}>
                <div>
                  <p className="font-bold text-[#1C1712] text-sm">Move Lead</p>
                  <p className="text-[10px] mt-0.5 text-[#9A8F82]">{moveModal.name}</p>
                </div>
                <button onClick={() => setMoveModal(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#9A8F82] hover:text-[#1C1712] bg-[#F5F0E8]">✕</button>
              </div>
              <div className="px-4 py-3 border-b border-[#F0EBE0]">
                <p className="text-[9px] text-[#9A8F82] uppercase tracking-wider mb-2">Current</p>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: `${getStg(moveModal.pipeline).accent}15`, border: `1px solid ${getStg(moveModal.pipeline).accent}30` }}>
                  <span>{getStg(moveModal.pipeline).icon}</span>
                  <span className="text-sm font-bold" style={{ color: getStg(moveModal.pipeline).color }}>{getStg(moveModal.pipeline).label}</span>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {PIPELINE_STAGES.filter(s => s.key !== moveModal.pipeline).map(stage => (
                  <button key={stage.key} onClick={() => updatePipeline(moveModal.id, stage.key)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{ background: stage.light, border: `1px solid ${stage.border}` }}>
                    <span className="text-base">{stage.icon}</span>
                    <span className="text-sm font-bold flex-1" style={{ color: stage.color }}>{stage.label}</span>
                    <span className="text-[10px] text-[#9A8F82]">{leads.filter(l => l.pipeline === stage.key).length}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      <AddLeadModal isOpen={leadModalOpen} onClose={() => setLeadModalOpen(false)} onLeadsAdded={handleLeadsAdded} industry="interior-design" />
    </>
  )
}