'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]

const ROLE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  admin:        { bg: '#FFFBEB', color: '#B45309', label: '👑 Admin' },
  tenant_admin: { bg: '#FFFBEB', color: '#B45309', label: '👑 Admin' },
  manager:      { bg: '#F5F3FF', color: '#7C3AED', label: '🎯 Manager' },
  employee:     { bg: '#EFF6FF', color: '#2563EB', label: '👤 Staff' },
  super_admin:  { bg: '#FEF2F2', color: '#DC2626', label: '⚡ Super' },
}

const ini = (name: string) => name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

export default function UsersSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles').select('company_id').eq('id', user.id).single()
        if (!profile?.company_id) return
        setCompanyId(profile.company_id)

        // Fetch all profiles in this company
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: true })

        // Fetch employees for extra info
        const { data: employees } = await supabase
          .from('employees')
          .select('user_id, designation, department, permissions, is_active, employee_code')
          .eq('company_id', profile.company_id)

        const empMap: Record<string, any> = {}
        employees?.forEach(e => { empMap[e.user_id] = e })

        const merged = (profiles || []).map(p => ({
          ...p,
          ...(empMap[p.id] || {}),
        }))

        setUsers(merged)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  const admins = users.filter(u => ['admin', 'tenant_admin', 'manager'].includes(u.role)).length
  const staff = users.filter(u => u.role === 'employee').length

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="flex-1 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div>
          <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[4px] mb-1">Settings</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Users & Access</h1>
          <p className="text-sm text-[#9A8F82] mt-1">All users in your company portal.</p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Users', value: users.length,  color: '#7C3AED' },
            { label: 'Admins',      value: admins,         color: '#B8860B' },
            { label: 'Staff',       value: staff,          color: '#2563EB' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
              <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Users Table ── */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

          {/* Search bar */}
          <div className="px-5 py-4 border-b border-[#F0EBE0] flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input type="text" placeholder="Search users..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl pl-8 pr-8 py-2 text-xs text-[#1C1712] placeholder:text-[#C4BAB0] outline-none bg-[#F7F5F1] border border-[#E8E2D8] focus:border-[#B8860B] transition-colors" />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A8F82] text-xs">🔍</span>
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A8F82] hover:text-red-500 text-xs">✕</button>
              )}
            </div>
            <p className="text-[10px] text-[#9A8F82]">
              <span className="font-bold text-[#1C1712]">{filtered.length}</span> of {users.length} users
            </p>
          </div>

          {/* Table — desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  {['#', 'User', 'Email', 'Role', 'Dept / Designation', 'Access', 'Joined'].map(h => (
                    <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const g = GRADIENTS[i % GRADIENTS.length]
                  const roleCfg = ROLE_CONFIG[u.role] ?? { bg: '#F5F0E8', color: '#7A6E60', label: u.role }
                  const perms: string[] = u.permissions || []
                  return (
                    <tr key={u.id}
                      className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors">
                      <td className="pl-5 pr-2 py-3.5">
                        <span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span>
                      </td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                            {ini(u.full_name || u.email)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1C1712]">{u.full_name || '—'}</p>
                            {u.employee_code && (
                              <p className="text-[9px] text-[#B8B0A0] font-mono">{u.employee_code}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-[#7A6E60] truncate max-w-[180px]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.color}30` }}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          {u.designation && <p className="text-xs font-medium text-[#1C1712]">{u.designation}</p>}
                          {u.department && <p className="text-[10px] text-[#9A8F82]">{u.department}</p>}
                          {!u.designation && !u.department && <span className="text-[#C4BAB0]">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {perms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {perms.map(p => {
                              const pColors: Record<string, string> = {
                                pipeline: '#7C3AED', projects: '#EA580C',
                                hr: '#0284C7', finance: '#16A34A',
                              }
                              return (
                                <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                  style={{ background: pColors[p] || '#9A8F82' }}>
                                  {p}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#B8B0A0] px-2 py-0.5 rounded-full bg-[#F5F0E8]">Full</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        <p className="text-[10px] text-[#B8B0A0] whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {filtered.map((u, i) => {
              const g = GRADIENTS[i % GRADIENTS.length]
              const roleCfg = ROLE_CONFIG[u.role] ?? { bg: '#F5F0E8', color: '#7A6E60', label: u.role }
              const perms: string[] = u.permissions || []
              return (
                <div key={u.id} className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
                      {ini(u.full_name || u.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#1C1712] truncate">{u.full_name || '—'}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: roleCfg.bg, color: roleCfg.color }}>
                          {roleCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#9A8F82] mt-0.5 truncate">{u.email}</p>
                      {(u.designation || u.department) && (
                        <p className="text-[10px] text-[#B8B0A0] mt-1">{u.designation} {u.department ? `· ${u.department}` : ''}</p>
                      )}
                      {perms.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {perms.map(p => (
                            <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                              style={{ background: { pipeline: '#7C3AED', projects: '#EA580C', hr: '#0284C7', finance: '#16A34A' }[p] || '#9A8F82' }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-sm font-bold text-[#1C1712]">{search ? 'No results found' : 'No users yet'}</p>
              <p className="text-xs text-[#9A8F82] mt-1">{search ? 'Try a different search' : 'Add employees from HR section'}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between"
            style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">
              <span className="font-bold text-[#1C1712]">{users.length}</span> total users
            </p>
            <p className="text-[10px] text-[#B8B0A0]">
              Add more users via HR → Employees
            </p>
          </div>
        </div>

        {/* ── Info box ── */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black text-[#9A8F82] uppercase tracking-[2px] mb-3">ℹ️ Access Levels</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(ROLE_CONFIG).filter(([k]) => !['super_admin', 'tenant_admin'].includes(k)).map(([key, cfg]) => (
              <div key={key} className="rounded-xl p-3" style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
                <p className="text-xs font-bold mb-1" style={{ color: cfg.color }}>{cfg.label}</p>
                <p className="text-[10px] text-[#9A8F82]">
                  {key === 'admin' ? 'Full access to all modules' :
                   key === 'manager' ? 'Pipeline + Reports access' :
                   'Based on permissions set'}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}