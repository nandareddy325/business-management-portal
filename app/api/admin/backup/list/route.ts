import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('company_id')

    // Always return the company list (for the dropdown)
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true })

    if (companiesError) throw companiesError

    let backups: unknown[] = []
    let stats = { total_backups: 0, completed_backups: 0, failed_backups: 0, total_data_size_gb: 0 }

    if (companyId) {
      const { data: backupRows, error: backupsError } = await supabaseAdmin
        .from('backups')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (backupsError) throw backupsError
      backups = backupRows || []

      const totalSize = (backupRows || []).reduce((sum, b) => sum + (b.data_size_bytes || 0), 0)
      stats = {
        total_backups: backupRows?.length || 0,
        completed_backups: (backupRows || []).filter((b) => b.status === 'completed').length,
        failed_backups: (backupRows || []).filter((b) => b.status === 'failed').length,
        total_data_size_gb: totalSize / 1024 / 1024 / 1024,
      }
    }

    return NextResponse.json({ companies, backups, stats })
  } catch (error) {
    console.error('Error fetching backup data:', error)
    return NextResponse.json({ error: 'Failed to fetch backup data' }, { status: 500 })
  }
}
