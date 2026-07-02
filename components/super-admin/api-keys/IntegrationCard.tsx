// FILE 4: components/super-admin/api-keys/IntegrationCard.tsx
// ============================================================================
interface Integration {
  name: string
  status: 'connected' | 'available'
  description: string
  icon: React.ReactNode
  users?: number
}

interface IntegrationCardProps {
  integration: Integration
  onConnect?: () => void
  onManage?: () => void
}

export function IntegrationCard({ integration, onConnect, onManage }: IntegrationCardProps) {
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
          <p className="text-[10px] font-semibold text-black/60 mb-3">{integration.users} connection{integration.users !== 1 ? 's' : ''}</p>
          <button className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-black/70 hover:text-black bg-black/5 hover:bg-black/10 transition-all" onClick={onManage}>
            Manage
          </button>
        </div>
      ) : (
        <button className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 transition-all" onClick={onConnect}>
          Connect
        </button>
      )}
    </div>
  )
}

