import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'
import TrialBanner from './TrialBanner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // ── Trial status check ──────────────────────────────────────
  let trialDaysRemaining: number | null = null
  let isTrial = false

  if (profile.company_id) {
    const { data: sub } = await supabase
      .from('company_subscriptions')
      .select('status, trial_ends_at')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sub?.status === 'trial' && sub.trial_ends_at) {
      isTrial = true
      const now = new Date()
      const trialEnd = new Date(sub.trial_ends_at)
      const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      trialDaysRemaining = Math.max(0, diff)

      // Expired → redirect to renew
      if (trialDaysRemaining === 0 && trialEnd < now) {
        redirect('/subscription/renew')
      }
    }
  }

  return (
    <DashboardShell
      userName={profile.full_name as string ?? ''}
      userEmail={user.email || ''}
      userRole={profile.role || 'user'}
    >
      {/* Trial banner — only show during active trial */}
      {isTrial && trialDaysRemaining !== null && (
        <TrialBanner daysRemaining={trialDaysRemaining} />
      )}
      {children}
    </DashboardShell>
  )
}