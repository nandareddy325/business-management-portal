import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_ROLES = ['admin', 'owner', 'tenant_admin', 'manager']

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { company_id, subject, description, category, priority } = await req.json()

    if (!company_id || !subject || !description) {
      return NextResponse.json({ error: 'company_id, subject and description are required' }, { status: 400 })
    }

    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        company_id,
        created_by: user.id,
        subject,
        description,
        category: category || null,
        priority: priority || 'medium',
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    // Notify company admins/managers — wrapped in try/catch so a notification
    // failure never blocks ticket creation (same pattern as the lead webhook).
    try {
      const { data: admins, error: adminErr } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('company_id', company_id)
        .in('role', ADMIN_ROLES)

      if (adminErr) {
        console.error('Failed to fetch admins for ticket notification:', adminErr)
      } else if (admins && admins.length > 0) {
        const priorityIcon: Record<string, string> = { urgent: '🚨', high: '⚠️', medium: '🎫', low: '🎫' }
        const notificationRows = admins
          .filter((a) => a.id !== user.id) // don't notify the person who raised it
          .map((a) => ({
            company_id,
            user_id: a.id,
            type: 'support_ticket',
            title: `${priorityIcon[priority || 'medium']} New support ticket — ${ticketNumber}`,
            message: `${subject} · Priority: ${(priority || 'medium').toUpperCase()}`,
            link: '/dashboard/settings/company', // update if a dedicated tickets page exists
          }))

        if (notificationRows.length > 0) {
          const { error: notifError } = await supabaseAdmin.from('notifications').insert(notificationRows)
          if (notifError) console.error('Failed to create ticket notifications:', notifError)
        }
      }
    } catch (notifyErr) {
      console.error('Ticket notification step failed:', notifyErr)
    }

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}