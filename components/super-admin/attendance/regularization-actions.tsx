'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Check, X } from 'lucide-react'

export function RegularizationActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleDecision(decision: 'approved' | 'rejected') {
    setLoading(decision === 'approved' ? 'approve' : 'reject')
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: request } = await supabase
        .from('attendance_regularization_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      await supabase
        .from('attendance_regularization_requests')
        .update({ status: decision, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', requestId)

      if (decision === 'approved' && request) {
        await supabase.from('attendance').upsert({
          employee_id: request.employee_id,
          attendance_date: request.attendance_date,
          check_in: request.requested_check_in ? `${request.attendance_date}T${request.requested_check_in}` : null,
          check_out: request.requested_check_out ? `${request.attendance_date}T${request.requested_check_out}` : null,
          status: 'present',
          is_regularized: true,
        }, { onConflict: 'employee_id,attendance_date' })
      }

      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to update request')
    }
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => handleDecision('approved')}
        disabled={loading !== null}
        className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors disabled:opacity-50"
        title="Approve"
      >
        {loading === 'approve' ? <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" /> : <Check size={15} />}
      </button>
      <button
        onClick={() => handleDecision('rejected')}
        disabled={loading !== null}
        className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-colors disabled:opacity-50"
        title="Reject"
      >
        {loading === 'reject' ? <div className="w-3.5 h-3.5 border-2 border-rose-700 border-t-transparent rounded-full animate-spin" /> : <X size={15} />}
      </button>
    </div>
  )
}