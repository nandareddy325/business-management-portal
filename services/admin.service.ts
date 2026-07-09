// services/admin.service.ts
// Client-side Super Admin API calls

import { apiClient } from './api-client'

export const adminClientService = {
  // ── Dashboard ──────────────────────────────────────────
  async getDashboardKPIs() {
    return apiClient.get('/api/admin/dashboard')
  },

  async getRevenueStats() {
    return apiClient.get('/api/admin/revenue')
  },

  async getAnalytics() {
    return apiClient.get('/api/admin/analytics')
  },

  // ── Tenants ────────────────────────────────────────────
  async getAllTenants(page = 1, search?: string) {
    const query = new URLSearchParams({ page: String(page) })
    if (search) query.set('search', search)
    return apiClient.get(`/api/admin/tenants?${query.toString()}`)
  },

  async getTenantById(companyId: string) {
    return apiClient.get(`/api/admin/tenants/${companyId}`)
  },

  async suspendTenant(companyId: string) {
    return apiClient.patch(`/api/admin/tenants/${companyId}/suspend`, {})
  },

  async activateTenant(companyId: string) {
    return apiClient.patch(`/api/admin/tenants/${companyId}/activate`, {})
  },

  // ── Subscriptions ──────────────────────────────────────
  async getAllSubscriptions(page = 1) {
    return apiClient.get(`/api/admin/subscriptions?page=${page}`)
  },

  async overridePlan(companyId: string, planId: string) {
    return apiClient.patch(`/api/admin/tenants/${companyId}/plan`, { plan_id: planId })
  },

  // ── Users ──────────────────────────────────────────────
  async getAllUsers(page = 1) {
    return apiClient.get(`/api/admin/users?page=${page}`)
  },

  // ── Plans ──────────────────────────────────────────────
  async getPlans() {
    return apiClient.get('/api/admin/plans')
  },

  async updatePlan(planId: string, data: Record<string, unknown>) {
    return apiClient.patch(`/api/admin/plans/${planId}`, data)
  },

  // ── Audit Logs ─────────────────────────────────────────
  async getAuditLogs(page = 1, companyId?: string) {
    const query = new URLSearchParams({ page: String(page) })
    if (companyId) query.set('company_id', companyId)
    return apiClient.get(`/api/admin/audit-logs?${query.toString()}`)
  },

  // ── System ─────────────────────────────────────────────
  async getSystemStats() {
    return apiClient.get('/api/admin/system')
  },

  async sendSystemNotification(data: { title: string; message: string; target?: string }) {
    return apiClient.post('/api/admin/notifications', data)
  },
}
