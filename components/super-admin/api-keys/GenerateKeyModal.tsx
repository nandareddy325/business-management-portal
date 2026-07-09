'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Plus, X, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { generateAPIKeyAction } from '@/app/(super-admin)/admin/api-keys/actions'

export function GenerateKeyModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState('')
  const [environment, setEnvironment] = useState<'development' | 'production'>('development')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plaintextKey, setPlaintextKey] = useState('')
  const [copied, setCopied] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-mounted guard for portal/SSR safety
  useEffect(() => { setMounted(true) }, [])

  function reset() {
    setName('')
    setEnvironment('development')
    setError('')
    setPlaintextKey('')
    setCopied(false)
  }

  function close() {
    setOpen(false)
    // Delay reset so the closing animation (if any) doesn't flash empty state
    setTimeout(reset, 200)
  }

  async function handleGenerate() {
    if (!name.trim()) { setError('Give the key a name'); return }
    setLoading(true)
    setError('')
    const result = await generateAPIKeyAction(name, environment)
    setLoading(false)
    if (result.error || !result.plaintextKey) {
      setError(result.error ?? 'Something went wrong')
      return
    }
    setPlaintextKey(result.plaintextKey)
    router.refresh()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plaintextKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select and copy manually')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-md"
      >
        <Plus size={14} /> Generate Key
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && close()} />

          <div className="relative bg-white rounded-2xl ring-1 ring-black/8 shadow-2xl w-full max-w-md p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-[#1C1712]">
                {plaintextKey ? 'Key generated' : 'Generate API key'}
              </h2>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-black/5 text-black/40 hover:text-black/70">
                <X size={16} />
              </button>
            </div>

            {!plaintextKey ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/50 block mb-1.5">
                    Key name
                  </label>
                  <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Zapier integration"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-3.5 py-2.5 text-sm text-black/80 outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/50 block mb-1.5">
                    Environment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['development', 'production'] as const).map(env => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => setEnvironment(env)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          environment === env
                            ? 'bg-amber-500/10 border-amber-500 text-amber-700'
                            : 'bg-black/5 border-black/10 text-black/50 hover:text-black/70'
                        }`}
                      >
                        {env === 'development' ? 'Development' : 'Production'}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> {error}
                  </p>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {loading ? 'Generating...' : 'Generate key'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Copy this key now — for security it won&apos;t be shown again.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-black/5 px-3 py-2.5 rounded-xl text-black/80 break-all">
                    {plaintextKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                      copied ? 'bg-emerald-500/10 text-emerald-600' : 'bg-black/5 hover:bg-black/10 text-black/50 hover:text-black/70'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={close}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 text-black/70 text-sm font-semibold transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
