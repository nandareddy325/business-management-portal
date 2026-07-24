'use client'
import { useState } from 'react'
import { Info, Copy, Check } from 'lucide-react'

const TEMPLATE_VARIABLES = [
  { name: '{{user.name}}', description: 'Full name of the recipient' },
  { name: '{{user.email}}', description: 'Email address' },
  { name: '{{company.name}}', description: 'Company name' },
  { name: '{{date}}', description: 'Current date' },
  { name: '{{link}}', description: 'Action link/URL' },
  { name: '{{code}}', description: 'Verification or reset code' },
]

export function VariablesInfo() {
  const [copied, setCopied] = useState<string | null>(null)

  async function handleCopy(name: string) {
    try {
      await navigator.clipboard.writeText(name)
      setCopied(name)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard unavailable — silently ignore, button just won't show the check state
    }
  }

  return (
    <div className="rounded-3xl p-5" style={{ background: '#fff', border: '1px solid #EDE7DB', boxShadow: '0 1px 2px rgba(28,23,18,0.04), 0 10px 24px rgba(28,23,18,0.05)' }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#E0F2FE', border: '1px solid #BAE6FD' }}>
          <Info size={14} style={{ color: '#0891B2' }} />
        </div>
        <h3 className="text-sm font-black" style={{ color: '#1C1712' }}>Available Variables</h3>
      </div>

      <div className="space-y-2">
        {TEMPLATE_VARIABLES.map((variable, i) => (
          <div key={i} className="group flex items-center justify-between gap-3 p-3 rounded-2xl transition-colors" style={{ background: '#F7F4EF' }}>
            <div className="flex-1 min-w-0">
              <code className="text-xs font-mono font-black block" style={{ color: '#B8860B' }}>{variable.name}</code>
              <p className="text-[11px] mt-0.5" style={{ color: '#7A6E60' }}>{variable.description}</p>
            </div>
            <button
              onClick={() => handleCopy(variable.name)}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: copied === variable.name ? '#D1FAE5' : '#fff', border: '1px solid rgba(184,134,11,0.15)', color: copied === variable.name ? '#059669' : '#B8860B' }}
              title="Copy variable"
            >
              {copied === variable.name ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}