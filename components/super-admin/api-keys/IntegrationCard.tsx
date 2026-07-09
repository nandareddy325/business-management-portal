// FILE 4: components/super-admin/api-keys/IntegrationCard.tsx
// ============================================================================
'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

interface Integration {
  name: string
  status: 'connected' | 'available'
  description: string
  icon: React.ReactNode
  users?: number
}

interface IntegrationCardProps {
  integration: Integration
}

const NOTES: Record<string, string> = {
  Zapier: 'Not connected yet — wiring this up needs a Zapier app registered under GK CRM. Ping the dev team to enable it.',
  GitHub: 'Not connected yet — needs a GitHub OAuth app registered under GK CRM. Ping the dev team to enable it.',
  Webhooks: 'Webhooks authenticate using your API keys above. Generate an active key, then point your endpoint at it.',
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const [showNote, setShowNote] = useState(false)
  const isConnected = integration.status === 'connected'

  return (
    <div className={`rounded-2xl ring-1 p-5 shadow-sm transition-all ${isConnected ? 'bg-white ring-black/8' : 'bg-black/2 ring-black/8'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? 'bg-amber-100' : 'bg-black/10'}`}>
          {integration.icon}
        </div>
        {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
      </div>
      <h3 className="text-sm font-semibold text-black/80 mb-1">{integration.name}</h3>
      <p className="text-xs text-black/50 mb-4">{integration.description}</p>

      {isConnected ? (
        <div>
          <p className="text-[10px] font-semibold text-black/60 mb-3">
            {integration.users} active key{integration.users !== 1 ? 's' : ''}
          </p>
          <button
            className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-black/70 hover:text-black bg-black/5 hover:bg-black/10 transition-all"
            onClick={() => setShowNote(v => !v)}
          >
            Manage
          </button>
        </div>
      ) : (
        <button
          className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
          onClick={() => setShowNote(v => !v)}
        >
          Connect
        </button>
      )}

      {showNote && (
        <div className="mt-3 flex items-start gap-1.5 bg-black/5 rounded-lg px-2.5 py-2">
          <Info size={12} className="text-black/40 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-black/60 leading-relaxed">{NOTES[integration.name]}</p>
        </div>
      )}
    </div>
  )
}
