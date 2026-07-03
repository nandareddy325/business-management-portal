// app/(super-admin)/admin/users/page.tsx
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserManagementPanel } from '@/components/super-admin/UserManagementPanel'

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // ── Super Admin: fetch ALL users across ALL companies ──────────────────────
  // Each new company that buys GK CRM will appear here automatically
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at, company_id')
    .order('created_at', { ascending: false })

  // ── Fetch all registered companies ─────────────────────────────────────────
  // Table name: 'companies' — adjust if yours is named 'tenants' or 'organizations'
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <UserManagementPanel
      initialUsers={users ?? []}
      currentUserId={user.id}
      currentCompanyId={profile.company_id}
      companies={companies ?? []}
    />
  )
}