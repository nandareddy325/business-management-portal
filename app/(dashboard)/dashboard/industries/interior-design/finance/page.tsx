import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IndianRupee, FileText, Receipt, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface Quotation {
  id: string
  quotation_no?: string | null
  amount?: number | null
  status?: string | null
  created_at: string
}

interface Invoice {
  id: string
  invoice_no?: string | null
  amount?: number | null
  paid_amount?: number | null
  status?: string | null
  due_date?: string | null
  created_at: string
}

interface Payment {
  id: string
  amount?: number | null
  payment_method?: string | null
  payment_date?: string | null
  invoice?: { invoice_no?: string | null } | null
}

interface Expense {
  id: string
  expense_name?: string | null
  category?: string | null
  amount?: number | null
  expense_date?: string | null
}

async function getFinanceData(supabase: SupabaseServerClient, companyId: string) {
  const [
    { data: quotations },
    { data: invoices },
    { data: payments },
    { data: expenses },
  ] = await Promise.all([
    supabase.from('quotations').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('payments').select('*, invoice:invoices(invoice_no, company_id)').order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
  ])

  const quotationsList: Quotation[] = quotations ?? []
  const invoicesList: Invoice[] = invoices ?? []
  const paymentsList: Payment[] = payments ?? []
  const expensesList: Expense[] = expenses ?? []

  const totalQuotationValue = quotationsList.reduce((s: number, q: Quotation) => s + Number(q.amount || 0), 0)
  const totalInvoiced = invoicesList.reduce((s: number, i: Invoice) => s + Number(i.amount || 0), 0)
  const totalReceived = invoicesList.reduce((s: number, i: Invoice) => s + Number(i.paid_amount || 0), 0)
  const totalPending = totalInvoiced - totalReceived
  const totalExpenses = expensesList.reduce((s: number, e: Expense) => s + Number(e.amount || 0), 0)
  const netProfit = totalReceived - totalExpenses

  return {
    quotations: quotationsList,
    invoices: invoicesList,
    payments: paymentsList,
    expenses: expensesList,
    stats: {
      totalQuotationValue,
      totalInvoiced,
      totalReceived,
      totalPending,
      totalExpenses,
      netProfit,
    }
  }
}

const statusBadge: Record<string, string> = {
  paid:      'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  overdue:   'bg-red-100 text-red-600',
  draft:     'bg-[#F5F0E8] text-[#9A8F82]',
  sent:      'bg-blue-100 text-blue-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-600',
}

export default async function FinancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/login')

  const { quotations, invoices, payments, expenses, stats } = await getFinanceData(supabase, profile.company_id)

  const statCards = [
    {
      label: 'Total Invoiced',
      value: `₹${(stats.totalInvoiced / 100000).toFixed(1)}L`,
      sub: `${invoices.length} invoices`,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      trend: '+12%',
      up: true,
    },
    {
      label: 'Amount Received',
      value: `₹${(stats.totalReceived / 100000).toFixed(1)}L`,
      sub: 'Collected so far',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      trend: '+8%',
      up: true,
    },
    {
      label: 'Pending Amount',
      value: `₹${(stats.totalPending / 100000).toFixed(1)}L`,
      sub: 'Yet to collect',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      trend: '-3%',
      up: false,
    },
    {
      label: 'Total Expenses',
      value: `₹${(stats.totalExpenses / 100000).toFixed(1)}L`,
      sub: `${expenses.length} entries`,
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-100',
      trend: '+5%',
      up: false,
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Interior Design CRM</p>
          <h1 className="font-serif text-2xl md:text-3xl text-[#1C1712]">Finance Dashboard</h1>
          <p className="text-sm text-[#9A8F82] mt-1">Quotations · Invoices · Payments · Expenses</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/industries/interior-design/finance/quotations/new"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: '#1C1712' }}>
            + New Quotation
          </Link>
          <Link href="/dashboard/industries/interior-design/finance/invoices/new"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white transition-all">
            + New Invoice
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-4 md:p-5 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={16} className={card.color} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${card.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {card.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {card.trend}
                </span>
              </div>
              <p className="font-serif text-xl md:text-2xl font-bold text-[#1C1712]">{card.value}</p>
              <p className="text-xs text-[#9A8F82] mt-0.5">{card.label}</p>
              <p className="text-[10px] text-[#B8B0A0] mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Net Profit Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: '#1C1712' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #B8860B, transparent 60%)' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#B8860B] uppercase tracking-widest mb-1">Net Profit</p>
            <p className="font-serif text-3xl text-white">₹{stats.netProfit.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/50 mt-1">Revenue Received − Total Expenses</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Quotation Pipeline</p>
            <p className="font-serif text-xl text-[#B8860B]">₹{(stats.totalQuotationValue / 100000).toFixed(1)}L</p>
            <p className="text-[10px] text-white/30">{quotations.length} quotations</p>
          </div>
        </div>
      </div>

      {/* Two Column — Invoices + Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EBE0]"
            style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <div className="flex items-center gap-2">
              <Receipt size={15} className="text-[#B8860B]" />
              <h2 className="font-serif text-sm text-[#1C1712]">Recent Invoices</h2>
            </div>
            <Link href="/dashboard/industries/interior-design/finance/invoices"
              className="text-[11px] font-semibold text-[#B8860B] hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {invoices.slice(0, 5).length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle size={24} className="text-[#9A8F82] mx-auto mb-2" />
                <p className="text-sm text-[#9A8F82]">No invoices yet</p>
              </div>
            ) : invoices.slice(0, 5).map((inv: Invoice) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#FFFBEF] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-[#1C1712]">{inv.invoice_no}</p>
                  <p className="text-xs text-[#9A8F82]">
                    Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1C1712]">₹{Number(inv.amount).toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusBadge[inv.status ?? 'draft'] ?? statusBadge.draft}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EBE0]"
            style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-[#B8860B]" />
              <h2 className="font-serif text-sm text-[#1C1712]">Recent Quotations</h2>
            </div>
            <Link href="/dashboard/industries/interior-design/finance/quotations"
              className="text-[11px] font-semibold text-[#B8860B] hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {quotations.slice(0, 5).length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle size={24} className="text-[#9A8F82] mx-auto mb-2" />
                <p className="text-sm text-[#9A8F82]">No quotations yet</p>
              </div>
            ) : quotations.slice(0, 5).map((q: Quotation) => (
              <div key={q.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#FFFBEF] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-[#1C1712]">{q.quotation_no}</p>
                  <p className="text-xs text-[#9A8F82]">
                    {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1C1712]">₹{Number(q.amount).toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusBadge[q.status ?? 'draft'] ?? statusBadge.draft}`}>
                    {q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EBE0]"
          style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <div className="flex items-center gap-2">
            <TrendingDown size={15} className="text-[#B8860B]" />
            <h2 className="font-serif text-sm text-[#1C1712]">Recent Expenses</h2>
          </div>
          <Link href="/dashboard/industries/interior-design/finance/expenses"
            className="text-[11px] font-semibold text-[#B8860B] hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="divide-y divide-[#F0EBE0]">
          {expenses.slice(0, 5).length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={24} className="text-[#9A8F82] mx-auto mb-2" />
              <p className="text-sm text-[#9A8F82]">No expenses yet</p>
            </div>
          ) : expenses.slice(0, 5).map((exp: Expense) => (
            <div key={exp.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#FFFBEF] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrendingDown size={14} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1712]">{exp.expense_name}</p>
                  <p className="text-xs text-[#9A8F82]">
                    {exp.category} · {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-red-500">−₹{Number(exp.amount).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EBE0]"
          style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <div className="flex items-center gap-2">
            <IndianRupee size={15} className="text-[#B8860B]" />
            <h2 className="font-serif text-sm text-[#1C1712]">Recent Payments Received</h2>
          </div>
          <Link href="/dashboard/industries/interior-design/finance/payments"
            className="text-[11px] font-semibold text-[#B8860B] hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="divide-y divide-[#F0EBE0]">
          {payments.slice(0, 5).length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={24} className="text-[#9A8F82] mx-auto mb-2" />
              <p className="text-sm text-[#9A8F82]">No payments yet</p>
            </div>
          ) : payments.slice(0, 5).map((pay: Payment) => (
            <div key={pay.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#FFFBEF] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1712]">{pay.invoice?.invoice_no ?? 'Payment'}</p>
                  <p className="text-xs text-[#9A8F82]">
                    {pay.payment_method} · {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-600">+₹{Number(pay.amount).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}