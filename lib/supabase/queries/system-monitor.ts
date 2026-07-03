// lib/supabase/queries/system-monitor.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getSystemStatus() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('system_status')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

export async function getSystemAlerts() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export async function createSystemAlert(
  service_name: string,
  severity: 'info' | 'warning' | 'critical',
  message: string
) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('system_alerts')
    .insert({
      service_name,
      severity,
      message
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSystemStatus(
  service_name: string,
  status: 'operational' | 'degraded' | 'down' | 'maintenance',
  response_time_ms: number,
  is_healthy: boolean
) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('system_status')
    .upsert({
      service_name,
      status,
      response_time_ms,
      is_healthy,
      checked_at: new Date().toISOString()
    }, {
      onConflict: 'service_name'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getHealthSummary() {
  const supabase = await createServerSupabaseClient()
  
  const { data: statuses, error: statusError } = await supabase
    .from('system_status')
    .select('*')
    .order('checked_at', { ascending: false })

  if (statusError) throw statusError

  const { data: alerts, error: alertError } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  if (alertError) throw alertError

  const totalServices = statuses?.length || 0
  const healthyServices = statuses?.filter(s => s.is_healthy).length || 0
  const unhealthyServices = totalServices - healthyServices
  const avgResponseTime = statuses && statuses.length > 0
    ? Math.round(statuses.reduce((sum, s) => sum + s.response_time_ms, 0) / statuses.length)
    : 0

  return {
    totalServices,
    healthyServices,
    unhealthyServices,
    avgResponseTime,
    activeAlerts: alerts?.length || 0,
    statuses: statuses || [],
    alerts: alerts || []
  }
}