export const PLANS = {
  starter: {
    maxUsers: 10, maxLeads: 500, maxIndustries: 1,
    features: {
      hrms_attendance: false,
      gst_billing: false,
      advanced_reports: false,
      realtime_dashboard: false,
      priority_support: false,
    },
  },
  professional: {
    maxUsers: 20, maxLeads: -1, maxIndustries: 3,
    features: {
      hrms_attendance: true,
      gst_billing: true,
      advanced_reports: true,
      realtime_dashboard: true,
      priority_support: true,
    },
  },
  business: {
    maxUsers: 50, maxLeads: -1, maxIndustries: 5,
    features: {
      hrms_attendance: true,
      gst_billing: true,
      advanced_reports: true,
      realtime_dashboard: true,
      priority_support: true,
    },
  },
  enterprise: {
    maxUsers: -1, maxLeads: -1, maxIndustries: -1,
    features: {
      hrms_attendance: true,
      gst_billing: true,
      advanced_reports: true,
      realtime_dashboard: true,
      priority_support: true,
    },
  },
} as const

export type PlanId = keyof typeof PLANS
export type PlanFeature = keyof typeof PLANS.starter.features

export function hasFeature(plan: PlanId, feature: PlanFeature): boolean {
  return PLANS[plan]?.features[feature] ?? false
}