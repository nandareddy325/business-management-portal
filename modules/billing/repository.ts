import { createServerSupabaseClient } from '@/lib/supabase/server'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue'

export type LineItem = {
  description: string
  quantity: number
  rate: number
  amount: number
}

export const billingRepository = {
  async getInvoices(companyId: string, status?: InvoiceStatus, page = 1, limit = 20) {
    const supabase = await createServerSupabaseClient()
    const from = (page - 1) * limit

    let query = supabase
      .from('invoices')
      .select('*, customer:crm_customers(id, name, email, phone)', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return { data: data ?? [], total: count ?? 0 }
  },

  async getInvoiceById(companyId: string, invoiceId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:crm_customers(*)')
      .eq('company_id', companyId)
      .eq('id', invoiceId)
      .single()
    if (error) return null
    return data
  },

  async createInvoice(invoice: {
    company_id: string
    customer_id: string
    invoice_no: string
    amount: number
    due_date?: string
    items: LineItem[]
    status?: InvoiceStatus
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('invoices')
      .insert({ ...invoice, status: invoice.status ?? 'draft', paid_amount: 0 })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updateInvoice(companyId: string, invoiceId: string, updates: Record<string, any>) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('company_id', companyId)
      .eq('id', invoiceId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async recordPayment(companyId: string, invoiceId: string, paidAmount: number) {
    const invoice = await this.getInvoiceById(companyId, invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    const newPaid = Number(invoice.paid_amount) + paidAmount
    const newStatus: InvoiceStatus = newPaid >= Number(invoice.amount) ? 'paid' : 'partial'

    return this.updateInvoice(companyId, invoiceId, {
      paid_amount: newPaid,
      status: newStatus,
    })
  },

  async getRevenueSummary(companyId: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('invoices')
      .select('amount, paid_amount, status')
      .eq('company_id', companyId)

    if (!data) return { total: 0, collected: 0, pending: 0, overdue: 0 }

    return data.reduce((acc, inv) => {
      acc.total += Number(inv.amount)
      acc.collected += Number(inv.paid_amount)
      if (inv.status === 'overdue') acc.overdue += Number(inv.amount) - Number(inv.paid_amount)
      if (['sent', 'partial'].includes(inv.status)) acc.pending += Number(inv.amount) - Number(inv.paid_amount)
      return acc
    }, { total: 0, collected: 0, pending: 0, overdue: 0 })
  },

  async generateInvoiceNumber(companyId: string): Promise<string> {
    const supabase = await createServerSupabaseClient()
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    const num = String((count ?? 0) + 1).padStart(4, '0')
    const year = new Date().getFullYear()
    return `INV-${year}-${num}`
  },
}
