// app/(super-admin)/admin/tenants/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Search, Building2, ExternalLink } from 'lucide-react'
import TenantActions from '@/components/super-admin/TenantActions'

async function getTenants(search?: string, page = 1) {
  const supabase = await createServerSupabaseClient()
  const limit = 15
  const from = (page - 1) * limit

  let query = supabase
    .from('companies')
    .select('*, plan:plans(name, price_monthly)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (search) query = query.ilike('name', `%${search}%`)

  const { data, count } = await query
  return { tenants: data ?? [], total: count ?? 0 }
}

const statusBadge: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  trial: 'bg-amber-500/10 text-amber-400',
  expired: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-gray-700 text-gray-400',
}

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string }
}) {
  const page = Number(searchParams.page ?? 1)
  const { tenants, total } = await getTenants(searchParams.search, page)
  const totalPages = Math.ceil(total / 15)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">All Tenants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} companies registered</p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          name="search"
          defaultValue={searchParams.search}
          placeholder="Search companies..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
        />
      </form>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Ends</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {tenants.map((tenant: any) => (
              <tr key={tenant.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tenant.name}</p>
                      <p className="text-xs text-gray-500">{tenant.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm text-gray-300 capitalize">{tenant.plan?.name ?? '—'}</p>
                  {tenant.plan?.price_monthly && (
                    <p className="text-xs text-gray-600">₹{tenant.plan.price_monthly}/mo</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[tenant.plan_status] ?? statusBadge.cancelled}`}>
                    {tenant.plan_status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">
                  {tenant.trial_ends_at
                    ? new Date(tenant.trial_ends_at).toLocaleDateString('en-IN')
                    : '—'}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">
                  {new Date(tenant.created_at).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-3">
                  <TenantActions
                    tenantId={tenant.id}
                    isActive={tenant.is_active}
                    tenantName={tenant.name}
                  />
                </td>
              </tr>
            ))}
            {!tenants.length && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-600 text-sm">
                  No tenants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}&search=${searchParams.search ?? ''}`}
                className="px-3 py-1.5 text-xs bg-gray-900 border border-gray-800 text-gray-400 rounded-lg hover:border-gray-600">
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}&search=${searchParams.search ?? ''}`}
                className="px-3 py-1.5 text-xs bg-gray-900 border border-gray-800 text-gray-400 rounded-lg hover:border-gray-600">
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
