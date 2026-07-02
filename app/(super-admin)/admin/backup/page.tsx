// FILE 1: app/(super-admin)/admin/backup/page.tsx
// ---
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBackups, getBackupStats } from '@/lib/supabase/queries/admin'
import { Database, Plus } from 'lucide-react'
import { BackupHistory, ScheduleConfig } from '@/components/super-admin/backup'

export default async function BackupPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: backups } = await getBackups(supabase, profile.company_id, 20, 0)
  const stats = await getBackupStats(supabase, profile.company_id)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Database size={11} className="text-blue-600" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-blue-700/70">Protection</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1C1712]">Backup Management</h1>
          </div>
          <button className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-md">
            <Plus size={14} /> Create Backup
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <StatCard label="Total Backups" value={stats.total_backups} />
            <StatCard label="Completed" value={stats.completed_backups} color="emerald" />
            <StatCard label="Failed" value={stats.failed_backups} color="red" />
            <StatCard label="Total Size" value={`${stats.total_data_size_gb.toFixed(2)}GB`} color="blue" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backup History */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-[#1C1712] mb-4">Recent Backups</h2>
            <BackupHistory backups={backups} />
          </div>

          {/* Schedule Config */}
          <div>
            <h2 className="text-sm font-bold text-[#1C1712] mb-4">Schedule</h2>
            <ScheduleConfig />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'black' }: any) {
  return (
    <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-semibold text-black/60 uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${
        color === 'emerald' ? 'text-emerald-700' : 
        color === 'red' ? 'text-red-700' : 
        color === 'blue' ? 'text-blue-700' :
        'text-black/80'
      }`}>{value}</p>
    </div>
  )
}
