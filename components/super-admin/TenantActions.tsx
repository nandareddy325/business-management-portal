'use client'
// components/super-admin/TenantActions.tsx

import { useState } from 'react'
import { Shield, ShieldOff, ExternalLink } from 'lucide-react'
import { adminClientService } from '@/services'
import { useRouter } from 'next/navigation'

type Props = {
  tenantId: string
  isActive: boolean
  tenantName: string
}

export default function TenantActions({ tenantId, isActive, tenantName }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    if (!confirm(`${isActive ? 'Suspend' : 'Activate'} "${tenantName}"?`)) return
    setLoading(true)
    try {
      if (isActive) {
        await adminClientService.suspendTenant(tenantId)
      } else {
        await adminClientService.activateTenant(tenantId)
      }
      router.refresh()
    } catch (err) {
      alert('Action failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/admin/tenants/${tenantId}`}
        className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        title="View details"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`p-1.5 rounded-md transition-colors ${
          isActive
            ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
            : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10'
        }`}
        title={isActive ? 'Suspend tenant' : 'Activate tenant'}
      >
        {isActive
          ? <ShieldOff className="w-3.5 h-3.5" />
          : <Shield className="w-3.5 h-3.5" />
        }
      </button>
    </div>
  )
}
