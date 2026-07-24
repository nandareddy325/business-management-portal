'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Plus, X, AlertTriangle, Loader2 } from 'lucide-react'
import { createEmailTemplateAction, updateEmailTemplateAction } from '@/app/(super-admin)/admin/email-templates/actions'
import type { EmailTemplate, EmailTemplateCategory } from '@/types/admin'

const CATEGORIES: EmailTemplateCategory[] = [
  'onboarding', 'welcome', 'reset_password', 'verification', 'notification', 'marketing', 'invoice', 'other',
]

interface TemplateFormModalProps {
  mode: 'create' | 'edit'
  template?: EmailTemplate
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TemplateFormModal({ mode, template, trigger, open: controlledOpen, onOpenChange }: TemplateFormModalProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState(template?.name ?? '')
  const [category, setCategory] = useState<EmailTemplateCategory>(template?.category ?? 'other')
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [body, setBody] = useState(template?.body ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-mounted guard for portal/SSR safety
  useEffect(() => { setMounted(true) }, [])

  function setOpen(v: boolean) {
    if (isControlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  function close() {
    if (loading) return
    setOpen(false)
    setError('')
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const input = { name, category, subject, body }
    const result = mode === 'create'
      ? await createEmailTemplateAction(input)
      : await updateEmailTemplateAction(template!.id, input)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.refresh()
    setOpen(false)
  }

  return (
    <>
      {trigger && <span onClick={() => setOpen(true)}>{trigger}</span>}
      {!trigger && mode === 'create' && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black text-white transition-all hover:-translate-y-0.5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#B8860B,#D97706)', boxShadow: '0 6px 18px rgba(184,134,11,0.3)' }}
        >
          <Plus size={15} /> New Template
        </button>
      )}

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto" style={{ animation: 'fadeIn 0.2s ease' }}>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes scaleIn{from{opacity:0;transform:scale(0.93) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

          <div className="relative w-full max-w-lg my-8 rounded-3xl" style={{ background: '#FFFDF8', border: '1.5px solid rgba(184,134,11,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.18)', animation: 'scaleIn 0.32s cubic-bezier(0.16,1,0.3,1) both' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(184,134,11,0.12)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base" style={{ background: '#FFF3D6', border: '1px solid #F5DFA0' }}>✉️</div>
                <h2 className="text-sm font-black" style={{ color: '#1C1712' }}>
                  {mode === 'create' ? 'New Email Template' : 'Edit Template'}
                </h2>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: '#F5F0E8', color: '#6B5E4E' }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-[3px] block mb-1.5" style={{ color: '#B8860B' }}>Template name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Welcome email"
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none"
                  style={{ background: '#F5F0E8', border: '1.5px solid rgba(184,134,11,0.2)', color: '#1C1712' }}
                  onFocus={e => (e.target.style.borderColor = '#FDE68A')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(184,134,11,0.2)')}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[3px] block mb-1.5" style={{ color: '#B8860B' }}>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as EmailTemplateCategory)}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none capitalize"
                  style={{ background: '#F5F0E8', border: '1.5px solid rgba(184,134,11,0.2)', color: '#1C1712' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[3px] block mb-1.5" style={{ color: '#B8860B' }}>Subject line</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Welcome to {{company.name}}, {{user.name}}!"
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none"
                  style={{ background: '#F5F0E8', border: '1.5px solid rgba(184,134,11,0.2)', color: '#1C1712' }}
                  onFocus={e => (e.target.style.borderColor = '#FDE68A')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(184,134,11,0.2)')}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[3px] block mb-1.5" style={{ color: '#B8860B' }}>Email body</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={7}
                  placeholder={'Hi {{user.name}},\n\nWelcome to {{company.name}}...'}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none font-mono"
                  style={{ background: '#F5F0E8', border: '1.5px solid rgba(184,134,11,0.2)', color: '#1C1712' }}
                  onFocus={e => (e.target.style.borderColor = '#FDE68A')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(184,134,11,0.2)')}
                />
                <p className="text-[10px] mt-1.5" style={{ color: '#9A8F82' }}>
                  Use variables like <code className="font-mono font-bold" style={{ color: '#B8860B' }}>{'{{user.name}}'}</code> — see the panel on the right for the full list.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <AlertTriangle size={13} style={{ color: '#DC2626' }} />
                  <p className="text-xs font-semibold" style={{ color: '#991B1B' }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#B8860B,#D97706)', boxShadow: '0 6px 18px rgba(184,134,11,0.3)' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {loading ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}