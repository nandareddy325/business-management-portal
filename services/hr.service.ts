// services/hr.service.ts
// Client-side HR & Attendance API calls

import { apiClient } from './api-client'

export type AttendanceRecord = {
  employee_id: string
  status: 'present' | 'absent' | 'half_day' | 'leave'
  check_in?: string
  check_out?: string
}

export const hrClientService = {
  // ── Employees ──────────────────────────────────────────
  async getEmployees(page = 1) {
    return apiClient.get(`/api/hr/employees?page=${page}`)
  },

  async getEmployeeById(employeeId: string) {
    return apiClient.get(`/api/hr/employees/${employeeId}`)
  },

  async createEmployee(data: {
    full_name: string
    email?: string
    phone?: string
    designation?: string
    department?: string
    salary?: number
    join_date?: string
  }) {
    return apiClient.post('/api/hr/employees', data)
  },

  async updateEmployee(employeeId: string, data: Record<string, unknown>) {
    return apiClient.patch(`/api/hr/employees/${employeeId}`, data)
  },

  async deactivateEmployee(employeeId: string) {
    return apiClient.patch(`/api/hr/employees/${employeeId}`, { is_active: false })
  },

  // ── Attendance ──────────────────────────────────────────
  async getTodayAttendance() {
    return apiClient.get('/api/hr/attendance/today')
  },

  async markAttendance(date: string, records: AttendanceRecord[]) {
    return apiClient.post('/api/hr/attendance', { date, records })
  },

  async getMonthlyAttendance(month: string) {
    // month = "2026-06"
    return apiClient.get(`/api/hr/attendance/monthly?month=${month}`)
  },

  async getEmployeeAttendance(employeeId: string, month: string) {
    return apiClient.get(`/api/hr/employees/${employeeId}/attendance?month=${month}`)
  },

  async getMonthlyReport(month: string) {
    return apiClient.get(`/api/hr/reports/monthly?month=${month}`)
  },
}
