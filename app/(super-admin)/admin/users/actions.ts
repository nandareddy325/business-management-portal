// app/(super-admin)/admin/users/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') return { error: 'Forbidden', supabase: null }

  return { error: null, supabase }
}

// ─── Add User to ANY company ──────────────────────────────────────────────────
// companyId = whichever company the super admin chose in the modal
export async function addUserAction(
  companyId: string,
  fullName: string,
  email: string,
  role: string
): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr } = await requireSuperAdmin()
  if (authErr) return { error: authErr }

  const admin = adminClient()

  // Duplicate check across ALL companies
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (existing) return { error: 'A user with this email already exists.' }

  // Create auth user
  const tempPwd = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4) + '!9'

  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password: tempPwd,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim() },
  })

  if (createErr) return { error: createErr.message }

  // Insert profile under chosen company
  const { error: profileErr } = await admin.from('profiles').insert({
    id: newUser.user.id,
    email: email.trim().toLowerCase(),
    full_name: fullName.trim() || null,
    role,
    company_id: companyId,   // ← whichever company chosen
  })

  if (profileErr) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return { error: profileErr.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

// ─── Update Role ──────────────────────────────────────────────────────────────
export async function updateRoleAction(
  userId: string,
  newRole: string
): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr, supabase } = await requireSuperAdmin()
  if (authErr || !supabase) return { error: authErr ?? 'Error' }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

// ─── Bulk Role Update ─────────────────────────────────────────────────────────
export async function bulkUpdateRoleAction(
  userIds: string[],
  newRole: string
): Promise<{ error?: string; success?: boolean; count?: number }> {
  const { error: authErr, supabase } = await requireSuperAdmin()
  if (authErr || !supabase) return { error: authErr ?? 'Error' }

  const { error, count } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .in('id', userIds)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true, count: count ?? userIds.length }
}

// ─── Remove User ──────────────────────────────────────────────────────────────
export async function removeUserAction(
  userId: string
): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr } = await requireSuperAdmin()
  if (authErr) return { error: authErr }

  const admin = adminClient()

  // Step 1: Delete profile first (removes FK constraint)
  const { error: profileErr } = await admin
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileErr) return { error: profileErr.message }

  // Step 2: Delete auth user
  const { error: authDeleteErr } = await admin.auth.admin.deleteUser(userId)
  if (authDeleteErr) {
    console.error('Auth user delete failed (profile removed):', authDeleteErr.message)
  }

  revalidatePath('/admin/users')
  return { success: true }
}