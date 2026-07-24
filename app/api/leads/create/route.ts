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
      names,             // Name field
      phone_number,      // Phone Number
      location,          // Location dropdown
      service_required,  // Service Required
      your_message        // Your Message
    } = body

    // GK Home Interiors company ID Supabase lo chuddu
    const GKHI_COMPANY_ID = process.env.GKHI_COMPANY_ID

    // Lead create cheyyi
    // NOTE: owner_id ni intentionally set cheyatam ledu -> fresh/unclaimed lead
    // (RLS policy prakaram anni CRE-laki kanipistundi, evaraina claim chesukovachu)
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        company_id: GKHI_COMPANY_ID,
        lead_name: names?.first_name || names || '',   // fixed: name -> lead_name
        phone: phone_number || '',
        city: location || '',                          // fixed: location -> city
        interest: service_required || '',               // fixed: service_required -> interest
        notes: your_message || '',                      // fixed: message -> notes
        pipeline_stage: 'new',                           // fixed: stage -> pipeline_stage
        status: 'new',
        source: 'Website Form',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Lead insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notify all active employees of this company — new unclaimed lead available.
    // Wrapped in try/catch so a notification failure never blocks lead creation.
    try {
      const { data: activeEmployees, error: empError } = await supabaseAdmin
        .from('employees')
        .select('user_id')
        .eq('company_id', GKHI_COMPANY_ID)
        .eq('is_active', true)
        .not('user_id', 'is', null)

      if (empError) {
        console.error('Failed to fetch employees for notification:', empError)
      } else if (activeEmployees && activeEmployees.length > 0) {
        const notificationRows = activeEmployees.map((emp) => ({
          company_id: GKHI_COMPANY_ID,
          user_id: emp.user_id,
          type: 'lead_assigned',
          title: 'New lead available',
          message: `${data.lead_name || 'A new lead'} · ${data.interest || 'General inquiry'} — unclaimed, first come first served`,
          link: '/dashboard/industries/interior-design/new-leads',
        }))

        const { error: notifError } = await supabaseAdmin
          .from('notifications')
          .insert(notificationRows)

        if (notifError) {
          console.error('Failed to create notifications:', notifError)
        }
      }
    } catch (notifyErr) {
      console.error('Notification step failed:', notifyErr)
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