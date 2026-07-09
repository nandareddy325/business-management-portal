'use client'

// components/settings/ChangePasswordCard.tsx

import { useState } from 'react'
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

function InputField({
  label, value, onChange, show, onToggle, placeholder
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full bg-white border border-[#DDD5C4] rounded-xl px-4 py-2.5 pr-11 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8F82] hover:text-[#1C1712] transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function ChangePasswordCard() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4' }
    if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/4' }
    if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' }
    return { label: 'Medium', color: 'bg-amber-400', width: 'w-3/4' }
  }

  const strength = passwordStrength(newPassword)

  const handleSubmit = async () => {
    setMessage(null)

    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill all fields' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' })
      } else {
        setMessage({ type: 'success', text: 'Password changed successfully! 🎉' })
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Try again.' })
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2D9C8] bg-[#F5F0E8]">
        <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center">
          <KeyRound className="w-4 h-4 text-[#B8860B]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#1C1712]">Change Password</h2>
          <p className="text-xs text-[#9A8F82]">Set a new password for your account</p>
        </div>
      </div>

      {/* Form */}
      <div className="p-5 space-y-4">
        <InputField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew(p => !p)}
          placeholder="Min 6 characters"
        />

        {/* Password strength bar */}
        {strength && (
          <div className="space-y-1 -mt-2">
            <div className="w-full bg-[#E2D9C8] rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
            </div>
            <p className="text-[11px] text-[#9A8F82]">Strength: <span className="font-semibold">{strength.label}</span></p>
          </div>
        )}

        <InputField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm(p => !p)}
          placeholder="Re-enter new password"
        />

        {/* Match indicator */}
        {confirmPassword && newPassword && (
          <p className={`text-xs flex items-center gap-1 -mt-2 ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
            {newPassword === confirmPassword
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Passwords match</>
              : <><AlertCircle className="w-3.5 h-3.5" /> Passwords don&apos;t match</>
            }
          </p>
        )}

        {/* Status message */}
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {message.text}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Update Password
            </>
          )}
        </button>
      </div>
    </div>
  )
}