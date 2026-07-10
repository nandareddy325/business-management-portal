import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      companyId,
      planConfig,
    } = await req.json()

    // ── Signature verify ──────────────────────────────────────
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      console.error('❌ Signature mismatch')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // ── Supabase update — companyId ఉంటేనే ──────────────────
    if (companyId) {
      await supabase.from('company_subscriptions').upsert({
        company_id: companyId,
        plan_config: planConfig,
        status: 'active',
        total_amount: planConfig?.total ?? planConfig?.amount ?? 0,
        razorpay_order_id,
        razorpay_payment_id,
        activated_at: new Date().toISOString(),
      }, { onConflict: 'company_id' })

      await supabase
        .from('companies')
        .update({ plan: 'paid' })
        .eq('id', companyId)
    } else {
      // Signup flow — payment verified, company baad create avutundi
      console.log('✅ Payment verified (pre-signup):', razorpay_payment_id)
    }

    return NextResponse.json({ success: true, payment_id: razorpay_payment_id })

  } catch (err: unknown) {
    console.error('❌ Verify error:', (err instanceof Error ? err.message : undefined))
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}