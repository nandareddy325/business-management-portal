'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye } from 'lucide-react'
import type { EmailTemplate } from '@/types/admin'

const SAMPLE_DATA: Record<string, string> = {
  '{{user.name}}': 'Priya Sharma',
  '{{user.email}}': 'priya@example.com',
  '{{company.name}}': 'GK Home Interiors',
  '{{date}}': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
  '{{link}}': 'https://crm.gkhomeinteriors.in/...',
  '{{code}}': '482913',
}

function renderSample(text: string) {
  let out = text
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    out = out.split(key).join(value)
  }
  return out
}

interface PreviewModalProps {
  template: EmailTemplate
  trigger: React.ReactNode
}

export function PreviewModal({ template, trigger }: PreviewModalProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-mounted guard for portal/SSR safety
  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-2xl ring-1 ring-black/8 shadow-2xl w-full max-w-lg my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-blue-600" />
                <h2 className="text-sm font-bold text-[#1C1712]">{template.name}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 text-black/40 hover:text-black/70">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Subject</p>
                <p className="text-sm font-semibold text-black/80">{renderSample(template.subject)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Body</p>
                <div className="bg-black/2 rounded-xl p-4 text-sm text-black/70 whitespace-pre-wrap leading-relaxed">
                  {renderSample(template.body)}
                </div>
              </div>
              <p className="text-[10px] text-black/40">
                Previewed with sample data — actual sends will use the real recipient&apos;s details.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
