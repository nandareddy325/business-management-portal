// src/types/admin.ts
// Complete TypeScript type definitions for GK CRM Admin Panel

// ============================================================================
// AUDIT LOGS TYPES
// ============================================================================

export type AuditLogActionType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export' 
  | 'import' 
  | 'login' 
  | 'logout'
  | 'permission_change'

export type AuditLogStatus = 'success' | 'failed' | 'warning'

export type AuditLogResourceType = 
  | 'user' 
  | 'company' 
  | 'lead' 
  | 'quotation' 
  | 'invoice' 
  | 'subscription'
  | 'api_key'
  | 'template'

export interface AuditLog {
  id: string
  company_id: string
  user_id: string
  action: string
  action_type: AuditLogActionType
  resource_type: AuditLogResourceType
  resource_id?: string
  changes?: Record<string, any>
  status: AuditLogStatus
  ip_address?: string
  user_agent?: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
    full_name?: string
  }
  company?: {
    id: string
    name: string
  }
}

export interface AuditLogInsert {
  company_id: string
  user_id: string
  action: string
  action_type: AuditLogActionType
  resource_type: AuditLogResourceType
  resource_id?: string
  changes?: Record<string, any>
  status: AuditLogStatus
  ip_address?: string
  user_agent?: string
}

export interface AuditLogFilters {
  action_type?: AuditLogActionType
  status?: AuditLogStatus
  user_id?: string
  start_date?: string
  end_date?: string
  resource_type?: AuditLogResourceType
}

export interface AuditLogStats {
  total_logs: number
  success_count: number
  failed_count: number
  warning_count: number
  by_action_type: Record<string, number>
}

// ============================================================================
// API KEYS TYPES
// ============================================================================

export type APIKeyEnvironment = 'development' | 'production'
export type APIKeyStatus = 'active' | 'inactive' | 'revoked'

export interface APIKey {
  id: string
  company_id: string
  created_by: string
  name: string
  key_prefix: string
  key_hash: string
  environment: APIKeyEnvironment
  status: APIKeyStatus
  permissions?: string[]
  rate_limit?: number
  last_used_at?: string
  last_ip?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface APIKeyInsert {
  company_id: string
  created_by: string
  name: string
  environment: APIKeyEnvironment
  permissions?: string[]
  rate_limit?: number
  expires_at?: string
}

export interface APIKeyUpdate {
  name?: string
  status?: APIKeyStatus
  permissions?: string[]
  rate_limit?: number
  expires_at?: string
}

// ============================================================================
// SUPPORT TICKETS TYPES
// ============================================================================

export type TicketCategory = 'bug' | 'feature_request' | 'support' | 'billing' | 'other'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened'

export interface SupportTicket {
  id: string
  company_id: string
  ticket_number: string
  created_by: string
  assigned_to?: string
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  message_count: number
  resolution_time_hours?: number
  response_time_hours?: number
  created_at: string
  updated_at: string
  closed_at?: string
  created_by_user?: {
    id: string
    email: string
    full_name?: string
  }
  assigned_to_user?: {
    id: string
    email: string
    full_name?: string
  }
}

export interface SupportTicketInsert {
  company_id: string
  created_by: string
  assigned_to?: string
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
}

export interface SupportTicketUpdate {
  assigned_to?: string
  subject?: string
  description?: string
  category?: TicketCategory
  priority?: TicketPriority
  status?: TicketStatus
}

export interface SupportTicketFilters {
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  assigned_to?: string
  created_by?: string
}

export interface TicketStats {
  total_open: number
  total_in_progress: number
  total_resolved: number
  by_priority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  avg_resolution_time_hours: number
  avg_response_time_hours: number
}

// ============================================================================
// EMAIL TEMPLATES TYPES
// ============================================================================

export type EmailTemplateCategory = 
  | 'onboarding' 
  | 'welcome' 
  | 'reset_password' 
  | 'verification' 
  | 'notification' 
  | 'marketing' 
  | 'invoice' 
  | 'other'

export interface EmailTemplate {
  id: string
  template_key: string
  name: string
  category: EmailTemplateCategory
  subject: string
  body: string
  variables?: string[]
  usage_count: number
  last_used_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailTemplateInsert {
  template_key: string
  name: string
  category: EmailTemplateCategory
  subject: string
  body: string
  variables?: string[]
  is_active?: boolean
}

export interface EmailTemplateUpdate {
  name?: string
  subject?: string
  body?: string
  variables?: string[]
  is_active?: boolean
}

// ============================================================================
// BACKUP TYPES
// ============================================================================

export type BackupType = 'full' | 'incremental' | 'differential'
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type BackupStorageProvider = 'local' | 's3' | 'gcs' | 'azure'

export interface Backup {
  id: string
  company_id?: string
  backup_name: string
  backup_type: BackupType
  status: BackupStatus
  storage_provider: BackupStorageProvider
  storage_path: string
  data_size_bytes?: number
  duration_seconds?: number
  started_at: string
  completed_at?: string
  created_at: string
  updated_at: string
  error_message?: string
}

export interface BackupInsert {
  company_id?: string
  backup_name: string
  backup_type: BackupType
  status: BackupStatus
  storage_provider: BackupStorageProvider
  storage_path: string
  started_at: string
}

export interface BackupUpdate {
  status?: BackupStatus
  completed_at?: string
  data_size_bytes?: number
  duration_seconds?: number
  error_message?: string
}

export interface BackupStats {
  total_backups: number
  completed_backups: number
  failed_backups: number
  total_data_size_gb: number
  last_backup_time: string
}

// ============================================================================
// SYSTEM STATUS TYPES
// ============================================================================

export type SystemService = 
  | 'api' 
  | 'database' 
  | 'redis' 
  | 'storage' 
  | 'email' 
  | 'auth' 
  | 'webhook' 
  | 'cdn'

export type ServiceStatus = 'operational' | 'degraded' | 'down'
export type AlertLevel = 'info' | 'warning' | 'critical'

export interface SystemStatus {
  id: string
  service_name: SystemService
  status: ServiceStatus
  uptime_percent: number
  response_time_ms: number
  last_check_message?: string
  alert_level?: AlertLevel
  checked_at: string
  created_at: string
  updated_at: string
}

export interface SystemStatusInsert {
  service_name: SystemService
  status: ServiceStatus
  uptime_percent: number
  response_time_ms: number
  last_check_message?: string
  alert_level?: AlertLevel
  checked_at: string
}

export interface SystemStatusUpdate {
  status?: ServiceStatus
  uptime_percent?: number
  response_time_ms?: number
  last_check_message?: string
  alert_level?: AlertLevel
}

export interface SystemHealthSummary {
  status: 'healthy' | 'degraded' | 'critical'
  services: SystemStatus[]
  last_updated: string
}

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'guest'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'

export interface AdminUser {
  id: string
  email: string
  full_name?: string
  role: UserRole
  status: UserStatus
  avatar_url?: string
  company_id?: string
  last_login?: string
  created_at: string
  updated_at: string
}

export interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  by_role: Record<UserRole, number>
  by_status: Record<UserStatus, number>
}

// ============================================================================
// COMPANY/TENANT TYPES
// ============================================================================

export interface CompanySubscription {
  id: string
  company_id: string
  plan: 'free' | 'professional' | 'enterprise'
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  billing_cycle: 'monthly' | 'yearly'
  price_amount: number
  started_at: string
  ends_at: string
  created_at: string
  updated_at: string
  cancelled_at?: string
}

export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  logo_url?: string
  subscription?: CompanySubscription
  created_at: string
  updated_at: string
  is_active: boolean
}

// ============================================================================
// ANALYTICS & REPORTING TYPES
// ============================================================================

export interface DashboardStats {
  total_revenue: number
  total_users: number
  active_subscriptions: number
  growth_rate: number
}

export interface RevenueDataPoint {
  month: string
  revenue: number
  target: number
}

export interface MetricCard {
  title: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
  icon?: string
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type * from './admin'