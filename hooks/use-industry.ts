import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useIndustryAccess(companyId: string | null) {
  const [industries, setIndustries] = useState<string[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!companyId) { setLoading(false); return }
    supabase
      .from('company_industries')
      .select('industries(slug)')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .then(({ data }) => {
        setIndustries((data || []).map((d: any) => d.industries?.slug).filter(Boolean))
        setLoading(false)
      })
  }, [companyId])

  const hasAccess = (slug: string) => industries.includes(slug)
  return { industries, hasAccess, loading }
}