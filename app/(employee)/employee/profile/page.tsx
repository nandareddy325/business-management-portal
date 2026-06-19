import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, Building, Briefcase, Calendar, Wallet } from 'lucide-react'
import ChangePasswordCard from '@/components/settings/ChangePasswordCard'

export const dynamic = 'force-dynamic'

export default async function EmployeeProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('email', user.email!)
    .single()

  if (!employee) redirect('/employee')

  const initials = employee.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-[#F7F5F1]">

      {/* Hero */}
      <div className="bg-[#1C1712] px-6 py-5 relative overflow-hidden">
        <div className="absolute -right-5 -top-5 w-32 h-32 rounded-full border border-[#B8860B]/10" />
        <div className="max-w-lg mx-auto">
          <Link href="/employee" className="text-white/35 text-[11px] flex items-center gap-1 mb-2 w-fit hover:text-white/60 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to portal
          </Link>
          <h1 className="text-[20px] font-semibold text-white">My profile</h1>
          <p className="text-[12px] text-white/30 mt-0.5">Personal & employment details</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2.5">

        {/* Avatar Card */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F0EBE0] border-2 border-[#E8DFC8] flex items-center justify-center text-[26px] font-medium text-[#B8860B] flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-[18px] font-medium text-[#1C1712]">{employee.full_name}</h2>
            <p className="text-[12px] text-[#7A6E60] mt-0.5">
              {employee.designation ?? 'Employee'} · {employee.department ?? '—'}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
                {employee.employee_code ?? employee.employee_id ?? 'N/A'}
              </span>
              {employee.is_active && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2D9C8]">
            <p className="text-[10px] tracking-[2px] text-[#7A6E60] font-medium uppercase">Personal information</p>
          </div>
          {[
            { label: 'Full name', value: employee.full_name,   Icon: User },
            { label: 'Email',     value: employee.email,        Icon: Mail },
            { label: 'Phone',     value: employee.phone ?? '—', Icon: Phone },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBE0] last:border-0">
              <span className="text-[11px] text-[#7A6E60] flex items-center gap-1.5">
                <item.Icon className="w-3.5 h-3.5" /> {item.label}
              </span>
              <span className="text-[13px] font-medium text-[#1C1712] max-w-[200px] text-right truncate">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Employment Details */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2D9C8]">
            <p className="text-[10px] tracking-[2px] text-[#7A6E60] font-medium uppercase">Employment details</p>
          </div>
          {[
            { label: 'Department',  value: employee.department  ?? '—', Icon: Building },
            { label: 'Designation', value: employee.designation ?? '—', Icon: Briefcase },
            {
              label: 'Join date',
              value: employee.join_date
                ? new Date(employee.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—',
              Icon: Calendar,
            },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBE0] last:border-0">
              <span className="text-[11px] text-[#7A6E60] flex items-center gap-1.5">
                <item.Icon className="w-3.5 h-3.5" /> {item.label}
              </span>
              <span className="text-[13px] font-medium text-[#1C1712]">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Salary */}
        {employee.salary && (
          <div className="bg-[#1C1712] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-white/40 mb-1">Monthly salary</p>
              <p className="text-[22px] font-medium text-[#B8860B]">
                ₹{Number(employee.salary).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#B8860B]/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#B8860B]" />
            </div>
          </div>
        )}

        {/* ✅ Change Password Card */}
        <ChangePasswordCard />

        {/* Back Button */}
        <Link href="/employee"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#E2D9C8] text-sm text-[#7A6E60] hover:bg-[#F5F0E8] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

      </div>
    </div>
  )
}