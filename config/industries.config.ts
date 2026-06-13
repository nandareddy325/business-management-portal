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

export const INDUSTRY_META: Record<IndustrySlug, { name: string; icon: string; color: string }> = {
  'interior-design': { name: 'Interior Design', icon: '🛋️', color: 'purple' },
  'real-estate':     { name: 'Real Estate',     icon: '🏠', color: 'blue' },
  'hospital':        { name: 'Hospital',         icon: '🏥', color: 'red' },
  'b2b-business':    { name: 'B2B Business',    icon: '🤝', color: 'amber' },
  'clinics':         { name: 'Clinics',          icon: '🩺', color: 'emerald' },
}