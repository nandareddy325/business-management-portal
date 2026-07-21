import { hrRepository, type AttendanceStatus } from './repository'
import { subscriptionService } from '@/modules/subscription/service'

export const hrService = {
  async getEmployees(companyId: string, page = 1) {
    return hrRepository.getEmployees(companyId, page)
  },

  async addEmployee(companyId: string, input: {
    full_name: string
    email?: string
    phone?: string
    designation?: string
    department?: string
    salary?: number
    join_date?: string
  }) {
    // Starter plan lo kuda employee add cheయగలరు — count limit మాత్రమే check
    const canAdd = await subscriptionService.canAddUser(companyId)
    if (!canAdd) {
      throw new Error('User limit reached for your plan. Upgrade to add more team members.')
    }

    // Full HRMS module (salary, payslip-tied fields) unlock ఐతేనే ఆ fields save చేయి
    const hasHrms = await subscriptionService.hasFeature(companyId, 'hrms')
    const safeInput = hasHrms
      ? input
      : {
          full_name: input.full_name,
          email: input.email,
          phone: input.phone,
          designation: input.designation,
          department: input.department,
          // salary, join_date strip చేయబడ్డాయి — Starter plan లో HRMS fields save కావు
        }

    return hrRepository.createEmployee({ company_id: companyId, ...safeInput })
  },

  async markBulkAttendance(companyId: string, date: string, records: {
    employee_id: string
    status: AttendanceStatus
    check_in?: string
    check_out?: string
  }[]) {
    const hasHrms = await subscriptionService.hasFeature(companyId, 'hrms')
    if (!hasHrms) {
      throw new Error('Attendance tracking requires Professional plan or higher.')
    }

    const results = await Promise.allSettled(
      records.map(r =>
        hrRepository.markAttendance({ company_id: companyId, date, ...r })
      )
    )
    const failed = results.filter(r => r.status === 'rejected').length
    return { total: records.length, failed, success: records.length - failed }
  },

  async getTodayAttendance(companyId: string) {
    const hasHrms = await subscriptionService.hasFeature(companyId, 'hrms')
    if (!hasHrms) throw new Error('Attendance tracking requires Professional plan or higher.')

    const today = new Date().toISOString().split('T')[0]
    const [employees, attendance] = await Promise.all([
      hrRepository.getEmployees(companyId, 1, 200),
      hrRepository.getAttendanceByDate(companyId, today),
    ])

    const markedIds = new Set(attendance.map((a: { employee_id: string }) => a.employee_id))
    const unmarked = employees.data.filter((e: { id: string }) => !markedIds.has(e.id))

    return { attendance, unmarked, date: today }
  },

  async getMonthlyReport(companyId: string, month: string) {
    const hasHrms = await subscriptionService.hasFeature(companyId, 'hrms')
    if (!hasHrms) throw new Error('Reports require Professional plan or higher.')

    const [{ data: employees }, summary] = await Promise.all([
      hrRepository.getEmployees(companyId, 1, 200),
      hrRepository.getMonthlyAttendanceSummary(companyId, month),
    ])

    return employees.map((emp: { id: string; [key: string]: unknown }) => ({
      ...emp,
      attendance: summary[emp.id] ?? { present: 0, absent: 0, half_day: 0, leave: 0 },
    }))
  },

  async getEmployeeProfile(companyId: string, employeeId: string, month: string) {
    const hasHrms = await subscriptionService.hasFeature(companyId, 'hrms')
    if (!hasHrms) throw new Error('This feature requires Professional plan or higher.')

    const [employee, attendance] = await Promise.all([
      hrRepository.getEmployeeById(companyId, employeeId),
      hrRepository.getEmployeeAttendance(companyId, employeeId, month),
    ])
    if (!employee) throw new Error('Employee not found')

    const stats = attendance.reduce((acc: Record<string, number>, r: { status: string }) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {})

    return { employee, attendance, stats }
  },
}