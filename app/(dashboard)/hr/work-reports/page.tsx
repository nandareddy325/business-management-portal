'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, ChevronDown, Users } from 'lucide-react'

interface WorkReport {
  id: string
  report_date: string
  tasks_completed: string
  tasks_pending: string
  blockers: string
  hours_worked: number
  status: string
  employee_id: string
  employee: { full_name: string; email: string }
}

const avatarColors = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FDF4FF', text: '#7E22CE' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#FFF1F2', text: '#BE123C' },
  { bg: '#ECFEFF', text: '#0E7490' },
]

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

export default function WorkReportsPage() {
  const supabase = createClientSupabaseClient()
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [companyId, setCompanyId] = useState('')
  const [userId, setUserId] = useState('')
  const [reports, setReports] = useState<WorkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [todayReport, setTodayReport] = useState<WorkReport | null>(null)
  const [filterUser, setFilterUser] = useState('all')
  const [uniqueUsers, setUniqueUsers] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    tasks_completed: '',
    tasks_pending: '',
    blockers: '',
    hours_worked: '8',
  })

  const today = new Date().toISOString().split('T')[0]
  const todayDisplay = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  useEffect(() => { init() }, [])

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role, full_name')
        .eq('id', user.id)
        .single()
      if (!profile) return
      const r = ['admin', 'tenant_admin', 'manager'].includes(profile.role) ? 'admin' : 'user'
      setRole(r)
      setCompanyId(profile.company_id)
      await fetchReports(profile.company_id, user.id, r)
    } catch (err) {
      console.error('Init error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchReports(cid: string, uid: string, r: string) {
    let query = supabase
      .from('work_reports')
      .select('*, employee:profiles(full_name, email)')
      .eq('company_id', cid)
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (r === 'user') query = query.eq('employee_id', uid)
    const { data } = await query.limit(100)
    if (data) {
      setReports(data as any)
      const tr = data.find((rep: any) => rep.report_date === today && rep.employee_id === uid)
      setTodayReport(tr || null)
      // Build unique users list for filter
      const usersMap: Record<string, string> = {}
      data.forEach((rep: any) => {
        if (rep.employee_id && rep.employee?.full_name) {
          usersMap[rep.employee_id] = rep.employee.full_name
        }
      })
      setUniqueUsers(Object.entries(usersMap).map(([id, name]) => ({ id, name })))
    }
  }

  async function handleSubmit() {
    if (!form.tasks_completed.trim()) { setError('Tasks completed required'); return }
    setSubmitting(true); setError('')
    try {
      const { error: err } = await supabase
        .from('work_reports')
        .upsert({
          employee_id: userId,
          company_id: companyId,
          report_date: today,
          tasks_completed: form.tasks_completed,
          tasks_pending: form.tasks_pending,
          blockers: form.blockers,
          hours_worked: parseFloat(form.hours_worked) || 8,
          status: 'submitted',
        }, { onConflict: 'employee_id,report_date' })
      if (err) throw err
      setSuccess('Report submitted successfully!')
      setShowForm(false)
      setForm({ tasks_completed: '', tasks_pending: '', blockers: '', hours_worked: '8' })
      await fetchReports(companyId, userId, role)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  function editReport(report: WorkReport) {
    setForm({
      tasks_completed: report.tasks_completed || '',
      tasks_pending: report.tasks_pending || '',
      blockers: report.blockers || '',
      hours_worked: String(report.hours_worked || 8),
    })
    setShowForm(true)
  }

  const filteredReports = reports.filter(r =>
    filterUser === 'all' || r.employee_id === filterUser
  )

  // Today's summary for admin
  const todayReports = reports.filter(r => r.report_date === today)
  const todaySubmitted = todayReports.length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#B8860B', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-5 p-4 md:p-0 max-w-4xl" style={{ minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>HR & Admin</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Work Reports</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">📅 {todayDisplay}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); if (todayReport) editReport(todayReport) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
            style={{ background: '#1C1712' }}
          >
            <Plus className="w-4 h-4" style={{ color: '#B8860B' }} />
            {todayReport ? "Update Today's Report" : "Submit Today's Report"}
          </button>
        )}
      </div>

      {/* Admin summary cards */}
      {role === 'admin' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} style={{ color: '#B8860B' }} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A8F82]">Today's Reports</p>
            </div>
            <p className="text-3xl font-black" style={{ color: '#B8860B' }}>{todaySubmitted}</p>
            <p className="text-xs text-[#9A8F82] mt-0.5">{uniqueUsers.length} total employees</p>
          </div>
          <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} style={{ color: '#1C1712' }} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A8F82]">Total Reports</p>
            </div>
            <p className="text-3xl font-black text-[#1C1712]">{reports.length}</p>
            <p className="text-xs text-[#9A8F82] mt-0.5">All time submissions</p>
          </div>
        </div>
      )}

      {/* Today status banner */}
      {!showForm && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={todayReport
            ? { background: '#F0FDF4', borderColor: '#BBF7D0' }
            : { background: '#FFFBEB', borderColor: '#FDE68A' }
          }>
          {todayReport
            ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          }
          <p className="text-sm font-medium" style={{ color: todayReport ? '#166534' : '#92400E' }}>
            {todayReport
              ? `Your report submitted · ${todayReport.hours_worked}hrs worked`
              : "Your work report not submitted yet"
            }
          </p>
          {!todayReport && (
            <button onClick={() => setShowForm(true)}
              className="ml-auto text-xs font-bold underline text-amber-700">
              Submit now →
            </button>
          )}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="px-4 py-3 rounded-2xl border text-sm font-medium text-emerald-700"
          style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
          ✅ {success}
        </div>
      )}

      {/* Submit Form */}
      {showForm && (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EBE0]"
            style={{ background: '#1C1712' }}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: '#B8860B' }} />
              <h2 className="text-sm font-semibold text-white">
                {todayReport ? 'Update' : 'Submit'} Work Report — {new Date().toLocaleDateString('en-IN')}
              </h2>
            </div>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="text-gray-400 hover:text-white text-lg">✕</button>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#16A34A' }}>
                ✅ Tasks Completed Today *
              </label>
              <textarea rows={4}
                placeholder={"1. Completed lead pipeline UI\n2. Fixed Razorpay integration\n3. Updated dashboard sidebar"}
                value={form.tasks_completed}
                onChange={e => setForm({ ...form, tasks_completed: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none text-[#1C1712] placeholder-[#C4BAB0]"
                style={{ borderColor: '#E2D9C8', background: '#FAFAF8' }}
                onFocus={e => e.target.style.borderColor = '#B8860B'}
                onBlur={e => e.target.style.borderColor = '#E2D9C8'}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#2563EB' }}>
                🔄 Pending / Tomorrow's Tasks
              </label>
              <textarea rows={3}
                placeholder={"1. Billing pages fix\n2. Employee work report feature\n3. Settings page testing"}
                value={form.tasks_pending}
                onChange={e => setForm({ ...form, tasks_pending: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none text-[#1C1712] placeholder-[#C4BAB0]"
                style={{ borderColor: '#E2D9C8', background: '#FAFAF8' }}
                onFocus={e => e.target.style.borderColor = '#B8860B'}
                onBlur={e => e.target.style.borderColor = '#E2D9C8'}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#DC2626' }}>
                ⚠️ Blockers / Issues
              </label>
              <textarea rows={2}
                placeholder="Any blockers or issues faced today... (or type 'None')"
                value={form.blockers}
                onChange={e => setForm({ ...form, blockers: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none text-[#1C1712] placeholder-[#C4BAB0]"
                style={{ borderColor: '#E2D9C8', background: '#FAFAF8' }}
                onFocus={e => e.target.style.borderColor = '#B8860B'}
                onBlur={e => e.target.style.borderColor = '#E2D9C8'}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#7A6E60]">
                🕐 Hours Worked
              </label>
              <div className="flex gap-2 flex-wrap">
                {['4', '5', '6', '7', '8', '9', '10'].map(h => (
                  <button key={h} onClick={() => setForm({ ...form, hours_worked: h })}
                    className="px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: form.hours_worked === h ? '#1C1712' : '#F0EBE0',
                      color: form.hours_worked === h ? '#B8860B' : '#7A6E60',
                    }}>
                    {h}h
                  </button>
                ))}
                <input type="number" min="1" max="16" step="0.5"
                  value={form.hours_worked}
                  onChange={e => setForm({ ...form, hours_worked: e.target.value })}
                  className="w-16 border rounded-xl px-2 py-2 text-sm text-[#1C1712] text-center focus:outline-none"
                  style={{ borderColor: '#E2D9C8', background: '#FAFAF8' }}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-xl border text-red-700"
                style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>⚠ {error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowForm(false); setError('') }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: '#E2D9C8', color: '#7A6E60' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: '#B8860B' }}>
                {submitting ? '⏳ Submitting...' : todayReport ? '✅ Update Report' : '✅ Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EBE0]"
          style={{ background: '#1C1712' }}>
          <h2 className="text-sm font-semibold text-white">
            {role === 'admin' ? 'All Team Reports' : 'My Reports'} ({filteredReports.length})
          </h2>
          <div className="flex items-center gap-2">
            {role === 'admin' && uniqueUsers.length > 0 && (
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                style={{ background: '#2C2A25', color: '#B8860B', border: '1px solid #3C3A35' }}
              >
                <option value="all">All Employees</option>
                {uniqueUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#B8860B' }}>
              <Clock className="w-3.5 h-3.5" />
              Recent first
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-[#B8860B]" />
            </div>
            <p className="text-[#1C1712] font-bold text-sm">No work reports yet</p>
            <p className="text-[#9A8F82] text-xs mt-1">Submit today's report to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0EBE0]">
            {filteredReports.map((report: any, i: number) => (
              <ReportRow
                key={report.id}
                report={report}
                isAdmin={role === 'admin'}
                isOwn={report.employee_id === userId}
                avatarIndex={i}
                onEdit={() => { editReport(report); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportRow({ report, isAdmin, isOwn, avatarIndex, onEdit }: {
  report: any
  isAdmin: boolean
  isOwn: boolean
  avatarIndex: number
  onEdit: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(report.report_date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
  const isToday = report.report_date === new Date().toISOString().split('T')[0]
  const av = avatarColors[avatarIndex % avatarColors.length]
  const name = report.employee?.full_name || 'Unknown'

  return (
    <div className="px-5 py-4 hover:bg-[#FDFAF8] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">

          {/* Date badge */}
          <div className="flex-shrink-0 text-center px-2.5 py-1.5 rounded-xl min-w-[58px] border"
            style={isToday
              ? { background: '#1C1712', borderColor: '#1C1712' }
              : { background: '#F5F0E8', borderColor: '#E2D9C8' }
            }>
            <p className="text-[10px] font-bold uppercase"
              style={{ color: isToday ? '#B8860B' : '#9A8F82' }}>
              {isToday ? 'Today' : date.split(' ')[0]}
            </p>
            <p className="text-sm font-bold"
              style={{ color: isToday ? '#F5F0E8' : '#1C1712' }}>
              {date.split(' ').slice(1).join(' ')}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            {/* Admin: show employee avatar + name */}
            {isAdmin && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: av.bg, color: av.text }}>
                  {getInitials(name)}
                </div>
                <p className="text-xs font-semibold" style={{ color: '#B8860B' }}>{name}</p>
              </div>
            )}
            <p className="text-sm text-[#1C1712] line-clamp-2">{report.tasks_completed}</p>

            {expanded && (
              <div className="mt-3 space-y-3">
                {report.tasks_pending && (
                  <div className="rounded-xl px-3 py-2.5 border border-[#DBEAFE]" style={{ background: '#EFF6FF' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-700">🔄 Pending</p>
                    <p className="text-xs text-blue-800 whitespace-pre-line">{report.tasks_pending}</p>
                  </div>
                )}
                {report.blockers && (
                  <div className="rounded-xl px-3 py-2.5 border border-[#FECACA]" style={{ background: '#FEF2F2' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-red-700">⚠️ Blockers</p>
                    <p className="text-xs text-red-800 whitespace-pre-line">{report.blockers}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[#7A6E60] font-medium">{report.hours_worked}h</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={report.status === 'submitted'
              ? { background: '#F0FDF4', color: '#166534' }
              : { background: '#F5F0E8', color: '#7A6E60' }
            }>
            {report.status}
          </span>
          {isOwn && isToday && (
            <button onClick={onEdit} className="text-xs font-semibold underline"
              style={{ color: '#B8860B' }}>Edit</button>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="text-[#C4BAB0] hover:text-[#7A6E60] transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}