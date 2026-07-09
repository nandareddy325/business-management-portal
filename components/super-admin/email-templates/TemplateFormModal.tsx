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
          className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-md"
        >
          <Plus size={14} /> New Template
        </button>
      )}

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

          <div className="relative bg-white rounded-2xl ring-1 ring-black/8 shadow-2xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-[#1C1712]">
                {mode === 'create' ? 'New email template' : 'Edit template'}
              </h2>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-black/5 text-black/40 hover:text-black/70">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/50 block mb-1.5">
                  Template name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Welcome email"
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-3.5 py-2.5 text-sm text-black/80 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/50 block mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as EmailTemplateCategory)}
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-3.5 py-2.5 text-sm text-black/80 outline-none focus:border-amber-500 transition-colors capitalize"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/50 block mb-1.5">
                  Subject line
                </label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Welcome to {{company.name}}, {{user.name}}!"
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-3.5 py-2.5 text-sm text-black/80 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/50 block mb-1.5">
                  Email body
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={7}
                  placeholder={'Hi {{user.name}},\n\nWelcome to {{company.name}}...'}
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-3.5 py-2.5 text-sm text-black/80 outline-none focus:border-amber-500 transition-colors resize-none font-mono"
                />
                <p className="text-[10px] text-black/40 mt-1">
                  Use variables like {'{{user.name}}'} — see the panel on the right for the full list.
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {loading ? 'Saving...' : mode === 'create' ? 'Create template' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
