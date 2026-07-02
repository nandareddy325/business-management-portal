'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSystemStatus } from '@/lib/supabase/queries/admin'
import { Activity, RefreshCw } from 'lucide-react'
import { ServiceStatus } from '@/components/super-admin/system-monitor'

export default async function SystemMonitorPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: statuses } = await getSystemStatus(supabase)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-[#1C1712]">System Monitor</h1>
          <button className="px-3 py-2 rounded-lg bg-white ring-1 ring-black/10 text-xs font-semibold text-black/70 hover:bg-black/5 transition-all flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <ServiceStatus services={statuses} />
      </div>
    </div>
  )
}