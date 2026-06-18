import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, email, phone, designation, department, join_date, salary, companyId, permissions } = body

    if (!full_name || !email || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { count } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    const prefix = full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    const empCode = `EMP${prefix}${String((count ?? 0) + 1).padStart(3, '0')}`

    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$'
    const password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'employee' }
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const userId = authData.user.id

    // ✅ FIX 1: Profile upsert error check
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name,
      email: email.trim(),
      role: 'employee',
      company_id: companyId,
    })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Profile creation failed: ' + profileError.message }, { status: 400 })
    }

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
      // ✅ Permissions save
      permissions: permissions && permissions.length > 0 ? permissions : ['pipeline'],
    }).select().single()

    if (empError) {
      // ✅ FIX 2: Cleanup profile row too, not just auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      return NextResponse.json({ error: empError.message }, { status: 400 })
    }

    // ✅ FIX 3: Leave balance error check (log only, don't rollback employee)
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
      employee: { empCode, email: email.trim(), password }
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}