'use client'

import { useState, useRef } from 'react'
import { X, Plus, Trash2, User, Users, ChevronDown, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SingleLead {
  name: string
  phone: string
  email: string        // ← ఇది add చేయి
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
  name: '', phone: '', email: '',  // ← email: '' add చేయి
  source: '', budget: '', propertyType: '',
  city: '', manualCity: '', interest: '',
  status: 'new', notes: '',
}

const sources       = ['Instagram', 'Facebook', 'Google Ads', 'Referral', 'Walk-in', 'WhatsApp', 'MagicBricks', '99acres', 'JustDial', 'Other']
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
    const { data } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    return data?.company_id || null
  } catch {
    return null
  }
}

function toRow(lead: SingleLead, companyId: string | null, industry: string) {
  const finalCity = lead.city === '__manual__' ? lead.manualCity : lead.city
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return {
    company_id:    companyId,
    lead_name:     lead.name.trim(),
    phone:         lead.phone.trim() || null,
    source:        lead.source || null,
    status:        lead.status.charAt(0).toUpperCase() + lead.status.slice(1),
    budget:        lead.budget || null,
    property_type: lead.propertyType || null,
    city:          finalCity || null,
    interest:      lead.interest || null,
    notes:         lead.notes || null,
    industry:      industry,
    date:          today,
  }
}

function parseCSV(text: string): SingleLead[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const get  = (keys: string[]) => { for (const k of keys) { const idx = headers.indexOf(k); if (idx !== -1 && cols[idx]) return cols[idx] } return '' }
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
  const [mode, setMode]           = useState<'single' | 'bulk'>('single')
  const [bulkTab, setBulkTab]     = useState<'manual' | 'upload'>('manual')
  const [singleLead, setSingleLead] = useState<SingleLead>(emptyLead)
  const [bulkLeads, setBulkLeads]   = useState<SingleLead[]>([{ ...emptyLead }, { ...emptyLead }])
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [errors, setErrors]       = useState<string[]>([])
  const [dragOver, setDragOver]   = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; count: number } | null>(null)
  const [uploadError, setUploadError]   = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const isManualCity = singleLead.city === '__manual__'

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

 const handleSubmit = async () => {
  const errs = mode === 'single' ? validateSingle() : validateBulk()
  if (errs.length > 0) { setErrors(errs); return }
  setErrors([])
  setLoading(true)

  try {
    const companyId = await getCompanyId()

    if (mode === 'single') {
      // ── Duplicate check ──
      const { data: existing } = await supabase
        .from('leads')
        .select('id, lead_name')
        .eq('phone', singleLead.phone.trim())
        .eq('company_id', companyId)
        .maybeSingle()

      if (existing) {
        setErrors([`⚠ Phone ${singleLead.phone} already exists — "${existing.lead_name}" గా registered ఉంది. Duplicate add చేయలేరు.`])
        setLoading(false)
        return
      }

      const row = toRow(singleLead, companyId, industry)
      const { error } = await supabase.from('leads').insert(row)
      if (error) {
        if (error.code === '23505') {
          setErrors(['⚠ ఈ phone number already registered ఉంది'])
        } else {
          setErrors([`Save failed: ${error.message}`])
        }
        setLoading(false)
        return
      }

    } else {
      const validLeads = bulkLeads.filter(l => l.name.trim())
      if (validLeads.length === 0) {
        setErrors(['At least one lead with name required'])
        setLoading(false)
        return
      }

      // ── Bulk: same batch duplicates check ──
      const phonesInBatch = validLeads.map(l => l.phone.trim()).filter(Boolean)
      const uniqueInBatch = new Set(phonesInBatch)
      if (uniqueInBatch.size !== phonesInBatch.length) {
        const seen = new Set<string>()
        const dups = phonesInBatch.filter(p => { if (seen.has(p)) return true; seen.add(p); return false })
        setErrors([`⚠ Batch లో duplicate phones: ${[...new Set(dups)].join(', ')}`])
        setLoading(false)
        return
      }

      // ── Bulk: DB duplicate check ──
      const { data: existingInDB } = await supabase
        .from('leads')
        .select('phone, lead_name')
        .eq('company_id', companyId)
        .in('phone', phonesInBatch)

      if (existingInDB && existingInDB.length > 0) {
        const dupList = existingInDB
          .map((e: { phone: string; lead_name: string }) => `${e.phone} (${e.lead_name})`)
          .join(', ')
        setErrors([`⚠ Already exists: ${dupList}`])
        setLoading(false)
        return
      }

      const rows = validLeads.map(l => toRow(l, companyId, industry))
      const { error } = await supabase.from('leads').insert(rows)
      if (error) {
        if (error.code === '23505') {
          setErrors(['⚠ One or more phone numbers already registered ఉన్నాయి'])
        } else {
          setErrors([`Save failed: ${error.message}`])
        }
        setLoading(false)
        return
      }
    }

    const leadsToReturn = mode === 'single'
      ? [singleLead]
      : bulkLeads.filter(l => l.name.trim())

    onLeadsAdded?.(leadsToReturn)
    setSuccess(true)

    setTimeout(() => {
      setSuccess(false)
      setSingleLead(emptyLead)
      setBulkLeads([{ ...emptyLead }, { ...emptyLead }])
      setUploadedFile(null)
      onClose()
    }, 1200)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    setErrors([`Error: ${msg}`])
  } finally {
    setLoading(false)
  }
}

  const addBulkRow    = () => setBulkLeads([...bulkLeads, { ...emptyLead }])
  const removeBulkRow = (i: number) => { if (bulkLeads.length > 1) setBulkLeads(bulkLeads.filter((_, idx) => idx !== i)) }
  const updateBulkLead = (i: number, field: keyof SingleLead, value: string) => {
    const updated = [...bulkLeads]; updated[i] = { ...updated[i], [field]: value }; setBulkLeads(updated)
  }

  const processFile = (file: File) => {
    setUploadError(''); setUploadedFile(null)
    const isCSV  = file.name.endsWith('.csv')
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (!isCSV && !isXLSX) { setUploadError('Only .csv, .xlsx, or .xls files supported.'); return }

    if (isXLSX) {
      const reader = new FileReader()
      reader.onload = (e) => {
        import('xlsx').then(XLSX => {
          const wb  = XLSX.read(e.target?.result, { type: 'array' })
          const ws  = wb.Sheets[wb.SheetNames[0]]
          const csv = XLSX.utils.sheet_to_csv(ws)
          const leads = parseCSV(csv)
          if (!leads.length) { setUploadError('File లో valid data లేదు.'); return }
          setBulkLeads(leads); setUploadedFile({ name: file.name, count: leads.length })
        }).catch(() => setUploadError('xlsx package install చేయండి: npm i xlsx'))
      }
      reader.readAsArrayBuffer(file); return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const leads = parseCSV(e.target?.result as string)
      if (!leads.length) { setUploadError('File లో valid data లేదు.'); return }
      setBulkLeads(leads); setUploadedFile({ name: file.name, count: leads.length })
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f) }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }

  const downloadSample = () => {
    const csv = [
      'name,phone,source,budget,property_type,city,Requirement',
      'Rajesh Kumar,9876543210,Instagram,₹5-8L,2 BHK Apartment,Hyderabad,Living Room,',
      'Priya Sharma,9123456789,Referral,₹10-15L,Villa / Independent House,Vijayawada,Full Interior',
    ].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'leads_sample.csv',
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const inp  = "w-full bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-3 py-2 text-sm text-[#1C1712] placeholder:text-[#B8B0A0] outline-none focus:border-[#B8860B] transition-colors"
  const lbl  = "text-[10px] font-semibold text-[#7A6E60] uppercase tracking-wide block mb-1"
  const sel  = "w-full bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-3 py-2 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors appearance-none"
  const bInp = "w-full bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1712] outline-none focus:border-[#B8860B]"
  const activeLead = bulkLeads.filter(l => l.name.trim()).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[#FDFAF4] rounded-2xl border border-[#E2D9C8] w-full shadow-2xl flex flex-col"
        style={{ maxWidth: mode === 'bulk' ? '960px' : '520px', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2D9C8] flex-shrink-0">
          <div>
            <h2 className="font-serif text-xl text-[#1C1712]">Add Leads</h2>
            <p className="text-xs text-[#7A6E60] mt-0.5">Data directly Supabase లో save అవుతుంది</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-[#E2D9C8] flex items-center justify-center text-[#7A6E60] hover:bg-[#F0EBE0]">
            <X size={15} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-5 pt-4 flex-shrink-0">
          <div className="flex gap-2 p-1 bg-[#F5F0E8] rounded-xl w-fit">
            {(['single', 'bulk'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors([]) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-[#1C1712] text-white' : 'text-[#7A6E60] hover:text-[#1C1712]'}`}>
                {m === 'single' ? <User size={14} /> : <Users size={14} />}
                {m === 'single' ? 'Single Lead' : 'Bulk Leads'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* SINGLE */}
          {mode === 'single' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Full Name *</label>
                  <input type="text" placeholder="Rajesh Kumar" value={singleLead.name} onChange={e => setSingleLead({ ...singleLead, name: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Phone *</label>
                  <input type="tel" placeholder="+91 98765 43210" value={singleLead.phone} onChange={e => setSingleLead({ ...singleLead, phone: e.target.value })} className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Lead Source *</label>
                  <div className="relative">
                    <select value={singleLead.source} onChange={e => setSingleLead({ ...singleLead, source: e.target.value })} className={sel}>
                      <option value="">Source select చేయండి</option>
                      {sources.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E60] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Budget</label>
                  <input type="text" placeholder="₹5–8L" value={singleLead.budget} onChange={e => setSingleLead({ ...singleLead, budget: e.target.value })} className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Property Type</label>
                  <div className="relative">
                    <select value={singleLead.propertyType} onChange={e => setSingleLead({ ...singleLead, propertyType: e.target.value })} className={sel}>
                      <option value="">Type select చేయండి</option>
                      {propertyTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E60] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Location / City</label>
                  <div className="relative">
                    <select value={singleLead.city} onChange={e => setSingleLead({ ...singleLead, city: e.target.value, manualCity: '' })} className={sel}>
                      <option value="">City select చేయండి</option>
                      <optgroup label="Telangana (TS)">{tsCities.map(c => <option key={c}>{c}</option>)}</optgroup>
                      <optgroup label="Andhra Pradesh (AP)">{apCities.map(c => <option key={c}>{c}</option>)}</optgroup>
                      <option value="__manual__">+ Manual గా type చేయండి</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E60] pointer-events-none" />
                  </div>
                  {isManualCity && (
                    <input type="text" placeholder="City పేరు type చేయండి..." value={singleLead.manualCity}
                      onChange={e => setSingleLead({ ...singleLead, manualCity: e.target.value })} className={`${inp} mt-2`} autoFocus />
                  )}
                </div>
              </div>

              <div>
                <label className={lbl}>Requirement</label>
                <input type="text" placeholder="Living Room Makeover, Full Interior..." value={singleLead.interest} onChange={e => setSingleLead({ ...singleLead, interest: e.target.value })} className={inp} />
              </div>

              

              <div>
                <label className={lbl}>Notes</label>
                <textarea placeholder="Any additional notes..." value={singleLead.notes} onChange={e => setSingleLead({ ...singleLead, notes: e.target.value })} rows={3} className={`${inp} resize-none`} />
              </div>
            </div>
          )}

          {/* BULK */}
          {mode === 'bulk' && (
            <div>
              <div className="flex gap-1 mb-4 p-1 bg-[#F5F0E8] rounded-xl w-fit">
                {(['manual', 'upload'] as const).map(t => (
                  <button key={t} onClick={() => setBulkTab(t)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${bulkTab === t ? 'bg-[#1C1712] text-white' : 'text-[#7A6E60] hover:text-[#1C1712]'}`}>
                    {t === 'manual' ? <Plus size={12} /> : <Upload size={12} />}
                    {t === 'manual' ? 'Manual Entry' : 'Upload CSV / Excel'}
                  </button>
                ))}
              </div>

              {bulkTab === 'upload' && (
                <div>
                  <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${dragOver ? 'border-[#B8860B] bg-amber-50' : 'border-[#E2D9C8] hover:border-[#B8860B]'}`}>
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
                    <FileSpreadsheet size={36} className="text-[#B8860B] mb-3" />
                    <p className="text-sm font-semibold text-[#1C1712]">CSV లేదా Excel file drag చేయండి</p>
                    <p className="text-xs text-[#7A6E60] mt-1">లేదా click చేసి file select చేయండి</p>
                    <p className="text-[10px] text-[#B8B0A0] mt-3">Supports: .csv, .xlsx, .xls</p>
                  </div>
                  {uploadError && (
                    <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-600">{uploadError}</p>
                    </div>
                  )}
                  {uploadedFile && (
                    <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-emerald-700">{uploadedFile.name}</p>
                        <p className="text-[10px] text-emerald-600">{uploadedFile.count} leads loaded</p>
                      </div>
                      <button onClick={() => { setUploadedFile(null); setBulkLeads([{ ...emptyLead }, { ...emptyLead }]) }} className="text-[10px] text-red-500 hover:underline">Remove</button>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between bg-[#F5F0E8] rounded-xl p-3">
                    <div>
                      <p className="text-xs font-semibold text-[#1C1712]">Sample file కావాలా?</p>
                      <p className="text-[10px] text-[#7A6E60]">Correct format తో sample CSV</p>
                    </div>
                    <button onClick={downloadSample} className="text-xs font-semibold text-[#B8860B] hover:underline flex items-center gap-1">
                      <Upload size={11} className="rotate-180" /> Download Sample
                    </button>
                  </div>
                  <div className="mt-3 bg-[#F5F0E8] rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-[#7A6E60] uppercase tracking-wide mb-2">Expected column headers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['name', 'phone', 'source', 'budget', 'property_type', 'city', 'interest', 'status', 'notes'].map(h => (
                        <span key={h} className="bg-[#E2D9C8] text-[#1C1712] text-[10px] font-mono px-2 py-0.5 rounded">{h}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(bulkTab === 'manual' || uploadedFile) && (
                <div className={bulkTab === 'upload' ? 'mt-4' : ''}>
                  {bulkTab === 'manual' && (
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-[#7A6E60]">{bulkLeads.length} leads ready</p>
                      <button onClick={addBulkRow} className="flex items-center gap-1.5 bg-[#1C1712] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#2d2822]">
                        <Plus size={12} /> Add Row
                      </button>
                    </div>
                  )}
                  {bulkTab === 'upload' && uploadedFile && (
                    <p className="text-xs text-[#7A6E60] mb-2 font-semibold">Preview — edit చేయవచ్చు</p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: '820px' }}>
                      <thead>
                        <tr className="border-b border-[#E2D9C8]">
                          {['#', 'Name *', 'Phone *', 'Source', 'Budget', 'Property Type', 'City', 'Status', ''].map((h, i) => (
                            <th key={i} className="text-left text-[10px] font-semibold text-[#7A6E60] uppercase tracking-wide pb-2 pr-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkLeads.map((lead, i) => (
                          <tr key={i} className="border-b border-[#F0EBE0] last:border-0">
                            <td className="py-2 pr-2 text-xs text-[#7A6E60] font-semibold">{i + 1}</td>
                            <td className="py-2 pr-2"><input type="text" placeholder="Full name" value={lead.name} onChange={e => updateBulkLead(i, 'name', e.target.value)} className={bInp} /></td>
                            <td className="py-2 pr-2"><input type="tel" placeholder="Phone" value={lead.phone} onChange={e => updateBulkLead(i, 'phone', e.target.value)} className={bInp} /></td>
                            <td className="py-2 pr-2">
                              <select value={lead.source} onChange={e => updateBulkLead(i, 'source', e.target.value)} className={bInp}>
                                <option value="">Source</option>
                                {sources.map(s => <option key={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="py-2 pr-2"><input type="text" placeholder="₹5–8L" value={lead.budget} onChange={e => updateBulkLead(i, 'budget', e.target.value)} className={bInp} /></td>
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
                            <td className="py-2">
                              <button onClick={() => removeBulkRow(i)} disabled={bulkLeads.length <= 1} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 disabled:opacity-30">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkTab === 'manual' && (
                    <button onClick={addBulkRow} className="mt-3 flex items-center gap-2 w-full py-2.5 border-2 border-dashed border-[#E2D9C8] rounded-xl text-sm text-[#7A6E60] hover:border-[#B8860B] hover:text-[#B8860B] transition-colors justify-center">
                      <Plus size={14} /> Add Another Row
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle size={12} /> {err}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-[#E2D9C8] flex-shrink-0">
          <button onClick={onClose} className="flex-1 border border-[#E2D9C8] text-[#1C1712] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F0EBE0] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || success}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-70 ${success ? 'bg-emerald-600 text-white' : 'bg-[#1C1712] text-white hover:bg-[#2d2822]'}`}>
            {loading
              ? 'Saving to Supabase...'
              : success
              ? `✓ ${mode === 'bulk' ? `${activeLead} Leads` : 'Lead'} Saved!`
              : mode === 'bulk' ? `Add ${activeLead} Leads` : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}