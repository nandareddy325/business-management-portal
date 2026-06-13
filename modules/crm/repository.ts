import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Lead, Customer } from '@/types/database'

export type LeadFilters = {
  stage?: string
  status?: string
  assignedTo?: string
  industryId?: string
  search?: string
  page?: number
  limit?: number
}

export const crmRepository = {
  // ── Leads ──────────────────────────────────────────────
  async getLeads(companyId: string, filters: LeadFilters = {}) {
    const supabase = await createServerSupabaseClient()
    const { stage, status, assignedTo, industryId, search, page = 1, limit = 20 } = filters
    const from = (page - 1) * limit

    let query = supabase
      .from('crm_leads')
      .select('*, assigned_user:profiles(full_name, email)', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (stage) query = query.eq('pipeline_stage', stage)
    if (status) query = query.eq('status', status)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)
    if (industryId) query = query.eq('industry_id', industryId)
    if (search) query = query.ilike('lead_name', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return { data: data ?? [], total: count ?? 0 }
  },

  async getLeadById(companyId: string, leadId: string): Promise<Lead | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*, assigned_user:profiles(full_name, email)')
      .eq('company_id', companyId)
      .eq('id', leadId)
      .single()
    if (error) return null
    return data
  },

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('crm_leads')
      .insert(lead)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updateLead(companyId: string, leadId: string, updates: Partial<Lead>): Promise<Lead> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('crm_leads')
      .update(updates)
      .eq('company_id', companyId)
      .eq('id', leadId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updateLeadStage(companyId: string, leadId: string, stage: string, status: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('crm_leads')
      .update({ pipeline_stage: stage, status })
      .eq('company_id', companyId)
      .eq('id', leadId)
  },

  async deleteLead(companyId: string, leadId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('company_id', companyId)
      .eq('id', leadId)
    if (error) throw new Error(error.message)
  },

  async getLeadCountByStage(companyId: string, industryId?: string) {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('crm_leads')
      .select('pipeline_stage')
      .eq('company_id', companyId)
    if (industryId) query = query.eq('industry_id', industryId)
    const { data } = await query
    if (!data) return {}
    return data.reduce((acc: Record<string, number>, row) => {
      acc[row.pipeline_stage] = (acc[row.pipeline_stage] ?? 0) + 1
      return acc
    }, {})
  },

  async getMonthlyLeadCount(companyId: string): Promise<number> {
    const supabase = await createServerSupabaseClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', startOfMonth.toISOString())
    return count ?? 0
  },

  // ── Customers ──────────────────────────────────────────
  async getCustomers(companyId: string, page = 1, limit = 20) {
    const supabase = await createServerSupabaseClient()
    const from = (page - 1) * limit
    const { data, error, count } = await supabase
      .from('crm_customers')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) throw new Error(error.message)
    return { data: data ?? [], total: count ?? 0 }
  },

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('crm_customers')
      .insert(customer)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },
}
