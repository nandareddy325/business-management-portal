'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Building2, Phone, Mail, Globe, MapPin, FileText, Save } from 'lucide-react'

export default function CompanySettingsPage() {
  const supabase = createClientSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [company, setCompany] = useState({
    name: '', phone: '', email: '',
    website: '', address: '', city: '', state: '', pincode: '', gstin: '',
  })

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        if (!profile?.company_id) return
        const { data: comp } = await supabase.from('companies').select('*').eq('id', profile.company_id).single()
        if (comp) setCompany({
          name: comp.name || '', phone: comp.phone || '',
          email: comp.email || '', website: comp.website || '',
          address: comp.address || '', city: comp.city || '',
          state: comp.state || '', pincode: comp.pincode || '',
          gstin: comp.gstin || '',
        })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchCompany()
  }, [])

  const handleSave = async () => {
    setSaving(true); setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) return
      await supabase.from('companies').update(company).eq('id', profile.company_id)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor:'#B8860B', borderTopColor:'transparent' }} />
    </div>
  )

  const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm text-[#1C1712] outline-none transition-all focus:border-[#B8860B]"
  const inputSty = { borderColor:'#E8E2D8', background:'#FAFAF8' }
  const cardSty  = { background:'#fff', border:'1px solid #E2D9C8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }
  const headSty  = { background:'#1C1712' }

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-2xl">

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color:'#B8860B' }}>Settings</p>
        <h1 className="text-xl font-black text-[#1C1712]">Company Setup</h1>
        <p className="text-sm text-[#7A6E60] mt-0.5">Update your company information and business details</p>
      </div>

      {/* Basic Info */}
      <div className="rounded-2xl overflow-hidden" style={cardSty}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EBE0]" style={headSty}>
          <Building2 size={16} color="#B8860B" />
          <p className="text-sm font-bold text-white">Basic Information</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black text-[#7A6E60] uppercase tracking-wider mb-1.5">
              Company Name <span className="text-red-400">*</span>
            </label>
            <input type="text" value={company.name}
              onChange={e => setCompany(p => ({ ...p, name: e.target.value }))}
              placeholder="GK Interiors" className={inputCls} style={inputSty} />
          </div>
          {[
            { key:'phone',   label:'Phone',   placeholder:'+91 98765 43210', type:'tel',   icon:Phone },
            { key:'email',   label:'Email',   placeholder:'info@company.com', type:'email', icon:Mail },
            { key:'website', label:'Website', placeholder:'www.company.com',  type:'text',  icon:Globe },
            { key:'gstin',   label:'GSTIN',   placeholder:'29ABCDE1234F1Z5',  type:'text',  icon:FileText },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[10px] font-black text-[#7A6E60] uppercase tracking-wider mb-1.5">{f.label}</label>
              <div className="relative">
                <f.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8F82]" />
                <input type={f.type} value={(company as any)[f.key]}
                  onChange={e => setCompany(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={inputCls + ' pl-9'} style={inputSty} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Address */}
      <div className="rounded-2xl overflow-hidden" style={cardSty}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EBE0]" style={headSty}>
          <MapPin size={16} color="#B8860B" />
          <p className="text-sm font-bold text-white">Address Details</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black text-[#7A6E60] uppercase tracking-wider mb-1.5">Address</label>
            <input type="text" value={company.address}
              onChange={e => setCompany(p => ({ ...p, address: e.target.value }))}
              placeholder="123, Main Street" className={inputCls} style={inputSty} />
          </div>
          {[
            { key:'city',    label:'City',    placeholder:'Hyderabad' },
            { key:'state',   label:'State',   placeholder:'Telangana' },
            { key:'pincode', label:'Pincode', placeholder:'500001' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[10px] font-black text-[#7A6E60] uppercase tracking-wider mb-1.5">{f.label}</label>
              <input type="text" value={(company as any)[f.key]}
                onChange={e => setCompany(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} className={inputCls} style={inputSty} />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between rounded-2xl px-5 py-4" style={cardSty}>
        {saved
          ? <p className="text-sm font-bold text-emerald-600">✅ Saved successfully!</p>
          : <div />
        }
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50"
          style={{ background:'#1C1712' }}>
          <Save size={14} color="#B8860B" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl overflow-hidden" style={{ background:'#fff', border:'1px solid #FECACA' }}>
        <div className="px-5 py-4 border-b border-red-100" style={{ background:'#FEF2F2' }}>
          <p className="text-xs font-black text-red-500 uppercase tracking-widest">⚠️ Danger Zone</p>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#1C1712]">Delete Company Account</p>
            <p className="text-xs text-[#9A8F82] mt-0.5">Permanently delete all data. This cannot be undone.</p>
          </div>
          <button className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
            Delete Account
          </button>
        </div>
      </div>

    </div>
  )
}