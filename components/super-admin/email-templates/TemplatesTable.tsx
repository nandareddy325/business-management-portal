'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Edit, Copy, Trash2, Eye as EyeIcon, Loader2 } from 'lucide-react'
import { EmailTemplate } from '@/types/admin'
import { duplicateEmailTemplateAction, deleteEmailTemplateAction } from '@/app/(super-admin)/admin/email-templates/actions'
import { TemplateFormModal } from './TemplateFormModal'
import { PreviewModal } from './PreviewModal'

interface TemplatesTableProps {
  templates: EmailTemplate[] | null
  loading?: boolean
}

const CATEGORY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  onboarding:      { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  welcome:         { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  reset_password:  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  verification:    { bg: '#ECFEFF', color: '#0891B2', border: '#A5F3FC' },
  notification:    { bg: '#FFFBEB', color: '#B8860B', border: '#FDE68A' },
  marketing:       { bg: '#FDF2F8', color: '#DB2777', border: '#FBCFE8' },
  invoice:         { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  other:           { bg: '#F5F0E8', color: '#7A6E60', border: '#E2D9C8' },
}

export function TemplatesTable({ templates, loading }: TemplatesTableProps) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  if (loading) {
    return (
      <div className="rounded-3xl py-16 text-center" style={{ background: '#fff', border: '1px solid #EDE7DB', boxShadow: '0 1px 2px rgba(28,23,18,0.04), 0 10px 24px rgba(28,23,18,0.05)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#B8860B', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: '#9A8F82' }}>Loading templates...</p>
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="rounded-3xl py-16 text-center" style={{ background: '#fff', border: '1px solid #EDE7DB', boxShadow: '0 1px 2px rgba(28,23,18,0.04), 0 10px 24px rgba(28,23,18,0.05)' }}>
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#FFF3D6', border: '1px solid #F5DFA0' }}>
          <Mail size={24} style={{ color: '#B8860B' }} />
        </div>
        <p className="font-bold" style={{ color: '#1C1712' }}>No templates yet</p>
        <p className="text-xs mt-1" style={{ color: '#9A8F82' }}>Create your first email template to get started</p>
      </div>
    )
  }

  function handleDuplicate(template: EmailTemplate) {
    setPendingId(template.id)
    setError('')
    startTransition(async () => {
      const result = await duplicateEmailTemplateAction(template.id)
      setPendingId(null)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleDelete(template: EmailTemplate) {
    if (!confirm(`Delete "${template.name}"? This can't be undone.`)) return
    setPendingId(template.id)
    setError('')
    startTransition(async () => {
      const result = await deleteEmailTemplateAction(template.id, template.name)
      setPendingId(null)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-2xl px-4 py-3 text-xs font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
          {error}
        </div>
      )}

      <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', border: '1px solid #EDE7DB', boxShadow: '0 1px 2px rgba(28,23,18,0.04), 0 12px 28px rgba(28,23,18,0.06)' }}>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                {['Name', 'Category', 'Updated', 'Usage', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-5 py-3 font-black uppercase tracking-[2px] ${i === 4 ? 'text-center' : 'text-left'}`} style={{ color: '#9A8F82', fontSize: 9 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((template, idx) => {
                const busy = isPending && pendingId === template.id
                const cat = CATEGORY_STYLE[template.category] ?? CATEGORY_STYLE.other
                return (
                  <tr key={template.id} className="transition-colors hover:bg-[#FDFAF8]" style={{ borderBottom: idx < templates.length - 1 ? '1px solid #F7F5F1' : 'none' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FFF3D6', border: '1px solid #F5DFA0' }}>
                          <Mail size={14} style={{ color: '#B8860B' }} />
                        </div>
                        <span className="font-bold" style={{ color: '#1C1712' }}>{template.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                        {template.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#7A6E60' }}>{new Date(template.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-black px-2.5 py-1 rounded-full" style={{ background: '#FFFBEB', color: '#B8860B', border: '1px solid #FDE68A' }}>{template.usage_count}×</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <PreviewModal
                          template={template}
                          trigger={
                            <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors" style={{ background: '#F5F0E8', color: '#7A6E60' }} title="Preview">
                              <EyeIcon size={14} />
                            </button>
                          }
                        />
                        <button onClick={() => setEditingTemplate(template)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors" style={{ background: '#F5F0E8', color: '#7A6E60' }} title="Edit">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDuplicate(template)} disabled={busy}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50" style={{ background: '#F5F0E8', color: '#7A6E60' }} title="Duplicate">
                          {busy ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                        </button>
                        <button onClick={() => handleDelete(template)} disabled={busy}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50" style={{ background: '#FEF2F2', color: '#DC2626' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: '#F0EBE0' }}>
          {templates.map((template) => {
            const busy = isPending && pendingId === template.id
            const cat = CATEGORY_STYLE[template.category] ?? CATEGORY_STYLE.other
            return (
              <div key={template.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FFF3D6', border: '1px solid #F5DFA0' }}>
                    <Mail size={14} style={{ color: '#B8860B' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#1C1712' }}>{template.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: cat.bg, color: cat.color }}>{template.category.replace('_', ' ')}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: '#FFFBEB', color: '#B8860B' }}>{template.usage_count}×</span>
                      <span className="text-[10px]" style={{ color: '#9A8F82' }}>{new Date(template.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <PreviewModal template={template} trigger={
                    <button className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={{ background: '#F5F0E8', color: '#7A6E60' }}><EyeIcon size={13} /> View</button>
                  } />
                  <button onClick={() => setEditingTemplate(template)} className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={{ background: '#F5F0E8', color: '#7A6E60' }}><Edit size={13} /> Edit</button>
                  <button onClick={() => handleDuplicate(template)} disabled={busy} className="w-9 py-2 rounded-xl flex items-center justify-center disabled:opacity-50" style={{ background: '#F5F0E8', color: '#7A6E60' }}>{busy ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}</button>
                  <button onClick={() => handleDelete(template)} disabled={busy} className="w-9 py-2 rounded-xl flex items-center justify-center disabled:opacity-50" style={{ background: '#FEF2F2', color: '#DC2626' }}><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {editingTemplate && (
        <TemplateFormModal
          mode="edit"
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(v) => !v && setEditingTemplate(null)}
        />
      )}
    </div>
  )
}