// FILE 3: app/(super-admin)/admin/analytics/page.tsx
// ---
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuditLogStats, getTicketStats, getBackupStats } from '@/lib/supabase/queries/admin'
import { BarChart3, Calendar, Download } from 'lucide-react'
import { MetricsCards, RevenueChart } from '@/components/super-admin/analytics'

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const auditStats = await getAuditLogStats(supabase, profile.company_id)
  const ticketStats = await getTicketStats(supabase, profile.company_id)
  const backupStats = await getBackupStats(supabase, profile.company_id)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <BarChart3 size={11} className="text-blue-600" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-blue-700/70">Insights</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1C1712]">Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-lg bg-white ring-1 ring-black/10 text-xs font-semibold text-black/70 hover:bg-black/5 transition-all flex items-center gap-2">
              <Calendar size={14} /> Date Range
            </button>
            <button className="px-3 py-2 rounded-lg bg-white ring-1 ring-black/10 text-xs font-semibold text-black/70 hover:bg-black/5 transition-all flex items-center gap-2">
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Metrics Overview */}
        <MetricsCards />

        {/* Revenue Chart */}
        <RevenueChart />

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white ring-1 ring-black/8 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-black/80 mb-4">Audit Logs</h3>
            {auditStats && (
              <>
                <p className="text-2xl font-bold text-black/80">{auditStats.total_logs}</p>
                <p className="text-xs text-black/50 mt-2">
                  <span className="text-emerald-700 font-semibold">{auditStats.success_count}</span> successful
                </p>
              </>
            )}
          </div>

          <div className="bg-white ring-1 ring-black/8 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-black/80 mb-4">Support Tickets</h3>
            {ticketStats && (
              <>
                <p className="text-2xl font-bold text-black/80">{ticketStats.total_open + ticketStats.total_in_progress}</p>
                <p className="text-xs text-black/50 mt-2">
                  Avg response: <span className="font-semibold">{ticketStats.avg_response_time_hours.toFixed(1)}h</span>
                </p>
              </>
            )}
          </div>

          <div className="bg-white ring-1 ring-black/8 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-black/80 mb-4">Backups</h3>
            {backupStats && (
              <>
                <p className="text-2xl font-bold text-black/80">{backupStats.completed_backups}</p>
                <p className="text-xs text-black/50 mt-2">
                  Total: <span className="font-semibold">{backupStats.total_data_size_gb.toFixed(2)}GB</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
