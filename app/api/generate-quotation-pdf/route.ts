import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: q, error } = await supabase
    .from('quotations')
    .select('*, client:id_clients(name, phone, email, city, address)')
    .eq('id', id)
    .single()

  if (error || !q) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(q)
}