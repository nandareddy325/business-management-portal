// lib/fetch-all-leads.ts
import { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

interface FetchAllLeadsOptions {
  /** ISO timestamp — only return leads created on/after this date (for range filters like 7/30/90 days) */
  createdAfter?: string
}

export async function fetchAllLeads<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  companyId: string,
  industry: string,
  columns: string = '*',
  options?: FetchAllLeadsOptions
): Promise<T[]> {
  let all: T[] = []
  let from = 0

  while (true) {
    let query = supabase
      .from('leads')
      .select(columns)
      .eq('company_id', companyId)
      .eq('industry', industry)

    if (options?.createdAfter) {
      query = query.gte('created_at', options.createdAfter)
    }

    const { data, error } = await query
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

/**
 * Generic paginated fetch for tables other than `leads` (e.g. lead_activities).
 * Chunk large id lists yourself before calling this if using .in() filters,
 * since huge id arrays can blow past URL length limits.
 */
export async function fetchAllRows<T = Record<string, unknown>>(
  buildQuery: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  let from = 0
  const all: T[] = []
  for (let i = 0; i < 50; i++) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await buildQuery(from, to)
    if (error || !data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return all
}