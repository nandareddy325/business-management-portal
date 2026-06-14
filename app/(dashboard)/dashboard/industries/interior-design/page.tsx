'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchLeads, insertLeadsBulk } from '@/lib/supabase-helpers'
import { AddLeadModal } from '@/components/dashboard/add-lead-modal'

// ✅ Updated Pipeline Stages
const PIPELINE_STAGES = [
  { key: 'new',             label: 'New Lead',         icon: '🎯', color: '#64748B', light: '#F8FAFC', border: '#E2E8F0' },
  { key: 'called',          label: 'Called',           icon: '📞', color: '#7C3AED', light: '#F5F3FF', border: '#DDD6FE' },
  { key: 'interested',      label: 'Interested',       icon: '✨', color: '#0891B2', light: '#ECFEFF', border: '#A5F3FC' },
  { key: 'followup',        label: 'Follow Up',        icon: '🔄', color: '#D97706', light: '#FFFBEB', border: '#FDE68A' },
  { key: 'sitevisit',       label: 'Site Visit',       icon: '🏠', color: '#EA580C', light: '#FFF7ED', border: '#FED7AA' },
  { key: 'design',          label: 'Design Discussion',icon: '🎨', color: '#9333EA', light: '#FAF5FF', border: '#E9D5FF' },
  { key: 'quotation',       label: 'Quotation Sent',   icon: '💰', color: '#2563EB', light: '#EFF6FF', border: '#BFDBFE' },
  { key: 'negotiation',     label: 'Negotiation',      icon: '🤝', color: '#B45309', light: '#FFFBEB', border: '#FDE68A' },
  { key: 'advance',         label: 'Advance Received', icon: '💵', color: '#059669', light: '#ECFDF5', border: '#A7F3D0' },
  { key: 'won',             label: 'Won',              icon: '✅', color: '#16A34A', light: '#F0FDF4', border: '#BBF7D0' },
  { key: 'project_started', label: 'Project Started',  icon: '🚀', color: '#0F766E', light: '#F0FDFA', border: '#99F6E4' },
  { key: 'lost',            label: 'Lost',             icon: '❌', color: '#DC2626', light: '#FEF2F2', border: '#FECACA' },
]

const GRADIENTS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-600', 'from-indigo-500 to-blue-600',
]

type Lead = {
  id: string; name: string; phone: string; email: string
  requirement: string; budget: string; source: string; status: string; pipeline: string; date: string
}

const ini = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
const getStg = (key: string) => PIPELINE_STAGES.find(s => s.key === key) || PIPELINE_STAGES[0]

// ── Advanced Call Popup ────────────────────────────────────
function AdvancedCallPopup({ lead, onClose, onUpdatePipeline }: {
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
  const grad = GRADIENTS[lead.name.charCodeAt(0) % GRADIENTS.length]
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
      interested:      'interested',
      followup:        'followup',
      sitevisit:       'sitevisit',
      design:          'design',
      quotation:       'quotation',
      negotiation:     'negotiation',
      advance:         'advance',
      won:             'won',
      project_started: 'project_started',
      notinterested:   'lost',
      called:          'called',
    }
    const newStage = stageMap[outcome] || 'called'
    try {
      await supabase.from('leads').update({
        pipeline_stage: newStage,
        notes: note,
        status: outcome === 'notinterested' ? 'Lost' : 'Active',
      }).eq('id', lead.id)
      onUpdatePipeline(lead.id, newStage)
      setSaved(true)
      setTimeout(onClose, 1200)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  // ✅ Updated outcomes
  const outcomes = [
    { id: 'interested',  label: '✨ Interested',      color: '#0891B2', light: '#ECFEFF', desc: 'Showing interest' },
    { id: 'followup',    label: '🔄 Follow Up',        color: '#D97706', light: '#FFFBEB', desc: 'Call back needed' },
    { id: 'sitevisit',   label: '🏠 Site Visit',       color: '#EA580C', light: '#FFF7ED', desc: 'Wants to visit' },
    { id: 'notinterested', label: '❌ Not Interested', color: '#DC2626', light: '#FEF2F2', desc: 'Mark as lost' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.3)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="relative px-6 py-5 text-center"
          style={{ background: 'linear-gradient(135deg, #1C1712 0%, #2d2822 100%)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #B8860B, transparent 60%)' }} />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors text-sm">✕</button>
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl font-black text-white mx-auto mb-3`}
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            {ini(lead.name)}
          </div>
          <p className="text-white font-bold text-xl">{lead.name}</p>
          <p className="font-mono text-lg mt-1 tracking-widest" style={{ color: '#F59E0B' }}>{lead.phone}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full"
              style={{ background: stg.light, color: stg.color }}>{stg.icon} {stg.label}</span>
          </div>
          {phase === 'calling' && (
            <div className="mt-3 flex items-center justify-center gap-2 bg-white/8 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono text-sm font-bold">{fmt(seconds)}</span>
              <span className="text-white/40 text-xs">Calling...</span>
            </div>
          )}
          {phase === 'post' && (
            <p className="mt-2 text-white/40 text-xs">📵 Call ended · {fmt(seconds)}</p>
          )}
        </div>

        <div className="px-5 py-4 border-b border-[#F0EBE0]">
          <p className="text-[9px] font-black text-[#9A8F82] uppercase tracking-widest mb-3">Customer Details</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { l: 'Budget', v: lead.budget },
              { l: 'City',   v: (lead as any).city || '—' },
              { l: 'Added',  v: lead.date },
            ].map(x => (
              <div key={x.l} className="rounded-xl p-2.5" style={{ background: '#F7F5F1' }}>
                <p className="text-[8px] font-black text-[#9A8F82] uppercase tracking-wider">{x.l}</p>
                <p className="text-xs font-bold text-[#1C1712] mt-0.5 truncate">{x.v || '—'}</p>
              </div>
            ))}
          </div>
          {lead.requirement && lead.requirement !== '—' && (
            <div className="rounded-xl p-2.5" style={{ background: '#F7F5F1' }}>
              <p className="text-[8px] font-black text-[#9A8F82] uppercase tracking-wider">Requirement</p>
              <p className="text-xs text-[#1C1712] mt-0.5">{lead.requirement}</p>
            </div>
          )}
        </div>

        {phase === 'pre' && (
          <div className="p-5 space-y-2">
            <button onClick={startCall}
              className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
              <span className="text-xl">📞</span> Call Now — {lead.phone}
            </button>
            <button onClick={() => navigator.clipboard.writeText(lead.phone)}
              className="w-full py-2.5 rounded-xl text-xs font-bold border border-[#E8E2D8] text-[#7A6E60] hover:bg-[#F5F0E8] transition-colors">
              📋 Copy Number
            </button>
            <button onClick={onClose} className="w-full text-[#B8B0A0] text-xs hover:text-[#1C1712] py-1.5 transition-colors">Cancel</button>
          </div>
        )}

        {phase === 'calling' && (
          <div className="p-5 space-y-3">
            <div className="text-center py-3 rounded-2xl" style={{ background: '#F0FDF4' }}>
              <p className="text-sm font-bold text-emerald-700">📞 Calling {lead.name}...</p>
              <p className="text-xs text-emerald-600 mt-1">Phone dialing — tap End Call when done</p>
            </div>
            <button onClick={endCall}
              className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', boxShadow: '0 8px 24px rgba(220,38,38,0.3)' }}>
              <span className="text-xl">📵</span> End Call — {fmt(seconds)}
            </button>
          </div>
        )}

        {phase === 'post' && (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-wider mb-2">
                Call Outcome <span className="text-red-400">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {outcomes.map(o => (
                  <button key={o.id} onClick={() => setOutcome(o.id)}
                    className="p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: outcome === o.id ? o.light : 'white',
                      borderColor: outcome === o.id ? o.color : '#E8E2D8',
                      boxShadow: outcome === o.id ? `0 4px 12px ${o.color}25` : 'none',
                    }}>
                    <p className="text-xs font-black" style={{ color: outcome === o.id ? o.color : '#1C1712' }}>{o.label}</p>
                    <p className="text-[9px] text-[#9A8F82] mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-wider mb-2">Feedback / Notes</p>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Customer interested in 3BHK, budget ₹50L..."
                rows={3}
                className="w-full rounded-xl border-2 border-[#E8E2D8] px-4 py-3 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none resize-none transition-all"
                style={{ background: '#F7F5F1' }}
                onFocus={e => (e.target.style.borderColor = '#B8860B')}
                onBlur={e => (e.target.style.borderColor = '#E8E2D8')}
              />
            </div>
            <button onClick={handleSave} disabled={!outcome || saving || saved}
              className="w-full py-4 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-40"
              style={{
                background: saved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #1C1712, #2d2822)',
                boxShadow: '0 8px 24px rgba(28,23,18,0.2)',
              }}>
              {saved ? '✅ Saved!' : saving ? '⏳ Saving...' : '💾 Save & Update Stage'}
            </button>
            {!outcome && <p className="text-center text-[10px] text-[#9A8F82]">⚠ Outcome select చేయాలి</p>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function InteriorDesignDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlStage = searchParams.get('stage')

  const [userName, setUserName] = useState('User')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState(urlStage || 'all')
  const [activeTab, setActiveTab] = useState<'list' | 'pipeline'>('list')
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [callLead, setCallLead] = useState<Lead | null>(null)
  const [moveModal, setMoveModal] = useState<Lead | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    setStageFilter(urlStage || 'all')
    if (urlStage) setActiveTab('list')
  }, [urlStage])

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
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
      const uniquePhones = Array.from(new Set(phones))
      const { data: existing } = await supabase.from('leads').select('phone').in('phone', uniquePhones)
      const existingPhones = new Set((existing || []).map((e: any) => e.phone))
      const fresh = validLeads.filter(l => !existingPhones.has(l.phone.trim()))
      if (!fresh.length) { setLeadModalOpen(false); return }
      const inserted = await insertLeadsBulk(fresh.map(l => ({
        name: l.name, phone: l.phone, email: l.email || '',
        source: l.source || '', interest: l.interest || '',
        budget: l.budget || '', status: l.status || 'new',
        pipeline_stage: 'new', industry: 'interior-design',
      })))
      if (inserted.length > 0) {
        setLeads(prev => [...inserted.map((l: any) => ({
          id: l.id, name: l.lead_name || l.name || '', phone: l.phone || '',
          email: l.email || '', requirement: l.interest || '—',
          budget: l.budget || '—', status: l.status || 'New',
          pipeline: l.pipeline_stage || 'new', source: l.source || '—', date: 'Today',
        })), ...prev])
      }
    } catch (err) { console.error(err) }
    finally { setLeadModalOpen(false) }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <main className="flex-1 p-4 md:p-6 space-y-4">

        {/* ── TOP ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, #1C1712 0%, #2d2218 100%)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(184,134,11,0.2), transparent 50%)' }} />
            <div className="relative">
              <p className="text-[8px] font-bold text-[#B8860B] uppercase tracking-[3px] mb-2">Interior Design CRM</p>
              <h1 className="text-white text-lg font-semibold mb-1">{greeting}, {userName} 👋</h1>
              <p className="text-white/40 text-xs">{leads.length} leads · {activeLeads.length} active · {winRate}% win</p>
            </div>
            <div className="relative flex gap-2 mt-4">
              <button onClick={() => setLeadModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 4px 14px rgba(184,134,11,0.3)' }}>
                + Add
              </button>
              <button onClick={() => setActiveTab(t => t === 'list' ? 'pipeline' : 'list')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 border border-white/10 hover:bg-white/10 transition-all">
                {activeTab === 'list' ? '⬡ Board' : '≡ List'}
              </button>
            </div>
          </div>

          {[
            { label: 'Total Leads',    value: leads.length,            icon: '🎯', color: '#1C1712', bg: 'bg-white',      border: 'border-[#E8E2D8]', trend: 'All time' },
            { label: 'Follow-ups Due', value: followupsDue.length,     icon: '🔄', color: '#D97706', bg: 'bg-amber-50',   border: 'border-amber-200', trend: 'Need callback',
              onClick: () => { setStageFilter('followup'); setActiveTab('list') } },
            { label: 'Site Visits',    value: siteVisits.length,       icon: '🏠', color: '#EA580C', bg: 'bg-orange-50',  border: 'border-orange-200', trend: 'Scheduled',
              onClick: () => { setStageFilter('sitevisit'); setActiveTab('list') } },
            { label: 'Quotations',     value: quotationsPending.length, icon: '💰', color: '#2563EB', bg: 'bg-blue-50',    border: 'border-blue-200', trend: 'Pending',
              onClick: () => { setStageFilter('quotation'); setActiveTab('list') } },
          ].map((s, i) => (
            <div key={i} onClick={s.onClick}
              className={`${s.bg} rounded-2xl p-4 border ${s.border} hover:shadow-md hover:-translate-y-0.5 transition-all ${s.onClick ? 'cursor-pointer' : 'cursor-default'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{s.label}</p>
                <span className="text-base">{s.icon}</span>
              </div>
              <p className="font-serif text-2xl leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-[#B8B0A0] font-medium">{s.trend}</p>
            </div>
          ))}
        </div>

        {/* ── SECOND ROW ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Today's Leads",   value: todayLeads.length,  icon: '📅', color: '#2563EB', bg: 'bg-blue-50',    border: 'border-blue-100',    trend: 'Added today' },
            { label: 'Active Pipeline', value: activeLeads.length, icon: '🔥', color: '#D97706', bg: 'bg-amber-50',   border: 'border-amber-100',   trend: 'In progress' },
            { label: 'Won Deals',       value: wonLeads.length,    icon: '✅', color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-100', trend: `${winRate}% win rate` },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all`}>
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{s.label}</p>
                <p className="font-serif text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] text-[#B8B0A0]">{s.trend}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── PIPELINE STRIP ── */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[#1C1712]">Pipeline Overview</p>
            <p className="text-[10px] text-[#9A8F82]">{leads.length} leads · {PIPELINE_STAGES.length} stages</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PIPELINE_STAGES.map(stage => {
              const count = leads.filter(l => l.pipeline === stage.key).length
              const pct = leads.length > 0 ? (count / leads.length) * 100 : 0
              const active = stageFilter === stage.key
              return (
                <button key={stage.key}
                  onClick={() => { setStageFilter(s => s === stage.key ? 'all' : stage.key); setActiveTab('list') }}
                  className="flex-1 min-w-[72px] p-2 rounded-xl border text-center transition-all hover:shadow-md relative overflow-hidden"
                  style={{
                    background: active ? stage.color : stage.light,
                    borderColor: active ? stage.color : stage.border,
                    transform: active ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: active ? `0 4px 16px ${stage.color}30` : 'none',
                  }}>
                  <p className="text-sm mb-0.5">{stage.icon}</p>
                  <p className="font-serif text-base font-bold" style={{ color: active ? 'white' : stage.color }}>{count}</p>
                  <p className="text-[7px] font-bold uppercase tracking-wide leading-tight" style={{ color: active ? 'rgba(255,255,255,0.8)' : stage.color }}>{stage.label}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: active ? 'rgba(255,255,255,0.3)' : stage.border }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: active ? 'white' : stage.color }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F0EBE0] flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setStageFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stageFilter === 'all' ? 'bg-[#1C1712] text-white' : 'bg-[#F5F0E8] text-[#7A6E60] hover:bg-[#EDE8DE]'}`}>
                  All {leads.length}
                </button>
                {PIPELINE_STAGES.map(s => {
                  const c = leads.filter(l => l.pipeline === s.key).length
                  if (!c) return null
                  return (
                    <button key={s.key} onClick={() => setStageFilter(s.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border hover:scale-105"
                      style={{
                        background: stageFilter === s.key ? s.color : s.light,
                        borderColor: stageFilter === s.key ? s.color : s.border,
                        color: stageFilter === s.key ? 'white' : s.color,
                      }}>
                      {s.icon} {c}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[160px] max-w-[220px]">
                  <input type="text" placeholder="Search name or phone..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl pl-8 pr-7 py-2 text-xs outline-none focus:border-[#B8860B] transition-colors" />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A8F82] text-xs">🔍</span>
                  {search && (
                    <button onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A8F82] hover:text-red-500 text-xs">✕</button>
                  )}
                </div>
                {(['all', 'today', 'yesterday', 'week'] as const).map(d => (
                  <button key={d} onClick={() => setDateFilter(d)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      dateFilter === d ? 'bg-[#1C1712] text-white border-[#1C1712]' : 'bg-[#F7F5F1] text-[#7A6E60] border-[#E8E2D8] hover:bg-[#EDE8DE]'
                    }`}>
                    {d === 'all' ? 'All Time' : d === 'today' ? 'Today' : d === 'yesterday' ? 'Yesterday' : 'This Week'}
                  </button>
                ))}
                <button onClick={() => setLeadModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #1C1712, #2d2822)' }}>
                  + Add
                </button>
              </div>
            </div>

            {stageFilter !== 'all' && (
              <div className="px-5 py-2 border-b flex items-center gap-2" style={{ borderColor: '#F0EBE0', background: getStg(stageFilter).light }}>
                <span>{getStg(stageFilter).icon}</span>
                <p className="text-xs font-semibold" style={{ color: getStg(stageFilter).color }}>
                  Showing {getStg(stageFilter).label} — {filteredLeads.length} leads
                </p>
                <button onClick={() => setStageFilter('all')} className="ml-auto text-[10px] text-[#9A8F82] hover:text-red-500 transition-colors">✕ Clear</button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#9A8F82]">Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: '#F5F0E8' }}>
                  {leads.length === 0 ? '🎯' : '🔍'}
                </div>
                <p className="text-base font-bold text-[#1C1712]">{leads.length === 0 ? 'No leads yet' : 'No results found'}</p>
                <p className="text-sm text-[#9A8F82] mt-1">{leads.length === 0 ? 'Add your first lead to get started' : 'Try clearing the filter'}</p>
                {leads.length === 0 && (
                  <button onClick={() => setLeadModalOpen(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #1C1712, #2d2822)' }}>
                    + Add First Lead
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#FAFAF9' }}>
                      {['#', 'Lead', 'Phone', 'Requirement', 'Budget', 'Source', 'Stage', 'Date', ''].map((h, i) => (
                        <th key={i} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[1.5px] px-4 py-3 border-b border-[#F0EBE0] whitespace-nowrap first:pl-5 last:pr-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead, i) => {
                      const stg = getStg(lead.pipeline)
                      const isHovered = hoveredRow === lead.id
                      return (
                        <tr key={lead.id}
                          onMouseEnter={() => setHoveredRow(lead.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className="border-b border-[#F7F5F1] last:border-0 transition-colors"
                          style={{ background: isHovered ? '#FDFAF8' : 'white' }}>
                          <td className="pl-5 pr-2 py-3.5"><span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span></td>
                          <td className="pl-2 pr-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-[11px] font-black text-white flex-shrink-0`}
                                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                {ini(lead.name)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#1C1712]">{lead.name}</p>
                                <p className="text-[10px] text-[#B8B0A0]">{lead.email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><p className="text-sm font-semibold text-[#1C1712] whitespace-nowrap">{lead.phone}</p></td>
                          <td className="px-4 py-3.5"><p className="text-xs text-[#7A6E60] max-w-[120px] truncate">{lead.requirement}</p></td>
                          <td className="px-4 py-3.5"><p className="text-xs font-bold text-[#1C1712]">{lead.budget}</p></td>
                          <td className="px-4 py-3.5"><p className="text-xs text-[#7A6E60]">{lead.source}</p></td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border"
                              style={{ background: stg.light, borderColor: stg.border, color: stg.color }}>
                              {stg.icon} {stg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5"><p className="text-[10px] text-[#B8B0A0] whitespace-nowrap">{lead.date}</p></td>
                          <td className="pr-5 pl-2 py-3.5">
                            <div className={`flex gap-1.5 items-center transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 translate-x-2'}`}>
                              <button onClick={() => setMoveModal(lead)}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:scale-105 transition-all"
                                style={{ background: '#F5F0E8', color: '#1C1712' }}>Move</button>
                              <button onClick={() => setCallLead(lead)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110"
                                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between">
                <p className="text-[10px] text-[#9A8F82]">
                  <span className="font-bold text-[#1C1712]">{filteredLeads.length}</span> of <span className="font-bold text-[#1C1712]">{leads.length}</span> leads
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── PIPELINE BOARD ── */}
        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {PIPELINE_STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.pipeline === stage.key)
              return (
                <div key={stage.key} className="rounded-2xl overflow-hidden border"
                  style={{ background: 'white', borderColor: stage.border }}>
                  <div className="px-3 py-2.5 border-b flex items-center justify-between"
                    style={{ background: stage.light, borderColor: stage.border }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{stage.icon}</span>
                      <p className="text-[9px] font-black uppercase tracking-wide truncate" style={{ color: stage.color }}>{stage.label}</p>
                    </div>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                      style={{ background: stage.color }}>{stageLeads.length}</span>
                  </div>
                  <div className="p-2 flex flex-col gap-2 min-h-[100px]">
                    {stageLeads.map((lead, i) => (
                      <div key={lead.id} onClick={() => setMoveModal(lead)}
                        className="rounded-xl p-2.5 cursor-pointer transition-all hover:shadow-md border"
                        style={{ background: '#FDFAF8', borderColor: '#F0EBE0' }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-[9px] font-black text-white flex-shrink-0`}>
                            {ini(lead.name)}
                          </div>
                          <p className="text-[11px] font-bold text-[#1C1712] truncate flex-1">{lead.name}</p>
                        </div>
                        <p className="text-[10px] text-[#9A8F82] mb-1">{lead.phone}</p>
                        {lead.budget !== '—' && <p className="text-[10px] font-bold" style={{ color: '#B8860B' }}>{lead.budget}</p>}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t" style={{ borderColor: '#F0EBE0' }}>
                          <p className="text-[9px] text-[#C4BAB0]">{lead.source}</p>
                          <button onClick={e => { e.stopPropagation(); setCallLead(lead) }}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all"
                            style={{ background: '#10B981' }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {!stageLeads.length && (
                      <div className="flex-1 flex items-center justify-center py-6">
                        <p className="text-[10px] text-[#D4CFC8]">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {callLead && (
          <AdvancedCallPopup lead={callLead} onClose={() => setCallLead(null)} onUpdatePipeline={updatePipeline} />
        )}

        {moveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMoveModal(null)} />
            <div className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="px-5 py-4 border-b border-[#F0EBE0] flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h3 className="font-bold text-[#1C1712]">Move Lead</h3>
                  <p className="text-xs text-[#9A8F82]">{moveModal.name} · {moveModal.phone}</p>
                </div>
                <button onClick={() => setMoveModal(null)} className="w-8 h-8 rounded-xl border border-[#E8E2D8] flex items-center justify-center text-[#9A8F82] hover:bg-[#F5F0E8]">✕</button>
              </div>
              <div className="px-5 py-3 border-b border-[#F0EBE0]">
                <p className="text-[9px] font-black text-[#9A8F82] uppercase tracking-wider mb-2">Current Stage</p>
                <div className="flex items-center gap-2.5 p-3 rounded-xl border"
                  style={{ background: getStg(moveModal.pipeline).light, borderColor: getStg(moveModal.pipeline).border }}>
                  <span className="text-xl">{getStg(moveModal.pipeline).icon}</span>
                  <span className="text-sm font-bold" style={{ color: getStg(moveModal.pipeline).color }}>{getStg(moveModal.pipeline).label}</span>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {PIPELINE_STAGES.filter(s => s.key !== moveModal.pipeline).map(stage => (
                  <button key={stage.key} onClick={() => updatePipeline(moveModal.id, stage.key)}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-sm"
                    style={{ background: stage.light, borderColor: stage.border }}>
                    <span className="text-lg">{stage.icon}</span>
                    <span className="text-sm font-bold flex-1" style={{ color: stage.color }}>{stage.label}</span>
                    <span className="text-[10px] font-bold text-[#B8B0A0]">{leads.filter(l => l.pipeline === stage.key).length}</span>
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