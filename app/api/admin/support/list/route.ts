import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('company_id')
    const status = searchParams.get('status')

    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true })

    if (companiesError) throw companiesError

    let tickets: unknown[] = []
    let stats = { total_open: 0, total_in_progress: 0, total_resolved: 0, avg_response_hours: 0 }

    if (companyId) {
      let query = supabaseAdmin
        .from('support_tickets')
        .select(`
          id, ticket_number, subject, description, category, priority, status,
          message_count, response_time_hours, resolution_time_hours,
          created_at, updated_at, resolved_at
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: ticketRows, error: ticketsError } = await query
      if (ticketsError) throw ticketsError
      tickets = ticketRows || []

      const responseTimes = (ticketRows || [])
        .map((t) => t.response_time_hours)
        .filter((v): v is number => typeof v === 'number')
      const avgResponse = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0

      stats = {
        total_open: (ticketRows || []).filter((t) => t.status === 'open').length,
        total_in_progress: (ticketRows || []).filter((t) => t.status === 'in_progress').length,
        total_resolved: (ticketRows || []).filter((t) => t.status === 'resolved').length,
        avg_response_hours: Math.round(avgResponse * 10) / 10,
      }
    }

    return NextResponse.json({ companies, tickets, stats })
  } catch (error) {
    console.error('Error fetching support data:', error)
    return NextResponse.json({ error: 'Failed to fetch support data' }, { status: 500 })
  }
}
