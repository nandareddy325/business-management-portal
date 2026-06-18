'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────
interface LeadActivity {
  id: string
  type: 'call' | 'stage_change' | 'note' | 'sitevisit' | 'quotation' | 'created'
  title: string
  description?: string
  stage_from?: string
  stage_to?: string
  outcome?: string
  scheduled_date?: string
  amount?: string
  created_at: string
}

interface LeadDetail {
  id: string
  lead_name: string
  phone: string
  email?: string
  source?: string
  budget?: string
  property_type?: string
  city?: string
  interest?: string
  notes?: string
  pipeline_stage: string
  status: string
  date?: string
  followup_date?: string
  sitevisit_date?: string
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  new:             { label: 'New Lead',   icon: '🎯', color: '#64748B', bg: '#F8FAFC' },
  called:          { label: 'Called',     icon: '📞', color: '#7C3AED', bg: '#F5F3FF' },
  interested:      { label: 'Interested', icon: '✨', color: '#0891B2', bg: '#ECFEFF' },
  followup:        { label: 'Follow Up',  icon: '🔄', color: '#D97706', bg: '#FFFBEB' },
  sitevisit:       { label: 'Site Visit', icon: '🏠', color: '#EA580C', bg: '#FFF7ED' },
  quotation:       { label: 'Quotation',  icon: '💰', color: '#2563EB', bg: '#EFF6FF' },
  won:             { label: 'Won',        icon: '✅', color: '#16A34A', bg: '#F0FDF4' },
  project_started: { label: 'Project On', icon: '🚀', color: '#0F766E', bg: '#F0FDFA' },
  lost:            { label: 'Lost',       icon: '❌', color: '#DC2626', bg: '#FEF2F2' },
}

const ACTIVITY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  created:      { icon: '🌟', color: '#B8860B', bg: '#FFFBEB' },
  call:         { icon: '📞', color: '#7C3AED', bg: '#F5F3FF' },
  stage_change: { icon: '↗️', color: '#0891B2', bg: '#ECFEFF' },
  note:         { icon: '📝', color: '#64748B', bg: '#F8FAFC' },
  sitevisit:    { icon: '🏠', color: '#EA580C', bg: '#FFF7ED' },
  quotation:    { icon: '💰', color: '#2563EB', bg: '#EFF6FF' },
}

const fmtDate = (ds: string) => {
  if (!ds) return '—'
  const d = new Date(ds)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDateTime = (ds: string) => {
  if (!ds) return '—'
  const d = new Date(ds)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const timeAgo = (ds: string) => {
  const diff = Date.now() - new Date(ds).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days}d ago`
  if (hrs > 0) return `${hrs}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]
const ini = (n: string) => n?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?'

// Follow Up leads are tagged in notes as [RNR] or [Call Back] — show the specific badge instead of generic "Follow Up"
const stripTag = (n?: string) => (n || '').replace(/^\[(RNR|Call Back)\]\s*/, '')
const getDisplayStage = (l: { pipeline_stage: string; notes?: string }) => {
  const base = STAGE_CONFIG[l.pipeline_stage] || STAGE_CONFIG.new
  if (l.pipeline_stage !== 'followup') return base
  const n = (l.notes || '').trim()
  if (n.startsWith('[RNR]')) return { ...base, label: 'RNR', icon: '📵' }
  if (n.startsWith('[Call Back]')) return { ...base, label: 'Call Back', icon: '🔄' }
  return base
}

// ─── Add Note Modal ────────────────────────────────────────
function AddNoteModal({ leadId, onClose, onSaved }: { leadId: string; onClose: () => void; onSaved: () => void }) {
  const [note, setNote] = useState('')
  const [type, setType] = useState<'note' | 'call' | 'sitevisit' | 'quotation'>('note')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const typeConfig = [
    { id: 'note',      label: '📝 Note',      color: '#64748B' },
    { id: 'call',      label: '📞 Call Log',  color: '#7C3AED' },
    { id: 'sitevisit', label: '🏠 Site Visit', color: '#EA580C' },
    { id: 'quotation', label: '💰 Quotation', color: '#2563EB' },
  ]

  const handleSave = async () => {
    if (!note.trim()) return
    setSaving(true)
    try {
      const activity: any = {
        lead_id: leadId,
        type,
        title: type === 'note' ? 'Note added' : type === 'call' ? 'Call logged' : type === 'sitevisit' ? 'Site Visit' : 'Quotation',
        description: note.trim(),
        created_at: new Date().toISOString(),
      }
      if (type === 'quotation' && amount) activity.amount = amount
      if (date) activity.scheduled_date = date

      await supabase.from('lead_activities').insert(activity)

      // Also update notes on lead
      if (type === 'note') {
        await supabase.from('leads').update({ notes: note.trim() }).eq('id', leadId)
      }
      if (type === 'sitevisit') {
        await supabase.from('leads').update({ sitevisit_date: date, pipeline_stage: 'sitevisit' }).eq('id', leadId)
      }
      if (type === 'quotation') {
        await supabase.from('leads').update({ pipeline_stage: 'quotation' }).eq('id', leadId)
      }

      onSaved()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden bg-white border border-[#E8E2D8] shadow-2xl">
        <div className="px-5 py-4 border-b border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
          <p className="font-bold text-[#1C1712]">Add Activity</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#F5F0E8] flex items-center justify-center text-[#9A8F82] hover:text-[#1C1712]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-4 gap-2">
            {typeConfig.map(t => (
              <button key={t.id} onClick={() => setType(t.id as any)}
                className="py-2 px-1 rounded-xl text-[10px] font-bold text-center transition-all"
                style={{
                  background: type === t.id ? `${t.color}15` : '#F5F0E8',
                  color: type === t.id ? t.color : '#7A6E60',
                  border: `2px solid ${type === t.id ? t.color : 'transparent'}`,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wide block mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm text-[#1C1712] outline-none border border-[#E8E2D8] focus:border-[#B8860B] bg-[#F7F5F1]" />
          </div>

          {/* Amount (quotation only) */}
          {type === 'quotation' && (
            <div>
              <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wide block mb-1">Quotation Amount</label>
              <input type="text" placeholder="₹15,00,000" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-[#1C1712] outline-none border border-[#E8E2D8] focus:border-[#B8860B] bg-[#F7F5F1]" />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wide block mb-1">
              {type === 'call' ? 'Call Summary' : type === 'quotation' ? 'Quotation Details' : type === 'sitevisit' ? 'Site Visit Notes' : 'Note'}
            </label>
            <textarea rows={4} value={note} onChange={e => setNote(e.target.value)}
              placeholder={
                type === 'call' ? 'Customer interested in modular kitchen, will call back...' :
                type === 'quotation' ? 'Quotation sent for full 3BHK interior...' :
                type === 'sitevisit' ? 'Site visit completed, customer liked the designs...' :
                'Add a note about this lead...'
              }
              className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none resize-none border border-[#E8E2D8] focus:border-[#B8860B] bg-[#F7F5F1]" />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#7A6E60] border border-[#E8E2D8] hover:bg-[#F5F0E8]">Cancel</button>
            <button onClick={handleSave} disabled={!note.trim() || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1C1712, #2d2822)' }}>
              {saving ? '⏳ Saving...' : '+ Add Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Follow Up Sub-type Modal (RNR / Call Back + date) ─────
function FollowupModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (outcome: 'rnr' | 'callback', dateTime: string) => Promise<void>
}) {
  const [outcome, setOutcome] = useState<'rnr' | 'callback' | ''>('')
  const todayISO = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(todayISO)
  const [time, setTime] = useState('10:00')
  const [saving, setSaving] = useState(false)

  const quickDates = [
    { label: 'Today',     value: todayISO },
    { label: 'Tomorrow',  value: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { label: 'In 3 Days', value: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
    { label: 'Next Week', value: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
  ]

  const options = [
    { id: 'rnr',      label: '📵 RNR',       desc: 'Not responding',  color: '#94A3B8' },
    { id: 'callback', label: '🔄 Call Back', desc: 'Callback needed', color: '#D97706' },
  ]

  const handleSave = async () => {
    if (!outcome || !date) return
    setSaving(true)
    try { await onSave(outcome as 'rnr' | 'callback', `${date}T${time}:00`) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-white border border-[#E8E2D8] shadow-2xl">
        <div className="px-5 py-4 border-b border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
          <p className="font-bold text-[#1C1712]">🔄 Follow Up</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#F5F0E8] flex items-center justify-center text-[#9A8F82] hover:text-[#1C1712]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wide mb-2">Type *</p>
            <div className="grid grid-cols-2 gap-2">
              {options.map(o => (
                <button key={o.id} onClick={() => setOutcome(o.id as any)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: outcome === o.id ? `${o.color}15` : '#F7F5F1',
                    border: `2px solid ${outcome === o.id ? o.color : '#E8E2D8'}`,
                  }}>
                  <p className="text-xs font-black" style={{ color: outcome === o.id ? o.color : '#1C1712' }}>{o.label}</p>
                  <p className="text-[9px] text-[#9A8F82] mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {outcome && (
            <div>
              <p className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wide mb-2">
                {outcome === 'rnr' ? '📅 Retry Date' : '📅 Call Back Date'} *
              </p>
              <div className="flex gap-2 flex-wrap mb-2">
                {quickDates.map(qd => (
                  <button key={qd.label} onClick={() => setDate(qd.value)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: date === qd.value ? '#1C1712' : '#F5F0E8',
                      color: date === qd.value ? 'white' : '#7A6E60',
                      border: '1px solid #E8E2D8',
                    }}>
                    {qd.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-[#1C1712] outline-none border border-[#E8E2D8] focus:border-[#B8860B] bg-[#F7F5F1]" />
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-28 rounded-xl px-3 py-2 text-sm text-[#1C1712] outline-none border border-[#E8E2D8] focus:border-[#B8860B] bg-[#F7F5F1]" />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#7A6E60] border border-[#E8E2D8] hover:bg-[#F5F0E8]">Cancel</button>
            <button onClick={handleSave} disabled={!outcome || !date || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1C1712, #2d2822)' }}>
              {saving ? '⏳ Saving...' : '💾 Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────
export function LeadDetailPanel({ leadId, onClose, onStageUpdate }: {
  leadId: string
  onClose: () => void
  onStageUpdate?: (id: string, stage: string, notes?: string) => void
}) {
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showFollowupModal, setShowFollowupModal] = useState(false)
  const [editQuotation, setEditQuotation] = useState(false)
  const [quotationAmount, setQuotationAmount] = useState('')
  const [savingQuotation, setSavingQuotation] = useState(false)

  const loadData = async () => {
    try {
      // Fetch lead
      const { data: leadData } = await supabase
        .from('leads').select('*').eq('id', leadId).single()
      if (leadData) setLead(leadData)

      // Fetch activities (try lead_activities table, fallback to empty)
      try {
        const { data: acts } = await supabase
          .from('lead_activities')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })

        // Build synthetic activities from lead data
        const synthetic: LeadActivity[] = []

        // Created activity
        if (leadData?.created_at) {
          synthetic.push({
            id: 'created',
            type: 'created',
            title: 'Lead Created',
            description: `Added via ${leadData.source || 'manual entry'}`,
            created_at: leadData.created_at,
          })
        }

        // Site visit scheduled
        if (leadData?.sitevisit_date) {
          synthetic.push({
            id: 'sv',
            type: 'sitevisit',
            title: 'Site Visit Scheduled',
            description: `Scheduled for ${fmtDateTime(leadData.sitevisit_date)}`,
            scheduled_date: leadData.sitevisit_date,
            created_at: leadData.sitevisit_date,
          })
        }

        // Follow up scheduled
        if (leadData?.followup_date) {
          synthetic.push({
            id: 'fu',
            type: 'call',
            title: 'Follow-up Scheduled',
            description: `Call back scheduled for ${fmtDateTime(leadData.followup_date)}`,
            scheduled_date: leadData.followup_date,
            created_at: leadData.followup_date,
          })
        }

        const combined = [...(acts || []), ...synthetic]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setActivities(combined)
      } catch {
        // lead_activities table might not exist, show synthetic only
        const synthetic: LeadActivity[] = []
        if (leadData?.created_at) {
          synthetic.push({ id: 'created', type: 'created', title: 'Lead Created', description: `Added via ${leadData?.source || 'manual entry'}`, created_at: leadData.created_at })
        }
        if (leadData?.sitevisit_date) {
          synthetic.push({ id: 'sv', type: 'sitevisit', title: 'Site Visit Scheduled', description: `Scheduled for ${fmtDateTime(leadData.sitevisit_date)}`, scheduled_date: leadData.sitevisit_date, created_at: leadData.sitevisit_date })
        }
        if (leadData?.followup_date) {
          synthetic.push({ id: 'fu', type: 'call', title: 'Follow-up Scheduled', description: `Call back for ${fmtDateTime(leadData.followup_date)}`, scheduled_date: leadData.followup_date, created_at: leadData.followup_date })
        }
        setActivities(synthetic.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [leadId])

  const handleStageChange = async (stage: string) => {
    if (!lead) return
    if (stage === 'followup') { setShowFollowupModal(true); return }

    const prev = lead.pipeline_stage
    setLead(l => l ? { ...l, pipeline_stage: stage } : l)
    await supabase.from('leads').update({ pipeline_stage: stage }).eq('id', leadId)

    // Log stage change activity
    try {
      await supabase.from('lead_activities').insert({
        lead_id: leadId, type: 'stage_change',
        title: 'Stage Updated',
        description: `Moved from ${STAGE_CONFIG[prev]?.label || prev} → ${STAGE_CONFIG[stage]?.label || stage}`,
        stage_from: prev, stage_to: stage,
        created_at: new Date().toISOString(),
      })
    } catch {}

    onStageUpdate?.(leadId, stage)
    loadData()
  }

  // RNR / Call Back save — tags notes so the list can show the specific sub-type
  const handleFollowupSave = async (outcome: 'rnr' | 'callback', dateTime: string) => {
    if (!lead) return
    const prev = lead.pipeline_stage
    const tag = outcome === 'rnr' ? '[RNR] ' : '[Call Back] '
    const newNotes = `${tag}${stripTag(lead.notes)}`.trim()

    setLead(l => l ? { ...l, pipeline_stage: 'followup', notes: newNotes, followup_date: dateTime } : l)
    try {
      await supabase.from('leads').update({ pipeline_stage: 'followup', notes: newNotes, followup_date: dateTime }).eq('id', leadId)
      await supabase.from('lead_activities').insert({
        lead_id: leadId, type: 'stage_change',
        title: outcome === 'rnr' ? 'Marked RNR' : 'Call Back Scheduled',
        description: `Moved from ${STAGE_CONFIG[prev]?.label || prev} → ${outcome === 'rnr' ? 'RNR' : 'Call Back'} — ${fmtDateTime(dateTime)}`,
        stage_from: prev, stage_to: 'followup',
        scheduled_date: dateTime,
        created_at: new Date().toISOString(),
      })
    } catch (e) { console.error(e) }

    onStageUpdate?.(leadId, 'followup', newNotes)
    setShowFollowupModal(false)
    loadData()
  }

  const saveQuotation = async () => {
    setSavingQuotation(true)
    try {
      await supabase.from('leads').update({ pipeline_stage: 'quotation' }).eq('id', leadId)
      try {
        await supabase.from('lead_activities').insert({
          lead_id: leadId, type: 'quotation',
          title: 'Quotation Sent',
          description: quotationAmount ? `Quotation of ${quotationAmount} sent to customer` : 'Quotation sent to customer',
          amount: quotationAmount,
          created_at: new Date().toISOString(),
        })
      } catch {}
      setLead(l => l ? { ...l, pipeline_stage: 'quotation' } : l)
      setEditQuotation(false)
      loadData()
    } catch (e) { console.error(e) }
    finally { setSavingQuotation(false) }
  }

  if (loading || !lead) return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md h-full bg-white flex items-center justify-center shadow-2xl">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  const stg = getDisplayStage(lead)
  const nameIdx = lead.lead_name.charCodeAt(0) % GRADIENTS.length
  const g = GRADIENTS[nameIdx]

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Panel — slides from right */}
        <div className="relative ml-auto w-full max-w-md h-full flex flex-col shadow-2xl"
          style={{ background: '#F5F0E8' }}>

          {/* ── Header ── */}
          <div className="flex-shrink-0 p-5" style={{ background: 'linear-gradient(135deg, #1C1712, #2d2218)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between mb-4">
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.08)' }}>←</button>
              <div className="flex items-center gap-2">
                <a href={`tel:${lead.phone}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
                  📞 Call
                </a>
                <button onClick={() => setShowAddNote(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  + Log Activity
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 8px 20px ${g[0]}50` }}>
                {ini(lead.lead_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black text-white truncate">{lead.lead_name}</h2>
                <p className="font-mono text-sm mt-0.5" style={{ color: '#F59E0B' }}>{lead.phone}</p>
                {lead.email && <p className="text-[10px] text-white/40 mt-0.5">{lead.email}</p>}
              </div>
            </div>

            {/* Stage badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: stg.bg, color: stg.color, border: `1px solid ${stg.color}30` }}>
                {stg.icon} {stg.label}
              </span>
              {lead.budget && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
                  💰 {lead.budget}
                </span>
              )}
              <span className="text-[10px] text-white/30 ml-auto">{timeAgo(lead.created_at)}</span>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">

            {/* Info cards */}
            <div className="p-4 grid grid-cols-2 gap-2">
              {[
                { l: 'Source',        v: lead.source },
                { l: 'Property Type', v: lead.property_type },
                { l: 'City',          v: lead.city },
                { l: 'Added',         v: fmtDate(lead.created_at) },
              ].map(x => x.v ? (
                <div key={x.l} className="bg-white rounded-xl p-3 border border-[#E8E2D8]">
                  <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{x.l}</p>
                  <p className="text-sm font-semibold text-[#1C1712] mt-0.5 truncate">{x.v}</p>
                </div>
              ) : null)}
            </div>

            {/* Requirement */}
            {lead.interest && (
              <div className="mx-4 mb-3 bg-white rounded-xl p-3 border border-[#E8E2D8]">
                <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider mb-1">Requirement</p>
                <p className="text-sm text-[#1C1712] leading-relaxed">{lead.interest}</p>
              </div>
            )}

            {/* Scheduled dates */}
            {(lead.followup_date || lead.sitevisit_date) && (
              <div className="mx-4 mb-3 space-y-2">
                {lead.followup_date && (
                  <div className="bg-white rounded-xl p-3 border-l-4 border-[#D97706] border border-[#FDE68A]">
                    <p className="text-[9px] font-bold text-[#D97706] uppercase tracking-wider">
                      {stg.label === 'RNR' || stg.label === 'Call Back' ? `${stg.icon} ${stg.label} Scheduled` : '🔄 Follow-up Scheduled'}
                    </p>
                    <p className="text-sm font-bold text-[#1C1712] mt-0.5">{fmtDateTime(lead.followup_date)}</p>
                  </div>
                )}
                {lead.sitevisit_date && (
                  <div className="bg-white rounded-xl p-3 border-l-4 border-[#EA580C] border border-[#FED7AA]">
                    <p className="text-[9px] font-bold text-[#EA580C] uppercase tracking-wider">🏠 Site Visit Scheduled</p>
                    <p className="text-sm font-bold text-[#1C1712] mt-0.5">{fmtDateTime(lead.sitevisit_date)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick stage mover */}
            <div className="mx-4 mb-3 bg-white rounded-xl border border-[#E8E2D8] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-[2px]">Move to Stage</p>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => handleStageChange(key)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                    style={{
                      background: lead.pipeline_stage === key ? cfg.color : cfg.bg,
                      color: lead.pipeline_stage === key ? 'white' : cfg.color,
                      border: `1px solid ${cfg.color}40`,
                    }}>
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quotation quick add */}
            <div className="mx-4 mb-3 bg-white rounded-xl border border-[#E8E2D8] overflow-hidden">
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-[2px]">💰 Quotation</p>
                <button onClick={() => setEditQuotation(!editQuotation)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  {editQuotation ? 'Cancel' : '+ Send Quotation'}
                </button>
              </div>
              {editQuotation ? (
                <div className="p-3 space-y-2">
                  <input type="text" placeholder="₹15,00,000" value={quotationAmount} onChange={e => setQuotationAmount(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm text-[#1C1712] outline-none border border-[#E8E2D8] focus:border-[#2563EB] bg-[#F7F5F1]" />
                  <button onClick={saveQuotation} disabled={savingQuotation}
                    className="w-full py-2 rounded-xl text-xs font-black text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
                    {savingQuotation ? '⏳...' : '💰 Mark Quotation Sent'}
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-xs text-[#9A8F82]">{lead.pipeline_stage === 'quotation' ? '✅ Quotation already sent' : 'No quotation sent yet'}</p>
                </div>
              )}
            </div>

            {/* ── Activity Timeline ── */}
            <div className="mx-4 mb-4 bg-white rounded-xl border border-[#E8E2D8] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
                <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-[2px]">📋 Activity History</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#7A6E60]">{activities.length}</span>
              </div>

              {activities.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-2xl mb-2">📋</p>
                  <p className="text-sm text-[#9A8F82]">No activity yet</p>
                  <p className="text-xs text-[#B8B0A0] mt-1">Log calls, site visits, quotations</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-0 bottom-0 w-px bg-[#F0EBE0]" />

                  <div className="divide-y divide-[#F7F5F1]">
                    {activities.map((act, i) => {
                      const cfg = ACTIVITY_CONFIG[act.type] || ACTIVITY_CONFIG.note
                      return (
                        <div key={act.id} className="flex gap-4 px-4 py-3.5 relative hover:bg-[#FDFAF8] transition-colors">
                          {/* Icon bubble */}
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 relative z-10"
                            style={{ background: cfg.bg, border: `2px solid ${cfg.color}30` }}>
                            {cfg.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-[#1C1712]">{act.title}</p>
                              <p className="text-[9px] text-[#B8B0A0] whitespace-nowrap flex-shrink-0">{timeAgo(act.created_at)}</p>
                            </div>
                            {act.description && (
                              <p className="text-[11px] text-[#7A6E60] mt-0.5 leading-relaxed">{act.description}</p>
                            )}
                            {act.amount && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                💰 {act.amount}
                              </span>
                            )}
                            {act.scheduled_date && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: '#FFFBEB', color: '#B45309' }}>
                                📅 {fmtDateTime(act.scheduled_date)}
                              </span>
                            )}
                            <p className="text-[9px] text-[#C4BAB0] mt-1">{fmtDate(act.created_at)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddNote && (
        <AddNoteModal
          leadId={leadId}
          onClose={() => setShowAddNote(false)}
          onSaved={() => { setShowAddNote(false); loadData() }}
        />
      )}

      {showFollowupModal && (
        <FollowupModal
          onClose={() => setShowFollowupModal(false)}
          onSave={handleFollowupSave}
        />
      )}
    </>
  )
}