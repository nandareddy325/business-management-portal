import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useIndustryAccess(companyId: string | null) {
  const [industries, setIndustries] = useState<string[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount/route-driven sync, not a render-time side effect
    if (!companyId) { setLoading(false); return }
    supabase
      .from('company_industries')
      .select('industries(slug)')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .then(({ data }) => {
        setIndustries((data || []).map((d: { industries?: { slug?: string }[] }) => d.industries?.[0]?.slug).filter(Boolean) as string[])
        setLoading(false)
      })
  }, [companyId])

  const hasAccess = (slug: string) => industries.includes(slug)
  return { industries, hasAccess, loading }
}