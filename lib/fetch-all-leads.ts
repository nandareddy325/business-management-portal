// lib/fetch-all-leads.ts
import { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

export async function fetchAllLeads<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  companyId: string,
  industry: string,
  columns: string = '*'
): Promise<T[]> {
  let all: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('leads')
      .select(columns)
      .eq('company_id', companyId)
      .eq('industry', industry)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('fetchAllLeads error:', error)
      break
    }
    if (!data || data.length === 0) break

    all = all.concat(data as T[])

    if (data.length < PAGE_SIZE) break // last page reached
    from += PAGE_SIZE
  }

  return all
}