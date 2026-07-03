// components/super-admin/ConfirmationModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, Zap } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type: 'warning' | 'danger' | 'critical'
  loading?: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
  tenantName?: string
  requiresTyping?: boolean
  confirmationWord?: string
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type,
  loading = false,
  onConfirm,
  onCancel,
  tenantName = '',
  requiresTyping = false,
  confirmationWord = 'CONFIRM',
}: ConfirmationModalProps) {
  const [typedValue, setTypedValue] = useState('')
  
  // Reset typing when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTypedValue('')
    }
  }, [isOpen])
  
  if (!isOpen) return null

  const isConfirmDisabled = requiresTyping && typedValue !== confirmationWord

  const typeConfig = {
    warning: {
      headerBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      btnColor: 'bg-amber-500 hover:bg-amber-600',
      icon: AlertCircle,
    },
    danger: {
      headerBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      btnColor: 'bg-orange-500 hover:bg-orange-600',
      icon: AlertCircle,
    },
    critical: {
      headerBg: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      btnColor: 'bg-red-600 hover:bg-red-700',
      icon: Zap,
    },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`bg-white rounded-2xl shadow-2xl border ${config.borderColor} max-w-md w-full overflow-hidden`}>
          
          {/* Header */}
          <div className={`${config.headerBg} px-6 py-4 flex items-center justify-between border-b ${config.borderColor}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ background: `${config.iconColor}15` }}>
                <Icon size={18} className={config.iconColor} />
              </div>
              <h2 className="text-lg font-bold text-[#1C1712]">{title}</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-[#9A8F82] hover:text-[#1C1712] transition-colors"
              disabled={loading}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-[#1C1712] leading-relaxed">
              {message}
              {tenantName && <span className="font-bold block mt-2">"{tenantName}"</span>}
            </p>

            {/* Typing Confirmation (if required) */}
            {requiresTyping && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-xs font-semibold text-red-700">
                    Type <span className="font-black">"{confirmationWord}"</span> to confirm
                  </span>
                </div>
                <input
                  type="text"
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  disabled={loading}
                  placeholder={`Type ${confirmationWord} here...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 font-mono"
                />
                {typedValue === confirmationWord && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-xs font-semibold text-green-700">✓ Confirmed!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-[#F0EBE0] flex gap-3 bg-[#FDFAF8]">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-[#E8E2D8] text-[#1C1712] rounded-lg font-semibold text-sm hover:border-[#B8860B] hover:text-[#B8860B] transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || isConfirmDisabled}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${config.btnColor} flex items-center justify-center gap-2`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}