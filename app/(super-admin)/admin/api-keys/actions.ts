// app/(super-admin)/admin/api-keys/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAPIKey, updateAPIKey, deleteAPIKey, logAdminAction } from '@/lib/supabase/queries/admin'
import type { APIKeyEnvironment } from '@/types/admin'

async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase: null, userId: null, companyId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Forbidden', supabase: null, userId: null, companyId: null }
  }

  return { error: null, supabase, userId: user.id, companyId: profile.company_id as string }
}

// ─── Generate a new API key ────────────────────────────────────────────────
// Returns the plaintext key ONCE — it is never stored, only its hash is.
export async function generateAPIKeyAction(
  name: string,
  environment: APIKeyEnvironment
): Promise<{ error?: string; plaintextKey?: string; success?: boolean }> {
  const { error: authErr, supabase, userId, companyId } = await requireSuperAdmin()
  if (authErr || !supabase || !userId || !companyId) return { error: authErr ?? 'Unauthorized' }

  const trimmedName = name.trim()
  if (!trimmedName) return { error: 'Key name is required' }
  if (!['development', 'production'].includes(environment)) {
    return { error: 'Invalid environment' }
  }

  const { data, error, plaintextKey } = await createAPIKey(supabase, {
    company_id: companyId,
    created_by: userId,
    name: trimmedName,
    environment,
  })

  if (error || !data || !plaintextKey) {
    return { error: error?.message ?? 'Failed to generate key' }
  }

  await logAdminAction(
    supabase, companyId, userId,
    `Generated API key "${trimmedName}" (${environment})`,
    'create', 'api_key', data.id
  )

  revalidatePath('/admin/api-keys')
  return { success: true, plaintextKey }
}

// ─── Revoke a key (soft — keeps history, blocks future use) ───────────────
export async function revokeAPIKeyAction(keyId: string, keyName: string): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr, supabase, userId, companyId } = await requireSuperAdmin()
  if (authErr || !supabase || !userId || !companyId) return { error: authErr ?? 'Unauthorized' }

  const { error } = await updateAPIKey(supabase, keyId, { status: 'revoked' })
  if (error) return { error: error.message }

  await logAdminAction(
    supabase, companyId, userId,
    `Revoked API key "${keyName}"`,
    'update', 'api_key', keyId
  )

  revalidatePath('/admin/api-keys')
  return { success: true }
}

// ─── Permanently delete a key ───────────────────────────────────────────────
export async function deleteAPIKeyAction(keyId: string, keyName: string): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr, supabase, userId, companyId } = await requireSuperAdmin()
  if (authErr || !supabase || !userId || !companyId) return { error: authErr ?? 'Unauthorized' }

  const { error } = await deleteAPIKey(supabase, keyId)
  if (error) return { error: error.message }

  await logAdminAction(
    supabase, companyId, userId,
    `Deleted API key "${keyName}"`,
    'delete', 'api_key', keyId
  )

  revalidatePath('/admin/api-keys')
  return { success: true }
}
