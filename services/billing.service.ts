// services/billing.service.ts
// Client-side Billing API calls — Invoices & Payments

import { apiClient } from './api-client'

export type LineItem = {
  description: string
  quantity: number
  rate: number
  amount: number
}

export type CreateInvoiceInput = {
  customer_id: string
  items: LineItem[]
  due_date?: string
  send_now?: boolean
}

export const billingClientService = {
  // ── Invoices ───────────────────────────────────────────
  async getInvoices(params?: {
    status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue'
    page?: number
  }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.page) query.set('page', String(params.page))
    return apiClient.get(`/api/billing/invoices?${query.toString()}`)
  },

  async getInvoiceById(invoiceId: string) {
    return apiClient.get(`/api/billing/invoices/${invoiceId}`)
  },

  async createInvoice(data: CreateInvoiceInput) {
    return apiClient.post('/api/billing/invoices', data)
  },

  async updateInvoice(invoiceId: string, data: Partial<CreateInvoiceInput>) {
    return apiClient.patch(`/api/billing/invoices/${invoiceId}`, data)
  },

  async sendInvoice(invoiceId: string) {
    return apiClient.post(`/api/billing/invoices/${invoiceId}/send`, {})
  },

  async recordPayment(invoiceId: string, amount: number) {
    return apiClient.post(`/api/billing/invoices/${invoiceId}/payment`, { amount })
  },

  async getRevenueSummary() {
    return apiClient.get('/api/billing/summary')
  },

  // ── Razorpay ───────────────────────────────────────────
  async createRazorpayOrder(planId: string, isYearly: boolean) {
    return apiClient.post('/api/razorpay/create-order', { planId, isYearly })
  },

  async verifyRazorpayPayment(data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    plan_id: string
  }) {
    return apiClient.post('/api/razorpay/verify', data)
  },
}
