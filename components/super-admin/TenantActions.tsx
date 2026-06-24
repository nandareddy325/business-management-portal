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
        className="w-8 h-8 rounded-lg bg-[#F5F0E8] border border-[#E8E2D8] hover:bg-[#EDE8DC] hover:border-[#B8860B] flex items-center justify-center text-[#9A8F82] hover:text-[#B8860B] transition-all"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-44 bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-xl"
            style={{ boxShadow: '0 12px 40px rgba(28,23,18,0.15)' }}>
            <a
              href={`/admin/tenants/${tenantId}`}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#1C1712] hover:bg-[#F5F0E8] transition-colors"
            >
              <ExternalLink size={13} className="text-[#B8860B]" />
              View Details
            </a>
            <div className="border-t border-[#F0EBE0]" />
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-emerald-600 hover:bg-emerald-50'
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