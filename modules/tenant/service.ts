import { tenantRepository } from './repository'
import { subscriptionService } from '@/modules/subscription/service'

export const tenantService = {
  async getTenantContext(companyId: string) {
    const company = await tenantRepository.getCompanyById(companyId)
    if (!company) throw new Error('Company not found')

    const industries = await tenantRepository.getCompanyIndustries(companyId)
    const subscription = await subscriptionService.getStatus(companyId)

    return { company, industries, subscription }
  },

  async canAccessIndustry(companyId: string, industrySlug: string): Promise<boolean> {
    const industries = await tenantRepository.getCompanyIndustries(companyId)
    return industries.includes(industrySlug)
  },

  async updateSettings(companyId: string, settings: {
    name?: string
    phone?: string
    email?: string
  }) {
    return tenantRepository.updateCompany(companyId, settings)
  },

  async getTeamMembers(companyId: string) {
    return tenantRepository.getCompanyUsers(companyId)
  },

  async getDashboardStats(companyId: string) {
    const [userCount, industries] = await Promise.all([
      tenantRepository.countActiveUsers(companyId),
      tenantRepository.getCompanyIndustries(companyId),
    ])

    return {
      activeUsers: userCount,
      industriesEnabled: industries.length,
      industries,
    }
  },
}
