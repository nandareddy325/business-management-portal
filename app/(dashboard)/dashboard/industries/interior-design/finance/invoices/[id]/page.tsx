'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft, Download, Plus, Trash2 } from 'lucide-react'

interface LineItem {
  description: string
  qty: number
  rate: number
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  const printRef = useRef<HTMLDivElement>(null)

  const [invoice, setInvoice] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', qty: 1, rate: 0 }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: emp } = await supabase
        .from('employees')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

      if (!inv) return

      const { data: comp } = await supabase
        .from('companies')
        .select('*')
        .eq('id', emp?.company_id)
        .single()

      let clientData = null
      if (inv.client_id) {
        const { data: cl } = await supabase
          .from('clients')
          .select('*')
          .eq('id', inv.client_id)
          .single()
        clientData = cl
      }

      setInvoice(inv)
      setCompany(comp)
      setClient(clientData)
      setLoading(false)
    }
    load()
  }, [id])

  const lineTotal = lineItems.reduce((s, i) => s + (i.qty * i.rate), 0)

  const handlePrint = () => {
    window.print()
  }

  const addLine = () => setLineItems(l => [...l, { description: '', qty: 1, rate: 0 }])
  const removeLine = (i: number) => setLineItems(l => l.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: keyof LineItem, val: string | number) => {
    setLineItems(l => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!invoice) return <div className="p-6 text-[#9A8F82]">Invoice not found</div>

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">

        {/* Top bar */}
        <div className="flex items-center justify-between no-print">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-[#9A8F82] hover:text-[#1C1712] transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#B8860B' }}>
            <Download size={15} /> Download PDF
          </button>
        </div>

        {/* Invoice Print Area */}
        <div id="print-area" ref={printRef}
          className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">

          {/* Header */}
          <div className="p-8 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #1C1712, #2C2218)' }}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-serif text-3xl text-white mb-1">{company?.name ?? 'GK Home Interiors'}</h1>
                <p className="text-sm text-[#C5BFB5]">{company?.address ?? 'Hyderabad, Telangana'}</p>
                <p className="text-sm text-[#C5BFB5]">{company?.phone ?? ''}</p>
                <p className="text-sm text-[#C5BFB5]">{company?.email ?? ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Invoice</p>
                <p className="font-serif text-2xl text-white">{invoice.invoice_no}</p>
                <div className="mt-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                    invoice.status === 'paid' ? 'bg-emerald-500 text-white' :
                    invoice.status === 'pending' ? 'bg-amber-500 text-white' :
                    invoice.status === 'overdue' ? 'bg-red-500 text-white' :
                    'bg-[#9A8F82] text-white'
                  }`}>{invoice.status ?? 'draft'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To + Date */}
          <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-[#F0EBE0] bg-[#FDFAF8]">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-2">Bill To</p>
              <p className="font-semibold text-[#1C1712]">{client?.client_name ?? invoice.client_name ?? '—'}</p>
              {client?.company_name && <p className="text-sm text-[#9A8F82]">{client.company_name}</p>}
              {client?.phone && <p className="text-sm text-[#9A8F82]">{client.phone}</p>}
              {client?.address && <p className="text-sm text-[#9A8F82]">{client.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-2">Details</p>
              {invoice.due_date && (
                <p className="text-sm text-[#9A8F82]">Due: <span className="font-semibold text-[#1C1712]">
                  {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span></p>
              )}
              <p className="text-sm text-[#9A8F82]">Created: <span className="font-semibold text-[#1C1712]">
                {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span></p>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B]">Line Items</p>
              <button onClick={addLine}
                className="no-print flex items-center gap-1 text-xs font-semibold text-[#B8860B] hover:text-[#1C1712] transition-colors">
                <Plus size={13} /> Add Item
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1C1712] text-left">
                  <th className="pb-2 text-xs font-bold text-[#9A8F82] uppercase tracking-wider w-1/2">Description</th>
                  <th className="pb-2 text-xs font-bold text-[#9A8F82] uppercase tracking-wider text-center">Qty</th>
                  <th className="pb-2 text-xs font-bold text-[#9A8F82] uppercase tracking-wider text-right">Rate (₹)</th>
                  <th className="pb-2 text-xs font-bold text-[#9A8F82] uppercase tracking-wider text-right">Amount (₹)</th>
                  <th className="no-print pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0]">
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4">
                      <input value={item.description}
                        onChange={e => updateLine(i, 'description', e.target.value)}
                        placeholder="e.g. Living Room Design"
                        className="w-full text-sm text-[#1C1712] bg-transparent border-b border-dashed border-[#E8E2D8] focus:outline-none focus:border-[#B8860B] py-0.5 no-print-hide"
                      />
                      <span className="hidden text-sm text-[#1C1712] print-show">{item.description}</span>
                    </td>
                    <td className="py-3 text-center">
                      <input type="number" min="1" value={item.qty}
                        onChange={e => updateLine(i, 'qty', Number(e.target.value))}
                        className="w-14 text-sm text-center text-[#1C1712] bg-transparent border-b border-dashed border-[#E8E2D8] focus:outline-none focus:border-[#B8860B] py-0.5"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input type="number" min="0" value={item.rate}
                        onChange={e => updateLine(i, 'rate', Number(e.target.value))}
                        className="w-28 text-sm text-right text-[#1C1712] bg-transparent border-b border-dashed border-[#E8E2D8] focus:outline-none focus:border-[#B8860B] py-0.5"
                      />
                    </td>
                    <td className="py-3 text-right text-sm font-semibold text-[#1C1712]">
                      ₹{(item.qty * item.rate).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 pl-2 no-print">
                      {lineItems.length > 1 && (
                        <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9A8F82]">Subtotal</span>
                  <span className="font-semibold text-[#1C1712]">₹{lineTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9A8F82]">Amount Paid</span>
                  <span className="font-semibold text-emerald-600">₹{Number(invoice.paid_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t-2 border-[#1C1712] pt-2">
                  <span className="text-[#1C1712]">Balance Due</span>
                  <span className="text-[#B8860B]">₹{(lineTotal - Number(invoice.paid_amount || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-8 py-4 border-t border-[#F0EBE0] bg-[#FDFAF8]">
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Notes</p>
              <p className="text-sm text-[#9A8F82]">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-4 border-t border-[#F0EBE0] text-center" style={{ background: 'linear-gradient(135deg, #1C1712, #2C2218)' }}>
            <p className="text-xs text-[#9A8F82]">Thank you for your business! • {company?.name ?? 'GK Home Interiors'} • Hyderabad</p>
          </div>
        </div>
      </div>
    </>
  )
}