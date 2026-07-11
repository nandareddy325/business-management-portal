import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Plan limits — Starter/Professional/Business వచ్చినప్పుడు ఇక్కడ extend చేయాలి
const PLAN_LIMITS: Record<string, number> = {
  starter: 10,
  professional: 25,
  business: 999999, // unlimited-ish
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error('❌ Webhook: signature header missing')
      return NextResponse.json({ error: 'Signature missing' }, { status: 400 })
    }

    // ── Webhook signature verify (ఇది key_secret కాదు, webhook secret వేరు) ──
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex')

    if (expected !== signature) {
      console.error('❌ Webhook: signature mismatch')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    console.log('📩 Razorpay webhook event:', event.event)

    // ── Event type ప్రకారం handle చేయి ──────────────────────
    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const subscriptionEntity = event.payload.subscription.entity
        const paymentEntity = event.payload.payment?.entity
        const companyId = subscriptionEntity.notes?.company_id
        const planName = subscriptionEntity.notes?.plan_name || 'starter'

        if (!companyId) {
          console.error('❌ Webhook: company_id missing in subscription notes')
          break
        }

        await supabase.from('company_subscriptions').upsert(
          {
            company_id: companyId,
            plan_config: { 'interior-design': planName },
            status: 'active',
            total_amount: paymentEntity ? Number(paymentEntity.amount) / 100 : null,
            max_users: PLAN_LIMITS[planName] ?? 10,
            razorpay_subscription_id: subscriptionEntity.id,
            razorpay_plan_id: subscriptionEntity.plan_id,
            razorpay_payment_id: paymentEntity?.id ?? null,
            activated_at: new Date().toISOString(),
            billing_cycle: 'monthly',
          },
          { onConflict: 'company_id' }
        )

        await supabase.from('companies').update({ plan: 'paid' }).eq('id', companyId)
        console.log(`✅ Subscription activated/charged for company ${companyId}`)
        break
      }

      case 'subscription.cancelled':
      case 'subscription.halted': {
        const subscriptionEntity = event.payload.subscription.entity
        const companyId = subscriptionEntity.notes?.company_id

        if (companyId) {
          await supabase
            .from('company_subscriptions')
            .update({ status: 'cancelled' })
            .eq('company_id', companyId)
          console.log(`⚠️ Subscription ${event.event} for company ${companyId}`)
        }
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error('❌ Webhook error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
