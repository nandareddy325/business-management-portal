export const PLANS = {
  starter:      { maxUsers: 10,  maxLeads: 500, maxIndustries: 1 },
  professional: { maxUsers: 20,  maxLeads: -1,  maxIndustries: 3 },
  business:     { maxUsers: 50,  maxLeads: -1,  maxIndustries: 5 },
  enterprise:   { maxUsers: -1,  maxLeads: -1,  maxIndustries: -1 },
} as const