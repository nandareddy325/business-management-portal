'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchLeads, insertLeadsBulk } from '@/lib/supabase-helpers'
import { AddLeadModal } from '@/components/dashboard/add-lead-modal'
import { LeadDetailPanel } from '@/components/dashboard/lead-detail-panel'

const PIPELINE_STAGES = [
  { key: 'new',             label: 'New Lead',   icon: '🎯', color: '#64748B', light: '#F8FAFC', border: '#E2E8F0', accent: '#64748B' },
  { key: 'called',          label: 'Called',     icon: '📞', color: '#7C3AED', light: '#F5F3FF', border: '#DDD6FE', accent: '#7C3AED' },
  { key: 'interested',      label: 'Interested', icon: '✨', color: '#0891B2', light: '#ECFEFF', border: '#A5F3FC', accent: '#0891B2' },
  { key: 'followup',        label: 'Follow Up',  icon: '🔄', color: '#D97706', light: '#FFFBEB', border: '#FDE68A', accent: '#D97706' },
  { key: 'sitevisit',       label: 'Site Visit', icon: '🏠', color: '#EA580C', light: '#FFF7ED', border: '#FED7AA', accent: '#EA580C' },
  { key: 'quotation',       label: 'Quotation',  icon: '💰', color: '#2563EB', light: '#EFF6FF', border: '#BFDBFE', accent: '#2563EB' },
  { key: 'won',             label: 'Won',        icon: '✅', color: '#16A34A', light: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A' },
  { key: 'project_started', label: 'Project On', icon: '🚀', color: '#0F766E', light: '#F0FDFA', border: '#99F6E4', accent: '#0F766E' },
  { key: 'lost',            label: 'Lost',       icon: '❌', color: '#DC2626', light: '#FEF2F2', border: '#FECACA', accent: '#DC2626' },
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

// ── Mini Calendar ──────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, accentColor }: {
  selectedDate: string; onSelect: (d: string) => void; accentColor: string
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }

  const toDateStr = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const isPast = (d: number) => toDateStr(d) < todayStr

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FEFCF8', border: '1px solid #E8E2D8' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: accentColor, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors text-sm font-bold">‹</button>
        <p className="text-sm font-black text-white">{monthNames[viewMonth]} {viewYear}</p>
        <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors text-sm font-bold">›</button>
      </div>
      <div className="grid grid-cols-7 px-3 pt-2">
        {dayNames.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-black text-[#9A8F82] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1
          const ds = toDateStr(d)
          const isSelected = ds === selectedDate
          const isToday = ds === todayStr
          const past = isPast(d)
          return (
            <button key={d} onClick={() => !past && onSelect(ds)} disabled={past}
              className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: isSelected ? accentColor : isToday ? `${accentColor}20` : 'transparent',
                color: isSelected ? 'white' : isToday ? accentColor : '#1C1712',
                boxShadow: isSelected ? `0 2px 8px ${accentColor}50` : 'none',
              }}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

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

  const todayISO = new Date().toISOString().split('T')[0]
  const [scheduledDate, setScheduledDate] = useState(todayISO)
  const [scheduledTime, setScheduledTime] = useState('10:00')
  const [showCalendar, setShowCalendar] = useState(false)

  const timer = useRef<any>(null)
  const stg = getStg(lead.pipeline)
  const g = GRADIENTS[lead.name.charCodeAt(0) % GRADIENTS.length]
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const startCall = () => {
  setPhase('calling')
  timer.current = setInterval(() => setSeconds(d => d + 1), 1000)
  const a = document.createElement('a')
  a.href = `tel:${lead.phone}`
  a.click()
}
  const endCall = () => { clearInterval(timer.current); setPhase('post') }
  useEffect(() => () => clearInterval(timer.current), [])

  const outcomes = [
    { id: 'interested',    label: '✨ Interested',      color: '#0891B2', accent: '#ECFEFF', desc: 'Showing interest', needsDate: true,  dateLabel: 'Follow-up Date' },
    { id: 'followup',      label: '🔄 Follow Up',       color: '#D97706', accent: '#FFFBEB', desc: 'Call back needed', needsDate: true,  dateLabel: 'Call Back Date' },
    { id: 'sitevisit',     label: '🏠 Site Visit',      color: '#EA580C', accent: '#FFF7ED', desc: 'Wants to visit',   needsDate: true,  dateLabel: 'Site Visit Date' },
    { id: 'notinterested', label: '❌ Not Interested',  color: '#DC2626', accent: '#FEF2F2', desc: 'Mark as lost',     needsDate: false, dateLabel: '' },
  ]

  const selectedOutcome = outcomes.find(o => o.id === outcome)
  const needsDate = selectedOutcome?.needsDate ?? false

  const handleOutcomeSelect = (id: string) => {
    setOutcome(id)
    setShowCalendar(outcomes.find(o => o.id === id)?.needsDate ?? false)
  }

  const formatDisplayDate = (ds: string) => {
    if (!ds) return ''
    const d = new Date(ds + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  }

  const stageMap: Record<string, string> = {
    interested: 'interested', followup: 'followup', sitevisit: 'sitevisit', notinterested: 'lost',
  }

  const handleSave = async () => {
    if (!outcome) return
    if (needsDate && !scheduledDate) return
    setSaving(true)
    try {
      const updateData: any = {
        pipeline_stage: stageMap[outcome] || 'called',
        notes: note,
        status: outcome === 'notinterested' ? 'Lost' : 'Active',
      }
      if (needsDate && scheduledDate) {
        const dateTime = scheduledTime ? `${scheduledDate}T${scheduledTime}:00` : scheduledDate
        if (outcome === 'sitevisit') updateData.sitevisit_date = dateTime
        else updateData.followup_date = dateTime
      }
      await supabase.from('leads').update(updateData).eq('id', lead.id)
      onUpdatePipeline(lead.id, stageMap[outcome] || 'called')
      setSaved(true)
      setTimeout(onClose, 1400)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const quickDates = [
    { label: 'Today',     value: todayISO },
    { label: 'Tomorrow',  value: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { label: 'In 3 Days', value: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
    { label: 'Next Week', value: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: '#FEFCF8', border: '1px solid #E2D9C8', boxShadow: '0 24px 60px rgba(28,23,18,0.25)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="relative p-5 text-center" style={{ background: 'linear-gradient(135deg, #1C1712 0%, #2d2218 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #B8860B, transparent 60%)' }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white" style={{ background: 'rgba(255,255,255,0.08)' }}>✕</button>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center text-lg font-black text-white"
            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 8px 24px ${g[0]}50` }}>
            {ini(lead.name)}
          </div>
          <p className="text-white font-bold text-base">{lead.name}</p>
          <p className="font-mono text-sm mt-0.5" style={{ color: '#F59E0B' }}>{lead.phone}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: stg.light, color: stg.color, border: `1px solid ${stg.border}` }}>
            {stg.icon} {stg.label}
          </span>
          {phase === 'calling' && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono text-sm">{fmt(seconds)}</span>
            </div>
          )}
        </div>

        <div className="p-3 grid grid-cols-3 gap-2 border-b border-[#F0EBE0]">
          {[{ l: 'Budget', v: lead.budget }, { l: 'Source', v: lead.source }, { l: 'Added', v: lead.date }].map(x => (
            <div key={x.l} className="rounded-xl p-2 text-center" style={{ background: '#F7F5F1', border: '1px solid #EDE8E0' }}>
              <p className="text-[8px] text-[#9A8F82] uppercase tracking-wider font-bold">{x.l}</p>
              <p className="text-xs font-bold text-[#1C1712] mt-0.5 truncate">{x.v || '—'}</p>
            </div>
          ))}
        </div>

        {lead.requirement && lead.requirement !== '—' && (
          <div className="px-4 py-2.5 border-b border-[#F0EBE0]">
            <p className="text-[9px] text-[#9A8F82] uppercase tracking-wider font-bold mb-1">Requirement</p>
            <p className="text-xs text-[#4A4035] leading-relaxed">{lead.requirement}</p>
          </div>
        )}

        <div className="p-4 space-y-3">
          {phase === 'pre' && (
            <>
              <button onClick={startCall} className="w-full py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
                📞 Call Now — {lead.phone}
              </button>
              <button onClick={() => { setPhase('post') }} className="w-full py-2.5 rounded-xl text-xs font-bold text-[#7A6E60] border border-[#E8E2D8] hover:bg-[#F5F0E8] transition-colors">
                📝 Log Call Outcome (already called)
              </button>
              <button onClick={() => navigator.clipboard.writeText(lead.phone)} className="w-full py-2 rounded-xl text-xs font-bold text-[#7A6E60] hover:text-[#1C1712] transition-colors border border-[#E8E2D8] hover:bg-[#F5F0E8]">
                📋 Copy Number
              </button>
              <button onClick={onClose} className="w-full text-[#B8B0A0] text-xs hover:text-[#1C1712] py-1 transition-colors">Cancel</button>
            </>
          )}

          {phase === 'calling' && (
            <button onClick={endCall} className="w-full py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', boxShadow: '0 8px 24px rgba(220,38,38,0.3)' }}>
              📵 End Call — {fmt(seconds)}
            </button>
          )}

          {phase === 'post' && (
            <>
              <div>
                <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-wider mb-2">Call Outcome *</p>
                <div className="grid grid-cols-2 gap-2">
                  {outcomes.map(o => (
                    <button key={o.id} onClick={() => handleOutcomeSelect(o.id)}
                      className="p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                      style={{
                        background: outcome === o.id ? `${o.color}15` : '#F7F5F1',
                        border: `2px solid ${outcome === o.id ? o.color : '#E8E2D8'}`,
                        boxShadow: outcome === o.id ? `0 4px 12px ${o.color}25` : 'none',
                      }}>
                      <p className="text-xs font-black" style={{ color: outcome === o.id ? o.color : '#1C1712' }}>{o.label}</p>
                      <p className="text-[9px] text-[#9A8F82] mt-0.5">{o.desc}</p>
                      {o.needsDate && outcome === o.id && (
                        <p className="text-[8px] font-bold mt-1" style={{ color: o.color }}>📅 Schedule date →</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {needsDate && outcome && (
                <div className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${selectedOutcome?.color}30`, background: selectedOutcome?.accent }}>
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${selectedOutcome?.color}20` }}>
                    <span className="text-base">{outcome === 'sitevisit' ? '🏠' : outcome === 'followup' ? '🔄' : '✨'}</span>
                    <p className="text-xs font-black" style={{ color: selectedOutcome?.color }}>{selectedOutcome?.dateLabel}</p>
                    {scheduledDate && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: selectedOutcome?.color }}>
                        {formatDisplayDate(scheduledDate)}
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-2 flex gap-2 flex-wrap">
                    {quickDates.map(qd => (
                      <button key={qd.label} onClick={() => { setScheduledDate(qd.value); setShowCalendar(false) }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                        style={{
                          background: scheduledDate === qd.value ? selectedOutcome?.color : 'rgba(255,255,255,0.6)',
                          color: scheduledDate === qd.value ? 'white' : selectedOutcome?.color,
                          border: `1px solid ${scheduledDate === qd.value ? selectedOutcome?.color : selectedOutcome?.color + '40'}`,
                        }}>
                        {qd.label}
                      </button>
                    ))}
                    <button onClick={() => setShowCalendar(c => !c)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                      style={{
                        background: showCalendar ? selectedOutcome?.color : 'rgba(255,255,255,0.6)',
                        color: showCalendar ? 'white' : selectedOutcome?.color,
                        border: `1px solid ${selectedOutcome?.color}40`,
                      }}>
                      📅 Pick Date
                    </button>
                  </div>
                  {showCalendar && (
                    <div className="px-3 pb-3">
                      <MiniCalendar
                        selectedDate={scheduledDate}
                        onSelect={(d) => { setScheduledDate(d); setShowCalendar(false) }}
                        accentColor={selectedOutcome?.color || '#D97706'}
                      />
                    </div>
                  )}
                  <div className="px-3 pb-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold" style={{ color: selectedOutcome?.color }}>⏰ Time:</span>
                    <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                      className="flex-1 rounded-xl px-3 py-1.5 text-sm font-bold text-[#1C1712] outline-none border transition-colors"
                      style={{ background: 'white', borderColor: `${selectedOutcome?.color}40` }} />
                  </div>
                </div>
              )}

              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Notes about this call..."
                rows={2} className="w-full rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder:text-[#C4BAB0] outline-none resize-none border-2 border-[#E8E2D8] focus:border-[#B8860B] transition-colors"
                style={{ background: '#F7F5F1' }} />

              <button onClick={handleSave} disabled={!outcome || saving || saved || (needsDate && !scheduledDate)}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
                style={{ background: saved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #1C1712, #2d2822)', boxShadow: '0 8px 24px rgba(28,23,18,0.2)' }}>
                {saved ? '✅ Saved!' : saving ? '⏳ Saving...' : needsDate && scheduledDate
                  ? `💾 Save — ${outcome === 'sitevisit' ? '🏠' : '🔄'} ${formatDisplayDate(scheduledDate)} ${scheduledTime}`
                  : '💾 Save & Update Stage'}
              </button>
              {!outcome && <p className="text-center text-[10px] text-[#9A8F82]">⚠ Select an outcome first</p>}
              {outcome && needsDate && !scheduledDate && <p className="text-center text-[10px] text-red-500">⚠ Select a date</p>}
            </>
          )}
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
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  // ── Date Filter State ──
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

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

  // ── Date Filter Logic ──
  const getDateFilteredLeads = (leads: Lead[]) => {
    const now = new Date()
    const todayISO = now.toISOString().split('T')[0]
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekStartISO = weekStart.toISOString().split('T')[0]
    const monthStartISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    return leads.filter(l => {
      if (dateFilter === 'all') return true
      const rawDate = l.date
      if (!rawDate || rawDate === 'Today') {
        if (dateFilter === 'custom' && fromDate) return todayISO >= fromDate && (!toDate || todayISO <= toDate)
        return true
      }
      const parsed = new Date(rawDate)
      if (isNaN(parsed.getTime())) return true
      const ds = parsed.toISOString().split('T')[0]
      if (dateFilter === 'today')  return ds === todayISO
      if (dateFilter === 'week')   return ds >= weekStartISO
      if (dateFilter === 'month')  return ds >= monthStartISO
      if (dateFilter === 'custom') return (!fromDate || ds >= fromDate) && (!toDate || ds <= toDate)
      return true
    })
  }

  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const todayLeads     = leads.filter(l => l.date === 'Today' || l.date === todayStr)
  const wonLeads       = leads.filter(l => l.pipeline === 'won' || l.pipeline === 'project_started')
  const activeLeads    = leads.filter(l => !['won', 'lost', 'project_started'].includes(l.pipeline))
  const followupsDue   = leads.filter(l => l.pipeline === 'followup')
  const siteVisits     = leads.filter(l => l.pipeline === 'sitevisit')
  const quotationsPending = leads.filter(l => l.pipeline === 'quotation')
  const winRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0

  const filteredLeads = getDateFilteredLeads(leads).filter(l => {
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
      const inserted = await insertLeadsBulk(fresh.map(l => ({
        name: l.name, phone: l.phone, email: l.email || '',
        source: l.source || '', interest: l.interest || '',
        budget: l.budget || '', status: 'Active',
        pipeline_stage: 'new', industry: 'interior-design',
      })))
      if (inserted.length > 0) setLeads(prev => [...inserted.map((l: any) => ({
        id: l.id, name: l.lead_name || l.name || '', phone: l.phone || '',
        email: l.email || '', requirement: l.interest || '—',
        budget: l.budget || '—', status: 'Active',
        pipeline: l.pipeline_stage || 'new', source: l.source || '—', date: 'Today',
      })), ...prev])
    } catch (err) { console.error(err) }
    finally { setLeadModalOpen(false) }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const clearAllFilters = () => {
    setDateFilter('all'); setFromDate(''); setToDate('')
    setShowDatePicker(false); setStageFilter('all')
  }

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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design</p>
            <h1 className="text-xl md:text-3xl font-bold text-[#1C1712] leading-tight">{greeting}, {userName} 👋</h1>
            <p className="text-sm mt-1 text-[#9A8F82]">{leads.length} leads total · {activeLeads.length} active · {winRate}% conversion</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setActiveTab(t => t === 'list' ? 'board' : 'list')}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all glass glass-hover text-[#7A6E60] hover:text-[#1C1712]">
              {activeTab === 'list' ? '⬡ Board' : '≡ List'}
            </button>
            <button onClick={() => setLeadModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-black text-white"
              style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 4px 20px rgba(184,134,11,0.4)' }}>
              + Add Lead
            </button>
          </div>
        </div>

        {/* ── KPI ROW 1 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Follow-ups Due', value: followupsDue.length,     icon: '🔄', color: '#D97706', sub: 'Need callback', onClick: () => { setStageFilter('followup');  setActiveTab('list') } },
            { label: 'Site Visits',    value: siteVisits.length,       icon: '🏠', color: '#EA580C', sub: 'Scheduled',    onClick: () => { setStageFilter('sitevisit'); setActiveTab('list') } },
            { label: 'Quotations',     value: quotationsPending.length, icon: '💰', color: '#2563EB', sub: 'Pending',      onClick: () => { setStageFilter('quotation'); setActiveTab('list') } },
            { label: 'Won Deals',      value: wonLeads.length,         icon: '✅', color: '#16A34A', sub: `${winRate}% rate` },
          ].map((card, i) => (
            <button key={i} onClick={card.onClick}
              className={`glass glass-hover rounded-2xl p-4 text-left transition-all group ${card.onClick ? 'cursor-pointer' : 'cursor-default'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{card.icon}</span>
                {card.onClick && <span className="text-[10px] text-[#C4BAB0] group-hover:text-[#9A8F82] transition-colors">→</span>}
              </div>
              <p className="text-3xl font-black text-[#1C1712] mb-1">{card.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: card.color }}>{card.label}</p>
              <p className="text-[10px] mt-0.5 text-[#B8B0A0]">{card.sub}</p>
            </button>
          ))}
        </div>

        {/* ── KPI ROW 2 ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today's Leads",   value: todayLeads.length,  color: '#2563EB' },
            { label: 'Active Pipeline', value: activeLeads.length, color: '#D97706' },
            { label: 'Total Leads',     value: leads.length,       color: '#7C3AED' },
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
          <div className="relative">
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
                      background: active ? `${stage.accent}20` : '#FAFAF8',
                      border: `1px solid ${active ? stage.accent + '60' : '#E8E2D8'}`,
                      boxShadow: active ? `0 0 16px ${stage.accent}20` : 'none',
                    }}>
                    <p className="text-base mb-1">{stage.icon}</p>
                    <p className="text-lg font-black text-[#1C1712]">{count}</p>
                    <p className="text-[7px] font-bold uppercase leading-tight mt-0.5" style={{ color: active ? stage.color : '#9A8F82' }}>{stage.label}</p>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F0EBE0]">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: stage.accent }} />
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 sm:hidden" style={{ background: 'linear-gradient(90deg, transparent, #FFFFFF)' }} />
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {activeTab === 'list' && (
          <div className="glass rounded-2xl overflow-hidden">

            {/* ── SINGLE FILTER ROW — Search + Stage + Date + Add ── */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0EBE0] overflow-x-auto scroll-x">

              {/* Search */}
              <div className="flex items-center gap-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-3 py-1.5 flex-shrink-0 w-44">
                <span className="text-[#9A8F82] text-xs">🔍</span>
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[#1C1712] placeholder:text-[#C4BAB0] outline-none w-full" />
                {search && <button onClick={() => setSearch('')} className="text-[#9A8F82] hover:text-red-500 text-xs flex-shrink-0">✕</button>}
              </div>

              <div className="w-px h-4 bg-[#E8E2D8] flex-shrink-0" />

              {/* Stage label */}
              <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#B8B0A0] flex-shrink-0">Stage</span>

              {/* Stage pills */}
              <button onClick={() => setStageFilter('all')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex-shrink-0"
                style={{
                  background: stageFilter === 'all' ? '#1C1712' : 'var(--color-background-secondary, #F5F0E8)',
                  color: stageFilter === 'all' ? 'white' : '#7A6E60',
                  border: '0.5px solid #E8E2D8',
                }}>
                All {leads.length}
              </button>
              {PIPELINE_STAGES.map(s => {
                const c = leads.filter(l => l.pipeline === s.key).length
                if (!c) return null
                return (
                  <button key={s.key} onClick={() => setStageFilter(s.key)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex-shrink-0"
                    style={{
                      background: stageFilter === s.key ? `${s.accent}20` : 'var(--color-background-secondary, #F5F0E8)',
                      color: stageFilter === s.key ? s.color : '#7A6E60',
                      border: `0.5px solid ${stageFilter === s.key ? s.accent + '60' : '#E8E2D8'}`,
                    }}>
                    {s.icon} {c}
                  </button>
                )
              })}

              <div className="w-px h-4 bg-[#E8E2D8] flex-shrink-0" />

              {/* Date label */}
              <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#B8B0A0] flex-shrink-0">Date</span>

              {/* Date quick buttons */}
              {[
                { label: 'All',   value: 'all'   },
                { label: 'Today', value: 'today' },
                { label: 'Week',  value: 'week'  },
                { label: 'Month', value: 'month' },
              ].map(f => (
                <button key={f.value}
                  onClick={() => { setDateFilter(f.value as any); setShowDatePicker(false) }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex-shrink-0"
                  style={{
                    background: dateFilter === f.value && dateFilter !== 'custom' ? '#1C1712' : 'var(--color-background-secondary, #F5F0E8)',
                    color: dateFilter === f.value && dateFilter !== 'custom' ? 'white' : '#7A6E60',
                    border: '0.5px solid #E8E2D8',
                  }}>
                  {f.label}
                </button>
              ))}

              {/* Date range toggle */}
              <button
                onClick={() => { setShowDatePicker(p => !p); if (dateFilter !== 'custom') setDateFilter('custom') }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex-shrink-0 flex items-center gap-1"
                style={{
                  background: dateFilter === 'custom' ? '#B8860B' : 'var(--color-background-secondary, #F5F0E8)',
                  color:      dateFilter === 'custom' ? 'white'   : '#7A6E60',
                  border: `0.5px solid ${dateFilter === 'custom' ? '#B8860B' : '#E8E2D8'}`,
                }}>
                📅 {dateFilter === 'custom' && fromDate ? `${fromDate}${toDate ? '→' + toDate : ''}` : 'Range'}
              </button>

              {/* Clear all */}
              {(dateFilter !== 'all' || stageFilter !== 'all' || search) && (
                <button onClick={() => { clearAllFilters(); setSearch('') }}
                  className="text-[11px] font-medium text-red-400 hover:text-red-600 flex-shrink-0">
                  Clear all
                </button>
              )}

              {/* Add button — pushed to right */}
              <button onClick={() => setLeadModalOpen(true)}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
                style={{ background: '#FFFBEB', border: '0.5px solid #FDE68A', color: '#B45309' }}>
                + Add
              </button>
            </div>

            {/* Date Range Picker */}
            {showDatePicker && (
              <div className="flex items-center gap-2 px-4 py-2.5 border-b flex-wrap"
                style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                <span className="text-[11px] font-medium text-amber-700">From</span>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="rounded-lg px-3 py-1.5 text-xs text-[#1C1712] outline-none"
                  style={{ border: '0.5px solid #FDE68A', background: 'white' }} />
                <span className="text-[11px] font-medium text-amber-700">To</span>
                <input type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)}
                  className="rounded-lg px-3 py-1.5 text-xs text-[#1C1712] outline-none"
                  style={{ border: '0.5px solid #FDE68A', background: 'white' }} />
                <button onClick={() => setShowDatePicker(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white"
                  style={{ background: '#1C1712' }}>
                  Apply
                </button>
              </div>
            )}

            {stageFilter !== 'all' && (
              <div className="px-5 py-2 flex items-center gap-2" style={{ background: `${getStg(stageFilter).accent}10`, borderBottom: `1px solid ${getStg(stageFilter).accent}20` }}>
                <span>{getStg(stageFilter).icon}</span>
                <p className="text-xs font-semibold" style={{ color: getStg(stageFilter).color }}>
                  {getStg(stageFilter).label} — {filteredLeads.length} leads
                </p>
                <button onClick={() => setStageFilter('all')} className="ml-auto text-[10px] text-[#B8B0A0] hover:text-[#1C1712]">✕ Clear</button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#9A8F82]">Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">{leads.length === 0 ? '🎯' : '🔍'}</p>
                <p className="text-sm font-bold text-[#1C1712]">{leads.length === 0 ? 'No leads yet' : 'No results'}</p>
                <p className="text-xs text-[#9A8F82] mt-1">{leads.length === 0 ? 'Add your first lead' : 'Try clearing filters'}</p>
                {leads.length === 0 && (
                  <button onClick={() => setLeadModalOpen(true)} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)' }}>
                    + Add First Lead
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* ── MOBILE CARD LIST ── */}
                <div className="sm:hidden divide-y divide-[#F7F5F1]">
                  {filteredLeads.map((lead, i) => {
                    const stg = getStg(lead.pipeline)
                    const g = GRADIENTS[i % GRADIENTS.length]
                    return (
                      <div key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className="px-4 py-3.5 active:bg-[#FDFAF8]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 4px 12px ${g[0]}40` }}>
                            {ini(lead.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#1C1712] truncate">{lead.name}</p>
                            <p className="text-xs font-mono text-[#7A6E60]">{lead.phone}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setCallLead(lead) }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                            style={{ background: `${stg.accent}18`, border: `1px solid ${stg.accent}40`, color: stg.color }}>
                            {stg.icon} {stg.label}
                          </span>
                          {lead.budget !== '—' && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-amber-700">
                              💰 {lead.budget}
                            </span>
                          )}
                          {lead.requirement && lead.requirement !== '—' && (
                            <span className="text-[10px] text-[#9A8F82] truncate max-w-[140px]">{lead.requirement}</span>
                          )}
                          <span className="text-[10px] text-[#B8B0A0] ml-auto flex-shrink-0">{lead.date}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── DESKTOP TABLE ── */}
                <div className="hidden sm:block overflow-x-auto scroll-x">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                        {['#', 'Lead', 'Phone', 'Requirement', 'Budget', 'Stage', 'Date', ''].map((h, i) => (
                          <th key={i} className="text-left text-[9px] font-black uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5 text-[#9A8F82]">{h}</th>
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
                            onClick={() => setSelectedLeadId(lead.id)}
                            onMouseEnter={() => setHoveredRow(lead.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className="transition-all cursor-pointer"
                            style={{ borderBottom: '1px solid #F7F5F1', background: isHov ? '#FDFAF8' : 'white' }}>
                            <td className="pl-5 pr-2 py-3.5"><span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span></td>
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
                            <td className="px-4 py-3.5"><p className="text-sm font-mono font-semibold text-[#1C1712]">{lead.phone}</p></td>
                            <td className="px-4 py-3.5"><p className="text-xs max-w-[120px] truncate text-[#7A6E60]">{lead.requirement}</p></td>
                            <td className="px-4 py-3.5"><p className="text-xs font-bold text-[#1C1712]">{lead.budget}</p></td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                                style={{ background: `${stg.accent}18`, border: `1px solid ${stg.accent}40`, color: stg.color }}>
                                {stg.icon} {stg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5"><p className="text-[10px] whitespace-nowrap text-[#B8B0A0]">{lead.date}</p></td>
                            <td className="pr-5 pl-2 py-3.5">
                              <div className={`flex gap-1.5 items-center transition-all duration-200 ${isHov ? 'opacity-100' : 'opacity-0'}`}>
                                <button onClick={(e) => { e.stopPropagation(); setMoveModal(lead) }}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-[#F5F0E8] text-[#1C1712] border border-[#E8E2D8] hover:scale-105 transition-all">
                                  Move
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setCallLead(lead) }}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-all"
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
              </>
            )}

            {filteredLeads.length > 0 && (
              <div className="px-5 py-3 flex items-center justify-between border-t border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                <p className="text-[10px] text-[#9A8F82]">
                  <span className="font-bold text-[#1C1712]">{filteredLeads.length}</span> of <span className="font-bold text-[#1C1712]">{leads.length}</span> leads
                  {dateFilter !== 'all' && <span className="ml-1 text-amber-600 font-bold">· date filtered</span>}
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
                  <div className="flex-1 p-2.5 flex flex-col gap-2 overflow-y-auto" style={{ minHeight: 200, background: '#FAFAF8' }}>
                    {stageLeads.map((lead, i) => {
                      const g = GRADIENTS[i % GRADIENTS.length]
                      return (
                        <div key={lead.id} onClick={() => setMoveModal(lead)}
                          className="rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 group"
                          style={{ background: '#fff', border: '1px solid #EDE8E0', boxShadow: '0 1px 6px rgba(28,23,18,0.06)' }}>
                          <div className="h-1 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${g[0]}, ${g[1]})` }} />
                          <div className="p-3">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 8px ${g[0]}40` }}>
                                {ini(lead.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-[#1C1712] truncate">{lead.name}</p>
                                <p className="text-[10px] text-[#9A8F82] font-mono">{lead.phone}</p>
                              </div>
                            </div>
                            {lead.budget !== '—' && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg mb-1.5"
                                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <span className="text-[9px]">💰</span>
                                <span className="text-[10px] font-bold text-amber-700">{lead.budget}</span>
                              </div>
                            )}
                            {lead.requirement && lead.requirement !== '—' && (
                              <p className="text-[10px] text-[#9A8F82] mb-2 line-clamp-2 leading-relaxed">{lead.requirement}</p>
                            )}
                            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #F0EBE0' }}>
                              <span className="text-[9px] text-[#B8B0A0] font-medium truncate max-w-[80px]">📍 {lead.source !== '—' ? lead.source : lead.date}</span>
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
                  {stageLeads.length > 0 && (
                    <div className="px-3 py-2 flex-shrink-0 flex items-center justify-between"
                      style={{ background: stage.light, borderTop: `1px solid ${stage.border}` }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: stage.color }}>
                        {stageLeads.length} lead{stageLeads.length > 1 ? 's' : ''}
                      </p>
                      <button onClick={() => { setStageFilter(stage.key); setActiveTab('list') }}
                        className="text-[9px] font-bold hover:underline" style={{ color: stage.color }}>
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

      {selectedLeadId && (
        <LeadDetailPanel
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onStageUpdate={updatePipeline}
        />
      )}

      <AddLeadModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onLeadsAdded={handleLeadsAdded}
        industry="interior-design"
      />
    </>
  )
}