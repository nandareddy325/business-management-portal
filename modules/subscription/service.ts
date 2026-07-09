import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Repository ─────────────────────────────────────────────
export const subscriptionRepository = {
  async getPlanByCompany(companyId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('companies')
      .select('plan_status, trial_ends_at, subscription_id, plan:plans(*)')
      .eq('id', companyId)
      .single()
    if (error) return null
    return data
  },

  async getAllPlans() {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price_monthly')
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async updateCompanyPlan(companyId: string, planId: string, subscriptionId: string) {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('companies')
      .update({ plan_id: planId, subscription_id: subscriptionId, plan_status: 'active' })
      .eq('id', companyId)
  },

  async setTrialExpired(companyId: string) {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('companies')
      .update({ plan_status: 'expired' })
      .eq('id', companyId)
  },
}

// ── Service ────────────────────────────────────────────────
export const subscriptionService = {
  async getStatus(companyId: string) {
    const data = await subscriptionRepository.getPlanByCompany(companyId)
    if (!data) return { status: 'none', plan: null, isActive: false, isTrialing: false }

    const isTrialing = data.plan_status === 'trial'
    const trialExpired = isTrialing && data.trial_ends_at
      ? new Date(data.trial_ends_at) < new Date()
      : false

    return {
      status: trialExpired ? 'trial_expired' : data.plan_status,
      plan: data.plan,
      isActive: data.plan_status === 'active',
      isTrialing: isTrialing && !trialExpired,
      trialEndsAt: data.trial_ends_at,
      subscriptionId: data.subscription_id,
    }
  },

  async canAddUser(companyId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('companies')
      .select('plan:plans(max_users)')
      .eq('id', companyId)
      .single()

    const maxUsers = (data?.plan as { max_users?: number } | null)?.max_users ?? 5
    if (maxUsers === -1) return true // unlimited

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true)

    return (count ?? 0) < maxUsers
  },

  async canAddLead(companyId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('companies')
      .select('plan:plans(max_leads)')
      .eq('id', companyId)
      .single()

    const maxLeads = (data?.plan as { max_leads?: number } | null)?.max_leads ?? 500
    if (maxLeads === -1) return true // unlimited

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', startOfMonth.toISOString())

    return (count ?? 0) < maxLeads
  },

  async hasFeature(companyId: string, feature: 'hrms' | 'billing' | 'realtime' | 'api' | 'branding'): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('companies')
      .select('plan:plans(name)')
      .eq('id', companyId)
      .single()

    const plan = (data?.plan as { name?: string } | null)?.name
    const featureMatrix: Record<string, string[]> = {
      starter: [],
      professional: ['hrms', 'billing', 'realtime'],
      business: ['hrms', 'billing', 'realtime', 'api', 'branding'],
      enterprise: ['hrms', 'billing', 'realtime', 'api', 'branding'],
    }
    return featureMatrix[plan]?.includes(feature) ?? false
  },

  async getAllPlans() {
    return subscriptionRepository.getAllPlans()
  },

  async createRazorpayOrder(planId: string, companyId: string, isYearly: boolean) {
    const supabase = await createServerSupabaseClient()
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (!plan) throw new Error('Plan not found')

    const amount = isYearly ? plan.price_yearly : plan.price_monthly
    const amountInPaise = Math.round(Number(amount) * 100)

    // Call your API route which uses Razorpay server SDK
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountInPaise, planId, companyId }),
    })
    return res.json()
  },
}
