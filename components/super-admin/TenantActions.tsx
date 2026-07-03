// components/super-admin/TenantActions.tsx - FIXED
'use client'

import { useState } from 'react'
import { MoreVertical, Power, PowerOff, ExternalLink } from 'lucide-react'
import ConfirmationModal from './ConfirmationModal'

interface TenantActionsProps {
  tenantId: string
  isActive: boolean
  tenantName: string
}

export default function TenantActions({ tenantId, isActive, tenantName }: TenantActionsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/super-admin/toggle-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, isActive }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to toggle tenant status')
        console.error('API error:', data.error)
        return
      }

      // Success - close modal and reload page
      setShowModal(false)
      setOpen(false)
      
      // Wait a moment then reload
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error toggling tenant:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setShowModal(true)
    setOpen(false)
    setError(null)
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 hover:bg-gray-200 hover:border-orange-500 flex items-center justify-center text-gray-600 hover:text-orange-600 transition-all disabled:opacity-50"
          disabled={loading}
        >
          <MoreVertical size={14} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div 
              className="absolute right-0 top-9 z-20 w-48 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg"
              style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
            >
              {/* View Details */}
              <a
                href={`/admin/tenants/${tenantId}`}
                className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-b border-gray-200"
                onClick={() => setOpen(false)}
              >
                <ExternalLink size={13} className="text-orange-600" />
                View Details
              </a>

              {/* Toggle Status */}
              <button
                onClick={handleOpenModal}
                disabled={loading}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isActive ? (
                  <>
                    <PowerOff size={13} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power size={13} />
                    Activate
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showModal}
        title={isActive ? 'Deactivate Tenant' : 'Activate Tenant'}
        message={
          isActive
            ? `This tenant will lose access to all features immediately. They can be reactivated at any time.`
            : `This tenant will regain access to all features and services.`
        }
        tenantName={tenantName}
        confirmText={isActive ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        type={isActive ? 'danger' : 'warning'}
        loading={loading}
        onConfirm={handleToggle}
        onCancel={() => {
          setShowModal(false)
          setError(null)
        }}
      />

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </>
  )
}