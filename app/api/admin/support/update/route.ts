import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: Request) {
  try {
    const { ticket_id, status } = await req.json()

    if (!ticket_id || !status) {
      return NextResponse.json({ error: 'ticket_id and status are required' }, { status: 400 })
    }

    const validStatuses = ['open', 'in_progress', 'resolved']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updates)
      .eq('id', ticket_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
