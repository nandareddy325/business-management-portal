'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'

interface WorkReport {
  id: string
  report_date: string
  tasks_completed: string
  tasks_pending: string
  blockers: string
  hours_worked: number
  status: string
  employee: { full_name: string; email: string }
}

export default function WorkReportsPage() {
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

  useEffect(() => {
    init()
  }, [])

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

    // User only sees own reports
    if (r === 'user') {
      query = query.eq('employee_id', uid)
    }

    const { data } = await query.limit(50)
    if (data) {
      setReports(data as any)
      // Check today's report for current user
      const tr = data.find((r: any) => r.report_date === today && r.employee_id === uid)
      setTodayReport(tr || null)
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

      setSuccess('✅ Work report submitted!')
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Daily Work Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todayDisplay}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); if (todayReport) editReport(todayReport) }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {todayReport ? 'Update Today\'s Report' : 'Submit Today\'s Report'}
          </button>
        )}
      </div>

      {/* Today status banner */}
      {!showForm && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          todayReport
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          {todayReport ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <p className="text-sm font-medium">
            {todayReport
              ? `Today's report submitted · ${todayReport.hours_worked}hrs worked`
              : "Today's work report not submitted yet"}
          </p>
          {!todayReport && (
            <button
              onClick={() => setShowForm(true)}
              className="ml-auto text-xs font-bold underline"
            >
              Submit now →
            </button>
          )}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Submit Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">
                {todayReport ? 'Update' : 'Submit'} Work Report — {new Date().toLocaleDateString('en-IN')}
              </h2>
            </div>
            <button onClick={() => { setShowForm(false); setError('') }} className="text-gray-600 hover:text-gray-400 text-lg">✕</button>
          </div>

          <div className="p-5 space-y-5">   

            {/* Tasks Completed */}
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                ✅ Tasks Completed Today *
              </label>
              <textarea
                rows={4}
                placeholder="1. Completed lead pipeline UI&#10;2. Fixed Razorpay integration&#10;3. Updated dashboard sidebar"
                value={form.tasks_completed}
                onChange={e => setForm({ ...form, tasks_completed: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {/* Tasks Pending */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                🔄 Pending / Tomorrow's Tasks
              </label>
              <textarea
                rows={3}
                placeholder="1. Billing pages fix&#10;2. Employee work report feature&#10;3. Settings page testing"
                value={form.tasks_pending}
                onChange={e => setForm({ ...form, tasks_pending: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {/* Blockers */}
            <div>
              <label className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                ⚠️ Blockers / Issues
              </label>
              <textarea
                rows={2}
                placeholder="Any blockers or issues faced today... (or type 'None')"
                value={form.blockers}
                onChange={e => setForm({ ...form, blockers: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {/* Hours */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                🕐 Hours Worked
              </label>
              <div className="flex gap-2">
                {['4', '5', '6', '7', '8', '9', '10'].map(h => (
                  <button
                    key={h}
                    onClick={() => setForm({ ...form, hours_worked: h })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.hours_worked === h
                        ? 'bg-amber-500 text-gray-900 font-bold'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="16"
                  step="0.5"
                  value={form.hours_worked}
                  onChange={e => setForm({ ...form, hours_worked: e.target.value })}
                  className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">⚠ {error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setError('') }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-400 text-gray-900 transition-colors disabled:opacity-50"
              >
                {submitting ? '⏳ Submitting...' : todayReport ? '✅ Update Report' : '✅ Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">
            {role === 'admin' ? 'All Team Reports' : 'My Reports'} ({reports.length})
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            Recent first
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No work reports yet</p>
            <p className="text-gray-600 text-xs mt-1">Submit today's report to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {reports.map((report: any) => (
              <ReportRow
                key={report.id}
                report={report}
                isAdmin={role === 'admin'}
                isOwn={report.employee_id === userId}
                onEdit={() => { editReport(report); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportRow({ report, isAdmin, isOwn, onEdit }: {
  report: any
  isAdmin: boolean
  isOwn: boolean
  onEdit: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(report.report_date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
  const isToday = report.report_date === new Date().toISOString().split('T')[0]

  return (
    <div className="px-5 py-4 hover:bg-gray-800/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Date badge */}
          <div className={`flex-shrink-0 text-center px-2.5 py-1.5 rounded-lg min-w-[56px] ${
            isToday ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-gray-800'
          }`}>
            <p className={`text-[10px] font-bold uppercase ${isToday ? 'text-amber-400' : 'text-gray-500'}`}>
              {isToday ? 'Today' : date.split(' ')[0]}
            </p>
            <p className={`text-sm font-bold ${isToday ? 'text-amber-300' : 'text-white'}`}>
              {date.split(' ').slice(1).join(' ')}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            {isAdmin && (
              <p className="text-xs text-amber-400 font-semibold mb-1">
                {report.employee?.full_name || 'Unknown'}
              </p>
            )}
            <p className="text-sm text-white line-clamp-2">{report.tasks_completed}</p>

            {expanded && (
              <div className="mt-3 space-y-2">
                {report.tasks_pending && (
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Pending</p>
                    <p className="text-xs text-gray-400 whitespace-pre-line">{report.tasks_pending}</p>
                  </div>
                )}
                {report.blockers && (
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Blockers</p>
                    <p className="text-xs text-gray-400 whitespace-pre-line">{report.blockers}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">{report.hours_worked}h</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            report.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-400'
          }`}>
            {report.status}
          </span>
          {isOwn && isToday && (
            <button onClick={onEdit} className="text-xs text-amber-400 hover:text-amber-300 font-medium">Edit</button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-gray-600 hover:text-gray-400">
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}