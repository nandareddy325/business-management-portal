import { createServerSupabaseClient } from '@/lib/supabase/server'

export type PlanId = 'starter' | 'professional' | 'business' | 'lifetime'
export type PlanFeature = 'hrms' | 'billing' | 'realtime' | 'api' | 'branding'

const FEATURE_MATRIX: Record<PlanId, PlanFeature[]> = {
  starter: [],
  professional: ['hrms', 'billing', 'realtime'],
  business: ['hrms', 'billing', 'realtime', 'api', 'branding'],
  lifetime: ['hrms', 'billing', 'realtime', 'api', 'branding'],
}

const LEAD_LIMITS: Record<PlanId, number> = {
  starter: 500,
  professional: -1,
  business: -1,
  lifetime: -1,
}

const PLAN_RANK: Record<PlanId, number> = {
  starter: 1, professional: 2, business: 3, lifetime: 4,
}

// ── Repository ─────────────────────────────────────────────
export const subscriptionRepository = {
  async getSubscription(companyId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .single()
    if (error) return null
    return data
  },
}

// ── Service ────────────────────────────────────────────────
export const subscriptionService = {
  async getStatus(companyId: string) {
    const sub = await subscriptionRepository.getSubscription(companyId)
    if (!sub) return { status: 'none', planConfig: null, isActive: false, isTrialing: false }

    const isTrialing = sub.status === 'trial'
    const trialExpired = isTrialing && sub.trial_ends_at
      ? new Date(sub.trial_ends_at) < new Date()
      : false

    return {
      status: trialExpired ? 'trial_expired' : sub.status,
      planConfig: sub.plan_config as Record<string, PlanId>,
      isActive: sub.status === 'active',
      isTrialing: isTrialing && !trialExpired,
      trialEndsAt: sub.trial_ends_at,
      maxUsers: sub.max_users,
      billingCycle: sub.billing_cycle,
    }
  },

  // ఒక్క నిర్దిష్ట industry కి ఏ plan ఉందో చెక్ చేయడానికి
  async getPlanForIndustry(companyId: string, industry: string): Promise<PlanId | null> {
    const sub = await subscriptionRepository.getSubscription(companyId)
    if (!sub?.plan_config) return null
    const config = sub.plan_config as Record<string, PlanId>
    return config[industry] ?? null
  },

  // Company subscribe చేసిన అన్ని industries లో అత్యధిక plan —
  // company-wide features (HRMS లాంటివి) కోసం వాడాలి
  async getHighestPlan(companyId: string): Promise<PlanId | null> {
    const sub = await subscriptionRepository.getSubscription(companyId)
    if (!sub?.plan_config) return null
    const config = sub.plan_config as Record<string, PlanId>
    const plans = Object.values(config)
    if (!plans.length) return null
    return plans.reduce((best, p) => (PLAN_RANK[p] > PLAN_RANK[best] ? p : best))
  },

  async canAddUser(companyId: string): Promise<boolean> {
    const sub = await subscriptionRepository.getSubscription(companyId)
    if (!sub) return false
    if (sub.max_users === -1) return true

    const supabase = await createServerSupabaseClient()
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true)

    return (count ?? 0) < (sub.max_users ?? 5)
  },

  async canAddLead(companyId: string, industry: string): Promise<boolean> {
    const plan = await this.getPlanForIndustry(companyId, industry)
    if (!plan) return false
    const maxLeads = LEAD_LIMITS[plan]
    if (maxLeads === -1) return true

    const supabase = await createServerSupabaseClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('leads')                    // fixed: crm_leads -> leads
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', startOfMonth.toISOString())

    return (count ?? 0) < maxLeads
  },

  // industry pass చేయకపోతే, company యొక్క highest plan వాడుతుంది
  // (HRMS లాంటి company-wide features కి idi సరిపోతుంది)
  async hasFeature(companyId: string, feature: PlanFeature, industry?: string): Promise<boolean> {
    const plan = industry
      ? await this.getPlanForIndustry(companyId, industry)
      : await this.getHighestPlan(companyId)

    if (!plan) return false
    return FEATURE_MATRIX[plan]?.includes(feature) ?? false
  },
}