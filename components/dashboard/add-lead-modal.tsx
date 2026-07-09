'use client'

import { useState, useRef } from 'react'
import {
  X, Plus, Trash2, User, Users, ChevronDown,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2,
  Zap, Database, Phone, UserX,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SingleLead {
  name: string
  phone: string
  email: string
  source: string
  budget: string
  propertyType: string
  city: string
  manualCity: string
  interest: string
  status: string
  notes: string
}

export interface AddLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onLeadsAdded?: (leads: SingleLead[]) => void
  industry?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const emptyLead: SingleLead = {
  name: '', phone: '', email: '',
  source: '', budget: '', propertyType: '',
  city: '', manualCity: '', interest: '',
  status: 'new', notes: '',
}

const sources = [
  'Instagram', 'Facebook', 'WhatsApp', 'Google Ads', 'YouTube',
  'LinkedIn', 'Justdial', 'IndiaMART', 'UrbanClap', 'Housing.com',
  '99acres', 'MagicBricks', 'Direct Walk-In', 'Referral',
  'SMS Campaign', 'Flyers', 'Hoardings', 'Newspaper Ads',
  'Lokal App', 'Email Campaign', 'Other',
]

const propertyTypes = [
  '1 BHK Apartment', '2 BHK Apartment', '3 BHK Apartment', '4 BHK Apartment',
  'Villa / Independent House', 'Row House', 'Plot / Land', 'Commercial Space',
  'Office Space', 'Shop / Showroom', 'Penthouse', 'Studio Apartment', 'Other',
]

const tsCities = ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam', 'Nalgonda', 'Rangareddy', 'Siddipet', 'Suryapet', 'Sangareddy']
const apCities = ['Vijayawada', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kakinada', 'Anantapur', 'Eluru', 'YSR Kadapa']

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getCompanyId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    return data?.company_id || null
  } catch { return null }
}

function toRow(lead: SingleLead, companyId: string | null, industry: string) {
  const finalCity = lead.city === '__manual__' ? lead.manualCity : lead.city
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return {
    company_id: companyId,
    lead_name: lead.name.trim(),
    phone: lead.phone.trim() || null,
    email: lead.email.trim() || null,
    source: lead.source || null,
    status: lead.status.charAt(0).toUpperCase() + lead.status.slice(1),
    budget: lead.budget || null,
    property_type: lead.propertyType || null,
    city: finalCity || null,
    interest: lead.interest || null,
    notes: lead.notes || null,
    industry,
    date: today,
  }
}

function parseCSV(text: string): SingleLead[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const get = (keys: string[]) => {
      for (const k of keys) {
        const idx = headers.indexOf(k)
        if (idx !== -1 && cols[idx]) return cols[idx]
      }
      return ''
    }
    return {
      name: get(['name', 'full_name', 'lead_name']),
      phone: get(['phone', 'mobile', 'contact']),
      email: get(['email', 'email_address']) || '',
      source: get(['source', 'lead_source']),
      budget: get(['budget']),
      propertyType: get(['property_type', 'type', 'property']),
      city: get(['city', 'location']),
      manualCity: '',
      interest: get(['interest', 'requirement']),
      status: get(['status', 'lead_status']) || 'new',
      notes: get(['notes', 'remarks']),
    }
  }).filter(l => l.name || l.phone)
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AddLeadModal({ isOpen, onClose, onLeadsAdded, industry = 'general' }: AddLeadModalProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [bulkTab, setBulkTab] = useState<'manual' | 'upload'>('manual')
  const [singleLead, setSingleLead] = useState<SingleLead>(emptyLead)
  const [bulkLeads, setBulkLeads] = useState<SingleLead[]>([{ ...emptyLead }, { ...emptyLead }])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; count: number } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [dbDuplicatePhones, setDbDuplicatePhones] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const isManualCity = singleLead.city === '__manual__'

  // ── Computed counts (derived from current bulkLeads) ──
  const noPhoneCount = bulkLeads.filter(l => l.name.trim() && !l.phone.trim()).length
  const noNameCount  = bulkLeads.filter(l => !l.name.trim()).length
  const totalInvalid = bulkLeads.filter(l => !l.name.trim() || !l.phone.trim()).length
  const activeLead   = bulkLeads.filter(l => l.name.trim()).length

  // Duplicate count — separate pass to avoid shared Set mutation bug
  const dupPhoneCount = (() => {
    const seen = new Set<string>()
    return bulkLeads.filter(l => {
      const p = l.phone.trim()
      if (!p) return false
      if (seen.has(p)) return true   // second+ occurrence
      seen.add(p); return false
    }).length
  })()

  // ── Error flags ──
  const hasPhoneErr  = errors.some(e => e.includes('Phone required'))
  const hasNameErr   = errors.some(e => e.includes('Name required'))
  const hasBatchDup  = errors.some(e => e.includes('Duplicate phones'))
  const hasDbDup     = errors.some(e => e.includes('Already exists in DB'))
  const showFixBar   = mode === 'bulk' && (hasPhoneErr || hasNameErr || hasBatchDup || hasDbDup)

  // ── Validation ──
  const validateSingle = () => {
    const errs: string[] = []
    if (!singleLead.name.trim()) errs.push('Name is required')
    if (!singleLead.phone.trim()) errs.push('Phone is required')
    if (!singleLead.source) errs.push('Source is required')
    return errs
  }

  const validateBulk = () => {
    const errs: string[] = []
    bulkLeads.forEach((lead, i) => {
      if (!lead.name.trim()) errs.push(`Row ${i + 1}: Name required`)
      if (!lead.phone.trim()) errs.push(`Row ${i + 1}: Phone required`)
    })
    return errs
  }

  // ── Submit ──
  const handleSubmit = async () => {
    const errs = mode === 'single' ? validateSingle() : validateBulk()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setLoading(true)

    try {
      const companyId = await getCompanyId()

      if (mode === 'single') {
        const { data: existing } = await supabase
          .from('leads').select('id, lead_name')
          .eq('phone', singleLead.phone.trim())
          .eq('company_id', companyId)
          .maybeSingle()

        if (existing) {
          setErrors([`⚠ Phone ${singleLead.phone} already exists — registered as "${existing.lead_name}".`])
          setLoading(false); return
        }

        const { error } = await supabase.from('leads').insert(toRow(singleLead, companyId, industry))
        if (error) {
          setErrors([error.code === '23505' ? '⚠ This phone number is already registered' : `Save failed: ${error.message}`])
          setLoading(false); return
        }

      } else {
        const validLeads = bulkLeads.filter(l => l.name.trim())
        if (!validLeads.length) { setErrors(['At least one lead with a name is required']); setLoading(false); return }

        // Check batch-level duplicates
        const phonesInBatch = validLeads.map(l => l.phone.trim()).filter(Boolean)
        const uniqueInBatch = new Set(phonesInBatch)
        if (uniqueInBatch.size !== phonesInBatch.length) {
          const seen = new Set<string>()
          const dups = phonesInBatch.filter(p => { if (seen.has(p)) return true; seen.add(p); return false })
          setErrors([`⚠ Duplicate phones in this batch: ${[...new Set(dups)].join(', ')}`])
          setLoading(false); return
        }

        // Check DB duplicates
        const { data: existingInDB } = await supabase
          .from('leads').select('phone, lead_name')
          .eq('company_id', companyId)
          .in('phone', phonesInBatch)

        if (existingInDB && existingInDB.length > 0) {
          const dupPhones = new Set(existingInDB.map((e: { phone: string }) => String(e.phone).trim()))
          setDbDuplicatePhones(dupPhones)
          const dupList = existingInDB.map((e: { phone: string; lead_name: string }) => `${e.phone} (${e.lead_name})`).join(', ')
          setErrors([`⚠ Already exists in DB: ${dupList}`])
          setLoading(false); return
        }

        const { error } = await supabase.from('leads').insert(validLeads.map(l => toRow(l, companyId, industry)))
        if (error) {
          setErrors([error.code === '23505' ? '⚠ One or more phone numbers already registered' : `Save failed: ${error.message}`])
          setLoading(false); return
        }
      }

      onLeadsAdded?.(mode === 'single' ? [singleLead] : bulkLeads.filter(l => l.name.trim()))
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setSingleLead(emptyLead)
        setBulkLeads([{ ...emptyLead }, { ...emptyLead }])
        setUploadedFile(null)
        onClose()
      }, 1200)

    } catch (err: unknown) {
      setErrors([`Error: ${err instanceof Error ? err.message : 'Unknown error'}`])
    } finally {
      setLoading(false)
    }
  }

  // ── Bulk row helpers ──
  const addBulkRow    = () => setBulkLeads(p => [...p, { ...emptyLead }])
  const removeBulkRow = (i: number) => { if (bulkLeads.length > 1) setBulkLeads(p => p.filter((_, idx) => idx !== i)) }
  const updateBulkLead = (i: number, field: keyof SingleLead, value: string) => {
    setBulkLeads(p => { const u = [...p]; u[i] = { ...u[i], [field]: value }; return u })
  }

  // ── Smart fix handlers — all call setUploadedFile(null) so table shows after fix ──
  const clearAndSwitch = (filtered: SingleLead[]) => {
    setBulkLeads(filtered.length > 0 ? filtered : [{ ...emptyLead }])
    setUploadedFile(null)  // switch from upload preview → manual table view
    setErrors([])
  }

  const fixNoPhone = () => clearAndSwitch(bulkLeads.filter(l => l.phone.trim()))
  const fixNoName  = () => clearAndSwitch(bulkLeads.filter(l => l.name.trim()))
  const fixAll     = () => clearAndSwitch(bulkLeads.filter(l => l.name.trim() && l.phone.trim()))

  const fixBatchDuplicates = () => {
    const seen2 = new Set<string>()
    clearAndSwitch(bulkLeads.filter(l => {
      const p = l.phone.trim()
      if (!p) return true             // no phone → keep (let fixNoPhone handle)
      if (seen2.has(p)) return false  // duplicate → remove
      seen2.add(p); return true       // first occurrence → keep
    }))
  }

  const fixDbDuplicates = () => {
    clearAndSwitch(bulkLeads.filter(l => !dbDuplicatePhones.has(l.phone.trim())))
    setDbDuplicatePhones(new Set())
  }

  // ── File processing ──
  const processFile = (file: File) => {
    setUploadError(''); setUploadedFile(null)
    const isCSV  = file.name.endsWith('.csv')
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (!isCSV && !isXLSX) { setUploadError('Only .csv, .xlsx, or .xls files supported.'); return }

    if (isXLSX) {
      const reader = new FileReader()
      reader.onload = (e) => {
        import('xlsx').then(XLSX => {
          const wb = XLSX.read(e.target?.result, { type: 'array' })
          const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])
          const leads = parseCSV(csv)
          if (!leads.length) { setUploadError('No valid data found in the file.'); return }
          setBulkLeads(leads); setUploadedFile({ name: file.name, count: leads.length })
        }).catch(() => setUploadError('Install xlsx package: npm i xlsx'))
      }
      reader.readAsArrayBuffer(file); return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const leads = parseCSV(e.target?.result as string)
      if (!leads.length) { setUploadError('No valid data found in the file.'); return }
      setBulkLeads(leads); setUploadedFile({ name: file.name, count: leads.length })
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f) }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }

  const downloadSample = () => {
    const csv = [
      'name,phone,source,budget,property_type,city,interest',
      'Rajesh Kumar,9876543210,Instagram,₹5-8L,2 BHK Apartment,Hyderabad,Living Room',
      'Priya Sharma,9123456789,Referral,₹10-15L,Villa / Independent House,Vijayawada,Full Interior',
    ].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'leads_sample.csv',
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  // ── Style constants ──
  const inp  = "w-full bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-3 py-2 text-sm text-[#1C1712] placeholder:text-[#B8B0A0] outline-none focus:border-[#B8860B] transition-colors"
  const lbl  = "text-[10px] font-semibold text-[#7A6E60] uppercase tracking-wide block mb-1"
  const sel  = "w-full bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-3 py-2 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors appearance-none"
  const bInp = "w-full bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1712] outline-none focus:border-[#B8860B]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-[#FDFAF4] rounded-2xl border border-[#E2D9C8] w-full shadow-2xl shadow-black/20 flex flex-col"
        style={{ maxWidth: mode === 'bulk' ? '980px' : '540px', maxHeight: '92vh' }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2D9C8] flex-shrink-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Plus size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#1C1712] leading-tight">Add Leads</h2>
              <p className="text-[10px] text-[#9A8F82] flex items-center gap-1 mt-0.5">
                <Database size={9} /> Saved directly to Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E2D9C8] flex items-center justify-center text-[#7A6E60] hover:bg-[#F0EBE0] hover:text-[#1C1712] transition-all">
            <X size={14} />
          </button>
        </div>

        {/* ── Mode Toggle ── */}
        <div className="px-5 pt-4 flex-shrink-0">
          <div className="flex gap-1.5 p-1 bg-[#F0EBE0] rounded-xl w-fit">
            {(['single', 'bulk'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors([]) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-[#1C1712] text-white shadow-md'
                    : 'text-[#7A6E60] hover:text-[#1C1712] hover:bg-[#E8E0D0]'
                }`}>
                {m === 'single' ? <User size={13} /> : <Users size={13} />}
                {m === 'single' ? 'Single Lead' : 'Bulk Leads'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── SINGLE LEAD FORM ── */}
          {mode === 'single' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Full Name *</label>
                  <input type="text" placeholder="Rajesh Kumar"
                    value={singleLead.name}
                    onChange={e => setSingleLead({ ...singleLead, name: e.target.value })}
                    className={inp} />
                </div>
                <div>
                  <label className={lbl}>Phone *</label>
                  <div className="flex rounded-lg overflow-hidden border border-[#E2D9C8] focus-within:border-[#B8860B] transition-colors">
                    <div className="flex items-center px-3 text-sm font-bold text-[#7A6E60] bg-[#EDE8DC] border-r border-[#E2D9C8] flex-shrink-0 select-none">+91</div>
                    <input type="tel" placeholder="98765 43210"
                      value={singleLead.phone.replace(/^\+91/, '')}
                      onChange={e => setSingleLead({ ...singleLead, phone: '+91' + e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="flex-1 bg-[#F5F0E8] px-3 py-2 text-sm text-[#1C1712] placeholder:text-[#B8B0A0] outline-none min-w-0" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Lead Source *</label>
                  <div className="relative">
                    <select value={singleLead.source} onChange={e => setSingleLead({ ...singleLead, source: e.target.value })} className={sel}>
                      <option value="">Select source</option>
                      {sources.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E60] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Budget</label>
                  <input type="text" placeholder="₹5–8L" value={singleLead.budget}
                    onChange={e => setSingleLead({ ...singleLead, budget: e.target.value })} className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Property Type</label>
                  <div className="relative">
                    <select value={singleLead.propertyType} onChange={e => setSingleLead({ ...singleLead, propertyType: e.target.value })} className={sel}>
                      <option value="">Select type</option>
                      {propertyTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E60] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Location / City</label>
                  <div className="relative">
                    <select value={singleLead.city}
                      onChange={e => setSingleLead({ ...singleLead, city: e.target.value, manualCity: '' })} className={sel}>
                      <option value="">Select city</option>
                      <optgroup label="Telangana (TS)">{tsCities.map(c => <option key={c}>{c}</option>)}</optgroup>
                      <optgroup label="Andhra Pradesh (AP)">{apCities.map(c => <option key={c}>{c}</option>)}</optgroup>
                      <option value="__manual__">+ Enter manually</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E60] pointer-events-none" />
                  </div>
                  {isManualCity && (
                    <input type="text" placeholder="Type city name..." value={singleLead.manualCity}
                      onChange={e => setSingleLead({ ...singleLead, manualCity: e.target.value })}
                      className={`${inp} mt-2`} autoFocus />
                  )}
                </div>
              </div>

              <div>
                <label className={lbl}>Email (optional)</label>
                <input type="email" placeholder="customer@email.com" value={singleLead.email}
                  onChange={e => setSingleLead({ ...singleLead, email: e.target.value })} className={inp} />
              </div>

              <div>
                <label className={lbl}>Requirement</label>
                <input type="text" placeholder="Living Room Makeover, Full Interior..." value={singleLead.interest}
                  onChange={e => setSingleLead({ ...singleLead, interest: e.target.value })} className={inp} />
              </div>

              <div>
                <label className={lbl}>Notes</label>
                <textarea placeholder="Any additional notes..." value={singleLead.notes}
                  onChange={e => setSingleLead({ ...singleLead, notes: e.target.value })}
                  rows={3} className={`${inp} resize-none`} />
              </div>
            </div>
          )}

          {/* ── BULK LEADS ── */}
          {mode === 'bulk' && (
            <div>
              {/* Sub-tab */}
              <div className="flex gap-1 mb-4 p-1 bg-[#F0EBE0] rounded-xl w-fit">
                {(['manual', 'upload'] as const).map(t => (
                  <button key={t} onClick={() => setBulkTab(t)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      bulkTab === t ? 'bg-[#1C1712] text-white shadow-md' : 'text-[#7A6E60] hover:text-[#1C1712] hover:bg-[#E8E0D0]'
                    }`}>
                    {t === 'manual' ? <Plus size={11} /> : <Upload size={11} />}
                    {t === 'manual' ? 'Manual Entry' : 'Upload CSV / Excel'}
                  </button>
                ))}
              </div>

              {/* Upload panel */}
              {bulkTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      dragOver ? 'border-[#B8860B] bg-amber-50/60' : 'border-[#E2D9C8] hover:border-[#B8860B] hover:bg-[#FDFAF4]'
                    }`}>
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                      <FileSpreadsheet size={28} className="text-[#B8860B]" />
                    </div>
                    <p className="text-sm font-bold text-[#1C1712]">Drag a CSV or Excel file here</p>
                    <p className="text-xs text-[#7A6E60] mt-1">or click to select</p>
                    <p className="text-[10px] text-[#B8B0A0] mt-3 bg-[#F0EBE0] px-3 py-1 rounded-full">.csv · .xlsx · .xls</p>
                  </div>

                  {uploadError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-600">{uploadError}</p>
                    </div>
                  )}

                  {uploadedFile && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-700 truncate">{uploadedFile.name}</p>
                        <p className="text-[10px] text-emerald-600">{uploadedFile.count} leads loaded</p>
                      </div>
                      <button
                        onClick={() => { setUploadedFile(null); setBulkLeads([{ ...emptyLead }, { ...emptyLead }]) }}
                        className="text-[10px] font-semibold text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-[#F5F0E8] border border-[#E2D9C8] rounded-xl p-3">
                    <div>
                      <p className="text-xs font-bold text-[#1C1712]">Need a sample file?</p>
                      <p className="text-[10px] text-[#7A6E60]">Download CSV with correct column format</p>
                    </div>
                    <button onClick={downloadSample} className="flex items-center gap-1.5 text-xs font-bold text-[#B8860B] hover:text-[#9A7009] transition-colors flex-shrink-0">
                      <Upload size={11} className="rotate-180" /> Download Sample
                    </button>
                  </div>

                  <div className="bg-[#F5F0E8] border border-[#E2D9C8] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider mb-2">Expected column headers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['name', 'phone', 'source', 'budget', 'property_type', 'city', 'interest', 'status', 'notes'].map(h => (
                        <span key={h} className="bg-white border border-[#E2D9C8] text-[#1C1712] text-[10px] font-mono px-2 py-0.5 rounded-md shadow-sm">{h}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Table — show in manual mode OR after upload */}
              {(bulkTab === 'manual' || uploadedFile) && (
                <div className={bulkTab === 'upload' ? 'mt-4' : ''}>
                  {/* Table header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1C1712]">{bulkLeads.length}</span>
                      <span className="text-sm text-[#7A6E60]">leads ready</span>
                      {activeLead < bulkLeads.length && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          {bulkLeads.length - activeLead} incomplete
                        </span>
                      )}
                    </div>
                    {bulkTab === 'manual' && (
                      <button onClick={addBulkRow}
                        className="flex items-center gap-1.5 bg-[#1C1712] hover:bg-[#2d2822] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm">
                        <Plus size={11} /> Add Row
                      </button>
                    )}
                  </div>

                  {bulkTab === 'upload' && uploadedFile && (
                    <p className="text-xs text-[#7A6E60] mb-2 font-semibold flex items-center gap-1">
                      <Zap size={10} className="text-[#B8860B]" /> Preview — you can edit before saving
                    </p>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-[#E2D9C8]">
                    <table className="w-full" style={{ minWidth: '880px' }}>
                      <thead>
                        <tr className="bg-[#F5F0E8] border-b border-[#E2D9C8]">
                          {['#', 'Name *', 'Phone * (+91)', 'Source', 'Budget', 'Property Type', 'City', ''].map((h, i) => (
                            <th key={i} className="text-left text-[9px] font-bold text-[#7A6E60] uppercase tracking-wider py-2.5 px-2 first:pl-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkLeads.map((lead, i) => {
                          const rowInvalid = !lead.name.trim() || !lead.phone.trim()
                          const isDbDup = dbDuplicatePhones.has(lead.phone.trim())
                          return (
                            <tr key={i} className={`border-b border-[#F0EBE0] last:border-0 transition-colors ${
                              isDbDup ? 'bg-blue-50/50' : rowInvalid && errors.length > 0 ? 'bg-red-50/40' : 'hover:bg-[#FDFAF4]'
                            }`}>
                              <td className="py-2 pl-3 pr-2 text-xs text-[#9A8F82] font-semibold w-8">{i + 1}</td>
                              <td className="py-2 pr-2">
                                <input type="text" placeholder="Full name" value={lead.name}
                                  onChange={e => updateBulkLead(i, 'name', e.target.value)}
                                  className={`${bInp} ${!lead.name.trim() && errors.length > 0 ? 'border-red-300 bg-red-50' : ''}`} />
                              </td>
                              <td className="py-2 pr-2">
                                <div className={`flex rounded-lg overflow-hidden border focus-within:border-[#B8860B] transition-colors ${
                                  !lead.phone.trim() && errors.length > 0 ? 'border-red-300' : 'border-[#E2D9C8]'
                                }`}>
                                  <span className="flex items-center px-2 text-[10px] font-bold text-[#7A6E60] bg-[#EDE8DC] border-r border-[#E2D9C8] select-none flex-shrink-0">+91</span>
                                  <input type="tel" placeholder="9876543210"
                                    value={lead.phone.replace(/^\+91/, '')}
                                    onChange={e => updateBulkLead(i, 'phone', '+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className={`flex-1 px-2 py-1.5 text-xs text-[#1C1712] placeholder:text-[#B8B0A0] outline-none min-w-0 ${
                                      !lead.phone.trim() && errors.length > 0 ? 'bg-red-50' : 'bg-[#F5F0E8]'
                                    }`} />
                                </div>
                              </td>
                              <td className="py-2 pr-2">
                                <select value={lead.source} onChange={e => updateBulkLead(i, 'source', e.target.value)} className={bInp}>
                                  <option value="">Source</option>
                                  {sources.map(s => <option key={s}>{s}</option>)}
                                </select>
                              </td>
                              <td className="py-2 pr-2">
                                <input type="text" placeholder="₹5–8L" value={lead.budget}
                                  onChange={e => updateBulkLead(i, 'budget', e.target.value)} className={bInp} />
                              </td>
                              <td className="py-2 pr-2">
                                <select value={lead.propertyType} onChange={e => updateBulkLead(i, 'propertyType', e.target.value)} className={bInp}>
                                  <option value="">Type</option>
                                  {propertyTypes.map(t => <option key={t}>{t}</option>)}
                                </select>
                              </td>
                              <td className="py-2 pr-2">
                                <select value={lead.city} onChange={e => updateBulkLead(i, 'city', e.target.value)} className={bInp}>
                                  <option value="">City</option>
                                  <optgroup label="TS">{tsCities.map(c => <option key={c}>{c}</option>)}</optgroup>
                                  <optgroup label="AP">{apCities.map(c => <option key={c}>{c}</option>)}</optgroup>
                                </select>
                              </td>
                              <td className="py-2 pr-2">
                                <button onClick={() => removeBulkRow(i)} disabled={bulkLeads.length <= 1}
                                  className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 hover:text-red-600 disabled:opacity-20 transition-all">
                                  <Trash2 size={11} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {bulkTab === 'manual' && (
                    <button onClick={addBulkRow}
                      className="mt-3 flex items-center gap-2 w-full py-2.5 border-2 border-dashed border-[#E2D9C8] rounded-xl text-xs font-semibold text-[#7A6E60] hover:border-[#B8860B] hover:text-[#B8860B] transition-colors justify-center">
                      <Plus size={13} /> Add Another Row
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ERRORS + SMART FIX BAR ── */}
          {errors.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 overflow-hidden shadow-sm">

              {/* Smart fix buttons */}
              {showFixBar && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100 p-3">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Zap size={10} className="text-red-600" />
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Quick Fix — one click to clean</p>
                  </div>
                  <div className="flex flex-wrap gap-2">

                    {hasPhoneErr && noPhoneCount > 0 && (
                      <button onClick={fixNoPhone}
                        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm">
                        <Phone size={10} />
                        Remove {noPhoneCount} rows without phone
                      </button>
                    )}

                    {hasNameErr && noNameCount > 0 && (
                      <button onClick={fixNoName}
                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm">
                        <UserX size={10} />
                        Remove {noNameCount} rows without name
                      </button>
                    )}

                    {hasBatchDup && dupPhoneCount > 0 && (
                      <button onClick={fixBatchDuplicates}
                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm">
                        <Trash2 size={10} />
                        Remove {dupPhoneCount} duplicate phone rows
                      </button>
                    )}

                    {hasDbDup && dbDuplicatePhones.size > 0 && (
                      <button onClick={fixDbDuplicates}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm">
                        <Database size={10} />
                        Remove {dbDuplicatePhones.size} already-in-DB rows
                      </button>
                    )}

                    {totalInvalid > 0 && (
                      <button onClick={fixAll}
                        className="flex items-center gap-1.5 bg-[#1C1712] hover:bg-[#2d2822] active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm">
                        <Zap size={10} />
                        Remove all {totalInvalid} invalid rows
                      </button>
                    )}

                  </div>
                </div>
              )}

              {/* Error list */}
              <div className="bg-red-50 p-3 max-h-32 overflow-y-auto space-y-1">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <AlertCircle size={11} className="flex-shrink-0 mt-0.5" /> {err}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-5 py-4 border-t border-[#E2D9C8] flex-shrink-0 bg-white rounded-b-2xl">
          <button onClick={onClose}
            className="flex-1 border-2 border-[#E2D9C8] text-[#1C1712] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F0EBE0] hover:border-[#D0C8B8] transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || success}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg disabled:opacity-60 ${
              success
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : 'bg-[#1C1712] text-white hover:bg-[#2d2822] shadow-black/15'
            }`}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
              : success
              ? `✓ ${mode === 'bulk' ? `${activeLead} Leads` : 'Lead'} Saved!`
              : mode === 'bulk' ? `Add ${activeLead} Leads →` : 'Add Lead →'}
          </button>
        </div>

      </div>
    </div>
  )
}