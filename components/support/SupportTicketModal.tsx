'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface SupportTicketModalProps {
  onClose: () => void
}

export function SupportTicketModal({ onClose }: SupportTicketModalProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [form, setForm] = useState({ subject: '', description: '', category: 'other', priority: 'medium' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      setMessage({ type: 'error', text: 'Subject and description are required' })
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage({ type: 'error', text: 'Session expired, please log in again' })
        setSubmitting(false)
        return
      }

      // Fetch company_id directly from employees table using the auth user_id
      const { data: employeeRow, error: empErr } = await supabase
        .from('employees')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      if (empErr || !employeeRow?.company_id) {
        setMessage({ type: 'error', text: 'Could not find company details' })
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/admin/support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: employeeRow.company_id, ...form }),
      })
      const json = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: json.error || 'Failed to create ticket' })
      } else {
        setMessage({ type: 'success', text: `Ticket ${json.ticket.ticket_number} submitted!` })
        setTimeout(() => onClose(), 1500)
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      setMessage({ type: 'error', text: 'Failed to create ticket' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1C1712]">Contact Support</h2>
          <button onClick={onClose} className="text-black/40 hover:text-black/70">
            <X size={18} />
          </button>
        </div>

        {message && (
          <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-black/60 uppercase">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/3 border border-black/8 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="Short summary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-black/60 uppercase">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/3 border border-black/8 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="Issue details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-black/60 uppercase">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-black/3 border border-black/8 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="other">Other</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-black/60 uppercase">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-black/3 border border-black/8 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </div>
  )
}