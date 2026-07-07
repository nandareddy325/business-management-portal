import { createServerSupabaseClient } from '@/lib/supabase/server'

// Fetches the logged-in client's account + their linked project
// Returns null if no client_account found for this auth user
export async function getClientProject() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: clientAccount, error: accountError } = await supabase
    .from('client_accounts')
    .select('*, project:projects(*)')
    .eq('auth_user_id', user.id)
    .single()

  if (accountError || !clientAccount) return null

  return clientAccount
}

// Fetches quotations linked to this client's project
export async function getClientQuotations(projectId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getClientQuotations error:', error)
    return []
  }
  return data
}

// Fetches payments linked to this client's project
export async function getClientPayments(projectId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getClientPayments error:', error)
    return []
  }
  return data
}
