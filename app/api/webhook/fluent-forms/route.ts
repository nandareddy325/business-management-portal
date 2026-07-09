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
    console.log('Webhook body received:', JSON.stringify(body))

    // WP Webhooks sends data inside form_data
    const formData = body.form_data || body

    const leadName = formData?.names?.first_name || 
                     formData?.full_name || 
                     'Website Lead'
    
    const leadPhone = formData?.numeric_field || 
                      formData?.phone_number || ''
    
    const leadCity = formData?.dropdown_1 || 
                     formData?.location || 'Hyderabad'
    
    const leadInterest = formData?.input_text || 
                         formData?.service_required || ''
    
    const leadNotes = formData?.message || 
                      formData?.your_message || ''

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        company_id: GK_HOME_COMPANY_ID,
        lead_name: leadName,
        phone: leadPhone,
        city: leadCity,
        interest: leadInterest,
        notes: leadNotes,
        source: 'Website Form',
        pipeline_stage: 'new',
        industry: 'interior-design',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lead created!',
      lead_id: lead.id
    })

  } catch (err: unknown) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'GK Webhook Active ✅' })
}