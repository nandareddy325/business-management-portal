'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, X } from 'lucide-react'
import { TicketsTable, TicketStats } from '@/components/super-admin/support'

interface Company {
  id: string
  name: string
}

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  category: string | null
  priority: string
  status: string
  message_count: number
  created_at: string
}

export default function SupportPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState({ total_open: 0, total_in_progress: 0, total_resolved: 0, avg_response_hours: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({ subject: '', description: '', category: 'other', priority: 'medium' })

  const fetchData = useCallback(async (companyId: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (companyId) params.set('company_id', companyId)
      const res = await fetch(`/api/admin/support/list?${params}`)
      const json = await res.json()
      setCompanies(json.companies || [])
      setTickets(json.tickets || [])
      if (json.stats) setStats(json.stats)
    } catch (error) {
      console.error('Error fetching support data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount-driven sync
    fetchData(selectedCompany)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only on selected company change
  }, [selectedCompany])

  const handleCreate = async () => {
    if (!selectedCompany) {
      setMessage({ type: 'error', text: 'ముందు company select చేయి' })
      return
    }
    if (!form.subject.trim() || !form.description.trim()) {
      setMessage({ type: 'error', text: 'Subject మరియు description అవసరం' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: selectedCompany, ...form }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: json.error || 'Ticket create అవ్వలేదు' })
      } else {
        setMessage({ type: 'success', text: `Ticket ${json.ticket.ticket_number} created` })
        setShowModal(false)
        setForm({ subject: '', description: '', category: 'other', priority: 'medium' })
        fetchData(selectedCompany)
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      setMessage({ type: 'error', text: 'Ticket create అవ్వలేదు' })
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/support/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, status }),
      })
      if (res.ok) {
        fetchData(selectedCompany)
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-[#1C1712]">Support Tickets</h1>

          <div className="flex items-center gap-3">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-black/10 text-xs font-semibold text-black/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-w-[180px]"
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => fetchData(selectedCompany)}
              disabled={loading}
              className="p-2 rounded-lg bg-black/5 hover:bg-black/10 text-black/50 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => setShowModal(true)}
              disabled={!selectedCompany}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Plus size={14} /> New Ticket
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {message && (
          <div className={`px-4 py-3 rounded-lg text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {!selectedCompany ? (
          <div className="bg-white ring-1 ring-black/8 rounded-2xl p-10 text-center text-sm text-black/50">
            Support tickets చూడాలంటే పైన company select చేయి.
          </div>
        ) : (
          <>
            <TicketStats
              open={stats.total_open}
              inProgress={stats.total_in_progress}
              resolved={stats.total_resolved}
              avgResponseTime={stats.avg_response_hours}
            />
            <TicketsTable tickets={tickets} loading={loading} onStatusChange={handleStatusChange} />
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1C1712]">New Support Ticket</h2>
              <button onClick={() => setShowModal(false)} className="text-black/40 hover:text-black/70">
                <X size={18} />
              </button>
            </div>

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
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
