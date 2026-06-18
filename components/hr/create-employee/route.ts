import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Service role client — admin privileges, bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────
    // Everything below runs with the service-role key and bypasses
    // RLS, so without this check anyone who can reach this endpoint
    // could create an employee + auth account in ANY company.
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .maybeSingle()

    // Adjust 'admin' below if your admin role value is named differently
    if (!callerProfile || callerProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { full_name, email, phone, designation, department, join_date, salary, companyId } = body

    if (!full_name || !email || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Admin can only create employees within their own company
    if (callerProfile.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate employee code
    const { count } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    const prefix = full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    const empCode = `EMP${prefix}${String((count ?? 0) + 1).padStart(3, '0')}`

    // Generate password
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$'
    const password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

    // Create auth user with admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'employee' }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name,
      email: email.trim(),
      role: 'employee',
      company_id: companyId,
      is_active: true,
    })

    if (profileError) {
      // Rollback auth user since profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Create employee record
    const { data: empData, error: empError } = await supabaseAdmin.from('employees').insert({
      company_id: companyId,
      user_id: userId,
      employee_id: empCode,
      employee_code: empCode,
      full_name,
      email: email.trim(),
      phone: phone || null,
      designation: designation || null,
      department: department || null,
      join_date: join_date || new Date().toISOString().split('T')[0],
      salary: Number(salary) || 0,
      is_active: true,
      portal_access: true,
      password_temp: password,
    }).select().single()

    if (empError) {
      // Rollback: remove the profile and auth user created above
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: empError.message }, { status: 400 })
    }

    // Create leave balance
    const { error: leaveError } = await supabaseAdmin.from('leave_balances').insert({
      employee_id: empData.id,
      company_id: companyId,
      year: new Date().getFullYear(),
      cl_total: 12, sl_total: 12, el_total: 15,
      cl_used: 0, sl_used: 0, el_used: 0,
    })

    if (leaveError) {
      console.error('Leave balance creation failed:', leaveError.message)
    }

    return NextResponse.json({
      success: true,
      employee: { empCode, email: email.trim(), password },
      warning: leaveError ? 'Employee created, but leave balance setup failed — add it manually.' : undefined,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}