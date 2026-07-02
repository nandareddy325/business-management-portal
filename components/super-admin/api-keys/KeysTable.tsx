// FILE 3: components/super-admin/api-keys/KeysTable.tsx
// ============================================================================
'use client'
import { APIKey } from '@/types/admin'
import { Copy, Trash2 } from 'lucide-react'

interface KeysTableProps {
  keys: APIKey[] | null
  loading?: boolean
}

export function KeysTable({ keys, loading }: KeysTableProps) {
  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading API keys...</div>
  if (!keys || keys.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No API keys found</div>

  return (
    <div className="space-y-3">
      {keys.map(key => (
        <div key={key.id} className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-black/80">{key.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-[10px] font-mono bg-black/5 px-2 py-1 rounded text-black/60">{key.key_prefix}...</code>
                <button className="text-black/40 hover:text-black/60"><Copy size={12} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${key.status === 'active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-black/10 text-black/60'}`}>
                {key.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <button className="p-2 rounded-lg bg-black/5 hover:bg-red-500/10 text-black/40 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-black/50 pt-3 border-t border-black/8 mt-3">
            <div>Created: {new Date(key.created_at).toLocaleDateString()}</div>
            <div>Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

