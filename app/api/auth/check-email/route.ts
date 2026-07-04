// app/api/auth/check-email/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 👇 meeru guess chestunna possible table names — dashboard chusi confirm chesaka
// ivi trim cheyachu, kani ippudu anni try chestundi, unna vatini matrame use chestundi
const CANDIDATE_TABLES = ['users', 'profiles', 'admins', 'super_admins', 'accounts']

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    let exists = false
    let foundIn: string | null = null

    for (const table of CANDIDATE_TABLES) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .ilike('email', normalizedEmail)
        .maybeSingle()

      // Table lేకపోతే Supabase error istundi (e.g. "relation does not exist")
      // అలాంటప్పుడు skip చేసి next table చూద్దాం
      if (error) {
        if (!error.message.includes('does not exist')) {
          console.error(`Error checking table "${table}":`, error.message)
        }
        continue
      }

      if (data) {
        exists = true
        foundIn = table
        break
      }
    }

    return NextResponse.json({ exists, foundIn })
  } catch (err) {
    console.error('check-email error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}