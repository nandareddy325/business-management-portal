// services/index.ts — Central barrel export

export { apiClient, ApiError } from './api-client'
export { authClientService } from './auth.service'
export { crmClientService } from './crm.service'
export { billingClientService } from './billing.service'
export { hrClientService } from './hr.service'
export { tenantClientService } from './tenant.service'
export { adminClientService } from './admin.service'

// Types
export type { CreateLeadInput, UpdateLeadInput } from './crm.service'
export type { LineItem, CreateInvoiceInput } from './billing.service'
export type { AttendanceRecord } from './hr.service'
