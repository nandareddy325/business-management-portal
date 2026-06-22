'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, ChevronDown, Users } from 'lucide-react'

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
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [todayReport, setTodayReport] = useState<any>(null)
  const [filterUser, setFilterUser] = useState('all')
  const [profileMap, setProfileMap] = useState<Record<string, string>>({})

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
        .from('profiles').select('company_id, role').eq('id', user.id).single()
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
    try {
      // Step 1: Fetch reports WITHOUT join
      let query = supabase
        .from('work_reports')
        .select('*')
        .eq('company_id', cid)
        .order('report_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200)

      if (r === 'user') query = query.eq('employee_id', uid)

      const { data, error: qErr } = await query
      console.log('[WorkReports] fetched:', data?.length, 'error:', qErr?.message)

      if (!data) return

      // Step 2: Fetch names from employees table (work_reports FK points to employees)
      const empIds = [...new Set(data.map((d: any) => d.employee_id).filter(Boolean))]
      const pm: Record<string, string> = {}
      if (empIds.length > 0) {
        const { data: emps } = await supabase
          .from('employees').select('id, full_name, email')
        if (emps) {
          emps.forEach((e: any) => { pm[e.id] = e.full_name || e.email || 'Unknown' })
        }
      }
      setProfileMap(pm)

      // Attach name to reports
      const enriched = data.map((rep: any) => ({
        ...rep,
        employee_name: pm[rep.employee_id] || 'Unknown',
      }))

      setReports(enriched)
      const tr = enriched.find((rep: any) => rep.report_date === today && rep.employee_id === uid)
      setTodayReport(tr || null)
    } catch (e) {
      console.error('[WorkReports] error:', e)
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

  function editReport(report: any) {
    setForm({
      tasks_completed: report.tasks_completed || '',
      tasks_pending: report.tasks_pending || '',
      blockers: report.blockers || '',
      hours_worked: String(report.hours_worked || 8),
    })
    setShowForm(true)
  }

  const uniqueUsers = Object.entries(profileMap).map(([id, name]) => ({ id, name }))
  const filteredReports = filterUser === 'all' ? reports : reports.filter(r => r.employee_id === filterUser)
  const todayReports = reports.filter(r => r.report_date === today)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#B8860B', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ minHeight: '100vh' }}>

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
            style={{ background: '#1C1712' }}>
            <Plus className="w-4 h-4" style={{ color: '#B8860B' }} />
            {todayReport ? "Update Today's Report" : "Submit Today's Report"}
          </button>
        )}
      </div>

      {/* Admin summary */}
      {role === 'admin' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#FFFBEB' }}>
              <Users size={14} style={{ color: '#B8860B' }} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color:'#9A8F82' }}>Today's Reports</p>
              <p className="text-2xl font-black leading-tight" style={{ color: '#B8860B' }}>{todayReports.length}</p>
              <p className="text-[9px]" style={{ color:'#9A8F82' }}>{uniqueUsers.length} employees</p>
            </div>
          </div>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#F5F0E8' }}>
              <FileText size={14} style={{ color: '#1C1712' }} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color:'#9A8F82' }}>Total Reports</p>
              <p className="text-2xl font-black leading-tight" style={{ color: '#1C1712' }}>{reports.length}</p>
              <p className="text-[9px]" style={{ color:'#9A8F82' }}>All time</p>
            </div>
          </div>
        </div>
      )}

      {/* Today status banner */}
      {!showForm && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={todayReport
            ? { background: '#F0FDF4', borderColor: '#BBF7D0' }
            : { background: '#FFFBEB', borderColor: '#FDE68A' }}>
          {todayReport
            ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />}
          <p className="text-sm font-medium" style={{ color: todayReport ? '#166534' : '#92400E' }}>
            {todayReport
              ? `Your report submitted · ${todayReport.hours_worked}hrs worked`
              : "Your work report not submitted yet"}
          </p>
          {!todayReport && (
            <button onClick={() => setShowForm(true)} className="ml-auto text-xs font-bold underline text-amber-700">
              Submit now →
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="px-4 py-3 rounded-2xl border text-sm font-medium text-emerald-700"
          style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>✅ {success}</div>
      )}

      {/* Form */}
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
            <button onClick={() => { setShowForm(false); setError('') }} className="text-gray-400 hover:text-white text-lg">✕</button>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#16A34A' }}>✅ Tasks Completed Today *</label>
              <textarea rows={4} placeholder={"1. Completed lead pipeline UI\n2. Fixed dashboard"} value={form.tasks_completed}
                onChange={e => setForm({ ...form, tasks_completed: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none text-[#1C1712] placeholder-[#C4BAB0]"
                style={{ borderColor: '#E2D9C8', background: '#FAFAF8' }}
                onFocus={e => e.target.style.borderColor = '#B8860B'} onBlur={e => e.target.style.borderColor = '#E2D9C8'}/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#2563EB' }}>🔄 Pending / Tomorrow's Tasks</label>
              <textarea rows={3} placeholder={"1. Billing fix\n2. Settings testing"} value={form.tasks_pending}
                onChange={e => setForm({ ...form, tasks_pending: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none text-[#1C1712] placeholder-[#C4BAB0]"
                style={{ borderColor: '#E2D9C8', background: '#FAFAF8' }}
                onFocus={e => e.target.style.borderColor = '#B8860B'} onBlur={e => e.target.style.borderColor = '#E2D9C8'}/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#DC2626' }}>⚠️ Blockers / Issues</label>
              <textarea rows={2} placeholder="Any blockers... (or 'None')" value={form.blockers}
                onChange={e => setForm({ ...form, blockers: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none text-[#1C1712] placeholder-[#C4BAB0]"
                style={{ borderColor: '#E2D9C8', background: '#FAFAF8' }}
                onFocus={e => e.target.style.borderColor = '#B8860B'} onBlur={e => e.target.style.borderColor = '#E2D9C8'}/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#7A6E60]">🕐 Hours Worked</label>
              <div className="flex gap-2 flex-wrap">
                {['4','5','6','7','8','9','10'].map(h => (
                  <button key={h} onClick={() => setForm({ ...form, hours_worked: h })}
                    className="px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: form.hours_worked === h ? '#1C1712' : '#F0EBE0', color: form.hours_worked === h ? '#B8860B' : '#7A6E60' }}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-xs px-3 py-2 rounded-xl border text-red-700" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>⚠ {error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowForm(false); setError('') }} className="px-5 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E2D9C8', color: '#7A6E60' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: '#B8860B' }}>
                {submitting ? '⏳ Submitting...' : todayReport ? '✅ Update Report' : '✅ Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <div className="px-4 py-3" style={{ background: '#1C1712', borderBottom:'1px solid #2C2A25' }}>
          {/* Desktop: one line | Mobile: two lines */}
          {/* Mobile: 2 rows | Desktop: 1 row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white whitespace-nowrap">
              {role === 'admin' ? 'All Team Reports' : 'My Reports'}
              <span className="ml-1.5 text-xs font-normal" style={{ color:'#B8860B' }}>({filteredReports.length})</span>
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {role === 'admin' && uniqueUsers.length > 0 && (
                <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
                  className="text-xs rounded-xl px-2 py-1.5 focus:outline-none font-bold"
                  style={{ background:'#2C2A25', color:'#B8860B', border:'1px solid #3C3A35', maxWidth:'140px' }}>
                  <option value="all">All Employees</option>
                  {uniqueUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
              <div className="flex items-center gap-1 text-[10px] font-bold whitespace-nowrap" style={{ color:'#7A6E60' }}>
                <Clock className="w-3 h-3" /> Recent
              </div>
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
              <ReportRow key={report.id} report={report} isAdmin={role === 'admin'}
                isOwn={report.employee_id === userId} avatarIndex={i}
                onEdit={() => { editReport(report); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                today={today} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportRow({ report, isAdmin, isOwn, avatarIndex, onEdit, today }: {
  report: any; isAdmin: boolean; isOwn: boolean; avatarIndex: number; onEdit: () => void; today: string
}) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(report.report_date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
  const isToday = report.report_date === today
  const av = avatarColors[avatarIndex % avatarColors.length]
  const name = report.employee_name || 'Unknown'

  return (
    <div className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Date badge */}
        <div className="flex-shrink-0 text-center w-14 py-2 rounded-2xl border"
          style={isToday ? { background:'#1C1712', borderColor:'#1C1712' } : { background:'#F5F0E8', borderColor:'#E2D9C8' }}>
          <p className="text-[9px] font-black uppercase leading-none" style={{ color: isToday ? '#B8860B' : '#9A8F82' }}>
            {isToday ? 'TODAY' : date.split(' ')[0].toUpperCase()}
          </p>
          <p className="text-base font-black leading-tight mt-0.5" style={{ color: isToday ? '#F5F0E8' : '#1C1712' }}>
            {date.split(' ')[1]}
          </p>
          <p className="text-[9px] font-bold" style={{ color: isToday ? '#B8860B' : '#9A8F82' }}>
            {date.split(' ')[2]}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + status row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {isAdmin && (
                <>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                    style={{ background: av.bg, color: av.text }}>{getInitials(name)}</div>
                  <p className="text-xs font-bold truncate" style={{ color: '#B8860B' }}>{name}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold" style={{ color: '#9A8F82' }}>
                {report.hours_worked || report.hours_spent || 8}h
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={(report.status === 'submitted' || report.status === 'completed')
                  ? { background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0' }
                  : { background:'#FFFBEB', color:'#D97706', border:'1px solid #FDE68A' }}>
                {(report.status === 'submitted' || report.status === 'completed') ? '✓ Done' : '⏳ Draft'}
              </span>
              {isOwn && isToday && (
                <button onClick={e => { e.stopPropagation(); onEdit() }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ background:'#FFFBEB', color:'#B8860B', border:'1px solid #FDE68A' }}>
                  Edit
                </button>
              )}
              <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                style={{ color: '#C4BAB0' }} />
            </div>
          </div>

          {/* Task preview */}
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#1C1712' }}>
            {report.tasks_completed || report.task_description || '—'}
          </p>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 ml-[68px] space-y-2.5">
          {report.tasks_pending && (
            <div className="rounded-2xl p-3" style={{ background:'#EFF6FF', border:'1px solid #DBEAFE' }}>
              <p className="text-[9px] font-black uppercase tracking-wider mb-1.5" style={{ color:'#2563EB' }}>🔄 Pending Tasks</p>
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color:'#1E40AF' }}>{report.tasks_pending}</p>
            </div>
          )}
          {report.blockers && (
            <div className="rounded-2xl p-3" style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>
              <p className="text-[9px] font-black uppercase tracking-wider mb-1.5" style={{ color:'#DC2626' }}>⚠️ Blockers</p>
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color:'#991B1B' }}>{report.blockers}</p>
            </div>
          )}
          {!report.tasks_pending && !report.blockers && (
            <p className="text-xs" style={{ color:'#C4BAB0' }}>No additional details</p>
          )}
        </div>
      )}
    </div>
  )
}