import { billingRepository, type LineItem } from './repository'

export const billingService = {
  async createInvoice(companyId: string, input: {
    customerId: string
    items: LineItem[]
    dueDate?: string
    sendNow?: boolean
  }) {
    const invoiceNo = await billingRepository.generateInvoiceNumber(companyId)
    const amount = input.items.reduce((sum, item) => sum + item.amount, 0)

    const invoice = await billingRepository.createInvoice({
      company_id: companyId,
      customer_id: input.customerId,
      invoice_no: invoiceNo,
      amount,
      due_date: input.dueDate,
      items: input.items,
      status: input.sendNow ? 'sent' : 'draft',
    })

    return invoice
  },

  async recordPayment(companyId: string, invoiceId: string, amount: number) {
    if (amount <= 0) throw new Error('Invalid payment amount')
    return billingRepository.recordPayment(companyId, invoiceId, amount)
  },

  async markAsOverdue(companyId: string) {
    // Called by a cron — marks sent invoices past due_date as overdue
    const { data } = await billingRepository.getInvoices(companyId, 'sent')
    const today = new Date()
    const overdueIds = data
      .filter(inv => inv.due_date && new Date(inv.due_date) < today)
      .map(inv => inv.id)

    for (const id of overdueIds) {
      await billingRepository.updateInvoice(companyId, id, { status: 'overdue' })
    }

    return overdueIds.length
  },

  async getDashboardMetrics(companyId: string) {
    return billingRepository.getRevenueSummary(companyId)
  },

  async getInvoices(companyId: string, status?: any, page = 1) {
    return billingRepository.getInvoices(companyId, status, page)
  },

  async getInvoiceDetail(companyId: string, invoiceId: string) {
    const invoice = await billingRepository.getInvoiceById(companyId, invoiceId)
    if (!invoice) throw new Error('Invoice not found')
    return invoice
  },
}
