import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { email, company_id, full_name, role } = await req.json()

    if (!email || !company_id) {
      return NextResponse.json({ error: 'email and company_id are required' }, { status: 400 })
    }

    // Send an invite email — the user sets their own password via the emailed link
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

    if (inviteError) {
      return NextResponse.json({ error: `Invite failed: ${inviteError.message}` }, { status: 500 })
    }

    const userId = inviteData.user.id

    // Create the matching profile row, scoped to this company
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        company_id,
        email,
        full_name: full_name || null,
        role: role || 'admin',
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({
        error: `Invite sent, but profile creation failed: ${profileError.message}`,
        user_id: userId,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 })
  }
}
