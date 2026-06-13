import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: NextRequest) {
  try {
    const { amount, companyId, planConfig } = await req.json()
    console.log('🔍 Razorpay order request:', { amount, companyId })

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    console.log('🔑 Keys loaded:', {
      key_id: process.env.RAZORPAY_KEY_ID?.slice(0, 10) + '...',
      secret_exists: !!process.env.RAZORPAY_KEY_SECRET
    })

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `gk_${Date.now()}`,
      notes: {
        company_id: companyId,
        plan_config: JSON.stringify(planConfig),
      },
    })

    console.log('✅ Order created:', order.id)
    return NextResponse.json(order)

  } catch (err: any) {
  console.error('❌ Razorpay error full:', JSON.stringify(err, null, 2))
  console.error('❌ Error message:', err?.message)
  console.error('❌ Error description:', err?.error?.description)
  console.error('❌ Error code:', err?.statusCode)
  return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
}
}