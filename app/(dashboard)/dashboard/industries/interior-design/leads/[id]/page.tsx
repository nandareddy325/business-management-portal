'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Phone, Calendar, MapPin, Tag, FileText, Trophy, XCircle, Zap, UserPlus } from 'lucide-react'

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]

const PIPELINE_STAGES = [
  { key: 'new',       label: 'New Lead',   icon: '🆕', color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'fresh-leads', label: 'Fresh',    icon: '⚡', color: '#16A34A', bg: '#F0FDF4' },
  { key: 'calling',   label: 'Calling',    icon: '📞', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'followup',  label: 'Follow Up',  icon: '🔄', color: '#D97706', bg: '#FFFBEB' },
  { key: 'sitevisit', label: 'Site Visit', icon: '🏠', color: '#0891B2', bg: '#ECFEFF' },
  { key: 'quotation', label: 'Quotation',  icon: '💰', color: '#DB2777', bg: '#FDF2F8' },
  { key: 'won',       label: 'Won',        icon: '🏆', color: '#B8860B', bg: '#FFFBEB' },
  { key: 'lost',      label: 'Lost',       icon: '❌', color: '#DC2626', bg: '#FEF2F2' },
]

const SOURCE_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  Instagram:   { bg: '#FDF2F8', color: '#DB2777', icon: '📸' },
  Facebook:    { bg: '#EFF6FF', color: '#2563EB', icon: '📘' },
  WhatsApp:    { bg: '#F0FDF4', color: '#16A34A', icon: '💬' },
  Referral:    { bg: '#FFFBEB', color: '#D97706', icon: '🤝' },
  'Walk-in':   { bg: '#F5F3FF', color: '#7C3AED', icon: '🚶' },
  Google:      { bg: '#FEF2F2', color: '#DC2626', icon: '🔍' },
  Other:       { bg: '#F5F0E8', color: '#7A6E60', icon: '📌' },
}

const ACTIVITY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  created:      { icon: '🌟', color: '#B8860B', bg: '#FFFBEB' },
  call:         { icon: '📞', color: '#7C3AED', bg: '#F5F3FF' },
  stage_change: { icon: '↗️', color: '#0891B2', bg: '#ECFEFF' },
  note:         { icon: '📝', color: '#64748B', bg: '#F8FAFC' },
  sitevisit:    { icon: '🏠', color: '#EA580C', bg: '#FFF7ED' },
  quotation:    { icon: '💰', color: '#2563EB', bg: '#EFF6FF' },
}

const ini = (name: string) =>
  name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

const fmtDate = (ds: string) => {
  if (!ds) return '—'
  return new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingStage, setSavingStage] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<'note' | 'call' | 'sitevisit' | 'quotation'>('note')
  const [savingNote, setSavingNote] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadData = async () => {
    const { data: leadData } = await supabase
      .from('leads').select('*').eq('id', params.id).single()
    if (leadData) setLead(leadData)

    try {
      const { data: acts } = await supabase
        .from('lead_activities').select('*')
        .eq('lead_id', params.id)
        .order('created_at', { ascending: false })

      const synthetic: any[] = []
      if (leadData?.created_at) {
        synthetic.push({
          id: 'created', type: 'created',
          title: 'Lead Created',
          description: `Added via ${leadData.source || 'manual entry'}`,
          created_at: leadData.created_at,
        })
      }
      const combined = [...(acts || []), ...synthetic]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setActivities(combined)
    } catch {
      if (leadData?.created_at) {
        setActivities([{
          id: 'created', type: 'created',
          title: 'Lead Created',
          description: `Added via ${leadData?.source || 'manual entry'}`,
          created_at: leadData.created_at,
        }])
      }
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [params.id])

  const handleStageChange = async (stageKey: string) => {
    if (!lead || savingStage) return
    setSavingStage(true)
    const prev = lead.pipeline_stage
    setLead((l: any) => ({ ...l, pipeline_stage: stageKey }))
    await supabase.from('leads').update({ pipeline_stage: stageKey }).eq('id', params.id)
    try {
      await supabase.from('lead_activities').insert({
        lead_id: params.id, type: 'stage_change',
        title: 'Stage Updated',
        description: `${prev} → ${stageKey}`,
        stage_from: prev, stage_to: stageKey,
        created_at: new Date().toISOString(),
      })
    } catch {}
    await loadData()
    setSavingStage(false)
  }

  const handleSaveNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      await supabase.from('lead_activities').insert({
        lead_id: params.id, type: noteType,
        title: noteType === 'note' ? 'Note added' : noteType === 'call' ? 'Call logged' : noteType === 'sitevisit' ? 'Site Visit' : 'Quotation',
        description: noteText.trim(),
        created_at: new Date().toISOString(),
      })
      if (noteType === 'note') {
        await supabase.from('leads').update({ notes: noteText.trim() }).eq('id', params.id)
        setLead((l: any) => ({ ...l, notes: noteText.trim() }))
      }
      setNoteText('')
      setShowNoteModal(false)
      await loadData()
    } catch (e) { console.error(e) }
    setSavingNote(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0E8' }}>
      <div className="w-10 h-10 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!lead) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0E8' }}>
      <div className="text-center">
        <p className="text-2xl mb-2">😕</p>
        <p className="text-[#1C1712] font-bold">Lead not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[#B8860B] underline">Go Back</button>
      </div>
    </div>
  )

  const nameIdx  = lead.lead_name.charCodeAt(0) % GRADIENTS.length
  const g        = GRADIENTS[nameIdx]
  const src      = SOURCE_CONFIG[lead.source] ?? SOURCE_CONFIG['Other']
  const curStage = PIPELINE_STAGES.find(s => s.key === lead.pipeline_stage) ?? PIPELINE_STAGES[0]
  const curStageIdx = PIPELINE_STAGES.findIndex(s => s.key === lead.pipeline_stage)

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1C1712, #2d2218)' }}>
        <div className="p-4 md:p-6">
          {/* Back + Actions */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <a href={`tel:${lead.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
                <Phone className="w-3.5 h-3.5" />
                Call
              </a>
              <button onClick={() => setShowNoteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                + Log Activity
              </button>
            </div>
          </div>

          {/* Lead Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 8px 20px ${g[0]}50` }}>
              {ini(lead.lead_name)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-white">{lead.lead_name}</h1>
              <a href={`tel:${lead.phone}`} className="font-mono text-sm mt-0.5 block" style={{ color: '#F59E0B' }}>
                {lead.phone}
              </a>
              {lead.email && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{lead.email}</p>}
            </div>
          </div>

          {/* Stage + Budget badges */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: curStage.bg, color: curStage.color }}>
              {curStage.icon} {curStage.label}
            </span>
            {lead.budget && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
                💰 {lead.budget}
              </span>
            )}
            {lead.source && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: src.bg, color: src.color }}>
                {src.icon} {lead.source}
              </span>
            )}
            <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Added {fmtDate(lead.created_at)}
            </span>
          </div>
        </div>

        {/* Pipeline Progress Bar */}
        <div className="px-4 md:px-6 pb-5">
          <p className="text-[9px] font-bold uppercase tracking-[2px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Pipeline Progress
          </p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {PIPELINE_STAGES.filter(s => s.key !== 'lost').map((stage, idx) => {
              const isActive  = stage.key === lead.pipeline_stage
              const isPast    = curStageIdx > idx && lead.pipeline_stage !== 'lost'
              return (
                <button key={stage.key}
                  onClick={() => handleStageChange(stage.key)}
                  disabled={savingStage}
                  className="flex flex-col items-center gap-1 flex-shrink-0 transition-all hover:scale-105 disabled:opacity-50"
                  style={{ minWidth: '52px' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all"
                    style={{
                      background: isActive ? stage.color : isPast ? `${stage.color}40` : 'rgba(255,255,255,0.08)',
                      border: isActive ? `2px solid ${stage.color}` : isPast ? `2px solid ${stage.color}60` : '2px solid rgba(255,255,255,0.12)',
                      boxShadow: isActive ? `0 4px 14px ${stage.color}50` : 'none',
                    }}>
                    {stage.icon}
                  </div>
                  <p className="text-[8px] font-bold text-center leading-tight"
                    style={{ color: isActive ? '#fff' : isPast ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', maxWidth: '48px' }}>
                    {stage.label}
                  </p>
                </button>
              )
            })}
            {/* Lost separate */}
            <button onClick={() => handleStageChange('lost')}
              disabled={savingStage}
              className="flex flex-col items-center gap-1 flex-shrink-0 ml-2 transition-all hover:scale-105 disabled:opacity-50"
              style={{ minWidth: '52px' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                style={{
                  background: lead.pipeline_stage === 'lost' ? '#DC2626' : 'rgba(255,255,255,0.08)',
                  border: lead.pipeline_stage === 'lost' ? '2px solid #DC2626' : '2px solid rgba(255,255,255,0.12)',
                }}>
                ❌
              </div>
              <p className="text-[8px] font-bold" style={{ color: lead.pipeline_stage === 'lost' ? '#fff' : 'rgba(255,255,255,0.3)' }}>Lost</p>
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Source',        value: lead.source,        icon: '📌' },
            { label: 'Property Type', value: lead.property_type, icon: '🏠' },
            { label: 'City',          value: lead.city,          icon: '📍' },
            { label: 'Added',         value: fmtDate(lead.created_at), icon: '📅' },
          ].filter(x => x.value).map(x => (
            <div key={x.label} className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-sm">
              <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider mb-1">{x.label}</p>
              <p className="text-sm font-bold text-[#1C1712] flex items-center gap-1">
                <span>{x.icon}</span> {x.value}
              </p>
            </div>
          ))}
        </div>

        {/* Requirement + Notes */}
        {(lead.interest || lead.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lead.interest && (
              <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-sm">
                <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider mb-2">💡 Requirement</p>
                <p className="text-sm text-[#1C1712] leading-relaxed">{lead.interest}</p>
              </div>
            )}
            {lead.notes && (
              <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-sm">
                <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider mb-2">📝 Notes</p>
                <p className="text-sm text-[#1C1712] leading-relaxed">{lead.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Move to Stage — Quick Buttons */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-[2px]">Move to Stage</p>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {PIPELINE_STAGES.map(stage => (
              <button key={stage.key}
                onClick={() => handleStageChange(stage.key)}
                disabled={savingStage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  background: lead.pipeline_stage === stage.key ? stage.color : stage.bg,
                  color: lead.pipeline_stage === stage.key ? '#fff' : stage.color,
                  border: `1px solid ${stage.color}40`,
                  boxShadow: lead.pipeline_stage === stage.key ? `0 4px 12px ${stage.color}40` : 'none',
                }}>
                {stage.icon} {stage.label}
                {lead.pipeline_stage === stage.key && <span className="text-[8px] opacity-70">✓ Current</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-[2px]">📋 Activity History</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#7A6E60]">{activities.length}</span>
              <button onClick={() => setShowNoteModal(true)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white"
                style={{ background: '#1C1712' }}>
                + Add
              </button>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm text-[#9A8F82]">No activity yet</p>
            </div>
          ) : (
            <div className="relative p-4 space-y-3">
              <div className="absolute left-8 top-4 bottom-4 w-px" style={{ background: '#F0EBE0' }} />
              {activities.map((act: any) => {
                const cfg = ACTIVITY_CONFIG[act.type] || ACTIVITY_CONFIG.note
                return (
                  <div key={act.id} className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 relative z-10"
                      style={{ background: cfg.bg, border: `2px solid ${cfg.color}30` }}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 bg-[#FAFAF8] rounded-xl p-3 border border-[#F0EBE0]">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#1C1712]">{act.title}</p>
                        <p className="text-[9px] text-[#C4BAB0] whitespace-nowrap">{timeAgo(act.created_at)}</p>
                      </div>
                      {act.description && (
                        <p className="text-[11px] text-[#7A6E60] mt-1 leading-relaxed">{act.description}</p>
                      )}
                      {act.amount && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: '#EFF6FF', color: '#2563EB' }}>
                          💰 {act.amount}
                        </span>
                      )}
                      <p className="text-[9px] text-[#C4BAB0] mt-1">{fmtDate(act.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Activity Modal ── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNoteModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E2D8] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
              <p className="font-bold text-[#1C1712]">Add Activity</p>
              <button onClick={() => setShowNoteModal(false)}
                className="w-7 h-7 rounded-full bg-[#F5F0E8] flex items-center justify-center text-[#9A8F82]">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {([
                  { id: 'note',      label: '📝 Note',       color: '#64748B' },
                  { id: 'call',      label: '📞 Call',       color: '#7C3AED' },
                  { id: 'sitevisit', label: '🏠 Site Visit', color: '#EA580C' },
                  { id: 'quotation', label: '💰 Quotation',  color: '#2563EB' },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setNoteType(t.id)}
                    className="py-2 px-1 rounded-xl text-[10px] font-bold text-center transition-all"
                    style={{
                      background: noteType === t.id ? `${t.color}15` : '#F5F0E8',
                      color: noteType === t.id ? t.color : '#7A6E60',
                      border: `2px solid ${noteType === t.id ? t.color : 'transparent'}`,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea rows={4} value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder={noteType === 'call' ? 'Call summary...' : noteType === 'quotation' ? 'Quotation details...' : noteType === 'sitevisit' ? 'Site visit notes...' : 'Add a note...'}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none resize-none border border-[#E8E2D8] focus:border-[#B8860B] bg-[#F7F5F1]" />
              <div className="flex gap-3">
                <button onClick={() => setShowNoteModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#7A6E60] border border-[#E8E2D8]">
                  Cancel
                </button>
                <button onClick={handleSaveNote} disabled={!noteText.trim() || savingNote}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1C1712, #2d2822)' }}>
                  {savingNote ? '⏳ Saving...' : '+ Add Activity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}