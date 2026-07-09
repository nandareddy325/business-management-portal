import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Profile {
  role?: string
  company_id?: string
  [key: string]: unknown
}

export function useAuth() {
  const [user, setUser]       = useState<unknown>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      setUser(session.user)
      const { data } = await supabase
        .from('profiles')
        .select('*, companies(name, plan_status)')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    init()
  }, [])

  return {
    user,
    profile,
    loading,
    role:      profile?.role,
    companyId: profile?.company_id,
    isAdmin:   profile?.role === 'tenant_admin',
    isManager: profile?.role === 'manager',
  }
}