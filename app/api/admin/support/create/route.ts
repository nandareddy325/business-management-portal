import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
