import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Search, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: any
}) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/login')
  }

  const page = Number(searchParams?.page ?? 1)
  const limit = 20

  let query = supabase
    .from('crm_customers')
    .select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (searchParams?.search) {
    query = query.ilike('name', `%${searchParams.search}%`)
  }

  const { data: customers, count } = await query

  const totalPages = Math.ceil((count ?? 0) / limit)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {count ?? 0} total customers
          </p>
        </div>

        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <form method="GET" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

        <input
          name="search"
          defaultValue={searchParams?.search}
          placeholder="Search customers..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
        />
      </form>

      <div className="grid grid-cols-1 gap-3">
        {(customers ?? []).map((c: any) => (
          <div
            key={c.id}
            className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  {c.name}
                </p>

                <p className="text-xs text-gray-500">
                  {c.email ?? '—'} · {c.phone ?? '—'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">
                {c.address ?? '—'}
              </p>

              <p className="text-[11px] text-gray-600">
                {c.created_at
                  ? new Date(c.created_at).toLocaleDateString('en-IN')
                  : '—'}
              </p>
            </div>
          </div>
        ))}

        {!customers?.length && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl py-16 text-center">
            <User className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No customers yet
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}`}
              className="px-3 py-1.5 text-xs bg-gray-900 border border-gray-800 text-gray-400 rounded-lg"
            >
              ← Prev
            </a>
          )}

          {page < totalPages && (
            <a
              href={`?page=${page + 1}`}
              className="px-3 py-1.5 text-xs bg-gray-900 border border-gray-800 text-gray-400 rounded-lg"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}