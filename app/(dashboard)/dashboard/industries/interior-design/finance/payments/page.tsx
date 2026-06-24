import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IndianRupee, Plus, AlertCircle, CheckCircle, CreditCard, Banknote } from 'lucide-react'

const methodIcon: Record<string, string> = {
  cash:   '💵',
  upi:    '📱',
  bank:   '🏦',
  cheque: '📝',
  card:   '💳',
  neft:   '🏦',
  rtgs:   '🏦',
}

export default async function PaymentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  // Payments joined with invoices to filter by company
  const { data: payments } = await supabase
    .from('payments')
    .select('*, invoice:invoices(invoice_no, company_id, amount)')
    .order('payment_date', { ascending: false })

  // Filter by company
  const all = (payments ?? []).filter((p: any) => p.invoice?.company_id === profile.company_id)

  const totalReceived = all.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

  // Group by method
  const byMethod: Record<string, number> = {}
  all.forEach((p: any) => {
    const m = (p.payment_method || 'other').toLowerCase()
    byMethod[m] = (byMethod[m] || 0) + Number(p.amount || 0)
  })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Finance</p>
          <h1 className="font-serif text-2xl md:text-3xl text-[#1C1712]">Payments</h1>
          <p className="text-sm text-[#9A8F82] mt-1">{all.length} payments received</p>
        </div>
      </div>

      {/* Total Received Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#1C1712' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #B8860B, transparent 60%)' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#B8860B] uppercase tracking-widest mb-1">Total Received</p>
            <p className="font-serif text-3xl text-white">₹{totalReceived.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/50 mt-1">{all.length} transactions</p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(184,134,11,0.2)' }}>
            <IndianRupee size={28} className="text-[#B8860B]" />
          </div>
        </div>
      </div>

      {/* By Method */}
      {Object.keys(byMethod).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(byMethod).map(([method, amount]) => (
            <div key={method} className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-sm">
              <p className="text-xl mb-2">{methodIcon[method] ?? '💰'}</p>
              <p className="text-sm font-bold text-[#1C1712]">₹{Number(amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-[#9A8F82] capitalize mt-0.5">{method}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payments List */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">Payment History</h2>
        </div>
        {all.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} className="text-[#9A8F82]" />
            </div>
            <p className="text-sm font-semibold text-[#1C1712]">No payments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0EBE0]">
            {all.map((pay: any) => (
              <div key={pay.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#FFFBEF] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-base">
                    {methodIcon[(pay.payment_method || '').toLowerCase()] ?? '💰'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C1712]">{pay.invoice?.invoice_no ?? 'Payment'}</p>
                    <p className="text-xs text-[#9A8F82]">
                      {pay.payment_method ?? '—'} · {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                    {pay.notes && <p className="text-xs text-[#B8B0A0] mt-0.5">{pay.notes}</p>}
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-600">+₹{Number(pay.amount).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}