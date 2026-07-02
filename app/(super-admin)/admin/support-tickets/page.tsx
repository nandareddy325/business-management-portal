'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupportTickets, getTicketStats } from '@/lib/supabase/queries/admin'
import { Headphones, Plus } from 'lucide-react'
import { TicketsTable, TicketStats } from '@/components/super-admin/support'

export default async function SupportPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: tickets } = await getSupportTickets(supabase, profile.company_id, {}, 50, 0)
  const stats = await getTicketStats(supabase, profile.company_id)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-[#1C1712]">Support Tickets</h1>
          <button className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-md">
            <Plus size={14} /> New Ticket
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {stats && <TicketStats open={stats.total_open} inProgress={stats.total_in_progress} resolved={stats.total_resolved} />}
        <TicketsTable tickets={tickets} />
      </div>
    </div>
  )
}