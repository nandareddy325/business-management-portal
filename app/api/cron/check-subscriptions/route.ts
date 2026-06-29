// app/api/cron/check-subscriptions/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getReminderEmailHtml, getExpiredEmailHtml } from '@/lib/email/templates'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const CRON_SECRET = process.env.CRON_SECRET || 'gkcrm-cron-2026'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://business-management-portal-fq61.vercel.app'

export async function GET(req: Request) {
  // Security check
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const authHeader = req.headers.get('authorization')

  if (secret !== CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

  try {
    const now = new Date()
    const results = { reminders: 0, expired: 0, errors: [] as string[] }

    // ── Fetch all active/trial subscriptions ──
    const subsRes = await fetch(
      `${SURL}/rest/v1/company_subscriptions?status=in.(active,trial)&select=id,company_id,status,trial_ends_at`,
      { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
    )
    const subs: any[] = subsRes.ok ? await subsRes.json() : []

    for (const sub of subs) {
      if (!sub.trial_ends_at) continue

      const expiryDate = new Date(sub.trial_ends_at)
      // Skip lifetime (2099)
      if (expiryDate.getFullYear() >= 2099) continue

      const diffMs   = expiryDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      // ── Get company name + admin email ──
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

      // ── Send 5-day reminder ──
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

      // ── Expired — update status + send email ──
      if (diffDays <= 0) {
        try {
          // Update status to expired
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

          // Send expired email
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