// components/super-admin/ConfirmationModal.tsx
'use client'

import { useState } from 'react'
import { AlertTriangle, X, CheckCircle, Lock } from 'lucide-react'

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
  requiresTyping?: boolean
  confirmationWord?: string
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type,
  loading,
  onConfirm,
  onCancel,
  requiresTyping = false,
  confirmationWord = 'CONFIRM'
}: ConfirmationModalProps) {
  const [typedValue, setTypedValue] = useState('')
  const isConfirmDisabled = requiresTyping && typedValue !== confirmationWord

  const typeStyles = {
    warning: {
      bg: 'from-amber-500/10 to-amber-500/5',
      border: 'border-amber-500/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600'
    },
    danger: {
      bg: 'from-red-500/10 to-red-500/5',
      border: 'border-red-500/20',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      button: 'bg-red-500 hover:bg-red-600'
    },
    critical: {
      bg: 'from-red-600/15 to-red-500/5',
      border: 'border-red-600/30',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700'
    }
  }

  const style = typeStyles[type]
  const Icon = style.icon

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative max-w-md w-full mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Background */}
        <div className={`bg-gradient-to-r ${style.bg} border-b ${style.border} px-6 py-8`}>
          <div className="flex items-start justify-between gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${style.button} bg-opacity-20`}>
              <Icon size={24} className={style.iconColor} />
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-black/40 hover:text-black/70 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-[#1C1712] mt-4">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Message */}
          <p className="text-sm text-[#666] leading-relaxed">{message}</p>

          {/* Typing Confirmation (if required) */}
          {requiresTyping && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Lock size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  Type <span className="font-bold">"{confirmationWord}"</span> to confirm
                </p>
              </div>
              <input
                type="text"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                disabled={loading}
                placeholder={`Type ${confirmationWord} here...`}
                className="w-full px-4 py-3 border border-[#E8E2D8] rounded-xl text-sm focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              {typedValue === confirmationWord && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <p className="text-xs text-emerald-700 font-medium">Confirmed! Ready to proceed.</p>
                </div>
              )}
            </div>
          )}

          {/* Risk Level Info */}
          {type === 'critical' && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">⚠️ CRITICAL ACTION</p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone. All data will be permanently deleted.</p>
            </div>
          )}

          {type === 'danger' && !requiresTyping && (
            <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">⚡ WARNING</p>
              <p className="text-xs text-amber-600 mt-1">This action will affect all users and services.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-[#F5F0E8] border-t border-[#E8E2D8]">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-[#1C1712] font-semibold text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || isConfirmDisabled}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${style.button}`}
          >
            {loading ? '⏳ Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}