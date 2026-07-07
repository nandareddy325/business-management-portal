export type IndustrySlug =
  | 'interior-design' | 'real-estate' | 'hospital'
  | 'b2b-business' | 'clinics'

export const INDUSTRY_PATHS: Record<IndustrySlug, string> = {
  'interior-design': '/dashboard/industries/interior-design',
  'real-estate':     '/dashboard/industries/real-estate',
  'hospital':        '/dashboard/industries/hospital',
  'b2b-business':    '/dashboard/industries/b2b-business',
  'clinics':         '/dashboard/industries/clinics',
}

export const INDUSTRY_META: Record<IndustrySlug, { name: string; icon: string; color: string; enabled: boolean }> = {
  'interior-design': { name: 'Interior Design', icon: '🛋️', color: 'purple', enabled: true },
  'real-estate':     { name: 'Real Estate',     icon: '🏠', color: 'blue',   enabled: false },
  'hospital':        { name: 'Hospital',        icon: '🏥', color: 'red',    enabled: false },
  'b2b-business':    { name: 'B2B Business',    icon: '🤝', color: 'amber',  enabled: false },
  'clinics':         { name: 'Clinics',         icon: '🩺', color: 'emerald', enabled: false },
}

// Returns only the industries that are live/ready — use this in sidebar/nav
export function getEnabledIndustries(): IndustrySlug[] {
  return (Object.keys(INDUSTRY_META) as IndustrySlug[]).filter(
    (slug) => INDUSTRY_META[slug].enabled
  )
}

// Quick check for a single industry — use in route guards if needed
export function isIndustryEnabled(slug: IndustrySlug): boolean {
  return INDUSTRY_META[slug].enabled
}
