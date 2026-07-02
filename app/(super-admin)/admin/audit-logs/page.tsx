import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuditLogs, getAuditLogStats } from '@/lib/supabase/queries/admin'
import { Activity, Search, Filter, Download, Calendar } from 'lucide-react'

export default async function AuditLogsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch real audit logs
  const { data: logs, error } = await getAuditLogs(
    supabase,
    profile.company_id,
    {},
    100,
    0
  )

  // Fetch stats
  const stats = await getAuditLogStats(supabase, profile.company_id)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Activity size={11} className="text-amber-600" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-amber-700/70">Monitoring</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1C1712] tracking-tight">Audit Logs</h1>
          </div>
          <button className="px-3 py-2 rounded-lg bg-white ring-1 ring-black/10 text-xs font-semibold text-black/70 hover:text-black hover:bg-black/5 transition-all flex items-center gap-2">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-black/60 uppercase">Total Logs</p>
              <p className="text-2xl font-bold text-black/80 mt-2">{stats.total_logs}</p>
            </div>
            <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-black/60 uppercase">Success</p>
              <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.success_count}</p>
            </div>
            <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-black/60 uppercase">Failed</p>
              <p className="text-2xl font-bold text-red-700 mt-2">{stats.failed_count}</p>
            </div>
            <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-black/60 uppercase">Warnings</p>
              <p className="text-2xl font-bold text-amber-700 mt-2">{stats.warning_count}</p>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white ring-1 ring-black/8 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/8 bg-black/2">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase">Timestamp</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {logs && logs.length > 0 ? (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-semibold text-black/80">{log.action}</p>
                          <p className="text-[10px] text-black/40 mt-0.5">{log.action_type}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-black/70">{log.user?.email || 'Unknown'}</td>
                      <td className="px-5 py-3 text-xs font-medium text-black/50">
                        {new Date(log.created_at).toLocaleDateString('en-IN')} {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          log.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : log.status === 'failed'
                            ? 'bg-red-500/10 text-red-700'
                            : 'bg-amber-500/10 text-amber-700'
                        }`}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-black/50">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}