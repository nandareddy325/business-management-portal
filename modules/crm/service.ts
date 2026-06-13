import { crmRepository, type LeadFilters } from './repository'
import { subscriptionService } from '@/modules/subscription/service'

export const crmService = {
  async getLeads(companyId: string, userId: string, role: string, filters: LeadFilters = {}) {
    // Employees only see their own leads
    if (role === 'employee') {
      filters.assignedTo = userId
    }
    return crmRepository.getLeads(companyId, filters)
  },

  async createLead(companyId: string, userId: string, industryId: string, data: {
    lead_name: string
    phone?: string
    budget?: string
    source?: string
    assigned_to?: string
  }) {
    // Check monthly lead limit
    const canAdd = await subscriptionService.canAddLead(companyId)
    if (!canAdd) throw new Error('LEAD_LIMIT_REACHED')

    return crmRepository.createLead({
      company_id: companyId,
      industry_id: industryId,
      assigned_to: data.assigned_to ?? userId,
      created_by: userId,
      lead_name: data.lead_name,
      phone: data.phone,
      budget: data.budget,
      source: data.source,
      status: 'new',
      pipeline_stage: 'new',
    })
  },

  async moveToPipeline(companyId: string, leadId: string, newStage: string) {
    const stageToStatus: Record<string, string> = {
      new: 'new',
      followup: 'called',
      sitevisit: 'followup',
      quotation: 'followup',
      negotiation: 'followup',
      won: 'won',
      lost: 'lost',
    }
    const status = stageToStatus[newStage] ?? 'followup'
    await crmRepository.updateLeadStage(companyId, leadId, newStage, status)
  },

  async assignLead(companyId: string, leadId: string, assignToUserId: string) {
    return crmRepository.updateLead(companyId, leadId, { assigned_to: assignToUserId })
  },

  async getPipelineBoard(companyId: string, industryId: string) {
    const stages = ['new', 'followup', 'sitevisit', 'quotation', 'negotiation', 'won', 'lost']
    const [counts, { data: leads }] = await Promise.all([
      crmRepository.getLeadCountByStage(companyId, industryId),
      crmRepository.getLeads(companyId, { industryId, limit: 200 }),
    ])

    const board: Record<string, any[]> = {}
    for (const stage of stages) {
      board[stage] = leads.filter(l => l.pipeline_stage === stage)
    }

    return { board, counts }
  },

  async deleteLead(companyId: string, leadId: string, role: string, userId: string) {
    if (role === 'employee') {
      const lead = await crmRepository.getLeadById(companyId, leadId)
      if (!lead || lead.assigned_to !== userId) throw new Error('UNAUTHORIZED')
    }
    await crmRepository.deleteLead(companyId, leadId)
  },

  async getDashboardMetrics(companyId: string) {
    const [stageCounts, monthlyCount] = await Promise.all([
      crmRepository.getLeadCountByStage(companyId),
      crmRepository.getMonthlyLeadCount(companyId),
    ])

    const totalLeads = Object.values(stageCounts).reduce((a, b) => a + b, 0)
    const wonLeads = stageCounts['won'] ?? 0
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    return {
      totalLeads,
      wonLeads,
      lostLeads: stageCounts['lost'] ?? 0,
      monthlyLeads: monthlyCount,
      conversionRate,
      stageCounts,
    }
  },
}
