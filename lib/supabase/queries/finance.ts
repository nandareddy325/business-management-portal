import { createServerSupabaseClient } from '@/lib/supabase/server'

// Invoice / expense / payment queries — single source of truth
// TODO: implement getInvoices, getExpenses, getPayments, getMonthlyRevenue, getMonthlyExpenses

export async function getMonthlyRevenue(companyId: string) {
  const supabase = await createServerSupabaseClient()
  throw new Error('Not implemented yet')
}

export async function getMonthlyExpenses(companyId: string) {
  const supabase = await createServerSupabaseClient()
  throw new Error('Not implemented yet')
}
