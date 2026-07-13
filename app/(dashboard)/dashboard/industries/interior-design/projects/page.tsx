import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsTabs from '@/components/interior/projects-tabs'
import { AddProjectButton } from '@/components/interior/add-project-button'
import { ProjectsListClient } from '@/components/interior/projects-list-client'

export const dynamic = 'force-dynamic'

interface ProjectRow {
  id: string
  project_name: string
  client_name: string | null
  budget: number | null
  status: string | null
  start_date: string | null
  end_date: string | null
  deadline: string | null
  created_at: string
  source: 'lead_won' | 'manual' | null
  assigned_to: string | null
  notes: string | null
}

interface QuotationRow {
  id: string
  quotation_no: string
  amount: number
  status: string | null
  created_at: string
  // Supabase types a `client:id_clients(name)` foreign-key join as an
  // array (even though it's a to-one relationship in practice), so this
  // must be typed as an array — not a single object — or TypeScript
  // rejects the cast at build time.
  client?: { name: string; company_id?: string }[] | null
}

// What we pass down per matched project — the most recent quotation
// for that client, keyed by a normalized version of the client's name.
export interface QuotationInfo {
  quotation_no: string
  amount: number
  status: string | null
}

export default async function AllProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get company_id + industry for the logged-in user
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id

  let projects: ProjectRow[] = []
  if (companyId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .eq('industry', 'interior-design')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Projects fetch error:', error)
    } else {
      projects = data ?? []
    }
  }

  // ── Quotations, matched to projects by client name ──
  // NOTE: the `quotations` table currently links to a client via
  // `client:id_clients(name)`, not directly to a project (no project_id
  // column exists yet). Matching is therefore done on a normalized
  // client name — good enough for now, but if two different clients
  // happen to share an identical name, this could attach the wrong
  // quotation. Adding a `project_id` column to `quotations` would make
  // this exact instead of name-based.
  const quotationsByClient: Record<string, QuotationInfo> = {}
  if (companyId) {
    // `quotations` has no company_id column of its own — it only links to
    // a client via client_id (FK to id_clients.id). To scope quotations to
    // this company, we filter on the JOINED id_clients row's company_id
    // instead, using `!inner` so the filter actually applies to the join.
    const { data: quotations } = await supabase
      .from('quotations')
      .select('id, quotation_no, amount, status, created_at, client:id_clients!inner(name, company_id)')
      .eq('client.company_id', companyId)
      .order('created_at', { ascending: false })

    const normalize = (n: string) => n.trim().toLowerCase()

    ;(quotations as QuotationRow[] | null)?.forEach(q => {
      const clientName = q.client?.[0]?.name
      if (!clientName) return
      const key = normalize(clientName)
      // Quotations are ordered newest-first, so the first one we see per
      // client is the most recent — skip if we've already recorded one.
      if (!quotationsByClient[key]) {
        quotationsByClient[key] = {
          quotation_no: q.quotation_no,
          amount: Number(q.amount || 0),
          status: q.status,
        }
      }
    })
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#F5F0E8' }}>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1C1712]">Projects</h1>
            <p className="text-xs text-[#7A6E60] mt-0.5">
              Won leads become projects automatically, or add one manually
            </p>
          </div>
          <AddProjectButton companyId={companyId ?? ''} />
        </div>

        <ProjectsTabs />

        <ProjectsListClient initialProjects={projects} quotationsByClient={quotationsByClient} />
      </div>
    </div>
  )
}
