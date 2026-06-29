import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // Verify secret key (security)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Map WordPress form fields → CRM lead fields
    const {
      names,        // Name field
      phone_number, // Phone Number
      location,     // Location dropdown
      service_required, // Service Required
      your_message  // Your Message
    } = body

    // GK Home Interiors company ID Supabase lo chuddu
    const GKHI_COMPANY_ID = process.env.GKHI_COMPANY_ID

    // Lead create cheyyi
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        company_id: GKHI_COMPANY_ID,
        name: names?.first_name || names || '',
        phone: phone_number || '',
        location: location || '',
        service_required: service_required || '',
        message: your_message || '',
        stage: 'New Leads',
        source: 'Website Form',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Lead insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      lead_id: data.id,
      message: 'Lead created successfully'
    })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}