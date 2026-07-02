// app/(super-admin)/admin/tenants/page.tsx
import { createClient } from '@supabase/supabase-js'
import { Search, Building2 } from 'lucide-react'
import TenantActions from '@/components/super-admin/TenantActions'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getTenants(search?: string, page = 1) {
  const limit = 15
  const from = (page - 1) * limit

  let query = supabaseAdmin
    .from('companies')
    .select('*, plan:plans(name, price_monthly)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (search) query = query.ilike('name', `%${search}%`)
  const { data, count } = await query
  return { tenants: data ?? [], total: count ?? 0 }
}

const statusBadge: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  trial:     'bg-amber-100 text-amber-700',
  expired:   'bg-red-100 text-red-600',
  cancelled: 'bg-[#F5F0E8] text-[#9A8F82]',
}

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  // ✅ Next.js 16 — await searchParams
  const { search, page: pageParam } = await searchParams
  const page = Number(pageParam ?? 1)
  const { tenants, total } = await getTenants(search, page)
  const totalPages = Math.ceil(total / 15)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Super Admin</p>
            <h1 className="font-serif text-3xl text-[#1C1712]">All Tenants</h1>
            <p className="text-sm text-[#9A8F82] mt-1">{total} companies registered</p>
          </div>
        </div>

        {/* Search */}
        <form method="GET" className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A8F82]" />
          <input 
            name="search" 
            defaultValue={search} 
            placeholder="Search companies..."
            className="w-full bg-white border border-[#E8E2D8] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1C1712] placeholder-[#B8B0A0] focus:outline-none focus:border-[#B8860B] transition-colors" 
          />
        </form>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <h2 className="font-serif text-base text-[#1C1712]">Company List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EBE0] bg-[#FDFAF8] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider whitespace-nowrap">Company</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider whitespace-nowrap">Plan</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider whitespace-nowrap">Trial Ends</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider whitespace-nowrap">Joined</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0]">
                {tenants.map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-[#FFFBEF] transition-colors">
                    <td className="px-5 py-3">
                      <a href={`/admin/tenants/${tenant.id}`} className="flex items-center gap-3 hover:opacity-75 transition-opacity">
                        <div className="w-9 h-9 bg-[#F5F0E8] border border-[#E8E2D8] rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-[#B8860B]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1C1712] truncate">{tenant.name}</p>
                          <p className="text-xs text-[#9A8F82] truncate">{tenant.email}</p>
                        </div>
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#1C1712] capitalize">{tenant.plan?.name ?? '—'}</p>
                      {tenant.plan?.price_monthly && (
                        <p className="text-xs text-[#9A8F82]">₹{Number(tenant.plan.price_monthly).toLocaleString('en-IN')}/mo</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold capitalize inline-block ${
                        statusBadge[tenant.plan_status] ?? statusBadge.cancelled
                      }`}>
                        {tenant.plan_status ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#9A8F82]">
                      {tenant.trial_ends_at 
                        ? new Date(tenant.trial_ends_at).toLocaleDateString('en-IN') 
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#9A8F82]">
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
                    <td colSpan={6} className="px-5 py-12 text-center text-[#9A8F82] text-sm">
                      No tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#9A8F82]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a 
                  href={`?page=${page - 1}&search=${search ?? ''}`} 
                  className="px-3 py-1.5 text-xs bg-white border border-[#E8E2D8] text-[#1C1712] rounded-lg hover:border-[#B8860B] transition-colors font-medium"
                >
                  ← Prev
                </a>
              )}
              {page < totalPages && (
                <a 
                  href={`?page=${page + 1}&search=${search ?? ''}`} 
                  className="px-3 py-1.5 text-xs bg-white border border-[#E8E2D8] text-[#1C1712] rounded-lg hover:border-[#B8860B] transition-colors font-medium"
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