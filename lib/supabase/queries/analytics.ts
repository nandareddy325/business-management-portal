import { createServerSupabaseClient } from '@/lib/supabase/server'

// Analytics queries — replaces lib/mock-data.ts usage in charts.tsx
// TODO: implement getRevenueVsExpenses, getConversionFunnel, getLeadSourceROI

export async function getRevenueVsExpenses(companyId: string) {
  const supabase = await createServerSupabaseClient()
  throw new Error('Not implemented yet')
}

export async function getConversionFunnel(companyId: string) {
  const supabase = await createServerSupabaseClient()
  throw new Error('Not implemented yet')
}
