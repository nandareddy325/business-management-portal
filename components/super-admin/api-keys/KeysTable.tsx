// FILE 3: components/super-admin/api-keys/KeysTable.tsx
// ============================================================================
'use client'
import { useState, useTransition } from 'react'
import { APIKey } from '@/types/admin'
import { Copy, Check, Trash2, Ban, Loader2 } from 'lucide-react'
import { revokeAPIKeyAction, deleteAPIKeyAction } from '@/app/(super-admin)/admin/api-keys/actions'

interface KeysTableProps {
  keys: APIKey[] | null
  loading?: boolean
}

export function KeysTable({ keys, loading }: KeysTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading API keys...</div>
  if (!keys || keys.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No API keys found</div>

  async function handleCopyPrefix(key: APIKey) {
    try {
      await navigator.clipboard.writeText(key.key_prefix)
      setCopiedId(key.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setError('Could not copy')
    }
  }

  function handleRevoke(key: APIKey) {
    if (!confirm(`Revoke "${key.name}"? Any app using this key will stop working immediately.`)) return
    setPendingId(key.id)
    setError('')
    startTransition(async () => {
      const result = await revokeAPIKeyAction(key.id, key.name)
      setPendingId(null)
      if (result.error) setError(result.error)
    })
  }

  function handleDelete(key: APIKey) {
    if (!confirm(`Permanently delete "${key.name}"? This can't be undone.`)) return
    setPendingId(key.id)
    setError('')
    startTransition(async () => {
      const result = await deleteAPIKeyAction(key.id, key.name)
      setPendingId(null)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      {keys.map(key => {
        const busy = isPending && pendingId === key.id
        return (
          <div key={key.id} className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-black/80">{key.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[10px] font-mono bg-black/5 px-2 py-1 rounded text-black/60">{key.key_prefix}...</code>
                  <button onClick={() => handleCopyPrefix(key)} className="text-black/40 hover:text-black/60" title="Copy key prefix">
                    {copiedId === key.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                  <span className="text-[10px] font-semibold text-black/40 uppercase">{key.environment}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  key.status === 'active' ? 'bg-emerald-500/10 text-emerald-700'
                    : key.status === 'revoked' ? 'bg-red-500/10 text-red-600'
                    : 'bg-black/10 text-black/60'
                }`}>
                  {key.status === 'active' ? 'Active' : key.status === 'revoked' ? 'Revoked' : 'Inactive'}
                </span>
                {key.status === 'active' && (
                  <button
                    onClick={() => handleRevoke(key)}
                    disabled={busy}
                    className="p-2 rounded-lg bg-black/5 hover:bg-amber-500/10 text-black/40 hover:text-amber-600 disabled:opacity-50"
                    title="Revoke key"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(key)}
                  disabled={busy}
                  className="p-2 rounded-lg bg-black/5 hover:bg-red-500/10 text-black/40 hover:text-red-600 disabled:opacity-50"
                  title="Delete permanently"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-black/50 pt-3 border-t border-black/8 mt-3">
              <div>Created: {new Date(key.created_at).toLocaleDateString()}</div>
              <div>Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
