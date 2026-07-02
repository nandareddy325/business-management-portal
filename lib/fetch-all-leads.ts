// lib/fetch-all-leads.ts
//
// Supabase/PostgREST caps every query at 1000 rows by default, even
// without an explicit .limit(). If total leads > 1000 (confirmed: 1079),
// every .select() call silently truncates — and because different pages
// sort differently, each page silently drops a DIFFERENT 79+ leads.
// That's what was causing every count to disagree even after the
// stage-normalization fix.
//
// This helper loops with .range() in batches of 1000 until a batch comes
// back shorter than the page size, guaranteeing the FULL result set.
// Both Sidebar.tsx and the All-Leads page must use this instead of a
// single .select() call.

const PAGE_SIZE = 1000

export async function fetchAllLeads(
  supabase: any,
  companyId: string,
  industry: string,
  columns: string = '*'
): Promise<any[]> {
  let all: any[] = []
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

    all = all.concat(data)

    if (data.length < PAGE_SIZE) break // last page reached
    from += PAGE_SIZE
  }

  return all
}