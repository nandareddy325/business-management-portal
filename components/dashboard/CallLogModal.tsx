'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { X, Phone, Calendar } from 'lucide-react'

interface CallLogModalProps {
  lead: { id: string; lead_name: string; phone: string }
  userId: string
  onClose: () => void
  onSuccess: () => void
}

const OUTCOMES = [
  { value: 'rnr',                label: 'RNR (No Answer)',      color: '#EF4444', nextDays: 1 },
  { value: 'not_interested',     label: 'Not Interested',       color: '#6B7280', nextDays: null },
  { value: 'callback_tomorrow',  label: 'Call Back Tomorrow',   color: '#F59E0B', nextDays: 1 },
  { value: 'callback_2weeks',    label: 'Call Back 2 Weeks',    color: '#3B82F6', nextDays: 14 },
  { value: 'callback_3months',   label: 'Call Back 3 Months',   color: '#8B5CF6', nextDays: 90 },
  { value: 'interested',         label: 'Interested ✅',         color: '#10B981', nextDays: null },
]

export default function CallLogModal({ lead, userId, onClose, onSuccess }: CallLogModalProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [selectedOutcome, setSelectedOutcome] = useState('')
  const [notes, setNotes]           = useState('')
  const [handoverDate, setHandoverDate] = useState('')
  const [loading, setLoading]       = useState(false)

  const selected = OUTCOMES.find(o => o.value === selectedOutcome)

  function getNextCallDate(days: number | null) {
    if (!days) return null
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString()
  }

  async function handleSubmit() {
    if (!selectedOutcome) return alert('Outcome select cheyyandi!')
    if (selectedOutcome === 'interested' && !handoverDate) return alert('Handover date enter cheyyandi!')

    setLoading(true)
    const nextCallDate = selected?.nextDays ? getNextCallDate(selected.nextDays) : null

    const { error } = await supabase.from('lead_activities').insert({
      lead_id: lead.id, user_id: userId, type: 'call',
      outcome: selectedOutcome, description: notes || null,
      scheduled_date: nextCallDate,
      title: `Call - ${selected?.label}`,
      created_at: new Date().toISOString(),
    })

    if (selectedOutcome === 'interested' && !error) {
      await supabase.from('leads').update({
        pipeline_stage: 'followup',
        notes: handoverDate ? `Handover Date: ${handoverDate}` : undefined,
      }).eq('id', lead.id)
    }

    if (selectedOutcome === 'not_interested' && !error) {
      await supabase.from('leads').update({ pipeline_stage: 'lost', status: 'closed' }).eq('id', lead.id)
    }

    if (selectedOutcome === 'rnr' && !error) {
      await supabase.from('leads').update({ pipeline_stage: 'rnr' }).eq('id', lead.id)
    }

    setLoading(false)
    if (error) { alert('Error: ' + error.message) } else { onSuccess(); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ background: '#1C1712' }}>
          <div>
            <div className="flex items-center gap-2">
              <Phone size={18} color="#B8860B" />
              <h2 className="text-white font-bold text-lg">Log Call</h2>
            </div>
            <p className="text-sm mt-0.5 font-mono" style={{ color: '#B8860B' }}>
              {lead.lead_name} — {lead.phone}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Outcome Selection */}
          <div>
            <p className="text-sm font-black mb-3" style={{ color: '#1C1712' }}>Call Outcome *</p>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map(outcome => (
                <button key={outcome.value} onClick={() => setSelectedOutcome(outcome.value)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-left border-2 transition-all"
                  style={{
                    borderColor: selectedOutcome === outcome.value ? outcome.color : '#E8E2D8',
                    background: selectedOutcome === outcome.value ? outcome.color + '15' : '#F7F5F1',
                    color: selectedOutcome === outcome.value ? outcome.color : '#7A6E60',
                  }}>
                  {outcome.label}
                </button>
              ))}
            </div>
          </div>

          {/* Next Call Preview */}
          {selected?.nextDays && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: '#FEF3C7' }}>
              <Calendar size={16} color="#92400E" />
              <p className="text-sm" style={{ color: '#92400E' }}>
                Next call: <strong>
                  {new Date(Date.now() + selected.nextDays * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </strong>
              </p>
            </div>
          )}

          {/* Handover Date */}
          {selectedOutcome === 'interested' && (
            <div>
              <label className="text-sm font-black block mb-2" style={{ color: '#1C1712' }}>🏠 House Handover Date *</label>
              <input type="date" value={handoverDate} onChange={e => setHandoverDate(e.target.value)}
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: '#B8860B', background: '#F7F5F1' }} />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-black block mb-2" style={{ color: '#1C1712' }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Call lo enti matladaru..."
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ borderColor: '#E8E2D8', background: '#F7F5F1' }} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border text-sm font-medium"
              style={{ borderColor: '#E8E2D8', color: '#7A6E60' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading || !selectedOutcome}
              className="flex-1 py-3 rounded-xl text-white text-sm font-black disabled:opacity-50 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 4px 12px rgba(184,134,11,0.35)' }}>
              {loading ? '⏳ Saving...' : '💾 Save Call Log'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}