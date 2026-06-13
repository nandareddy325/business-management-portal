// services/crm.service.ts
// Client-side CRM API calls — Leads & Customers

import { apiClient } from './api-client'

export type CreateLeadInput = {
  lead_name: string
  phone?: string
  budget?: string
  source?: string
  assigned_to?: string
  industry_id: string
}

export type UpdateLeadInput = Partial<CreateLeadInput> & {
  pipeline_stage?: string
  status?: string
  notes?: string
}

export const crmClientService = {
  // ── Leads ──────────────────────────────────────────────
  async getLeads(params?: {
    stage?: string
    status?: string
    search?: string
    page?: number
    limit?: number
    industry_id?: string
  }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.set(k, String(v))
      })
    }
    return apiClient.get(`/api/crm/leads?${query.toString()}`)
  },

  async getLeadById(leadId: string) {
    return apiClient.get(`/api/crm/leads/${leadId}`)
  },

  async createLead(data: CreateLeadInput) {
    return apiClient.post('/api/crm/leads', data)
  },

  async updateLead(leadId: string, data: UpdateLeadInput) {
    return apiClient.patch(`/api/crm/leads/${leadId}`, data)
  },

  async moveLeadStage(leadId: string, stage: string) {
    return apiClient.patch(`/api/crm/leads/${leadId}/stage`, { stage })
  },

  async assignLead(leadId: string, userId: string) {
    return apiClient.patch(`/api/crm/leads/${leadId}/assign`, { assigned_to: userId })
  },

  async deleteLead(leadId: string) {
    return apiClient.delete(`/api/crm/leads/${leadId}`)
  },

  async getPipelineBoard(industryId: string) {
    return apiClient.get(`/api/crm/pipeline?industry_id=${industryId}`)
  },

  async getDashboardMetrics() {
    return apiClient.get('/api/crm/metrics')
  },

  // ── Customers ──────────────────────────────────────────
  async getCustomers(page = 1) {
    return apiClient.get(`/api/crm/customers?page=${page}`)
  },

  async createCustomer(data: {
    name: string
    email?: string
    phone?: string
    address?: string
  }) {
    return apiClient.post('/api/crm/customers', data)
  },
}
