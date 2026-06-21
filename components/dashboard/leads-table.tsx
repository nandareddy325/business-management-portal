'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Phone, Search, ChevronDown } from 'lucide-react'
import CallLogModal from './CallLogModal'

const STAGE_COLORS: Record<string, string> = {
  new: '#6B7280',
  contacted: '#3B82F6',
  qualified: '#F59E0B',
  proposal: '#8B5CF6',
  negotiation: '#EC4899',
  interested: '#10B981',
  rnr: '#EF4444',
  lost: '#DC2626',
  confirmed: '#059669',
}

const OUTCOME_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  rnr: { label: 'RNR', color: '#EF4444', bg: '#FEE2E2' },
  not_interested: { label: 'Not Interested', color: '#6B7280', bg: '#F3F4F6' },
  callback_tomorrow: { label: 'CB Tomorrow', color: '#F59E0B', bg: '#FEF3C7' },
  callback_2weeks: { label: 'CB 2 Weeks', color: '#3B82F6', bg: '#DBEAFE' },
  callback_3months: { label: 'CB 3 Months', color: '#8B5CF6', bg: '#EDE9FE' },
  interested: { label: 'Interested ✅', color: '#10B981', bg: '#D1FAE5' },
}

export default function LeadsTable() {
  const supabase = createClientSupabaseClient()
  const [leads, setLeads] = useState<any[]>([])
  const [lastCallMap, setLastCallMap] = useState<Record<string, any>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [callModalLead, setCallModalLead] = useState<any>(null)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    await fetchLeads()
  }

  async function fetchLeads() {
    setLoading(true)

    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: activitiesData } = await supabase
      .from('lead_activities')
      .select('lead_id, outcome, created_at, scheduled_date')
      .eq('type', 'call')
      .order('created_at', { ascending: false })

    const callMap: Record<string, any> = {}
    activitiesData?.forEach(a => {
      if (!callMap[a.lead_id]) callMap[a.lead_id] = a
    })

    setLeads(leadsData || [])
    setLastCallMap(callMap)
    setLoading(false)
  }

  const filtered = leads.filter(l => {
    const matchSearch = search === '' ||
      l.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search) ||
      l.city?.toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === 'all' || l.pipeline_stage === stageFilter
    return matchSearch && matchStage
  })

  const stages = ['all', ...Array.from(new Set(leads.map(l => l.pipeline_stage || 'new').filter(Boolean)))]

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#F5F0E8' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1C1712' }}>Leads</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B4F2A' }}>
            {leads.length} total leads
          </p>
        </div>
        <a
          href="/crm/cre-dashboard"
          className="px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2"
          style={{ background: '#1C1712' }}
        >
          📊 CRE Dashboard
        </a>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none bg-white"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>
        <div className="relative">
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border rounded-xl text-sm bg-white focus:outline-none capitalize"
            style={{ borderColor: '#E5E7EB' }}
          >
            {stages.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Stages' : s}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1C1712' }}>
                  {['Lead Name', 'Phone', 'City', 'Source', 'Stage', 'Last Call', 'Next Call', 'Action'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: '#B8860B' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const lastCall = lastCallMap[lead.id]
                  const outcomeBadge = lastCall ? OUTCOME_BADGE[lastCall.outcome] : null
                  const stageColor = STAGE_COLORS[lead.pipeline_stage || 'new'] || '#6B7280'

                  return (
                    <tr
                      key={lead.id}
                      className="border-t border-amber-50 hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium" style={{ color: '#1C1712' }}>{lead.lead_name || '—'}</p>
                        <p className="text-xs text-gray-400">{lead.email || ''}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{lead.phone || '—'}</td>
                      <td className="py-3 px-4 capitalize text-gray-600">{lead.city || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
                          {lead.source || 'unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                          style={{ background: stageColor + '20', color: stageColor }}
                        >
                          {lead.pipeline_stage || 'new'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {outcomeBadge ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: outcomeBadge.bg, color: outcomeBadge.color }}
                          >
                            {outcomeBadge.label}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">No calls</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {lastCall?.scheduled_date
                          ? new Date(lastCall.scheduled_date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short'
                            })
                          : '—'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setCallModalLead(lead)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80"
                          style={{ background: '#B8860B' }}
                        >
                          <Phone size={12} />
                          Log Call
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      No leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Call Log Modal */}
      {callModalLead && currentUser && (
        <CallLogModal
          lead={callModalLead}
          userId={currentUser.id}
          onClose={() => setCallModalLead(null)}
          onSuccess={() => {
            setCallModalLead(null)
            fetchLeads()
          }}
        />
      )}
    </div>
  )
}