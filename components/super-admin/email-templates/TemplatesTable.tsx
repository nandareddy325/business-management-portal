// FILE 11: components/super-admin/email-templates/TemplatesTable.tsx
// ============================================================================
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

export function TemplatesTable({ templates, loading }: TemplatesTableProps) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading templates...</div>
  if (!templates || templates.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No templates found</div>

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
        <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white ring-1 ring-black/8 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/8 bg-black/2">
                <th className="px-5 py-3 text-left font-semibold text-black/60 uppercase">Name</th>
                <th className="px-5 py-3 text-left font-semibold text-black/60 uppercase">Category</th>
                <th className="px-5 py-3 text-left font-semibold text-black/60 uppercase">Updated</th>
                <th className="px-5 py-3 text-left font-semibold text-black/60 uppercase">Usage</th>
                <th className="px-5 py-3 text-center font-semibold text-black/60 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {templates.map(template => {
                const busy = isPending && pendingId === template.id
                return (
                  <tr key={template.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Mail size={14} className="text-amber-600" />
                        </div>
                        <span className="font-semibold text-black/80">{template.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block font-bold px-2.5 py-1 rounded-full capitalize ${
                        template.category === 'onboarding' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {template.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-black/60">{new Date(template.updated_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">{template.usage_count}x</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <PreviewModal
                          template={template}
                          trigger={
                            <button className="p-1.5 rounded-lg bg-black/5 hover:bg-blue-100 text-black/40 hover:text-blue-600" title="Preview">
                              <EyeIcon size={14} />
                            </button>
                          }
                        />
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="p-1.5 rounded-lg bg-black/5 hover:bg-amber-100 text-black/40 hover:text-amber-600"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(template)}
                          disabled={busy}
                          className="p-1.5 rounded-lg bg-black/5 hover:bg-emerald-100 text-black/40 hover:text-emerald-600 disabled:opacity-50"
                          title="Duplicate"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          disabled={busy}
                          className="p-1.5 rounded-lg bg-black/5 hover:bg-red-100 text-black/40 hover:text-red-600 disabled:opacity-50"
                          title="Delete"
                        >
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
