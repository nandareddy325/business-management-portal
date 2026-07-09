// FILE 12: components/super-admin/email-templates/VariablesInfo.tsx
// ============================================================================
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
    <div className="bg-white ring-1 ring-black/8 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Info size={16} className="text-blue-600" />
        <h3 className="text-sm font-bold text-black/80">Available Variables</h3>
      </div>

      <div className="space-y-2">
        {TEMPLATE_VARIABLES.map((variable, i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-3 bg-black/2 rounded-lg hover:bg-black/4 transition-colors group">
            <div className="flex-1 min-w-0">
              <code className="text-xs font-mono font-bold text-amber-700 block">{variable.name}</code>
              <p className="text-xs text-black/60 mt-0.5">{variable.description}</p>
            </div>
            <button
              onClick={() => handleCopy(variable.name)}
              className="p-1.5 rounded-lg bg-white ring-1 ring-black/8 text-black/40 hover:text-amber-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy variable"
            >
              {copied === variable.name ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
