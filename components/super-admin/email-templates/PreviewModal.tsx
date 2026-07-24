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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto" style={{ animation: 'fadeIn 0.2s ease' }}>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes scaleIn{from{opacity:0;transform:scale(0.93) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-lg my-8 rounded-3xl overflow-hidden" style={{ background: '#FFFDF8', border: '1.5px solid #BAE6FD', boxShadow: '0 32px 80px rgba(8,145,178,0.18)', animation: 'scaleIn 0.32s cubic-bezier(0.16,1,0.3,1) both' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#F0F9FF,#FFFDF8)', borderBottom: '1px solid #BAE6FD' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: '#E0F2FE', border: '1px solid #BAE6FD' }}>
                  <Eye size={15} style={{ color: '#0891B2' }} />
                </div>
                <h2 className="text-sm font-black" style={{ color: '#0C4A6E' }}>{template.name}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: '#E0F2FE', color: '#0891B2' }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[3px] mb-1.5" style={{ color: '#0891B2' }}>Subject</p>
                <p className="text-sm font-bold px-4 py-3 rounded-2xl" style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0C4A6E' }}>{renderSample(template.subject)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[3px] mb-1.5" style={{ color: '#0891B2' }}>Body</p>
                <div className="rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#164E63' }}>
                  {renderSample(template.body)}
                </div>
              </div>
              <p className="text-[10px]" style={{ color: '#9A8F82' }}>
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