'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [company, setCompany] = useState({
    name: '',
    industry: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
  })

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles').select('company_id').eq('id', user.id).single()
        if (!profile?.company_id) return
        const { data: comp } = await supabase
          .from('companies').select('*').eq('id', profile.company_id).single()
        if (comp) setCompany({
          name: comp.name || '',
          industry: comp.industry || '',
          phone: comp.phone || '',
          email: comp.email || '',
          website: comp.website || '',
          address: comp.address || '',
          city: comp.city || '',
          state: comp.state || '',
          pincode: comp.pincode || '',
          gstin: comp.gstin || '',
        })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) return
      await supabase.from('companies').update({
        name: company.name,
        industry: company.industry,
        phone: company.phone,
        email: company.email,
        website: company.website,
        address: company.address,
        city: company.city,
        state: company.state,
        pincode: company.pincode,
        gstin: company.gstin,
      }).eq('id', profile.company_id)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const fields = [
    { key: 'name',     label: 'Company Name',  placeholder: 'GK Interiors',        type: 'text',  required: true },
    { key: 'industry', label: 'Industry',       placeholder: 'interior-design',     type: 'text' },
    { key: 'phone',    label: 'Phone',          placeholder: '+91 98765 43210',     type: 'tel' },
    { key: 'email',    label: 'Email',          placeholder: 'info@company.com',    type: 'email' },
    { key: 'website',  label: 'Website',        placeholder: 'www.company.com',     type: 'text' },
    { key: 'gstin',    label: 'GSTIN',          placeholder: '29ABCDE1234F1Z5',     type: 'text' },
    { key: 'address',  label: 'Address',        placeholder: '123, Main Street',    type: 'text' },
    { key: 'city',     label: 'City',           placeholder: 'Hyderabad',           type: 'text' },
    { key: 'state',    label: 'State',          placeholder: 'Telangana',           type: 'text' },
    { key: 'pincode',  label: 'Pincode',        placeholder: '500001',              type: 'text' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="flex-1 p-4 md:p-6 max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest mb-1">Settings</p>
        <h1 className="text-2xl font-bold text-[#1C1712]">Company Profile</h1>
        <p className="text-sm text-[#9A8F82] mt-1">Update your company information and business details.</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden">

        {/* Section — Basic Info */}
        <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: '#FDFAF8' }}>
          <p className="text-xs font-black text-[#9A8F82] uppercase tracking-widest">Basic Information</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.slice(0, 6).map(f => (
            <div key={f.key} className={f.key === 'name' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-[#7A6E60] uppercase tracking-wider mb-1.5">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              <input
                type={f.type}
                value={(company as any)[f.key]}
                onChange={e => setCompany(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#1C1712] outline-none transition-all bg-[#F7F5F1]"
                onFocus={e => e.target.style.borderColor = '#B8860B'}
                onBlur={e => e.target.style.borderColor = '#E8E2D8'}
              />
            </div>
          ))}
        </div>

        {/* Section — Address */}
        <div className="px-6 py-4 border-t border-b border-[#F0EBE0]" style={{ background: '#FDFAF8' }}>
          <p className="text-xs font-black text-[#9A8F82] uppercase tracking-widest">Address Details</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.slice(6).map(f => (
            <div key={f.key} className={f.key === 'address' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-[#7A6E60] uppercase tracking-wider mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={(company as any)[f.key]}
                onChange={e => setCompany(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#1C1712] outline-none transition-all bg-[#F7F5F1]"
                onFocus={e => e.target.style.borderColor = '#B8860B'}
                onBlur={e => e.target.style.borderColor = '#E8E2D8'}
              />
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FDFAF8' }}>
          {saved && (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              ✅ Changes saved successfully!
            </p>
          )}
          {!saved && <div />}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1C1712, #2d2822)', boxShadow: '0 4px 14px rgba(28,23,18,0.2)' }}>
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100" style={{ background: '#FEF2F2' }}>
          <p className="text-xs font-black text-red-400 uppercase tracking-widest">Danger Zone</p>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#1C1712]">Delete Company Account</p>
            <p className="text-xs text-[#9A8F82] mt-0.5">Permanently delete all data. This cannot be undone.</p>
          </div>
          <button className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
            Delete Account
          </button>
        </div>
      </div>

    </main>
  )
}