// FILE 11: components/super-admin/email-templates/TemplatesTable.tsx
// ============================================================================
'use client'
import { Mail, Edit, Copy, Trash2, Eye as EyeIcon } from 'lucide-react'
import { EmailTemplate } from '@/types/admin'

interface TemplatesTableProps {
  templates: EmailTemplate[] | null
  loading?: boolean
}

export function TemplatesTable({ templates, loading }: TemplatesTableProps) {
  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading templates...</div>
  if (!templates || templates.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No templates found</div>

  return (
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
            {templates.map(template => (
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
                  <span className={`inline-block font-bold px-2.5 py-1 rounded-full ${
                    template.category === 'onboarding' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {template.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-black/60">{new Date(template.updated_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">{template.usage_count}x</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1.5 rounded-lg bg-black/5 hover:bg-blue-100 text-black/40 hover:text-blue-600">
                      <EyeIcon size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg bg-black/5 hover:bg-amber-100 text-black/40 hover:text-amber-600">
                      <Edit size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg bg-black/5 hover:bg-emerald-100 text-black/40 hover:text-emerald-600">
                      <Copy size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg bg-black/5 hover:bg-red-100 text-black/40 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
