import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Company } from '@/types/database'

export const tenantRepository = {
  async getCompanyById(companyId: string): Promise<Company | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*, plan:plans(*)')
      .eq('id', companyId)
      .single()
    if (error) return null
    return data
  },

  async getCompanyBySlug(slug: string): Promise<Company | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) return null
    return data
  },

  async updateCompany(companyId: string, updates: Partial<Company>): Promise<Company | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async getCompanyIndustries(companyId: string): Promise<string[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('company_industries')
      .select('industry:industries(slug)')
      .eq('company_id', companyId)
      .eq('is_active', true)
    if (error) return []
    return data.map((row: { industry?: { slug?: string }[] }) => row.industry?.[0]?.slug).filter(Boolean)
  },

  async addIndustryAccess(companyId: string, industryId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    await supabase.from('company_industries').upsert({
      company_id: companyId,
      industry_id: industryId,
      is_active: true,
      purchased_at: new Date().toISOString(),
    })
  },

  async getCompanyUsers(companyId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async countActiveUsers(companyId: string): Promise<number> {
    const supabase = await createServerSupabaseClient()
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true)
    return count ?? 0
  },

  async getAllCompanies(page = 1, limit = 20) {
    const supabase = await createServerSupabaseClient()
    const from = (page - 1) * limit
    const { data, error, count } = await supabase
      .from('companies')
      .select('*, plan:plans(name, price_monthly)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) throw new Error(error.message)
    return { data: data ?? [], total: count ?? 0 }
  },

  async suspendCompany(companyId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('companies')
      .update({ is_active: false })
      .eq('id', companyId)
  },

  async activateCompany(companyId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('companies')
      .update({ is_active: true })
      .eq('id', companyId)
  },
}
