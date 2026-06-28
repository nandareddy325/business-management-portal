// app/subscription/renew/page.tsx — NEW server wrapper
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionRenewClient from './renew-client'

export default async function SubscriptionRenewPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return <SubscriptionRenewClient />
  
  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  
  if (profile?.company_id) {
    const { data: company } = await supabase
      .from('companies').select('plan').eq('id', profile.company_id).single()
    
    if (company?.plan === 'lifetime') {
      redirect('/dashboard/industries/interior-design/dashboard')
    }
  }
  
  return <SubscriptionRenewClient />
}