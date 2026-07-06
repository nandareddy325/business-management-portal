'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const DELETE_OPTIONS = [
  { value: null,  label: 'Disabled',     desc: 'Lost leads will never be auto-deleted', icon: '🔒', color: '#9A8F82' },
  { value: 30,   label: 'After 30 days', desc: 'Delete lost leads older than 30 days',  icon: '📅', color: '#D97706' },
  { value: 60,   label: 'After 60 days', desc: 'Delete lost leads older than 60 days',  icon: '📆', color: '#0891B2' },
  { value: 90,   label: 'After 90 days', desc: 'Delete lost leads older than 90 days',  icon: '🗓️', color: '#7C3AED' },
]

export default function CompanySettingsPage() {
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [companyId, setCompanyId]   = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [autoDeleteDays, setAutoDeleteDays] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles').select('company_id').eq('id', user.id).single()
        if (!profile?.company_id) return
        setCompanyId(profile.company_id)

        const { data: company } = await supabase
          .from('companies')
          .select('name, auto_delete_lost_days')
          .eq('id', profile.company_id)
          .single()

        if (company) {
          setCompanyName(company.name || '')
          setAutoDeleteDays(company.auto_delete_lost_days ?? null)
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!companyId) return
    setSaving(true)
    try {
      await supabase
        .from('companies')
        .update({ auto_delete_lost_days: autoDeleteDays })
        .eq('id', companyId)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const selectedOption = DELETE_OPTIONS.find(o => o.value === autoDeleteDays) ?? DELETE_OPTIONS[0]

  return (
    <main className="flex-1 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[4px] mb-1">Settings</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Company Settings</h1>
          <p className="text-sm text-[#9A8F82] mt-1">{companyName}</p>
        </div>

        {/* Auto Delete Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

          {/* Card Header */}
          <div className="px-5 py-4 border-b border-[#F0EBE0]"
            style={{ background: 'linear-gradient(135deg,#FEF2F2,#fff8f8)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>🗑️</div>
              <div>
                <p className="text-sm font-black text-[#1C1712]">Auto-Delete Lost Leads</p>
                <p className="text-[11px] text-[#9A8F82] mt-0.5">
                  Automatically remove lost leads after a set number of days
                </p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="p-5 space-y-3">
            {DELETE_OPTIONS.map(opt => {
              const isSelected = opt.value === autoDeleteDays
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => setAutoDeleteDays(opt.value)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? `${opt.color}10` : '#F5F0E8',
                    border: `2px solid ${isSelected ? opt.color : 'transparent'}`,
                    boxShadow: isSelected ? `0 4px 14px ${opt.color}20` : 'none',
                  }}
                >
                  {/* Radio circle */}
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: isSelected ? opt.color : '#C4BAB0' }}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: opt.color }}/>
                    )}
                  </div>

                  {/* Icon */}
                  <span className="text-lg flex-shrink-0">{opt.icon}</span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: isSelected ? opt.color : '#1C1712' }}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#9A8F82' }}>
                      {opt.desc}
                    </p>
                  </div>

                  {/* Active badge */}
                  {isSelected && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0"
                      style={{ background: opt.color }}>
                      ACTIVE
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Warning when enabled */}
          {autoDeleteDays !== null && (
            <div className="mx-5 mb-4 px-4 py-3 rounded-xl flex items-start gap-3"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <span className="text-base mt-0.5 flex-shrink-0">⚠️</span>
              <p className="text-[11px] leading-relaxed" style={{ color: '#92400E' }}>
                Lost leads older than <strong>{autoDeleteDays} days</strong> will be permanently deleted every night at 7:30 AM IST.
                This action <strong>cannot be undone</strong>. Only this company's leads are affected.
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="px-5 pb-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-50 transition-all"
              style={{
                background: saved
                  ? 'linear-gradient(135deg,#059669,#047857)'
                  : 'linear-gradient(135deg,#B8860B,#D97706)',
                boxShadow: saved
                  ? '0 6px 18px rgba(5,150,105,0.3)'
                  : '0 6px 18px rgba(184,134,11,0.3)',
              }}
            >
              {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Settings'}
            </button>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-[#9A8F82] uppercase tracking-[2px] mb-3">ℹ️ How it works</p>
          <div className="space-y-2.5">
            {[
              { icon: '🌙', text: 'Cron job runs every night at 7:30 AM IST' },
              { icon: '🎯', text: 'Only deletes leads with pipeline_stage = "lost"' },
              { icon: '🏢', text: 'Each company has its own setting — other companies are not affected' },
              { icon: '🔒', text: 'Set to Disabled to never auto-delete any leads' },
              { icon: '♻️', text: 'Lost leads can be re-engaged before they are deleted' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-sm flex-shrink-0">{item.icon}</span>
                <p className="text-[11px] text-[#6B5E4E]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}