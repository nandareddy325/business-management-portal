import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, companyId, planConfig } = await req.json()
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(body).digest('hex')
    if (expected !== razorpay_signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    await supabase.from('company_subscriptions').upsert({
      company_id: companyId,
      plan_config: planConfig,
      status: 'active',
      razorpay_order_id,
      razorpay_payment_id,
      activated_at: new Date().toISOString(),
    })
    await supabase.from('companies').update({ plan: 'paid' }).eq('id', companyId)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}