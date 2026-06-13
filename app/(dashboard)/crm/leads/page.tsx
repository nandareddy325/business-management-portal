import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getLeads(
  companyId: string,
  userId: string,
  role: string,
  filters: any
) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('crm_leads')
    .select('*, assigned_user:profiles(full_name)', { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (role === 'employee') {
    query = query.eq('assigned_to', userId)
  }

  if (filters?.stage) {
    query = query.eq('pipeline_stage', filters.stage)
  }

  if (filters?.search) {
    query = query.ilike('lead_name', `%${filters.search}%`)
  }

  const page = Number(filters?.page ?? 1)
  const limit = 20

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count } = await query

  return {
    leads: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

const stageConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  new:         { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400',    label: 'New' },
  followup:    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'Follow Up' },
  sitevisit:   { bg: 'bg-purple-500/10',  text: 'text-purple-400',  dot: 'bg-purple-400',  label: 'Site Visit' },
  quotation:   { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    dot: 'bg-cyan-400',    label: 'Quotation' },
  negotiation: { bg: 'bg-orange-500/10',  text: 'text-orange-400',  dot: 'bg-orange-400',  label: 'Negotiation' },
  won:         { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Won' },
  lost:        { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'Lost' },
}

const stages = ['new', 'followup', 'sitevisit', 'quotation', 'negotiation', 'won', 'lost']

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
]

function getInitials(name: string) {
  return name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: any
}) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/login')

  const { leads, total, page, totalPages } = await getLeads(
    profile.company_id,
    user.id,
    profile.role ?? 'admin',
    searchParams
  )

  const activeStage = searchParams?.stage
  const activeConfig = activeStage ? stageConfig[activeStage] : null

  // Stage counts for filter tabs
  const stageCounts: Record<string, number> = {}
  for (const stage of stages) {
    const { count } = await supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
      .eq('pipeline_stage', stage)
    stageCounts[stage] = count ?? 0
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="text-amber-400 font-semibold">{total}</span> total leads
            {activeStage && (
              <span className="ml-2 text-gray-600">· filtered by <span className="text-amber-400 capitalize">{activeStage}</span></span>
            )}
          </p>
        </div>
        <a
          href="/crm/leads/new"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </a>
      </div>

      {/* ── Stage Filter Tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        <a
          href="/crm/leads"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !activeStage
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800 border border-transparent'
          }`}
        >
          All ({total})
        </a>
        {stages.map(s => {
          const cfg = stageConfig[s]
          const isActive = activeStage === s
          return (
            <a
              key={s}
              href={`/crm/leads?stage=${s}${searchParams?.search ? `&search=${searchParams.search}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors border ${
                isActive
                  ? `${cfg.bg} ${cfg.text} border-current`
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800 border-transparent'
              }`}
            >
              {cfg.label} ({stageCounts[s] ?? 0})
            </a>
          )
        })}
      </div>

      {/* ── Search ── */}
      <form method="GET" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          name="search"
          defaultValue={searchParams?.search}
          placeholder="Search by name or phone..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
        />
        {searchParams?.stage && (
          <input type="hidden" name="stage" value={searchParams.stage} />
        )}
      </form>

      {/* ── Table ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

        {/* Active filter banner */}
        {activeConfig && (
          <div className={`px-5 py-2.5 border-b border-gray-800 flex items-center justify-between ${activeConfig.bg}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${activeConfig.dot}`} />
              <p className={`text-xs font-semibold capitalize ${activeConfig.text}`}>
                {activeConfig.label} — {total} leads
              </p>
            </div>
            <a href="/crm/leads" className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
              ✕ Clear filter
            </a>
          </div>
        )}

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left bg-gray-950/40">
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {leads.map((lead: any, i: number) => {
              const stageKey = lead.pipeline_stage ?? 'new'
              const cfg = stageConfig[stageKey] ?? stageConfig['new']
              const grad = AVATAR_COLORS[(lead.lead_name?.charCodeAt(0) ?? i) % AVATAR_COLORS.length]
              const rowNum = (page - 1) * 20 + i + 1

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-800/30 transition-colors cursor-pointer group"
                >
                  {/* # */}
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-medium text-gray-600">{rowNum}</span>
                  </td>

                  {/* Lead Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-[11px] font-black text-white flex-shrink-0`}>
                        {getInitials(lead.lead_name ?? '?')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {lead.lead_name}
                        </p>
                        {lead.company_name && (
                          <p className="text-[11px] text-gray-500">{lead.company_name}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-3.5">
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-sm text-gray-300 hover:text-amber-400 font-mono transition-colors whitespace-nowrap"
                      onClick={e => e.stopPropagation()}
                    >
                      {lead.phone ?? '—'}
                    </a>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-500 truncate max-w-[160px]">
                      {lead.email ?? '—'}
                    </p>
                  </td>

                  {/* Stage Badge */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Assigned To */}
                  <td className="px-5 py-3.5">
                    {lead.assigned_user?.full_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-300 flex-shrink-0">
                          {lead.assigned_user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs text-gray-400 truncate max-w-[100px]">
                          {lead.assigned_user.full_name}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">Unassigned</span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="px-5 py-3.5">
                    {lead.source ? (
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md font-medium capitalize">
                        {lead.source}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-gray-600 whitespace-nowrap">
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })
                        : '—'}
                    </p>
                  </td>
                </tr>
              )
            })}

            {/* Empty State */}
            {!leads.length && (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    {searchParams?.search || activeStage ? 'No leads found' : 'No leads yet'}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {searchParams?.search
                      ? 'Try a different search term'
                      : activeStage
                      ? 'No leads in this stage'
                      : 'Click "+ Add Lead" to get started'}
                  </p>
                  {(searchParams?.search || activeStage) && (
                    <a href="/crm/leads" className="inline-block mt-3 text-xs text-amber-400 hover:underline">
                      Clear filters →
                    </a>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Page <span className="text-white font-semibold">{page}</span> of{' '}
              <span className="text-white font-semibold">{totalPages}</span>
              <span className="text-gray-600 ml-2">({total} total)</span>
            </p>
            <div className="flex gap-1.5">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${activeStage ? `&stage=${activeStage}` : ''}${searchParams?.search ? `&search=${searchParams.search}` : ''}`}
                  className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  ← Prev
                </a>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = i + 1
                return (
                  <a
                    key={p}
                    href={`?page=${p}${activeStage ? `&stage=${activeStage}` : ''}${searchParams?.search ? `&search=${searchParams.search}` : ''}`}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      p === page
                        ? 'bg-amber-500 text-gray-900 font-bold border-amber-500'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </a>
                )
              })}
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}${activeStage ? `&stage=${activeStage}` : ''}${searchParams?.search ? `&search=${searchParams.search}` : ''}`}
                  className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}