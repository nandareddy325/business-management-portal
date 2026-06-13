import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserCheck } from 'lucide-react'
import { AddEmployeeButton } from '@/components/hr/add-employee-button'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/login')

  const { data: employees, count } = await supabase
    .from('employees')
    .select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .order('full_name')

  const departments = [
    ...new Set((employees ?? []).map((e: any) => e.department).filter(Boolean)),
  ]

  const deptColors: Record<string, { bg: string; text: string }> = {
    Design:     { bg: 'bg-blue-50',   text: 'text-blue-700' },
    Sales:      { bg: 'bg-emerald-50',text: 'text-emerald-700' },
    Operations: { bg: 'bg-amber-50',  text: 'text-amber-700' },
    HR:         { bg: 'bg-pink-50',   text: 'text-pink-700' },
    Finance:    { bg: 'bg-purple-50', text: 'text-purple-700' },
    IT:         { bg: 'bg-cyan-50',   text: 'text-cyan-700' },
    Marketing:  { bg: 'bg-orange-50', text: 'text-orange-700' },
    Other:      { bg: 'bg-[#F0EBE0]', text: 'text-[#7A6E60]' },
  }

  const avatarColors = [
    { bg: 'bg-blue-50',    text: 'text-blue-700' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { bg: 'bg-purple-50',  text: 'text-purple-700' },
    { bg: 'bg-amber-50',   text: 'text-amber-700' },
    { bg: 'bg-pink-50',    text: 'text-pink-700' },
    { bg: 'bg-cyan-50',    text: 'text-cyan-700' },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1712]">Employees</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5">
            <span className="text-[#B8860B] font-semibold">{count ?? 0}</span> active employees
          </p>
        </div>
        <AddEmployeeButton companyId={profile.company_id} />
      </div>

      {/* Department chips */}
      {departments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {departments.map((dept) => {
            const deptCount = employees?.filter((e: any) => e.department === dept).length ?? 0
            const style = deptColors[String(dept)] ?? deptColors['Other']
            return (
              <span
                key={String(dept)}
                className={`${style.bg} ${style.text} border border-[#E2D9C8] text-xs font-semibold px-3 py-1 rounded-full`}
              >
                {String(dept)} ({deptCount})
              </span>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2D9C8] text-left">
              {['Employee', 'Designation', 'Department', 'Phone', 'Joined'].map(h => (
                <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[#7A6E60] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(employees ?? []).map((emp: any, i: number) => {
              const av = avatarColors[i % avatarColors.length]
              const deptStyle = deptColors[emp.department] ?? deptColors['Other']
              return (
                <tr key={emp.id} className="hover:bg-[#F5F0E8] transition-colors">

                  {/* Employee */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${av.bg} ${av.text} rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                        {emp.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1C1712]">{emp.full_name}</p>
                        <p className="text-xs text-[#7A6E60]">{emp.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Designation */}
                  <td className="px-5 py-3.5 text-sm text-[#7A6E60]">
                    {emp.designation ?? '—'}
                  </td>

                  {/* Department */}
                  <td className="px-5 py-3.5">
                    {emp.department ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deptStyle.bg} ${deptStyle.text}`}>
                        {emp.department}
                      </span>
                    ) : (
                      <span className="text-[#7A6E60]">—</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-3.5 text-sm text-[#7A6E60]">
                    {emp.phone ?? '—'}
                  </td>

                  {/* Joined */}
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60]">
                    {emp.join_date
                      ? new Date(emp.join_date).toLocaleDateString('en-IN')
                      : '—'}
                  </td>

                </tr>
              )
            })}

            {/* Empty state */}
            {!employees?.length && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-[#7A6E60]" />
                  </div>
                  <p className="text-[#7A6E60] text-sm font-medium">No employees added yet</p>
                  <p className="text-[#B8A99A] text-xs mt-1">Click "+ Add Employee" to get started</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}