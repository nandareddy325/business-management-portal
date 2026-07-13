import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

// Razorpay Dashboard → Subscriptions → Plans లో create చేసిన Plan ID ఇక్కడ పెట్టు
const RAZORPAY_PLAN_IDS: Record<string, string> = {
  starter: process.env.RAZORPAY_PLAN_STARTER!,
  professional: process.env.RAZORPAY_PLAN_PROFESSIONAL!,
  business: process.env.RAZORPAY_PLAN_BUSINESS!,
}

export async function POST(req: NextRequest) {
  try {
    const { companyId, planName } = await req.json()

    if (!companyId || !planName) {
      return NextResponse.json({ error: 'companyId, planName required' }, { status: 400 })
    }

    const planId = RAZORPAY_PLAN_IDS[planName]
    if (!planId) {
      return NextResponse.json({ error: `Unknown plan: ${planName}` }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // 12 నెలలు — ఏడాది తర్వాత renew ప్రాంప్ట్ అవుతుంది, ఇష్టం లేకపోతే పెద్ద number పెట్టొచ్చు
      notes: {
        company_id: companyId,
        plan_name: planName,
      },
    })

    console.log('✅ Subscription created:', subscription.id)
    return NextResponse.json(subscription)
  } catch (err: unknown) {
    const razorpayError = err as { error?: { description?: string } }
    const message =
      razorpayError?.error?.description ||
      (err instanceof Error ? err.message : undefined) ||
      'Subscription creation failed'
    console.error('❌ Razorpay create-subscription error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
