import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: NextRequest) {
  try {
    const { amount, companyId, planConfig } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
      amount,           // paise lo — ₹10,000 = 1000000
      currency: 'INR',
      receipt: `gk_${Date.now()}`,
      notes: {
        company_id: companyId ?? 'signup',
        plan_config: JSON.stringify(planConfig),
      },
    })

    console.log('✅ Order created:', order.id)
    return NextResponse.json(order)

  } catch (err: any) {
    console.error('❌ Razorpay create-order error:', err?.message)
    return NextResponse.json(
      { error: err?.error?.description || err?.message || 'Order creation failed' },
      { status: 500 }
    )
  }
}