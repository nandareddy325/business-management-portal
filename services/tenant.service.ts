// services/tenant.service.ts
// Client-side Tenant & Subscription API calls

import { apiClient } from './api-client'

export const tenantClientService = {
  // ── Tenant ─────────────────────────────────────────────
  async getTenantInfo() {
    return apiClient.get('/api/tenant')
  },

  async updateSettings(data: {
    name?: string
    phone?: string
    email?: string
  }) {
    return apiClient.patch('/api/tenant/settings', data)
  },

  async getTeamMembers() {
    return apiClient.get('/api/tenant/users')
  },

  async inviteUser(data: {
    email: string
    full_name: string
    role: 'manager' | 'employee'
  }) {
    return apiClient.post('/api/tenant/users/invite', data)
  },

  async updateUserRole(userId: string, role: string) {
    return apiClient.patch(`/api/tenant/users/${userId}/role`, { role })
  },

  async deactivateUser(userId: string) {
    return apiClient.patch(`/api/tenant/users/${userId}/deactivate`, {})
  },

  // ── Subscription ───────────────────────────────────────
  async getSubscriptionStatus() {
    return apiClient.get('/api/subscription')
  },

  async getAllPlans() {
    return apiClient.get('/api/subscription/plans')
  },

  async cancelSubscription() {
    return apiClient.post('/api/subscription/cancel', {})
  },

  // ── Industries ─────────────────────────────────────────
  async getMyIndustries() {
    return apiClient.get('/api/tenant/industries')
  },

  async purchaseIndustry(industryId: string) {
    return apiClient.post('/api/tenant/industries', { industry_id: industryId })
  },
}
