'use client'

import { useState } from 'react'
import { MoreVertical, Power, PowerOff, ExternalLink } from 'lucide-react'

interface TenantActionsProps {
  tenantId: string
  isActive: boolean
  tenantName: string
}

export default function TenantActions({ tenantId, isActive, tenantName }: TenantActionsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} ${tenantName}?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/toggle-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, isActive: !isActive }),
      })
      if (res.ok) window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-44 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
            <a
              href={`/admin/tenants/${tenantId}`}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <ExternalLink size={13} />
              View Details
            </a>
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {isActive ? <PowerOff size={13} /> : <Power size={13} />}
              {loading ? 'Processing...' : isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}