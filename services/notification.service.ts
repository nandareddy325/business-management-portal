import { supabaseAdmin } from '@/lib/supabase/admin'
import { createBrowserClient } from '@supabase/ssr'

export type NotificationType =
  | 'lead_assigned'
  | 'payment_received'
  | 'quotation_approved'
  | 'leave_request'
  | 'leave_approved'
  | 'system'

interface CreateNotificationParams {
  companyId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

// Server-side: create a notification (called from other services/routes)
export async function createNotification(params: CreateNotificationParams) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      company_id: params.companyId,
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('createNotification error:', error)
    throw error
  }
  return data
}

// Bulk create — e.g. notify all managers of a company
export async function createNotificationForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  const rows = userIds.map((userId) => ({
    company_id: params.companyId,
    user_id: userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  }))

  const { error } = await supabaseAdmin.from('notifications').insert(rows)
  if (error) {
    console.error('createNotificationForUsers error:', error)
    throw error
  }
}

// Client-side: fetch notifications for current user
export async function getNotifications(limit = 20) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getUnreadCount() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

export async function markAsRead(notificationId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllAsRead() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw error
}