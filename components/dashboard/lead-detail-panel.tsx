'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Phone, Plus, MapPin, Calendar, DollarSign, User, Clock, FileText, ChevronRight } from 'lucide-react'

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#DC2626', '#B91C1C'],
]

const PIPELINE_STAGES = [
  { key: 'new',       label: 'New',       icon: '🆕', color: '#7C3AED', light: '#EDE9FE' },
  { key: 'followup',  label: 'Follow Up', icon: '🔄', color: '#D97706', light: '#FEF3C7' },
  { key: 'rnr',       label: 'RNR',       icon: '📵', color: '#DC2626', light: '#FEE2E2' },
  { key: 'sitevisit', label: 'Site Visit',icon: '🏠', color: '#0891B2', light: '#CFFAFE' },
  { key: 'quotation', label: 'Quotation', icon: '💰', color: '#DB2777', light: '#FCE7F3' },
  { key: 'won',       label: 'Won',       icon: '🏆', color: '#059669', light: '#D1FAE5' },
  { key: 'lost',      label: 'Lost',      icon: '❌', color: '#DC2626', light: '#FEE2E2' },
]

const ACTIVITY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  created:      { icon: '✨', color: '#B8860B', bg: '#FFFBEB' },
  call:         { icon: '📞', color: '#7C3AED', bg: '#EDE9FE' },
  stage_change: { icon: '🔀', color: '#0891B2', bg: '#CFFAFE' },
  note:         { icon: '📝', color: '#64748B', bg: '#F1F5F9' },
  sitevisit:    { icon: '🏠', color: '#EA580C', bg: '#FFF7ED' },
  quotation:    { icon: '💰', color: '#2563EB', bg: '#EFF6FF' },
  followup:     { icon: '🔔', color: '#D97706', bg: '#FEF3C7' },
}

const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

const fmtDate = (ds: string) => {
  if (!ds) return '—'
  return new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDateTime = (ds: string) => {
  if (!ds) return '—'
  return new Date(ds).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

const timeAgo = (ds: string) => {
  const diff = Date.now() - new Date(ds).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days}d ago`
  if (hrs > 0)  return `${hrs}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

// Get tomorrow's date as default for follow up
const getTomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// Get current time + 1hr as default
const getNextHour = () => {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return `${String(d.getHours()).padStart(2, '0')}:00`
}

export function LeadDetailClient({ lead: initialLead, activities: initialActivities, leadId }: {
  lead: any; activities: any[]; leadId: string
}) {
  const router = useRouter()
  const [lead, setLead] = useState(initialLead)
  const [activities, setActivities] = useState(initialActivities)
  const [savingStage, setSavingStage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<'note' | 'call' | 'sitevisit' | 'quotation'>('call')
  const [savingNote, setSavingNote] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ── FOLLOW UP POPUP STATE ──
  const [showFollowUpPopup, setShowFollowUpPopup] = useState(false)
  const [followUpDate, setFollowUpDate] = useState(getTomorrow())
  const [followUpTime, setFollowUpTime] = useState(getNextHour())
  const [followUpNote, setFollowUpNote] = useState('')
  const [savingFollowUp, setSavingFollowUp] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
  }, [])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const curStage = PIPELINE_STAGES.find(s => s.key === lead.pipeline_stage) ?? PIPELINE_STAGES[0]
  const g = GRADIENTS[lead.lead_name?.charCodeAt(0) % GRADIENTS.length] ?? GRADIENTS[0]
  const curIdx = PIPELINE_STAGES.findIndex(s => s.key === lead.pipeline_stage)

  // ── NORMAL STAGE CHANGE ──
  const handleStageChange = async (stageKey: string) => {
    if (savingStage) return

    // Follow Up clicked → open popup instead
    if (stageKey === 'followup') {
      setFollowUpDate(getTomorrow())
      setFollowUpTime(getNextHour())
      setFollowUpNote('')
      setShowFollowUpPopup(true)
      return
    }

    setSavingStage(stageKey)
    const prev = lead.pipeline_stage
    const { data: { user } } = await supabase.auth.getUser()
    setLead((l: any) => ({ ...l, pipeline_stage: stageKey }))
    await supabase.from('leads').update({ pipeline_stage: stageKey }).eq('id', leadId)
    try {
      await supabase.from('lead_activities').insert({
        lead_id: leadId, type: 'stage_change', title: 'Stage Updated',
        description: `${prev} → ${stageKey}`, stage_from: prev, stage_to: stageKey,
        user_id: user?.id, created_at: new Date().toISOString(),
      })
      const { data: acts } = await supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
      setActivities(acts ?? [])
    } catch {}
    setSavingStage(null)
  }

  // ── SAVE FOLLOW UP ──
  const handleSaveFollowUp = async () => {
    if (!followUpDate || !followUpTime) return
    setSavingFollowUp(true)

    const prev = lead.pipeline_stage
    const { data: { user } } = await supabase.auth.getUser()

    // Combine date + time into ISO datetime
    const followUpDateTime = new Date(`${followUpDate}T${followUpTime}:00`).toISOString()
    const formattedDT = fmtDateTime(followUpDateTime)

    try {
      // Update lead: stage + followup_date + followup_note
      await supabase.from('leads').update({
        pipeline_stage: 'followup',
        followup_date: followUpDateTime,
        followup_note: followUpNote.trim() || null,
      }).eq('id', leadId)

      setLead((l: any) => ({
        ...l,
        pipeline_stage: 'followup',
        followup_date: followUpDateTime,
        followup_note: followUpNote.trim() || null,
      }))

      // Log activity
      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'followup',
        title: '🔔 Follow Up Scheduled',
        description: `📅 ${formattedDT}${followUpNote.trim() ? ` — ${followUpNote.trim()}` : ''}`,
        stage_from: prev,
        stage_to: 'followup',
        user_id: user?.id,
        created_at: new Date().toISOString(),
      })

      // Also log stage change if was different stage
      if (prev !== 'followup') {
        await supabase.from('lead_activities').insert({
          lead_id: leadId, type: 'stage_change', title: 'Stage Updated',
          description: `${prev} → followup`, stage_from: prev, stage_to: 'followup',
          user_id: user?.id, created_at: new Date().toISOString(),
        })
      }

      const { data: acts } = await supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
      setActivities(acts ?? [])
      setShowFollowUpPopup(false)
    } catch (e) {
      console.error(e)
    }
    setSavingFollowUp(false)
  }

  const handleSaveNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    const { data: { user } } = await supabase.auth.getUser()
    try {
      await supabase.from('lead_activities').insert({
        lead_id: leadId, type: noteType,
        title: noteType === 'note' ? 'Note added' : noteType === 'call' ? 'Call logged' : noteType === 'sitevisit' ? 'Site Visit' : 'Quotation',
        description: noteText.trim(), user_id: user?.id, created_at: new Date().toISOString(),
      })
      if (noteType === 'note') {
        await supabase.from('leads').update({ notes: noteText.trim() }).eq('id', leadId)
        setLead((l: any) => ({ ...l, notes: noteText.trim() }))
      }
      const { data: acts } = await supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
      setActivities(acts ?? [])
      setNoteText('')
      setShowModal(false)
    } catch (e) { console.error(e) }
    setSavingNote(false)
  }

  return (
    <div style={{ background: '#0F0F0F', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .fade-in  { animation: fadeIn 0.4s ease both; }
        .scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .stage-btn:hover { transform: translateY(-2px); }
        .stage-btn { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .activity-item { transition: background 0.15s ease; }
        .activity-item:hover { background: rgba(255,255,255,0.03); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
        .glass-warm { background: rgba(184,134,11,0.06); backdrop-filter: blur(12px); border: 1px solid rgba(184,134,11,0.15); }
        input[type="date"], input[type="time"] {
          color-scheme: dark;
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          cursor: pointer;
        }
      `}</style>

      {/* ── HERO HEADER ── */}
      <div style={{ background: `linear-gradient(160deg, ${g[0]}22 0%, #0F0F0F 60%)`, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}>

        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium transition-all hover:text-white"
            style={{ color: 'rgba(255,255,255,0.45)' }}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <a href={`tel:${lead.phone}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 glass">
              <Plus className="w-3.5 h-3.5" /> Log Activity
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 slide-up">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 relative"
              style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 12px 32px ${g[0]}50` }}>
              {ini(lead.lead_name)}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: curStage.color, border: '2px solid #0F0F0F' }}>
                {curStage.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl font-black text-white leading-tight">{lead.lead_name}</h1>
              <a href={`tel:${lead.phone}`} className="text-sm font-mono mt-1 block transition-opacity hover:opacity-80" style={{ color: '#F59E0B' }}>
                {lead.phone}
              </a>
              {lead.email && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{lead.email}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: `${curStage.color}20`, color: curStage.color, border: `1px solid ${curStage.color}40` }}>
              {curStage.icon} {curStage.label}
            </span>
            {/* Show scheduled follow up time if set */}
            {lead.followup_date && lead.pipeline_stage === 'followup' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(217,119,6,0.15)', color: '#FCD34D', border: '1px solid rgba(217,119,6,0.35)' }}>
                🔔 {fmtDateTime(lead.followup_date)}
              </span>
            )}
            {lead.budget && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(184,134,11,0.15)', color: '#F59E0B', border: '1px solid rgba(184,134,11,0.3)' }}>
                💰 {lead.budget}
              </span>
            )}
            {lead.source && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                📌 {lead.source}
              </span>
            )}
            <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {fmtDate(lead.created_at)}
            </span>
          </div>

          {/* Pipeline progress track */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[3px] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Pipeline</p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {PIPELINE_STAGES.filter(s => s.key !== 'lost').map((stage, idx) => {
                const isActive = stage.key === lead.pipeline_stage
                const isPast   = curIdx > idx && lead.pipeline_stage !== 'lost'
                const isLoading = savingStage === stage.key
                return (
                  <button key={stage.key}
                    onClick={() => handleStageChange(stage.key)}
                    disabled={!!savingStage}
                    className="stage-btn flex-shrink-0 flex flex-col items-center gap-1.5"
                    style={{ minWidth: 56 }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base relative overflow-hidden"
                      style={{
                        background: isActive ? `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)` : isPast ? `${stage.color}25` : 'rgba(255,255,255,0.05)',
                        border: isActive ? `2px solid ${stage.color}` : isPast ? `1px solid ${stage.color}50` : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isActive ? `0 8px 20px ${stage.color}50` : 'none',
                      }}>
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'pulse 1s infinite' }} />
                      ) : stage.icon}
                    </div>
                    <p className="text-[8px] font-bold leading-tight text-center"
                      style={{ color: isActive ? '#fff' : isPast ? `${stage.color}` : 'rgba(255,255,255,0.25)', maxWidth: 52 }}>
                      {stage.label}
                    </p>
                  </button>
                )
              })}
              <div className="w-px h-8 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <button
                onClick={() => handleStageChange('lost')}
                disabled={!!savingStage}
                className="stage-btn flex-shrink-0 flex flex-col items-center gap-1.5"
                style={{ minWidth: 48 }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base"
                  style={{
                    background: lead.pipeline_stage === 'lost' ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : 'rgba(220,38,38,0.1)',
                    border: lead.pipeline_stage === 'lost' ? '2px solid #DC2626' : '1px solid rgba(220,38,38,0.2)',
                    boxShadow: lead.pipeline_stage === 'lost' ? '0 8px 20px rgba(220,38,38,0.4)' : 'none',
                  }}>❌</div>
                <p className="text-[8px] font-bold" style={{ color: lead.pipeline_stage === 'lost' ? '#fff' : 'rgba(220,38,38,0.5)' }}>Lost</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="p-5 space-y-4 max-w-4xl mx-auto">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 slide-up" style={{ animationDelay: '0.1s' }}>
          {[
            { icon: MapPin,      label: 'City',          value: lead.city },
            { icon: User,        label: 'Property',      value: lead.property_type },
            { icon: Calendar,    label: 'Added',         value: fmtDate(lead.created_at) },
            { icon: DollarSign,  label: 'Budget',        value: lead.budget },
          ].map((x, i) => x.value ? (
            <div key={i} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <x.icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{x.label}</p>
              </div>
              <p className="text-sm font-bold text-white">{x.value}</p>
            </div>
          ) : null)}
        </div>

        {/* Follow Up scheduled card — show if set */}
        {lead.followup_date && (
          <div className="rounded-2xl p-4 slide-up"
            style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#F59E0B' }}>🔔 Follow Up Scheduled</p>
              <button
                onClick={() => {
                  setFollowUpDate(lead.followup_date ? new Date(lead.followup_date).toISOString().split('T')[0] : getTomorrow())
                  setFollowUpTime(lead.followup_date ? new Date(lead.followup_date).toTimeString().slice(0,5) : getNextHour())
                  setFollowUpNote(lead.followup_note || '')
                  setShowFollowUpPopup(true)
                }}
                className="text-[9px] font-bold px-2 py-1 rounded-lg"
                style={{ background: 'rgba(217,119,6,0.2)', color: '#FCD34D' }}>
                ✏️ Edit
              </button>
            </div>
            <p className="text-base font-black" style={{ color: '#FCD34D' }}>{fmtDateTime(lead.followup_date)}</p>
            {lead.followup_note && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{lead.followup_note}</p>
            )}
          </div>
        )}

        {(lead.interest || lead.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 slide-up" style={{ animationDelay: '0.15s' }}>
            {lead.interest && (
              <div className="glass rounded-2xl p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>💡 Requirement</p>
                <p className="text-sm text-white/70 leading-relaxed">{lead.interest}</p>
              </div>
            )}
            {lead.notes && (
              <div className="glass rounded-2xl p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>📝 Notes</p>
                <p className="text-sm text-white/70 leading-relaxed">{lead.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Move to Stage */}
        <div className="glass rounded-2xl overflow-hidden slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Move to Stage</p>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {PIPELINE_STAGES.map(stage => {
              const isActive  = lead.pipeline_stage === stage.key
              const isLoading = savingStage === stage.key
              return (
                <button key={stage.key}
                  onClick={() => handleStageChange(stage.key)}
                  disabled={!!savingStage}
                  className="stage-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold relative overflow-hidden"
                  style={{
                    background: isActive ? `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)` : `${stage.color}12`,
                    color: isActive ? '#fff' : stage.color,
                    border: `1px solid ${isActive ? stage.color : stage.color + '30'}`,
                    boxShadow: isActive ? `0 4px 16px ${stage.color}40` : 'none',
                  }}>
                  {isLoading ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : stage.icon}
                  {stage.label}
                  {isActive && <span className="text-[10px] opacity-70">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="glass rounded-2xl overflow-hidden slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Activity History</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                {activities.length}
              </span>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{ background: 'rgba(184,134,11,0.15)', color: '#F59E0B', border: '1px solid rgba(184,134,11,0.25)' }}>
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {activities.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm font-bold text-white/30">No activity yet</p>
              <p className="text-xs text-white/15 mt-1">Log calls, visits, and quotations</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[42px] top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)' }} />
              {activities.map((act: any, i: number) => {
                const cfg = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.note
                return (
                  <div key={act.id} className="activity-item flex gap-4 px-4 py-4 relative"
                    style={{ borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 relative z-10"
                      style={{ background: `${cfg.bg}15`, border: `1px solid ${cfg.color}30` }}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-xs font-bold text-white">{act.title}</p>
                        <p className="text-[9px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>{timeAgo(act.created_at)}</p>
                      </div>
                      {act.description && (
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{act.description}</p>
                      )}
                      {act.user_name && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>
                          👤 {act.user_name}
                        </span>
                      )}
                      <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>{fmtDate(act.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          FOLLOW UP POPUP
      ══════════════════════════════════════ */}
      {showFollowUpPopup && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowFollowUpPopup(false)} />

          <div className="relative w-full max-w-sm scale-in"
            style={{
              background: 'linear-gradient(160deg, #1C1612 0%, #171310 100%)',
              border: '1px solid rgba(217,119,6,0.25)',
              borderRadius: 24,
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,119,6,0.1)',
            }}>

            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(217,119,6,0.12)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                  style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)' }}>
                  🔔
                </div>
                <div>
                  <p className="text-sm font-black text-white">Schedule Follow Up</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{lead.lead_name}</p>
                </div>
              </div>
              <button onClick={() => setShowFollowUpPopup(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>✕</button>
            </div>

            <div className="p-5 space-y-4">

              {/* Date + Time row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>📅 Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(217,119,6,0.3)',
                      color: '#FCD34D',
                    }}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>🕐 Time</label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={e => setFollowUpTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(217,119,6,0.3)',
                      color: '#FCD34D',
                    }}
                  />
                </div>
              </div>

              {/* Quick time slots */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Quick Pick</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: '9 AM',  time: '09:00' },
                    { label: '11 AM', time: '11:00' },
                    { label: '2 PM',  time: '14:00' },
                    { label: '4 PM',  time: '16:00' },
                    { label: '6 PM',  time: '18:00' },
                  ].map(slot => (
                    <button key={slot.time}
                      onClick={() => setFollowUpTime(slot.time)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: followUpTime === slot.time ? 'rgba(217,119,6,0.25)' : 'rgba(255,255,255,0.05)',
                        color: followUpTime === slot.time ? '#FCD34D' : 'rgba(255,255,255,0.35)',
                        border: `1px solid ${followUpTime === slot.time ? 'rgba(217,119,6,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>📝 Note (optional)</label>
                <textarea
                  rows={2}
                  value={followUpNote}
                  onChange={e => setFollowUpNote(e.target.value)}
                  placeholder="E.g. Client busy, call after office hours..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    caretColor: '#F59E0B',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(217,119,6,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              {/* Preview */}
              {followUpDate && followUpTime && (
                <div className="px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.6)' }}>Scheduled For</p>
                  <p className="text-sm font-black" style={{ color: '#FCD34D' }}>
                    {fmtDateTime(new Date(`${followUpDate}T${followUpTime}:00`).toISOString())}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowFollowUpPopup(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Cancel
                </button>
                <button
                  onClick={handleSaveFollowUp}
                  disabled={!followUpDate || !followUpTime || savingFollowUp}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-30 transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #B45309, #D97706)',
                    boxShadow: '0 8px 20px rgba(217,119,6,0.35)',
                  }}>
                  {savingFollowUp ? '⏳ Saving...' : '🔔 Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOG ACTIVITY MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden slide-up"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-bold text-white">Log Activity</p>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {([
                  { id: 'call',      label: '📞 Call',      color: '#7C3AED' },
                  { id: 'note',      label: '📝 Note',      color: '#64748B' },
                  { id: 'sitevisit', label: '🏠 Visit',     color: '#EA580C' },
                  { id: 'quotation', label: '💰 Quote',     color: '#2563EB' },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setNoteType(t.id)}
                    className="py-2.5 px-1 rounded-xl text-[10px] font-bold text-center transition-all"
                    style={{
                      background: noteType === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                      color: noteType === t.id ? t.color : 'rgba(255,255,255,0.35)',
                      border: `1.5px solid ${noteType === t.id ? t.color + '60' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder={
                  noteType === 'call' ? 'Call summary — what did the customer say?' :
                  noteType === 'quotation' ? 'Quotation details and amount...' :
                  noteType === 'sitevisit' ? 'Site visit notes...' : 'Add a note...'
                }
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  caretColor: '#F59E0B',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(184,134,11,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />

              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Cancel
                </button>
                <button onClick={handleSaveNote} disabled={!noteText.trim() || savingNote}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-30 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: noteText.trim() ? '0 8px 20px rgba(184,134,11,0.35)' : 'none' }}>
                  {savingNote ? '⏳ Saving...' : '+ Save Activity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}