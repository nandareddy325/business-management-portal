import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/super-admin/AdminSidebar'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  // 1. Check session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. TEMPORARILY COMMENTED FOR TESTING
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('role, is_active')
  //   .eq('id', user.id)
  //   .single()

  // if (!profile || profile.role !== 'super_admin') redirect('/dashboard')
  // if (!profile.is_active) redirect('/login?error=account_suspended')

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}