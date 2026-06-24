import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'

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

  // ✅ profile data pass cheyyi
  return (
    <DashboardShell
      userName={profile.full_name as string ?? ''}
      userEmail={user.email || ''}
      userRole={profile.role || 'user'}
    >
      {children}
    </DashboardShell>
  )
}