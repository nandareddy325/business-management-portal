'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAPIKeys } from '@/lib/supabase/queries/admin'
import { Zap, GitBranch, Webhook } from 'lucide-react'
import { KeysTable, IntegrationCard, GenerateKeyModal } from '@/components/super-admin/api-keys'

export default async function APIKeysPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: keys } = await getAPIKeys(supabase, profile.company_id)
  const activeCount = keys?.filter(k => k.status === 'active').length ?? 0

  // These third-party integrations need their own OAuth app credentials
  // (Zapier app, GitHub OAuth app) to actually connect — not yet configured.
  // Shown as "available" rather than falsely claiming "connected".
  const integrations = [
    { name: 'Zapier', status: 'available' as const, description: 'Workflow automation', icon: <Zap size={18} className="text-amber-600" /> },
    { name: 'GitHub', status: 'available' as const, description: 'Repository sync', icon: <GitBranch size={18} className="text-black/60" /> },
    { name: 'Webhooks', status: activeCount > 0 ? 'connected' as const : 'available' as const, description: 'Real-time events via your API keys', icon: <Webhook size={18} className="text-blue-600" />, users: activeCount },
  ]

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-[#1C1712]">API Keys & Integrations</h1>
          <GenerateKeyModal />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-[#1C1712] mb-4">API Keys</h2>
          <KeysTable keys={keys} />
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#1C1712] mb-4">Integrations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map(int => (
              <IntegrationCard key={int.name} integration={int} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
