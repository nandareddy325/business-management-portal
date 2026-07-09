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

interface Invoice {
  id: string
  invoice_no: string
  client_id?: string | null
  client_name?: string | null
  project_id?: string | null
  amount: number
  paid_amount?: number | null
  status?: string | null
  due_date?: string | null
  notes?: string | null
  created_at: string
}

interface Company {
  name?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

interface Client {
  client_name?: string | null
  company_name?: string | null
  phone?: string | null
  address?: string | null
}

interface Project {
  project_name?: string | null
  location?: string | null
  house_type?: string | null
  phone?: string | null
}

interface Milestone {
  id: string
  milestone_name: string
  percentage?: number | null
  expected_amount?: number | null
  received_amount?: number | null
}

interface Payment {
  id: string
  milestone_id?: string | null
  amount: number
  payment_date: string
  notes?: string | null
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  const printRef = useRef<HTMLDivElement>(null)

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', qty: 1, rate: 0 }
  ])
  const [loading, setLoading] = useState(true)

  // Project-linked invoice data (Payment History + Milestone Summary view)
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

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

      let clientData: Client | null = null
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

      // If this invoice is linked to a project, load the milestone data
      // (Payment History + Milestone Summary) instead of using blank line items
      if (inv.project_id) {
        const { data: proj } = await supabase
          .from('projects')
          .select('*')
          .eq('id', inv.project_id)
          .single()
        setProject(proj)

        const { data: ms } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', inv.project_id)
          .order('sort_order')
        setMilestones(ms ?? [])

        const { data: pays } = await supabase
          .from('payments')
          .select('*')
          .eq('project_id', inv.project_id)
          .order('payment_date', { ascending: true })
        setPayments(pays ?? [])
      }

      setLoading(false)
    }
    load()
  }, [id, supabase])

  const lineTotal = lineItems.reduce((s, i) => s + (i.qty * i.rate), 0)

  const handlePrint = () => {
    window.print()
  }

  const addLine = () => setLineItems(l => [...l, { description: '', qty: 1, rate: 0 }])
  const removeLine = (i: number) => setLineItems(l => l.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: keyof LineItem, val: string | number) => {
    setLineItems(l => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  const fmt = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN')

  const milestoneNameById: Record<string, string> = {}
  milestones.forEach(m => { milestoneNameById[m.id] = m.milestone_name })

  const getMilestoneReceived = (m: Milestone) => {
    const logged = payments.filter(p => p.milestone_id === m.id)
    if (logged.length > 0) return logged.reduce((s, p) => s + Number(p.amount || 0), 0)
    return Number(m.received_amount || 0)
  }

  const totalExpected = milestones.reduce((s, m) => s + Number(m.expected_amount || 0), 0)
  const totalReceived = milestones.reduce((s, m) => s + getMilestoneReceived(m), 0)
  const totalPending = totalExpected - totalReceived

  const sortedPayments = [...payments].sort((a, b) => a.payment_date.localeCompare(b.payment_date))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!invoice) return <div className="p-6 text-[#9A8F82]">Invoice not found</div>

  const isProjectInvoice = !!invoice.project_id

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

          {/* Bill To + Date / Project */}
          <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-[#F0EBE0] bg-[#FDFAF8]">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-2">Bill To</p>
              <p className="font-semibold text-[#1C1712]">{client?.client_name ?? invoice.client_name ?? '—'}</p>
              {client?.company_name && <p className="text-sm text-[#9A8F82]">{client.company_name}</p>}
              {client?.phone && <p className="text-sm text-[#9A8F82]">{client.phone}</p>}
              {client?.address && <p className="text-sm text-[#9A8F82]">{client.address}</p>}
              {isProjectInvoice && project?.phone && !client?.phone && (
                <p className="text-sm text-[#9A8F82]">{project.phone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-2">
                {isProjectInvoice ? 'Project Details' : 'Details'}
              </p>
              {isProjectInvoice ? (
                <>
                  <p className="text-sm font-semibold text-[#1C1712]">{project?.project_name}</p>
                  <p className="text-sm text-[#9A8F82]">
                    {project?.location || ''}{project?.house_type ? ' · ' + project.house_type : ''}
                  </p>
                </>
              ) : null}
              {invoice.due_date && (
                <p className="text-sm text-[#9A8F82] mt-1">Due: <span className="font-semibold text-[#1C1712]">
                  {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span></p>
              )}
              <p className="text-sm text-[#9A8F82]">Created: <span className="font-semibold text-[#1C1712]">
                {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span></p>
            </div>
          </div>

          {isProjectInvoice ? (
            <>
              {/* Payment History */}
              {sortedPayments.length > 0 && (
                <div className="px-8 pt-6">
                  <div className="bg-[#1C1712] text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-t-lg">
                    Payment History
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#2C2218] text-white text-xs">
                        <th className="px-4 py-2 text-center font-semibold">#</th>
                        <th className="px-4 py-2 text-left font-semibold">Date</th>
                        <th className="px-4 py-2 text-left font-semibold">Description</th>
                        <th className="px-4 py-2 text-right font-semibold">Amount (₹)</th>
                        <th className="px-4 py-2 text-right font-semibold">Running Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE0]">
                      {(() => {
                        let running = 0
                        return sortedPayments.map((p, idx) => {
                          running += Number(p.amount || 0)
                          return (
                            <tr key={p.id}>
                              <td className="px-4 py-2 text-center text-[#9A8F82]">{idx + 1}</td>
                              <td className="px-4 py-2 text-[#1C1712]">
                                {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-2 text-[#1C1712]">{(p.milestone_id && milestoneNameById[p.milestone_id]) || p.notes || 'Payment'}</td>
                              <td className="px-4 py-2 text-right text-[#1C1712]">{fmt(Number(p.amount))}</td>
                              <td className="px-4 py-2 text-right font-semibold text-[#1C1712]">{fmt(running)}</td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#1C1712] text-white font-bold">
                        <td colSpan={3} className="px-4 py-2.5">TOTAL RECEIVED</td>
                        <td></td>
                        <td className="px-4 py-2.5 text-right text-emerald-400">{fmt(totalReceived)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Milestone Summary */}
              <div className="px-8 pt-6">
                <div className="bg-[#1C1712] text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-t-lg">
                  Milestone Summary
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#2C2218] text-white text-xs">
                      <th className="px-4 py-2 text-left font-semibold">Milestone</th>
                      <th className="px-4 py-2 text-center font-semibold">%</th>
                      <th className="px-4 py-2 text-right font-semibold">Expected (₹)</th>
                      <th className="px-4 py-2 text-right font-semibold">Received (₹)</th>
                      <th className="px-4 py-2 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE0]">
                    {milestones.map(m => {
                      const exp = Number(m.expected_amount || 0)
                      const rec = getMilestoneReceived(m)
                      const isPaid = rec >= exp
                      const statusColor = isPaid ? 'text-emerald-600' : rec > 0 ? 'text-amber-600' : 'text-[#9A8F82]'
                      const statusLabel = isPaid ? 'Paid' : rec > 0 ? 'Partial' : 'Pending'
                      return (
                        <tr key={m.id}>
                          <td className="px-4 py-2 font-semibold text-[#1C1712]">{m.milestone_name}</td>
                          <td className="px-4 py-2 text-center text-[#B8860B] font-semibold">{m.percentage}%</td>
                          <td className="px-4 py-2 text-right text-[#1C1712]">{fmt(exp)}</td>
                          <td className="px-4 py-2 text-right text-[#1C1712]">{fmt(rec)}</td>
                          <td className={`px-4 py-2 text-center font-bold ${statusColor}`}>{statusLabel}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1C1712] text-white font-bold">
                      <td colSpan={2} className="px-4 py-2.5">TOTAL</td>
                      <td className="px-4 py-2.5 text-right">{fmt(totalExpected)}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400">{fmt(totalReceived)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Grand Summary */}
              <div className="px-8 py-6">
                <div className="flex justify-end">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9A8F82]">Total Project Value</span>
                      <span className="font-semibold text-[#1C1712]">{fmt(totalExpected)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9A8F82]">Total Received</span>
                      <span className="font-semibold text-emerald-600">{fmt(totalReceived)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t-2 border-[#1C1712] pt-2">
                      <span className="text-[#1C1712]">Balance Pending</span>
                      <span className="text-[#B8860B]">{fmt(totalPending)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Generic Line Items (non-project invoices) */
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
          )}

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