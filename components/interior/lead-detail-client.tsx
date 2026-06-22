'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Phone, Plus, MapPin, Calendar, DollarSign, User, Upload, FileText, X, ChevronDown, ChevronUp } from 'lucide-react'

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#DC2626', '#B91C1C'],
]

const PIPELINE_STAGES = [
  { key: 'new',       label: 'New',        icon: '🆕', color: '#7C3AED' },
  { key: 'rnr',       label: 'RNR',        icon: '📵', color: '#DC2626' },
  { key: 'followup',  label: 'Follow Up',  icon: '🔄', color: '#D97706' },
  { key: 'sitevisit', label: 'Site Visit', icon: '🏠', color: '#0891B2' },
  { key: 'quotation', label: 'Quotation',  icon: '💰', color: '#DB2777' },
  { key: 'won',       label: 'Won',        icon: '🏆', color: '#059669' },
  { key: 'lost',      label: 'Lost',       icon: '❌', color: '#DC2626' },
]

const ACTIVITY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  created:      { icon: '✨', color: '#B8860B', bg: '#FFFBEB' },
  call:         { icon: '📞', color: '#7C3AED', bg: '#EDE9FE' },
  stage_change: { icon: '🔀', color: '#0891B2', bg: '#E0F2FE' },
  note:         { icon: '📝', color: '#64748B', bg: '#F1F5F9' },
  sitevisit:    { icon: '🏠', color: '#0891B2', bg: '#E0F2FE' },
  quotation:    { icon: '💰', color: '#DB2777', bg: '#FCE7F3' },
  followup:     { icon: '🔔', color: '#D97706', bg: '#FEF3C7' },
  won:          { icon: '🏆', color: '#059669', bg: '#D1FAE5' },
}

const C = {
  bg:        '#F5F0E8',
  card:      '#FFFFFF',
  border:    'rgba(184,134,11,0.15)',
  text:      '#1C1712',
  textMuted: '#6B5E4E',
  textFaint: '#A89880',
  gold:      '#B8860B',
  goldLight: '#FEF3C7',
}

const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'
const fmtDate = (ds: string) => { if (!ds) return '—'; return new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
const fmtDateTime = (ds: string) => { if (!ds) return '—'; return new Date(ds).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) }
const timeAgo = (ds: string) => { const diff = Date.now() - new Date(ds).getTime(); const mins = Math.floor(diff/60000); const hrs = Math.floor(mins/60); const days = Math.floor(hrs/24); if (days>0) return `${days}d ago`; if (hrs>0) return `${hrs}h ago`; if (mins>0) return `${mins}m ago`; return 'just now' }
const getTomorrow = () => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0] }
const getNextHour = () => { const d = new Date(); d.setHours(d.getHours()+1,0,0,0); return `${String(d.getHours()).padStart(2,'0')}:00` }

export function LeadDetailClient({ lead: initialLead, activities: initialActivities, leadId }: {
  lead: any; activities: any[]; leadId: string
}) {
  const router = useRouter()
  const [lead, setLead] = useState(initialLead)
  const [activities, setActivities] = useState(initialActivities)
  const [savingStage, setSavingStage] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<'note'|'call'|'sitevisit'|'quotation'>('call')
  const [savingNote, setSavingNote] = useState(false)

  const [showFollowUpPopup, setShowFollowUpPopup] = useState(false)
  const [followUpDate, setFollowUpDate] = useState(getTomorrow())
  const [followUpTime, setFollowUpTime] = useState(getNextHour())
  const [followUpNote, setFollowUpNote] = useState('')
  const [savingFollowUp, setSavingFollowUp] = useState(false)

  const [showSiteVisitPopup, setShowSiteVisitPopup] = useState(false)
  const [svDate, setSvDate] = useState(getTomorrow())
  const [svTime, setSvTime] = useState('10:00')
  const [svType, setSvType] = useState<'before_quotation'|'after_quotation'>('before_quotation')
  const [svNote, setSvNote] = useState('')
  const [savingSV, setSavingSV] = useState(false)

  const [showQuotationPopup, setShowQuotationPopup] = useState(false)
  const [qtDate, setQtDate] = useState(getTomorrow())
  const [qtTime, setQtTime] = useState('11:00')
  const [qtType, setQtType] = useState<'before_sitevisit'|'after_sitevisit'>('after_sitevisit')
  const [qtAmount, setQtAmount] = useState('')
  const [qtNote, setQtNote] = useState('')
  const [savingQT, setSavingQT] = useState(false)
  const [qtPdfFile, setQtPdfFile] = useState<File | null>(null)
  const [qtPdfUploading, setQtPdfUploading] = useState(false)
  const [qtPdfProgress, setQtPdfProgress] = useState(0)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Won popup
  const [showWonPopup, setShowWonPopup] = useState(false)
  const [wonAmount, setWonAmount] = useState('')
  const [wonNote, setWonNote] = useState('')
  const [savingWon, setSavingWon] = useState(false)

  // Quotation revisions
  const [revisions, setRevisions] = useState<any[]>([])
  const [showRevisions, setShowRevisions] = useState(true)
  const [loadingRevisions, setLoadingRevisions] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const curStage = PIPELINE_STAGES.find(s => s.key === lead.pipeline_stage) ?? PIPELINE_STAGES[0]
  const g = GRADIENTS[lead.lead_name?.charCodeAt(0) % GRADIENTS.length] ?? GRADIENTS[0]

  const refreshActivities = async () => {
    const { data: acts } = await supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
    setActivities(acts ?? [])
  }

  const loadRevisions = async () => {
    setLoadingRevisions(true)
    const { data } = await supabase
      .from('quotation_revisions')
      .select('*')
      .eq('lead_id', leadId)
      .order('version', { ascending: false })
    setRevisions(data ?? [])
    setLoadingRevisions(false)
  }

  // Load revisions on mount — handles page refresh when already on quotation stage
  useEffect(() => {
    loadRevisions()
  }, [])

  const handleStageChange = async (stageKey: string) => {
    if (savingStage) return
    if (stageKey === 'followup') { setFollowUpDate(getTomorrow()); setFollowUpTime(getNextHour()); setFollowUpNote(''); setShowFollowUpPopup(true); return }
    if (stageKey === 'sitevisit') { setSvDate(getTomorrow()); setSvTime('10:00'); setSvType('before_quotation'); setSvNote(''); setShowSiteVisitPopup(true); return }
    if (stageKey === 'quotation') { setQtDate(getTomorrow()); setQtTime('11:00'); setQtType('after_sitevisit'); setQtAmount(''); setQtNote(''); setQtPdfFile(null); setShowQuotationPopup(true); return }
    if (stageKey === 'won') { setWonAmount(lead.quotation_amount||''); setWonNote(''); setShowWonPopup(true); return }
    setSavingStage(stageKey)
    const prev = lead.pipeline_stage
    const { data: { user } } = await supabase.auth.getUser()
    setLead((l: any) => ({ ...l, pipeline_stage: stageKey }))
    await supabase.from('leads').update({ pipeline_stage: stageKey }).eq('id', leadId)
    try {
      await supabase.from('lead_activities').insert({ lead_id: leadId, type: 'stage_change', title: 'Stage Updated', description: `${prev} → ${stageKey}`, stage_from: prev, stage_to: stageKey, user_id: user?.id, created_at: new Date().toISOString() })
      await refreshActivities()
    } catch {}
    setSavingStage(null)
  }

  const handleSaveFollowUp = async () => {
    if (!followUpDate || !followUpTime) return
    setSavingFollowUp(true)
    const prev = lead.pipeline_stage
    const { data: { user } } = await supabase.auth.getUser()
    const dt = new Date(`${followUpDate}T${followUpTime}:00`).toISOString()
    try {
      await supabase.from('leads').update({ pipeline_stage: 'followup', followup_date: dt, followup_note: followUpNote.trim()||null }).eq('id', leadId)
      setLead((l: any) => ({ ...l, pipeline_stage: 'followup', followup_date: dt, followup_note: followUpNote.trim()||null }))
      await supabase.from('lead_activities').insert({ lead_id: leadId, type: 'followup', title: '🔔 Follow Up Scheduled', description: `📅 ${fmtDateTime(dt)}${followUpNote.trim()?` — ${followUpNote.trim()}`:''}`, stage_from: prev, stage_to: 'followup', user_id: user?.id, created_at: new Date().toISOString() })
      if (prev !== 'followup') await supabase.from('lead_activities').insert({ lead_id: leadId, type: 'stage_change', title: 'Stage Updated', description: `${prev} → followup`, stage_from: prev, stage_to: 'followup', user_id: user?.id, created_at: new Date().toISOString() })
      await refreshActivities(); setShowFollowUpPopup(false)
    } catch (e) { console.error(e) }
    setSavingFollowUp(false)
  }

  const handleSaveSiteVisit = async () => {
    if (!svDate || !svTime) return
    setSavingSV(true)
    const prev = lead.pipeline_stage
    const { data: { user } } = await supabase.auth.getUser()
    const dt = new Date(`${svDate}T${svTime}:00`).toISOString()
    try {
      await supabase.from('leads').update({ pipeline_stage: 'sitevisit', sitevisit_date: dt, sitevisit_type: svType, sitevisit_note: svNote.trim()||null }).eq('id', leadId)
      setLead((l: any) => ({ ...l, pipeline_stage: 'sitevisit', sitevisit_date: dt, sitevisit_type: svType, sitevisit_note: svNote.trim()||null }))
      await supabase.from('lead_activities').insert({ lead_id: leadId, type: 'sitevisit', title: '🏠 Site Visit Scheduled', description: `📅 ${fmtDateTime(dt)} · ${svType==='before_quotation'?'Before Quotation':'After Quotation'}${svNote.trim()?` — ${svNote.trim()}`:''}`, stage_from: prev, stage_to: 'sitevisit', user_id: user?.id, created_at: new Date().toISOString() })
      if (prev !== 'sitevisit') await supabase.from('lead_activities').insert({ lead_id: leadId, type: 'stage_change', title: 'Stage Updated', description: `${prev} → sitevisit`, stage_from: prev, stage_to: 'sitevisit', user_id: user?.id, created_at: new Date().toISOString() })
      await refreshActivities(); setShowSiteVisitPopup(false)
    } catch (e) { console.error(e) }
    setSavingSV(false)
  }

  const uploadPdf = async (file: File): Promise<string | null> => {
    setQtPdfUploading(true); setQtPdfProgress(10)
    try {
      const fileName = `${leadId}_${Date.now()}.pdf`
      const { error } = await supabase.storage.from('quotations').upload(`quotations/${fileName}`, file, { upsert: true, contentType: 'application/pdf' })
      if (error) { setQtPdfUploading(false); return null }
      setQtPdfProgress(80)
      const { data: { publicUrl } } = supabase.storage.from('quotations').getPublicUrl(`quotations/${fileName}`)
      setQtPdfProgress(100); setQtPdfUploading(false)
      return publicUrl
    } catch { setQtPdfUploading(false); return null }
  }

  const handleSaveQuotation = async () => {
    if (!qtDate || !qtTime) return
    setSavingQT(true)
    const prev = lead.pipeline_stage
    const { data: { user } } = await supabase.auth.getUser()
    const dt = new Date(`${qtDate}T${qtTime}:00`).toISOString()
    const qtTypeLabel = qtType === 'before_sitevisit' ? 'Before Site Visit' : 'After Site Visit'

    try {
      // Upload PDF
      let pdfUrl: string | null = null
      if (qtPdfFile) pdfUrl = await uploadPdf(qtPdfFile)

      // Get current version number
      const { count } = await supabase
        .from('quotation_revisions')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', leadId)
      const nextVersion = (count ?? 0) + 1

      // Save revision
      await supabase.from('quotation_revisions').insert({
        lead_id: leadId,
        version: nextVersion,
        amount: qtAmount.trim() || null,
        pdf_url: pdfUrl,
        quotation_type: qtType,
        note: qtNote.trim() || null,
        user_id: user?.id,
        created_at: new Date().toISOString(),
      })

      // Update lead with latest
      await supabase.from('leads').update({
        pipeline_stage: 'quotation',
        quotation_date: dt,
        quotation_type: qtType,
        quotation_amount: qtAmount.trim()||null,
        quotation_note: qtNote.trim()||null,
        quotation_pdf_url: pdfUrl || lead.quotation_pdf_url,
      }).eq('id', leadId)

      setLead((l: any) => ({ ...l, pipeline_stage: 'quotation', quotation_date: dt, quotation_type: qtType, quotation_amount: qtAmount.trim()||null, quotation_note: qtNote.trim()||null, quotation_pdf_url: pdfUrl || l.quotation_pdf_url }))

      // Log activity with version
      await supabase.from('lead_activities').insert({
        lead_id: leadId, type: 'quotation',
        title: `💰 Quotation v${nextVersion} ${nextVersion === 1 ? 'Sent' : 'Updated'}`,
        description: `${qtAmount.trim()?`₹${qtAmount.trim()} · `:''}${qtTypeLabel}${pdfUrl?' · 📄 PDF':''} ${qtNote.trim()?`— ${qtNote.trim()}`:''}`.trim(),
        stage_from: prev, stage_to: 'quotation', user_id: user?.id, created_at: new Date().toISOString(),
      })
      if (prev !== 'quotation') await supabase.from('lead_activities').insert({ lead_id: leadId, type: 'stage_change', title: 'Stage Updated', description: `${prev} → quotation`, stage_from: prev, stage_to: 'quotation', user_id: user?.id, created_at: new Date().toISOString() })

      await refreshActivities()
      await loadRevisions()
      setShowQuotationPopup(false)
      setQtPdfFile(null); setQtPdfProgress(0)
    } catch (e) { console.error(e) }
    setSavingQT(false)
  }

  const handleSaveNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    const { data: { user } } = await supabase.auth.getUser()
    try {
      await supabase.from('lead_activities').insert({ lead_id: leadId, type: noteType, title: noteType==='note'?'Note added':noteType==='call'?'Call logged':noteType==='sitevisit'?'Site Visit':'Quotation', description: noteText.trim(), user_id: user?.id, created_at: new Date().toISOString() })
      if (noteType === 'note') { await supabase.from('leads').update({ notes: noteText.trim() }).eq('id', leadId); setLead((l: any) => ({ ...l, notes: noteText.trim() })) }
      await refreshActivities(); setNoteText(''); setShowModal(false)
    } catch (e) { console.error(e) }
    setSavingNote(false)
  }

  const handleSaveWon = async () => {
    setSavingWon(true)
    const prev = lead.pipeline_stage
    const { data: { user } } = await supabase.auth.getUser()
    try {
      await supabase.from('leads').update({
        pipeline_stage: 'won',
        won_amount: wonAmount.trim() || null,
        won_note: wonNote.trim() || null,
        won_date: new Date().toISOString(),
      }).eq('id', leadId)
      setLead((l: any) => ({ ...l, pipeline_stage: 'won', won_amount: wonAmount.trim()||null, won_note: wonNote.trim()||null }))
      await supabase.from('lead_activities').insert({
        lead_id: leadId, type: 'won',
        title: '🏆 Deal Won!',
        description: `${wonAmount.trim()?`₹${Number(wonAmount).toLocaleString('en-IN')} · `:''}${wonNote.trim()||'Deal closed successfully'}`,
        stage_from: prev, stage_to: 'won',
        user_id: user?.id, created_at: new Date().toISOString(),
      })
      if (prev !== 'won') await supabase.from('lead_activities').insert({ lead_id: leadId, type: 'stage_change', title: 'Stage Updated', description: `${prev} → won`, stage_from: prev, stage_to: 'won', user_id: user?.id, created_at: new Date().toISOString() })
      await refreshActivities()
      setShowWonPopup(false)
    } catch (e) { console.error(e) }
    setSavingWon(false)
  }

  // Stage order — forward only logic
  const STAGE_ORDER = ['new', 'rnr','followup', 'sitevisit', 'quotation', 'won', 'lost']
  const currentStageIdx = STAGE_ORDER.indexOf(lead.pipeline_stage)
  const isStageDisabled = (stageKey: string) => {
    const targetIdx = STAGE_ORDER.indexOf(stageKey)
    // Disable stages that are BEFORE current stage (can't go back)
    // Exception: 'lost' is always available, 'rnr' is always available (can happen anytime)
    if (stageKey === 'lost') return false
    return targetIdx < currentStageIdx
  }

  const QuickTimes = ({ value, onChange, color }: { value: string; onChange: (t: string) => void; color: string }) => (
    <div className="flex gap-2 flex-wrap">
      {[{l:'9 AM',t:'09:00'},{l:'11 AM',t:'11:00'},{l:'2 PM',t:'14:00'},{l:'4 PM',t:'16:00'},{l:'6 PM',t:'18:00'}].map(slot => (
        <button key={slot.t} onClick={() => onChange(slot.t)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
          style={{ background:value===slot.t?`${color}25`:'rgba(0,0,0,0.04)', color:value===slot.t?color:'#6B5E4E', border:`1px solid ${value===slot.t?color+'50':'rgba(184,134,11,0.15)'}` }}>
          {slot.l}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:"'Inter', sans-serif" }}>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .slide-up{animation:slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both}
        .scale-in{animation:scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both}
        .stage-btn{transition:all 0.2s ease}.stage-btn:hover{transform:translateY(-2px)}
        .activity-item:hover{background:rgba(184,134,11,0.04)}.activity-item{transition:background 0.15s ease}
        input[type="date"],input[type="time"]{color-scheme:light}
        .pdf-drop:hover{border-color:#F9A8D4!important;background:#FFF5F9!important}
        .pdf-drop{transition:all 0.2s ease}
        .rev-row:hover{background:rgba(219,39,119,0.03)}
        .rev-row{transition:background 0.15s ease}
      `}</style>

      {/* HERO */}
      <div style={{ background:`linear-gradient(160deg,${g[0]}12 0%,${C.bg} 55%)`, borderBottom:`1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold hover:opacity-70" style={{ color:C.textMuted }}>
            <ArrowLeft className="w-4 h-4"/> Back
          </button>
          <div className="flex items-center gap-2">
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all"
              style={{ background:'linear-gradient(135deg,#10B981,#059669)',boxShadow:'0 4px 14px rgba(16,185,129,0.3)' }}>
              <Phone className="w-3.5 h-3.5"/> Call
            </a>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-all"
              style={{ background:C.card,border:`1px solid ${C.border}`,color:C.gold,boxShadow:'0 2px 8px rgba(184,134,11,0.1)' }}>
              <Plus className="w-3.5 h-3.5"/> Log Activity
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 slide-up">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 relative"
              style={{ background:`linear-gradient(135deg,${g[0]},${g[1]})`,boxShadow:`0 10px 28px ${g[0]}40` }}>
              {ini(lead.lead_name)}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background:curStage.color,border:`2px solid ${C.bg}` }}>{curStage.icon}</div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl font-black leading-tight" style={{ color:C.text }}>{lead.lead_name}</h1>
              <a href={`tel:${lead.phone}`} className="text-sm font-mono mt-1 block" style={{ color:C.gold }}>{lead.phone}</a>
              {lead.email && <p className="text-xs mt-0.5" style={{ color:C.textFaint }}>{lead.email}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:`${curStage.color}15`,color:curStage.color,border:`1px solid ${curStage.color}35` }}>{curStage.icon} {curStage.label}</span>
            {lead.followup_date&&lead.pipeline_stage==='followup'&&<span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:'#FEF3C7',color:'#92400E',border:'1px solid #FDE68A' }}>🔔 {fmtDateTime(lead.followup_date)}</span>}
            {lead.sitevisit_date&&lead.pipeline_stage==='sitevisit'&&<span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:'#E0F2FE',color:'#0369A1',border:'1px solid #BAE6FD' }}>🏠 {fmtDateTime(lead.sitevisit_date)}</span>}
            {lead.quotation_date&&lead.pipeline_stage==='quotation'&&<span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:'#FCE7F3',color:'#9D174D',border:'1px solid #FBCFE8' }}>💰 {revisions.length > 0 ? `v${revisions[0]?.version} · ` : ''}₹{lead.quotation_amount||'—'}</span>}
            {lead.budget&&<span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:'#FFFBEB',color:C.gold,border:'1px solid #FDE68A' }}>💰 {lead.budget}</span>}
            {lead.source&&<span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:'rgba(184,134,11,0.08)',color:C.textMuted,border:`1px solid ${C.border}` }}>📌 {lead.source}</span>}
            <span className="text-xs ml-auto" style={{ color:C.textFaint }}>{fmtDate(lead.created_at)}</span>
          </div>


        </div>
      </div>

      {/* BODY */}
      <div className="p-5 space-y-4 max-w-4xl mx-auto">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 slide-up">
          {[{icon:MapPin,label:'City',value:lead.city},{icon:User,label:'Property',value:lead.property_type},{icon:Calendar,label:'Added',value:fmtDate(lead.created_at)},{icon:DollarSign,label:'Budget',value:lead.budget}]
            .map((x,i)=>x.value?(<div key={i} className="rounded-2xl p-4" style={{ background:C.card,border:`1px solid ${C.border}`,boxShadow:'0 2px 8px rgba(184,134,11,0.06)' }}><div className="flex items-center gap-2 mb-2"><x.icon className="w-3.5 h-3.5" style={{ color:C.textFaint }}/><p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:C.textFaint }}>{x.label}</p></div><p className="text-sm font-bold" style={{ color:C.text }}>{x.value}</p></div>):null)}
        </div>

        {/* Follow Up card */}
        {lead.followup_date&&lead.pipeline_stage==='followup'&&(
          <div className="rounded-2xl p-4" style={{ background:'#FFFBEB',border:'1px solid #FDE68A' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#92400E' }}>🔔 Follow Up Scheduled</p>
              <button onClick={()=>{setFollowUpDate(new Date(lead.followup_date).toISOString().split('T')[0]);setFollowUpTime(new Date(lead.followup_date).toTimeString().slice(0,5));setFollowUpNote(lead.followup_note||'');setShowFollowUpPopup(true)}} className="text-[9px] font-bold px-2.5 py-1 rounded-lg" style={{ background:'#FEF3C7',color:'#92400E',border:'1px solid #FDE68A' }}>✏️ Edit</button>
            </div>
            <p className="text-base font-black" style={{ color:'#92400E' }}>{fmtDateTime(lead.followup_date)}</p>
            {lead.followup_note&&<p className="text-xs mt-1" style={{ color:'#B45309' }}>{lead.followup_note}</p>}
          </div>
        )}

        {/* Site Visit card */}
        {lead.sitevisit_date&&lead.pipeline_stage==='sitevisit'&&(
          <div className="rounded-2xl p-4" style={{ background:'#E0F2FE',border:'1px solid #BAE6FD' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#0369A1' }}>🏠 Site Visit Scheduled</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background:lead.sitevisit_type==='before_quotation'?'#FEF3C7':'#FCE7F3',color:lead.sitevisit_type==='before_quotation'?'#92400E':'#9D174D',border:`1px solid ${lead.sitevisit_type==='before_quotation'?'#FDE68A':'#FBCFE8'}` }}>{lead.sitevisit_type==='before_quotation'?'📋 Before Quotation':'✅ After Quotation'}</span>
                <button onClick={()=>{setSvDate(new Date(lead.sitevisit_date).toISOString().split('T')[0]);setSvTime(new Date(lead.sitevisit_date).toTimeString().slice(0,5));setSvType(lead.sitevisit_type||'before_quotation');setSvNote(lead.sitevisit_note||'');setShowSiteVisitPopup(true)}} className="text-[9px] font-bold px-2.5 py-1 rounded-lg" style={{ background:'#BAE6FD',color:'#0369A1',border:'1px solid #7DD3FC' }}>✏️ Edit</button>
              </div>
            </div>
            <p className="text-base font-black" style={{ color:'#0369A1' }}>{fmtDateTime(lead.sitevisit_date)}</p>
            {lead.sitevisit_note&&<p className="text-xs mt-1" style={{ color:'#0891B2' }}>{lead.sitevisit_note}</p>}
          </div>
        )}

        {/* Won card */}
        {lead.pipeline_stage==='won'&&(
          <div className="rounded-2xl p-5" style={{ background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)',border:'2px solid #6EE7B7',boxShadow:'0 4px 16px rgba(5,150,105,0.15)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background:'linear-gradient(135deg,#059669,#047857)',boxShadow:'0 6px 18px rgba(5,150,105,0.35)' }}>🏆</div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#065F46' }}>Deal Won! 🎉</p>
                {lead.won_amount&&<p className="text-2xl font-black" style={{ color:'#059669' }}>₹ {Number(lead.won_amount).toLocaleString('en-IN')}</p>}
              </div>
              <button onClick={()=>{setWonAmount(lead.won_amount||'');setWonNote(lead.won_note||'');setShowWonPopup(true)}}
                className="ml-auto text-[9px] font-bold px-2.5 py-1 rounded-lg" style={{ background:'#A7F3D0',color:'#065F46',border:'1px solid #6EE7B7' }}>✏️ Edit</button>
            </div>
            {lead.won_note&&<p className="text-sm" style={{ color:'#047857' }}>{lead.won_note}</p>}
            {lead.won_date&&<p className="text-[10px] mt-1" style={{ color:'#059669' }}>Closed on {fmtDate(lead.won_date)}</p>}
          </div>
        )}

        {/* ══ QUOTATION CARD with VERSION HISTORY ══ */}
        {lead.pipeline_stage==='quotation'&&(
          <div className="rounded-2xl overflow-hidden" style={{ background:'#FDF2F8',border:'1px solid #FBCFE8',boxShadow:'0 2px 8px rgba(219,39,119,0.1)' }}>

            {/* Latest quotation header */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#9D174D' }}>💰 Quotation</p>
                  {revisions.length > 0 && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background:'#9D174D',color:'#fff' }}>
                      v{revisions[0]?.version} — Latest
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {lead.quotation_type && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background:lead.quotation_type==='before_sitevisit'?'#E0F2FE':'#FEF3C7',color:lead.quotation_type==='before_sitevisit'?'#0369A1':'#92400E',border:`1px solid ${lead.quotation_type==='before_sitevisit'?'#BAE6FD':'#FDE68A'}` }}>
                      {lead.quotation_type==='before_sitevisit'?'📋 Before SV':'🏠 After SV'}
                    </span>
                  )}
                  <button onClick={()=>{setQtDate(getTomorrow());setQtTime('11:00');setQtType(lead.quotation_type||'after_sitevisit');setQtAmount('');setQtNote('');setQtPdfFile(null);setShowQuotationPopup(true)}}
                    className="text-[9px] font-bold px-2.5 py-1 rounded-lg" style={{ background:'#FCE7F3',color:'#9D174D',border:'1px solid #FBCFE8' }}>
                    + New Revision
                  </button>
                </div>
              </div>

              {lead.quotation_amount && (
                <p className="text-2xl font-black mb-1" style={{ color:'#9D174D' }}>₹ {Number(lead.quotation_amount).toLocaleString('en-IN')}</p>
              )}
              {lead.quotation_date && <p className="text-xs" style={{ color:'#DB2777' }}>{fmtDateTime(lead.quotation_date)}</p>}
              {lead.quotation_note && <p className="text-xs mt-1" style={{ color:'#DB2777' }}>{lead.quotation_note}</p>}

              {/* Latest PDF */}
              {lead.quotation_pdf_url && (
                <a href={lead.quotation_pdf_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-all"
                  style={{ background:'#FCE7F3',color:'#9D174D',border:'1px solid #FBCFE8',boxShadow:'0 2px 6px rgba(219,39,119,0.15)' }}>
                  <FileText className="w-3.5 h-3.5"/> View Latest PDF
                </a>
              )}
            </div>

            {/* Version History toggle */}
            {revisions.length > 0 && (
              <div style={{ borderTop:'1px solid #FBCFE8' }}>
                <button
                  onClick={() => setShowRevisions(!showRevisions)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold"
                  style={{ color:'#9D174D',background:showRevisions?'#FCE7F3':'transparent' }}>
                  <span className="flex items-center gap-2">
                    📋 Quotation History
                    <span className="px-1.5 py-0.5 rounded-full text-[9px]" style={{ background:'#9D174D',color:'white' }}>{revisions.length}</span>
                  </span>
                  {showRevisions ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                </button>

                {showRevisions && (
                  <div style={{ borderTop:'1px solid #FBCFE8' }}>
                    {loadingRevisions ? (
                      <div className="p-4 text-center text-xs" style={{ color:'#DB2777' }}>Loading...</div>
                    ) : (
                      revisions.map((rev, i) => (
                        <div key={rev.id} className="rev-row px-4 py-3 flex items-center gap-3"
                          style={{ borderBottom: i < revisions.length-1 ? '1px solid #FBCFE8' : 'none' }}>

                          {/* Version badge */}
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0"
                            style={{ background: i===0?'#9D174D':'#FCE7F3', color: i===0?'white':'#9D174D', border:'1px solid #FBCFE8' }}>
                            v{rev.version}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {rev.amount ? (
                                <p className="text-sm font-black" style={{ color:'#831843' }}>₹ {Number(rev.amount).toLocaleString('en-IN')}</p>
                              ) : (
                                <p className="text-xs font-bold" style={{ color:'#DB2777' }}>No amount</p>
                              )}
                              {i===0 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:'#9D174D',color:'white' }}>Latest</span>}
                              {/* Price change indicator */}
                              {i < revisions.length-1 && rev.amount && revisions[i+1]?.amount && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: Number(rev.amount) < Number(revisions[i+1].amount) ? '#FEF3C7' : '#FCE7F3',
                                    color: Number(rev.amount) < Number(revisions[i+1].amount) ? '#92400E' : '#9D174D',
                                  }}>
                                  {Number(rev.amount) < Number(revisions[i+1].amount) ? '↓' : '↑'}
                                  ₹{Math.abs(Number(rev.amount)-Number(revisions[i+1].amount)).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[9px]" style={{ color:'#DB2777' }}>{fmtDateTime(rev.created_at)}</p>
                              {rev.quotation_type && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:'rgba(219,39,119,0.1)',color:'#DB2777' }}>
                                  {rev.quotation_type==='before_sitevisit'?'Before SV':'After SV'}
                                </span>
                              )}
                              {rev.note && <p className="text-[9px] w-full mt-0.5" style={{ color:'#DB2777' }}>{rev.note}</p>}
                            </div>
                          </div>

                          {/* PDF link per revision */}
                          {rev.pdf_url && (
                            <a href={rev.pdf_url} target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center hover:scale-110 transition-all"
                              style={{ background:'#FCE7F3',border:'1px solid #FBCFE8' }}
                              title="View PDF">
                              <FileText className="w-3.5 h-3.5" style={{ color:'#9D174D' }}/>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(lead.interest||lead.notes)&&(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lead.interest&&<div className="rounded-2xl p-4" style={{ background:C.card,border:`1px solid ${C.border}` }}><p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:C.textFaint }}>💡 Requirement</p><p className="text-sm leading-relaxed" style={{ color:C.textMuted }}>{lead.interest}</p></div>}
            {lead.notes&&<div className="rounded-2xl p-4" style={{ background:C.card,border:`1px solid ${C.border}` }}><p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:C.textFaint }}>📝 Notes</p><p className="text-sm leading-relaxed" style={{ color:C.textMuted }}>{lead.notes}</p></div>}
          </div>
        )}

        {/* Move to Stage */}
        <div className="rounded-2xl overflow-hidden" style={{ background:C.card,border:`1px solid ${C.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom:`1px solid ${C.border}` }}><p className="text-[10px] font-black uppercase tracking-[3px]" style={{ color:C.textFaint }}>Move to Stage</p></div>
          <div className="p-4 flex flex-wrap gap-2">
            {PIPELINE_STAGES.map(stage=>{
              const isActive = lead.pipeline_stage === stage.key
              const isLoading = savingStage === stage.key
              const disabled = !!savingStage || isStageDisabled(stage.key)
              const isPast = isStageDisabled(stage.key) && !isActive
              return(
                <button key={stage.key}
                  onClick={() => !disabled && handleStageChange(stage.key)}
                  disabled={disabled}
                  title={isPast ? 'Cannot go back to a previous stage' : ''}
                  className="stage-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold relative"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg,${stage.color},${stage.color}cc)`
                      : isPast
                      ? 'rgba(0,0,0,0.04)'
                      : `${stage.color}12`,
                    color: isActive ? '#fff' : isPast ? '#C4B89A' : stage.color,
                    border: `1px solid ${isActive ? stage.color : isPast ? 'rgba(184,134,11,0.1)' : stage.color+'30'}`,
                    boxShadow: isActive ? `0 4px 14px ${stage.color}35` : 'none',
                    opacity: isPast ? 0.45 : 1,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                  }}>
                  {isLoading
                    ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                    : isPast
                    ? <span style={{ filter:'grayscale(1)', opacity:0.5 }}>{stage.icon}</span>
                    : stage.icon}
                  {stage.label}
                  {isActive && <span className="text-[10px] opacity-70">✓</span>}
                  {isPast && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]"
                      style={{ background:'rgba(184,134,11,0.2)', color:'#A89880' }}>🔒</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-2xl overflow-hidden" style={{ background:C.card,border:`1px solid ${C.border}` }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom:`1px solid ${C.border}` }}>
            <div className="flex items-center gap-2"><p className="text-[10px] font-black uppercase tracking-[3px]" style={{ color:C.textFaint }}>Activity History</p><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:C.goldLight,color:C.gold }}>{activities.length}</span></div>
            <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg" style={{ background:C.goldLight,color:C.gold,border:'1px solid #FDE68A' }}><Plus className="w-3 h-3"/> Add</button>
          </div>
          {activities.length===0?(<div className="p-10 text-center"><div className="text-3xl mb-3">📋</div><p className="text-sm font-bold" style={{ color:C.textFaint }}>No activity yet</p></div>):(
            <div className="relative">
              <div className="absolute left-[42px] top-0 bottom-0 w-px" style={{ background:`linear-gradient(to bottom,${C.border},transparent)` }}/>
              {activities.map((act:any,i:number)=>{
                const cfg=ACTIVITY_ICONS[act.type]||ACTIVITY_ICONS.note
                return(<div key={act.id} className="activity-item flex gap-4 px-4 py-4 relative" style={{ borderBottom:i<activities.length-1?`1px solid ${C.border}`:'none' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 relative z-10" style={{ background:cfg.bg,border:`1px solid ${cfg.color}25` }}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5"><p className="text-xs font-bold" style={{ color:C.text }}>{act.title}</p><p className="text-[9px] flex-shrink-0" style={{ color:C.textFaint }}>{timeAgo(act.created_at)}</p></div>
                    {act.description&&<p className="text-[11px] leading-relaxed" style={{ color:C.textMuted }}>{act.description}</p>}
                    {act.user_name&&<span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background:'#EDE9FE',color:'#7C3AED' }}>👤 {act.user_name}</span>}
                    <p className="text-[9px] mt-1" style={{ color:C.textFaint }}>{fmtDate(act.created_at)}</p>
                  </div>
                </div>)
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOLLOW UP POPUP */}
      {showFollowUpPopup&&(
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ animation:'fadeIn 0.2s ease' }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowFollowUpPopup(false)}/>
          <div className="relative w-full max-w-sm scale-in" style={{ background:'#FFFDF8',border:'1px solid #FDE68A',borderRadius:24,boxShadow:'0 24px 60px rgba(184,134,11,0.2)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid #FDE68A' }}><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background:'#FEF3C7',border:'1px solid #FDE68A' }}>🔔</div><div><p className="text-sm font-black" style={{ color:C.text }}>Schedule Follow Up</p><p className="text-[10px]" style={{ color:C.textFaint }}>{lead.lead_name}</p></div></div><button onClick={()=>setShowFollowUpPopup(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background:'#F5F0E8',color:C.textMuted }}>✕</button></div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:C.textFaint }}>📅 Date</label><input type="date" value={followUpDate} min={new Date().toISOString().split('T')[0]} onChange={e=>setFollowUpDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none" style={{ background:'#FFFBEB',border:'1px solid #FDE68A',color:'#92400E' }}/></div><div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:C.textFaint }}>🕐 Time</label><input type="time" value={followUpTime} onChange={e=>setFollowUpTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none" style={{ background:'#FFFBEB',border:'1px solid #FDE68A',color:'#92400E' }}/></div></div>
              <div><p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:C.textFaint }}>Quick Pick</p><QuickTimes value={followUpTime} onChange={setFollowUpTime} color="#D97706"/></div>
              <div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:C.textFaint }}>📝 Note</label><textarea rows={2} value={followUpNote} onChange={e=>setFollowUpNote(e.target.value)} placeholder="E.g. Client busy..." className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ background:'#F5F0E8',border:`1px solid ${C.border}`,color:C.text }} onFocus={e=>(e.target.style.borderColor='#FDE68A')} onBlur={e=>(e.target.style.borderColor=C.border)}/></div>
              {followUpDate&&followUpTime&&<div className="px-3 py-2.5 rounded-xl" style={{ background:'#FEF3C7',border:'1px solid #FDE68A' }}><p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color:'#B45309' }}>Scheduled For</p><p className="text-sm font-black" style={{ color:'#92400E' }}>{fmtDateTime(new Date(`${followUpDate}T${followUpTime}:00`).toISOString())}</p></div>}
              <div className="flex gap-3 pt-1"><button onClick={()=>setShowFollowUpPopup(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background:'#F5F0E8',color:C.textMuted,border:`1px solid ${C.border}` }}>Cancel</button><button onClick={handleSaveFollowUp} disabled={!followUpDate||!followUpTime||savingFollowUp} className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40" style={{ background:'linear-gradient(135deg,#B45309,#D97706)',boxShadow:'0 6px 18px rgba(184,134,11,0.3)' }}>{savingFollowUp?'⏳ Saving...':'🔔 Schedule'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* SITE VISIT POPUP */}
      {showSiteVisitPopup&&(
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ animation:'fadeIn 0.2s ease' }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowSiteVisitPopup(false)}/>
          <div className="relative w-full max-w-sm scale-in" style={{ background:'#F0F9FF',border:'1px solid #BAE6FD',borderRadius:24,boxShadow:'0 24px 60px rgba(8,145,178,0.18)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid #BAE6FD' }}><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background:'#E0F2FE',border:'1px solid #BAE6FD' }}>🏠</div><div><p className="text-sm font-black" style={{ color:'#0C4A6E' }}>Schedule Site Visit</p><p className="text-[10px]" style={{ color:'#0891B2' }}>{lead.lead_name}</p></div></div><button onClick={()=>setShowSiteVisitPopup(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background:'#E0F2FE',color:'#0891B2' }}>✕</button></div>
            <div className="p-5 space-y-4">
              <div><p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:'#0891B2' }}>Visit Type</p><div className="grid grid-cols-2 gap-2">{([{v:'before_quotation',label:'📋 Before',sub:'Quotation',bg:'#FEF3C7',color:'#92400E',border:'#FDE68A'},{v:'after_quotation',label:'✅ After',sub:'Quotation',bg:'#FCE7F3',color:'#9D174D',border:'#FBCFE8'}] as const).map(opt=>(<button key={opt.v} onClick={()=>setSvType(opt.v as any)} className="py-3 px-2 rounded-xl text-xs font-bold text-center transition-all" style={{ background:svType===opt.v?opt.bg:'#E0F2FE',color:svType===opt.v?opt.color:'#0369A1',border:`2px solid ${svType===opt.v?opt.border:'#BAE6FD'}`,boxShadow:svType===opt.v?`0 4px 12px ${opt.color}20`:'none' }}>{opt.label}<br/><span className="text-[9px] opacity-70">{opt.sub}</span></button>))}</div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#0891B2' }}>📅 Date</label><input type="date" value={svDate} min={new Date().toISOString().split('T')[0]} onChange={e=>setSvDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none" style={{ background:'#E0F2FE',border:'1px solid #BAE6FD',color:'#0369A1' }}/></div><div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#0891B2' }}>🕐 Time</label><input type="time" value={svTime} onChange={e=>setSvTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none" style={{ background:'#E0F2FE',border:'1px solid #BAE6FD',color:'#0369A1' }}/></div></div>
              <div><p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:'#0891B2' }}>Quick Pick</p><QuickTimes value={svTime} onChange={setSvTime} color="#0891B2"/></div>
              <div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#0891B2' }}>📝 Note</label><textarea rows={2} value={svNote} onChange={e=>setSvNote(e.target.value)} placeholder="Client available after 11 AM..." className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ background:'#E0F2FE',border:'1px solid #BAE6FD',color:'#0C4A6E' }} onFocus={e=>(e.target.style.borderColor='#7DD3FC')} onBlur={e=>(e.target.style.borderColor='#BAE6FD')}/></div>
              <div className="flex gap-3 pt-1"><button onClick={()=>setShowSiteVisitPopup(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background:'#E0F2FE',color:'#0891B2',border:'1px solid #BAE6FD' }}>Cancel</button><button onClick={handleSaveSiteVisit} disabled={!svDate||!svTime||savingSV} className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40" style={{ background:'linear-gradient(135deg,#0369A1,#0891B2)',boxShadow:'0 6px 18px rgba(8,145,178,0.3)' }}>{savingSV?'⏳ Saving...':'🏠 Schedule Visit'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* QUOTATION POPUP */}
      {showQuotationPopup&&(
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ animation:'fadeIn 0.2s ease' }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowQuotationPopup(false)}/>
          <div className="relative w-full max-w-sm scale-in" style={{ background:'#FFF5F9',border:'1px solid #FBCFE8',borderRadius:24,boxShadow:'0 24px 60px rgba(219,39,119,0.15)',maxHeight:'90vh',overflowY:'auto' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid #FBCFE8' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background:'#FCE7F3',border:'1px solid #FBCFE8' }}>💰</div>
                <div>
                  <p className="text-sm font-black" style={{ color:'#831843' }}>
                    {revisions.length > 0 ? `New Revision (v${revisions[0]?.version + 1})` : 'Send Quotation (v1)'}
                  </p>
                  <p className="text-[10px]" style={{ color:'#DB2777' }}>{lead.lead_name}</p>
                </div>
              </div>
              <button onClick={()=>setShowQuotationPopup(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background:'#FCE7F3',color:'#DB2777' }}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div><p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:'#DB2777' }}>Quotation Type</p>
                <div className="grid grid-cols-2 gap-2">{([{v:'before_sitevisit',label:'📋 Before',sub:'Site Visit',bg:'#E0F2FE',color:'#0369A1',border:'#BAE6FD'},{v:'after_sitevisit',label:'🏠 After',sub:'Site Visit',bg:'#FEF3C7',color:'#92400E',border:'#FDE68A'}] as const).map(opt=>(<button key={opt.v} onClick={()=>setQtType(opt.v as any)} className="py-3 px-2 rounded-xl text-xs font-bold text-center transition-all" style={{ background:qtType===opt.v?opt.bg:'#FCE7F3',color:qtType===opt.v?opt.color:'#DB2777',border:`2px solid ${qtType===opt.v?opt.border:'#FBCFE8'}`,boxShadow:qtType===opt.v?`0 4px 12px ${opt.color}20`:'none' }}>{opt.label}<br/><span className="text-[9px] opacity-70">{opt.sub}</span></button>))}</div>
              </div>

              {/* Previous amount reference */}
              {revisions.length > 0 && revisions[0]?.amount && (
                <div className="px-3 py-2 rounded-xl flex items-center justify-between" style={{ background:'rgba(219,39,119,0.06)',border:'1px solid #FBCFE8' }}>
                  <p className="text-[9px] font-bold" style={{ color:'#DB2777' }}>Previous (v{revisions[0].version})</p>
                  <p className="text-sm font-black" style={{ color:'#9D174D' }}>₹ {Number(revisions[0].amount).toLocaleString('en-IN')}</p>
                </div>
              )}

              <div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#DB2777' }}>₹ New Amount</label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black" style={{ color:'#DB2777' }}>₹</span><input type="number" value={qtAmount} onChange={e=>setQtAmount(e.target.value)} placeholder={revisions[0]?.amount||'450000'} className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm font-bold outline-none" style={{ background:'#FCE7F3',border:'1px solid #FBCFE8',color:'#831843' }} onFocus={e=>(e.target.style.borderColor='#F9A8D4')} onBlur={e=>(e.target.style.borderColor='#FBCFE8')}/></div>
                {/* Auto diff */}
                {qtAmount && revisions[0]?.amount && (
                  <p className="text-[10px] mt-1 font-bold" style={{ color: Number(qtAmount) < Number(revisions[0].amount) ? '#059669' : '#DC2626' }}>
                    {Number(qtAmount) < Number(revisions[0].amount) ? '↓ Reduced by' : '↑ Increased by'} ₹{Math.abs(Number(qtAmount)-Number(revisions[0].amount)).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3"><div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#DB2777' }}>📅 Date</label><input type="date" value={qtDate} min={new Date().toISOString().split('T')[0]} onChange={e=>setQtDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none" style={{ background:'#FCE7F3',border:'1px solid #FBCFE8',color:'#831843' }}/></div><div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#DB2777' }}>🕐 Time</label><input type="time" value={qtTime} onChange={e=>setQtTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none" style={{ background:'#FCE7F3',border:'1px solid #FBCFE8',color:'#831843' }}/></div></div>
              <div><p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:'#DB2777' }}>Quick Pick</p><QuickTimes value={qtTime} onChange={setQtTime} color="#DB2777"/></div>
              <div><label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#DB2777' }}>📝 Note</label><textarea rows={2} value={qtNote} onChange={e=>setQtNote(e.target.value)} placeholder="E.g. Revised after negotiation..." className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ background:'#FCE7F3',border:'1px solid #FBCFE8',color:'#831843' }} onFocus={e=>(e.target.style.borderColor='#F9A8D4')} onBlur={e=>(e.target.style.borderColor='#FBCFE8')}/></div>

              {/* PDF Upload */}
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#DB2777' }}>📄 PDF (optional)</label>
                {!qtPdfFile?(
                  <div className="pdf-drop rounded-xl border-2 border-dashed p-4 text-center cursor-pointer" style={{ borderColor:'#FBCFE8',background:'#FFF5F9' }} onClick={()=>pdfInputRef.current?.click()} onDragOver={e=>{e.preventDefault();(e.currentTarget as HTMLElement).style.borderColor='#F9A8D4'}} onDragLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#FBCFE8'}} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f&&f.type==='application/pdf')setQtPdfFile(f)}}>
                    <Upload className="w-5 h-5 mx-auto mb-1.5" style={{ color:'#FBCFE8' }}/><p className="text-xs font-bold" style={{ color:'#DB2777' }}>Click or drag PDF</p><p className="text-[9px] mt-0.5" style={{ color:'#F9A8D4' }}>PDF only · Max 10MB</p>
                  </div>
                ):(
                  <div className="rounded-xl p-3 flex items-center gap-3" style={{ background:'#FCE7F3',border:'1px solid #FBCFE8' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#FFF5F9',border:'1px solid #FBCFE8' }}><FileText className="w-4 h-4" style={{ color:'#DB2777' }}/></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate" style={{ color:'#831843' }}>{qtPdfFile.name}</p><p className="text-[10px]" style={{ color:'#DB2777' }}>{(qtPdfFile.size/1024/1024).toFixed(2)} MB</p>{qtPdfUploading&&<div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background:'#FBCFE8' }}><div className="h-full rounded-full transition-all duration-300" style={{ width:`${qtPdfProgress}%`,background:'linear-gradient(90deg,#DB2777,#BE185D)' }}/></div>}</div>
                    <button onClick={()=>setQtPdfFile(null)} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:'#FFF5F9',color:'#DB2777' }}><X className="w-3 h-3"/></button>
                  </div>
                )}
                <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setQtPdfFile(f);e.target.value=''}}/>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={()=>setShowQuotationPopup(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background:'#FCE7F3',color:'#DB2777',border:'1px solid #FBCFE8' }}>Cancel</button>
                <button onClick={handleSaveQuotation} disabled={!qtDate||!qtTime||savingQT||qtPdfUploading} className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40" style={{ background:'linear-gradient(135deg,#9D174D,#DB2777)',boxShadow:'0 6px 18px rgba(219,39,119,0.3)' }}>
                  {qtPdfUploading?`⬆️ ${qtPdfProgress}%...`:savingQT?'⏳ Saving...':revisions.length>0?`💰 Save v${revisions[0]?.version+1}`:'💰 Save v1'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WON POPUP */}
      {showWonPopup&&(
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ animation:'fadeIn 0.2s ease' }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowWonPopup(false)}/>
          <div className="relative w-full max-w-sm scale-in" style={{ background:'linear-gradient(160deg,#ECFDF5,#F0FDF4)',border:'2px solid #6EE7B7',borderRadius:24,boxShadow:'0 24px 60px rgba(5,150,105,0.2)' }}>

            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid #A7F3D0' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:'linear-gradient(135deg,#059669,#047857)',boxShadow:'0 4px 12px rgba(5,150,105,0.35)' }}>🏆</div>
                <div>
                  <p className="text-sm font-black" style={{ color:'#064E3B' }}>Mark as Won</p>
                  <p className="text-[10px]" style={{ color:'#059669' }}>{lead.lead_name}</p>
                </div>
              </div>
              <button onClick={()=>setShowWonPopup(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background:'#A7F3D0',color:'#059669' }}>✕</button>
            </div>

            <div className="p-5 space-y-4">

              {/* Confetti banner */}
              <div className="rounded-xl py-3 text-center" style={{ background:'linear-gradient(135deg,#059669,#047857)',boxShadow:'0 4px 14px rgba(5,150,105,0.3)' }}>
                <p className="text-white font-black text-base">🎉 Congratulations! 🎉</p>
                <p className="text-green-200 text-xs mt-0.5">Deal Closed Successfully</p>
              </div>

              {/* Final Deal Amount */}
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#059669' }}>₹ Final Deal Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black" style={{ color:'#059669' }}>₹</span>
                  <input type="number" value={wonAmount} onChange={e=>setWonAmount(e.target.value)}
                    placeholder={lead.quotation_amount||'Enter final amount'}
                    className="w-full pl-7 pr-3 py-3 rounded-xl text-base font-black outline-none"
                    style={{ background:'#D1FAE5',border:'2px solid #6EE7B7',color:'#064E3B' }}
                    onFocus={e=>(e.target.style.borderColor='#059669')} onBlur={e=>(e.target.style.borderColor='#6EE7B7')}/>
                </div>
                {/* Show vs quotation amount */}
                {wonAmount && lead.quotation_amount && wonAmount !== lead.quotation_amount && (
                  <p className="text-[10px] mt-1 font-bold" style={{ color: Number(wonAmount) < Number(lead.quotation_amount) ? '#DC2626' : '#059669' }}>
                    {Number(wonAmount) < Number(lead.quotation_amount)
                      ? `↓ ₹${(Number(lead.quotation_amount)-Number(wonAmount)).toLocaleString('en-IN')} less than quoted`
                      : `↑ ₹${(Number(wonAmount)-Number(lead.quotation_amount)).toLocaleString('en-IN')} more than quoted`}
                  </p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'#059669' }}>📝 Closing Note (optional)</label>
                <textarea rows={3} value={wonNote} onChange={e=>setWonNote(e.target.value)}
                  placeholder="E.g. Client happy with design, signed agreement on 22 Jun..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ background:'#D1FAE5',border:'1px solid #A7F3D0',color:'#064E3B' }}
                  onFocus={e=>(e.target.style.borderColor='#059669')} onBlur={e=>(e.target.style.borderColor='#A7F3D0')}/>
              </div>

              {/* Summary preview */}
              {wonAmount&&(
                <div className="px-4 py-3 rounded-xl" style={{ background:'#D1FAE5',border:'1px solid #6EE7B7' }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color:'#059669' }}>Deal Summary</p>
                  <p className="text-lg font-black" style={{ color:'#064E3B' }}>₹ {Number(wonAmount).toLocaleString('en-IN')}</p>
                  {lead.quotation_amount&&<p className="text-[10px]" style={{ color:'#059669' }}>Quoted: ₹{Number(lead.quotation_amount).toLocaleString('en-IN')}</p>}
                  {wonNote&&<p className="text-xs mt-1" style={{ color:'#047857' }}>{wonNote}</p>}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button onClick={()=>setShowWonPopup(false)} className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background:'#D1FAE5',color:'#059669',border:'1px solid #A7F3D0' }}>Cancel</button>
                <button onClick={handleSaveWon} disabled={savingWon}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40"
                  style={{ background:'linear-gradient(135deg,#047857,#059669)',boxShadow:'0 6px 18px rgba(5,150,105,0.35)' }}>
                  {savingWon?'⏳ Saving...':'🏆 Mark as Won!'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOG ACTIVITY MODAL */}
      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ animation:'fadeIn 0.2s ease' }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={()=>setShowModal(false)}/>
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden" style={{ background:'#FFFDF8',border:`1px solid ${C.border}`,boxShadow:'0 24px 60px rgba(0,0,0,0.12)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:`1px solid ${C.border}` }}><p className="font-black" style={{ color:C.text }}>Log Activity</p><button onClick={()=>setShowModal(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background:'#F5F0E8',color:C.textMuted }}>✕</button></div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2">{([{id:'call',label:'📞 Call',color:'#7C3AED'},{id:'note',label:'📝 Note',color:'#64748B'},{id:'sitevisit',label:'🏠 Visit',color:'#0891B2'},{id:'quotation',label:'💰 Quote',color:'#DB2777'}] as const).map(t=>(<button key={t.id} onClick={()=>setNoteType(t.id)} className="py-2.5 px-1 rounded-xl text-[10px] font-bold text-center transition-all" style={{ background:noteType===t.id?`${t.color}15`:'#F5F0E8',color:noteType===t.id?t.color:C.textMuted,border:`1.5px solid ${noteType===t.id?t.color+'50':C.border}` }}>{t.label}</button>))}</div>
              <textarea rows={4} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder={noteType==='call'?'Call summary...':noteType==='quotation'?'Quotation details...':noteType==='sitevisit'?'Site visit notes...':'Add a note...'} autoFocus className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background:'#F5F0E8',border:`1px solid ${C.border}`,color:C.text }} onFocus={e=>(e.target.style.borderColor='#FDE68A')} onBlur={e=>(e.target.style.borderColor=C.border)}/>
              <div className="flex gap-3"><button onClick={()=>setShowModal(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background:'#F5F0E8',color:C.textMuted,border:`1px solid ${C.border}` }}>Cancel</button><button onClick={handleSaveNote} disabled={!noteText.trim()||savingNote} className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40" style={{ background:'linear-gradient(135deg,#B8860B,#D97706)',boxShadow:noteText.trim()?'0 6px 18px rgba(184,134,11,0.3)':'none' }}>{savingNote?'⏳ Saving...':'+ Save Activity'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}