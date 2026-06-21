'use client'

import { useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { X, Phone, Calendar } from 'lucide-react'

interface CallLogModalProps {
  lead: { id: string; lead_name: string; phone: string }
  userId: string
  onClose: () => void
  onSuccess: () => void
}

const OUTCOMES = [
  { value: 'rnr', label: 'RNR (No Answer)', color: '#EF4444', nextDays: 1 },
  { value: 'not_interested', label: 'Not Interested', color: '#6B7280', nextDays: null },
  { value: 'callback_tomorrow', label: 'Call Back Tomorrow', color: '#F59E0B', nextDays: 1 },
  { value: 'callback_2weeks', label: 'Call Back 2 Weeks', color: '#3B82F6', nextDays: 14 },
  { value: 'callback_3months', label: 'Call Back 3 Months', color: '#8B5CF6', nextDays: 90 },
  { value: 'interested', label: 'Interested ✅', color: '#10B981', nextDays: null },
]

export default function CallLogModal({ lead, userId, onClose, onSuccess }: CallLogModalProps) {
  const supabase = createClientSupabaseClient()
  const [selectedOutcome, setSelectedOutcome] = useState('')
  const [notes, setNotes] = useState('')
  const [handoverDate, setHandoverDate] = useState('')
  const [loading, setLoading] = useState(false)

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
      lead_id: lead.id,
      user_id: userId,
      type: 'call',
      outcome: selectedOutcome,
      description: notes || null,
      scheduled_date: nextCallDate,
      title: `Call - ${selected?.label}`,
    })

    if (selectedOutcome === 'interested' && !error) {
      await supabase.from('leads').update({
        pipeline_stage: 'interested',
        notes: handoverDate ? `Handover Date: ${handoverDate}` : undefined,
      }).eq('id', lead.id)
    }

    if (selectedOutcome === 'not_interested' && !error) {
      await supabase.from('leads').update({
        pipeline_stage: 'lost',
        status: 'closed',
      }).eq('id', lead.id)
    }

    setLoading(false)

    if (error) {
      alert('Error saving: ' + error.message)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        <div className="flex items-center justify-between p-5 border-b" style={{ background: '#1C1712' }}>
          <div>
            <div className="flex items-center gap-2">
              <Phone size={18} color="#B8860B" />
              <h2 className="text-white font-semibold text-lg">Log Call</h2>
            </div>
            <p className="text-sm mt-0.5" style={{ color: '#B8860B' }}>
              {lead.lead_name} — {lead.phone}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#1C1712' }}>
              Call Outcome select cheyyandi:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map(outcome => (
                <button
                  key={outcome.value}
                  onClick={() => setSelectedOutcome(outcome.value)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-left border-2 transition-all"
                  style={{
                    borderColor: selectedOutcome === outcome.value ? outcome.color : '#E5E7EB',
                    background: selectedOutcome === outcome.value ? outcome.color + '15' : 'white',
                    color: selectedOutcome === outcome.value ? outcome.color : '#374151',
                  }}
                >
                  {outcome.label}
                </button>
              ))}
            </div>
          </div>

          {selected?.nextDays && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: '#FEF3C7' }}>
              <Calendar size={16} color="#92400E" />
              <p className="text-sm" style={{ color: '#92400E' }}>
                Next call auto-scheduled: <strong>
                  {new Date(Date.now() + selected.nextDays * 86400000).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </strong>
              </p>
            </div>
          )}

          {selectedOutcome === 'interested' && (
            <div>
              <label className="text-sm font-semibold block mb-2" style={{ color: '#1C1712' }}>
                🏠 House Handover Date:
              </label>
              <input
                type="date"
                value={handoverDate}
                onChange={e => setHandoverDate(e.target.value)}
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: '#B8860B' }}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: '#1C1712' }}>
              Notes (optional):
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Call lo enti matladaru..."
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border text-sm font-medium"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedOutcome}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
              style={{ background: '#B8860B' }}
            >
              {loading ? 'Saving...' : 'Save Call Log'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}