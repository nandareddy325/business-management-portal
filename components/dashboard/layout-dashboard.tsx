// app/(dashboard)/layout.tsx
// Uses YOUR existing Header + Sidebar components

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active, company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!profile.is_active) redirect('/login?error=suspended')

  // Trial check
  const { data: company } = await supabase
    .from('companies')
    .select('plan_status, trial_ends_at')
    .eq('id', profile.company_id)
    .single()

  if (company?.plan_status === 'trial') {
    const trialEnd = new Date(company.trial_ends_at)
    if (trialEnd < new Date()) redirect('/billing/trial-expired')
  }
  if (company?.plan_status === 'expired') redirect('/billing/trial-expired')

  return <DashboardShell>{children}</DashboardShell>
}
