'use client'

import { useState, useEffect } from 'react'
import { Search, Building2, RefreshCw, Calendar } from 'lucide-react'
import TenantActions from '@/components/super-admin/TenantActions'

interface Tenant {
  id: string
  name: string
  email: string
  plan: string
  plan_status: string
  is_active: boolean
  trial_ends: string | null
  created_at: string
  industry?: string
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search: search,
      })
      const res = await fetch(`/api/admin/tenants?${params}`)
      const { data, count } = await res.json()
      setTenants(data as Tenant[])
      setTotal(count || 0)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount/route-driven sync, not a render-time side effect
    fetchTenants()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch fn is stable-in-practice, only rerun on listed deps
  }, [search, page])

  useEffect(() => {
  const interval = setInterval(() => {
    fetchTenants()
  }, 15000)
  return () => clearInterval(interval)
// eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch fn is stable-in-practice, only rerun on listed deps
}, [])

  const totalPages = Math.ceil(total / 15)
  
  const getTrialStatus = (trialEnds: string | null, plan: string) => {
  if (!trialEnds || plan !== 'trial') {
    return { text: '—', color: 'text-gray-500' }
  }

  const endDate = new Date(trialEnds)
  const today = new Date()
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return { text: 'Expired', color: 'text-red-600' }
  } else if (daysLeft <= 7) {
    return { text: `${daysLeft} days`, color: 'text-amber-600' }
  } else {
    return { text: `${daysLeft} days`, color: 'text-green-600' }
  }
}
  

  const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    trial: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
    lifetime: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
  }
  return badges[status] || 'bg-gray-100 text-gray-600'
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-amber-600 uppercase mb-2">Super Admin</p>
            <h1 className="text-4xl font-bold text-gray-900">All Tenants</h1>
            <p className="text-gray-600 mt-2">
              {total} companies registered
              {lastRefresh && (
                <span className="text-xs text-gray-500 ml-3">
                  • Updated {lastRefresh.toLocaleTimeString('en-IN')}
                </span>
              )}
            </p>
            <p className="text-sm text-red-600 font-semibold mt-1">
  {tenants.filter(t => t.trial_ends && new Date(t.trial_ends) < new Date()).length} trial(s) expired
</p>
          </div>
          <button
            onClick={() => fetchTenants()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search companies..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trial Ends</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Loading tenants...</span>
                      </div>
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No tenants found
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => {
                    const trial = getTrialStatus(tenant.trial_ends, tenant.plan)
                    return (
                      <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-amber-600" />
                            <div>
                              <p className="font-semibold text-gray-900">{tenant.name}</p>
                              <p className="text-xs text-gray-500">{tenant.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{tenant.plan || '—'}</p>
                            <p className="text-xs text-gray-500">{tenant.industry || '—'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(tenant.plan_status)}`}>
                             {!tenant.is_active ? 'Inactive' : tenant.plan === 'trial' ? 'Trial' : 'Active'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold ${trial.color}`}>
                          <div className="flex items-center gap-1">
                            {trial.text !== '—' && <Calendar size={13} />}
                            {trial.text}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(tenant.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <TenantActions 
                            tenantId={tenant.id} 
                            isActive={tenant.is_active} 
                            tenantName={tenant.name} 
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages} • {total} total companies
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Previous
                </button>
              )}
              {page < totalPages && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}