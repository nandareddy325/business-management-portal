import { createServerSupabaseClient } from '@/lib/supabase/server'

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave'

export const hrRepository = {
  // ── Employees ──────────────────────────────────────────
  async getEmployees(companyId: string, page = 1, limit = 20) {
    const supabase = await createServerSupabaseClient()
    const from = (page - 1) * limit
    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('full_name')
      .range(from, from + limit - 1)
    if (error) throw new Error(error.message)
    return { data: data ?? [], total: count ?? 0 }
  },

  async getEmployeeById(companyId: string, employeeId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', employeeId)
      .single()
    if (error) return null
    return data
  },

  async createEmployee(employee: {
    company_id: string
    full_name: string
    email?: string
    phone?: string
    designation?: string
    department?: string
    salary?: number
    join_date?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('employees')
      .insert({ ...employee, is_active: true })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updateEmployee(companyId: string, employeeId: string, updates: Record<string, unknown>) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('company_id', companyId)
      .eq('id', employeeId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  // ── Attendance ──────────────────────────────────────────
  async markAttendance(record: {
    company_id: string
    employee_id: string
    date: string
    status: AttendanceStatus
    check_in?: string
    check_out?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('attendance')
      .upsert(record, { onConflict: 'employee_id,date' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async getAttendanceByDate(companyId: string, date: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('attendance')
      .select('*, employee:employees(full_name, designation, department)')
      .eq('company_id', companyId)
      .eq('date', date)
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getEmployeeAttendance(companyId: string, employeeId: string, month: string) {
    // month format: "2026-06"
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('company_id', companyId)
      .eq('employee_id', employeeId)
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`)
      .order('date')
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getMonthlyAttendanceSummary(companyId: string, month: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('attendance')
      .select('employee_id, status')
      .eq('company_id', companyId)
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`)

    if (!data) return {}

    const summary: Record<string, Record<string, number>> = {}
    for (const row of data) {
      if (!summary[row.employee_id]) {
        summary[row.employee_id] = { present: 0, absent: 0, half_day: 0, leave: 0 }
      }
      summary[row.employee_id][row.status] = (summary[row.employee_id][row.status] ?? 0) + 1
    }
    return summary
  },
}
