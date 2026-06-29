// app/api/cron/check-subscriptions/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET || 'gkcrm-cron-2026'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://business-management-portal-fq61.vercel.app'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const authHeader = req.headers.get('authorization')

  if (secret !== CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Dynamic imports — build time lo execute avvavu
  const { Resend } = await import('resend')
  const { getReminderEmailHtml, getExpiredEmailHtml } = await import('@/lib/email/templates')
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const now = new Date()
    const results = { reminders: 0, expired: 0, errors: [] as string[] }

    const subsRes = await fetch(
      `${SURL}/rest/v1/company_subscriptions?status=in.(active,trial)&select=id,company_id,status,trial_ends_at`,
      { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
    )
    const subs: any[] = subsRes.ok ? await subsRes.json() : []

    for (const sub of subs) {
      if (!sub.trial_ends_at) continue

      const expiryDate = new Date(sub.trial_ends_at)
      if (expiryDate.getFullYear() >= 2099) continue

      const diffMs   = expiryDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      const compRes = await fetch(
        `${SURL}/rest/v1/companies?id=eq.${sub.company_id}&select=id,name`,
        { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
      )
      const comps: any[] = compRes.ok ? await compRes.json() : []
      const company = comps[0]
      if (!company) continue

      const profRes = await fetch(
        `${SURL}/rest/v1/profiles?company_id=eq.${sub.company_id}&role=eq.tenant_admin&select=email,full_name&limit=1`,
        { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
      )
      const profs: any[] = profRes.ok ? await profRes.json() : []
      const adminEmail = profs[0]?.email
      if (!adminEmail) continue

      const renewUrl = `${BASE_URL}/subscription/renew`

      if (diffDays === 5 || diffDays === 3 || diffDays === 1) {
        try {
          await resend.emails.send({
            from: 'GK CRM <support@gkcrm.in>',
            to: adminEmail,
            subject: `⏰ Your GK CRM subscription expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
            html: getReminderEmailHtml(company.name, diffDays, renewUrl),
          })
          results.reminders++
        } catch (e: any) {
          results.errors.push(`Reminder email failed for ${company.name}: ${e.message}`)
        }
      }

      if (diffDays <= 0) {
        try {
          await fetch(
            `${SURL}/rest/v1/company_subscriptions?id=eq.${sub.id}`,
            {
              method: 'PATCH',
              headers: {
                apikey: SKEY,
                Authorization: `Bearer ${SKEY}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal',
              },
              body: JSON.stringify({ status: 'expired' }),
            }
          )
          await resend.emails.send({
            from: 'GK CRM <support@gkcrm.in>',
            to: adminEmail,
            subject: `🔒 Your GK CRM subscription has expired — Renew now`,
            html: getExpiredEmailHtml(company.name, renewUrl),
          })
          results.expired++
        } catch (e: any) {
          results.errors.push(`Expired handling failed for ${company.name}: ${e.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}