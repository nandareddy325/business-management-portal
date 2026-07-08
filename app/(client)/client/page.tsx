import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClientProject } from '@/lib/supabase/queries/client-portal'

export const dynamic = 'force-dynamic'

export default async function ClientDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const account = await getClientProject()

  if (!account) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>No project linked to your account yet.</h2>
        <p>Please contact your designer if you believe this is a mistake.</p>
      </div>
    )
  }

  const project = account.project

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Welcome, {account.client_name}
      </h1>
      <p style={{ color: '#7A6E60', marginBottom: 24 }}>
        Here&apos;s the latest on your project
      </p>

      <div style={{
        background: '#FDFAF4', border: '1px solid #E2D9C8', borderRadius: 16,
        padding: 20, marginBottom: 16
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{project?.name || 'Project'}</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#7A6E60' }}>
          Status: {project?.status || 'In progress'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Link href="/client/project" style={{
          display: 'block', padding: 16, borderRadius: 12,
          background: '#1C1712', color: '#F5F0E8', textDecoration: 'none', textAlign: 'center'
        }}>Project Timeline</Link>
        <Link href="/client/quotations" style={{
          display: 'block', padding: 16, borderRadius: 12,
          background: '#1C1712', color: '#F5F0E8', textDecoration: 'none', textAlign: 'center'
        }}>Quotations</Link>
        <Link href="/client/payments" style={{
          display: 'block', padding: 16, borderRadius: 12,
          background: '#1C1712', color: '#F5F0E8', textDecoration: 'none', textAlign: 'center'
        }}>Payments</Link>
      </div>
    </div>
  )
}