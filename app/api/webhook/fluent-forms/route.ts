import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GK_HOME_COMPANY_ID = '04e560cc-3bf4-4273-af1a-e4bfcd3902fe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      names,
      phone_number,
      location,
      service_required,
      your_message
    } = body

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        company_id: GK_HOME_COMPANY_ID,
        full_name: names || 'Website Lead',
        phone: phone_number || '',
        location: location || 'Hyderabad',
        requirement: service_required || '',
        notes: your_message || '',
        lead_source: 'Website Form',
        stage: 'New Leads',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lead created!',
      lead_id: lead.id
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}