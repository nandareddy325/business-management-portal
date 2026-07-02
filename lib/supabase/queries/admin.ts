// lib/supabase/queries/admin.ts
// Real Supabase queries for admin tables

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import type {
  AuditLog, AuditLogInsert, AuditLogFilters,
  APIKey, APIKeyInsert, APIKeyUpdate,
  SupportTicket, SupportTicketInsert, SupportTicketUpdate, SupportTicketFilters,
  EmailTemplate, EmailTemplateInsert, EmailTemplateUpdate,
  Backup, BackupInsert, BackupUpdate,
  SystemStatus, SystemStatusInsert, SystemStatusUpdate,
  AuditLogStats, TicketStats, BackupStats, SystemHealthSummary
} from '@/types/admin'

// ============================================================================
// AUDIT LOGS QUERIES
// ============================================================================

export async function getAuditLogs(
  supabase: SupabaseClient,
  companyId: string,
  filters?: AuditLogFilters,
  limit = 50,
  offset = 0
) {
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!user_id(email, full_name),
      company:companies!company_id(name)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters?.action_type) {
    query = query.eq('action_type', filters.action_type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id)
  }
  if (filters?.start_date) {
    query = query.gte('created_at', filters.start_date)
  }
  if (filters?.end_date) {
    query = query.lte('created_at', filters.end_date)
  }

  return await query
}

export async function getAuditLogStats(
  supabase: SupabaseClient,
  companyId: string
): Promise<AuditLogStats | null> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('status, action_type')
    .eq('company_id', companyId)

  if (error || !data) return null

  const stats: AuditLogStats = {
    total_logs: data.length,
    success_count: data.filter(l => l.status === 'success').length,
    failed_count: data.filter(l => l.status === 'failed').length,
    warning_count: data.filter(l => l.status === 'warning').length,
    by_action_type: {} as any
  }

  // Count by action type
  data.forEach(log => {
    stats.by_action_type[log.action_type] = (stats.by_action_type[log.action_type] || 0) + 1
  })

  return stats
}

export async function createAuditLog(
  supabase: SupabaseClient,
  log: AuditLogInsert
) {
  return await supabase
    .from('audit_logs')
    .insert([log])
    .select()
    .single()
}

// ============================================================================
// API KEYS QUERIES
// ============================================================================

export async function getAPIKeys(
  supabase: SupabaseClient,
  companyId: string,
  limit = 50,
  offset = 0
) {
  const { data, error } = await supabase
    .from('api_keys')
    .select(`
      *,
      created_by:profiles!created_by(email, full_name),
      company:companies!company_id(name)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function getAPIKeyById(
  supabase: SupabaseClient,
  keyId: string
) {
  return await supabase
    .from('api_keys')
    .select('*')
    .eq('id', keyId)
    .single()
}

export async function createAPIKey(
  supabase: SupabaseClient,
  key: APIKeyInsert
) {
  // In real implementation, generate and hash the actual API key
  const generatedKey = `sk_${key.environment}_${Math.random().toString(36).substr(2, 9)}`
  
  return await supabase
    .from('api_keys')
    .insert([{
      ...key,
      key_prefix: generatedKey.substring(0, 10),
      key_hash: generatedKey // Should be hashed in production
    }])
    .select()
    .single()
}

export async function updateAPIKey(
  supabase: SupabaseClient,
  keyId: string,
  updates: APIKeyUpdate
) {
  return await supabase
    .from('api_keys')
    .update(updates)
    .eq('id', keyId)
    .select()
    .single()
}

export async function deleteAPIKey(
  supabase: SupabaseClient,
  keyId: string
) {
  return await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
}

export async function updateAPIKeyUsage(
  supabase: SupabaseClient,
  keyId: string,
  lastIp?: string
) {
  return await supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      last_ip: lastIp
    })
    .eq('id', keyId)
}

// ============================================================================
// SUPPORT TICKETS QUERIES
// ============================================================================

export async function getSupportTickets(
  supabase: SupabaseClient,
  companyId: string,
  filters?: SupportTicketFilters,
  limit = 50,
  offset = 0
) {
  let query = supabase
    .from('support_tickets')
    .select(`
      *,
      created_by:profiles!created_by(email, full_name),
      assigned_to:profiles!assigned_to(email, full_name),
      company:companies!company_id(name)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to)
  }
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  return await query
}

export async function getSupportTicketById(
  supabase: SupabaseClient,
  ticketId: string
) {
  return await supabase
    .from('support_tickets')
    .select(`
      *,
      created_by:profiles!created_by(email, full_name),
      assigned_to:profiles!assigned_to(email, full_name)
    `)
    .eq('id', ticketId)
    .single()
}

export async function createSupportTicket(
  supabase: SupabaseClient,
  ticket: SupportTicketInsert
) {
  return await supabase
    .from('support_tickets')
    .insert([ticket])
    .select()
    .single()
}

export async function updateSupportTicket(
  supabase: SupabaseClient,
  ticketId: string,
  updates: SupportTicketUpdate
) {
  return await supabase
    .from('support_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single()
}

export async function getTicketStats(
  supabase: SupabaseClient,
  companyId: string
): Promise<TicketStats | null> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('status, priority, resolution_time_hours, response_time_hours')
    .eq('company_id', companyId)

  if (error || !data) return null

  const stats: TicketStats = {
    total_open: data.filter(t => t.status === 'open').length,
    total_in_progress: data.filter(t => t.status === 'in_progress').length,
    total_resolved: data.filter(t => t.status === 'resolved').length,
    by_priority: {
      low: data.filter(t => t.priority === 'low').length,
      medium: data.filter(t => t.priority === 'medium').length,
      high: data.filter(t => t.priority === 'high').length,
      urgent: data.filter(t => t.priority === 'urgent').length
    },
    avg_resolution_time_hours: data.reduce((sum, t) => sum + (t.resolution_time_hours || 0), 0) / data.length || 0,
    avg_response_time_hours: data.reduce((sum, t) => sum + (t.response_time_hours || 0), 0) / data.length || 0
  }

  return stats
}

// ============================================================================
// EMAIL TEMPLATES QUERIES
// ============================================================================

export async function getEmailTemplates(
  supabase: SupabaseClient,
  category?: string,
  limit = 50,
  offset = 0
) {
  let query = supabase
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  return await query
}

export async function getEmailTemplateByKey(
  supabase: SupabaseClient,
  templateKey: string
) {
  return await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single()
}

export async function createEmailTemplate(
  supabase: SupabaseClient,
  template: EmailTemplateInsert
) {
  return await supabase
    .from('email_templates')
    .insert([template])
    .select()
    .single()
}

export async function updateEmailTemplate(
  supabase: SupabaseClient,
  templateId: string,
  updates: EmailTemplateUpdate
) {
  return await supabase
    .from('email_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single()
}

export async function incrementEmailTemplateUsage(
  supabase: SupabaseClient,
  templateId: string
) {
  return await supabase
    .from('email_templates')
    .update({
      usage_count: supabase.rpc('increment', { x: 1 }),
      last_used_at: new Date().toISOString()
    })
    .eq('id', templateId)
}

// ============================================================================
// BACKUP QUERIES
// ============================================================================

export async function getBackups(
  supabase: SupabaseClient,
  companyId?: string,
  limit = 50,
  offset = 0
) {
  let query = supabase
    .from('backups')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  return await query
}

export async function createBackup(
  supabase: SupabaseClient,
  backup: BackupInsert
) {
  return await supabase
    .from('backups')
    .insert([backup])
    .select()
    .single()
}

export async function updateBackup(
  supabase: SupabaseClient,
  backupId: string,
  updates: BackupUpdate
) {
  return await supabase
    .from('backups')
    .update(updates)
    .eq('id', backupId)
    .select()
    .single()
}

export async function getBackupStats(
  supabase: SupabaseClient,
  companyId?: string
): Promise<BackupStats | null> {
  let query = supabase
    .from('backups')
    .select('status, data_size_bytes, created_at')

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query

  if (error || !data) return null

  const stats: BackupStats = {
    total_backups: data.length,
    completed_backups: data.filter(b => b.status === 'completed').length,
    failed_backups: data.filter(b => b.status === 'failed').length,
    total_data_size_gb: (data.reduce((sum, b) => sum + (b.data_size_bytes || 0), 0)) / 1024 / 1024 / 1024,
    last_backup_time: data[0]?.created_at || ''
  }

  return stats
}

// ============================================================================
// SYSTEM STATUS QUERIES
// ============================================================================

export async function getSystemStatus(
  supabase: SupabaseClient,
  serviceName?: string,
  limit = 50
) {
  let query = supabase
    .from('system_status')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(limit)

  if (serviceName) {
    query = query.eq('service_name', serviceName)
  }

  return await query
}

export async function createSystemStatus(
  supabase: SupabaseClient,
  status: SystemStatusInsert
) {
  return await supabase
    .from('system_status')
    .insert([status])
    .select()
    .single()
}

export async function updateSystemStatus(
  supabase: SupabaseClient,
  statusId: string,
  updates: SystemStatusUpdate
) {
  return await supabase
    .from('system_status')
    .update(updates)
    .eq('id', statusId)
    .select()
    .single()
}

export async function getSystemHealthSummary(
  supabase: SupabaseClient
) {
  const { data, error } = await supabase
    .from('system_status')
    .select('*')
    .order('checked_at', { ascending: false })

  if (error || !data) return []

  // Group by service and get latest for each
  const serviceMap = new Map()
  data.forEach(status => {
    if (!serviceMap.has(status.service_name)) {
      serviceMap.set(status.service_name, status)
    }
  })

  return Array.from(serviceMap.values()) as SystemStatus[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function logAdminAction(
  supabase: SupabaseClient,
  companyId: string,
  userId: string,
  action: string,
  actionType: string,
  resourceType: string,
  resourceId?: string,
  changes?: Record<string, any>
) {
  return await createAuditLog(supabase, {
    company_id: companyId,
    user_id: userId,
    action,
    action_type: actionType as any,
    resource_type: resourceType as any,
    resource_id: resourceId,
    changes,
    status: 'success'
  })
}

export async function getSystemHealth(
  supabase: SupabaseClient
): Promise<{
  status: 'healthy' | 'degraded' | 'critical'
  details: SystemStatus[]
}> {
  const  statuses  = await getSystemHealthSummary(supabase)
  
  if (!Array.isArray(statuses)) {
    return { status: 'healthy', details: [] }
  }

  const allOperational = statuses.every(s => s.status === 'operational')
  const hasCritical = statuses.some(s => s.status === 'down')

  return {
    status: hasCritical ? 'critical' : allOperational ? 'healthy' : 'degraded',
    details: statuses
  }
}