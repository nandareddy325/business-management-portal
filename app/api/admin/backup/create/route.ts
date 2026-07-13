import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const startedAt = Date.now()

  try {
    const { company_id } = await req.json()

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    // Get company name for the backup filename
    const { data: company, error: companyErr } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single()

    if (companyErr || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch each dataset independently — if one table is missing/renamed,
    // the rest of the backup should still succeed.
    const warnings: string[] = []

    const fetchTable = async (table: string) => {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq('company_id', company_id)
      if (error) {
        warnings.push(`${table}: ${error.message}`)
        return []
      }
      return data || []
    }

    const [leads, employees, invoices] = await Promise.all([
      fetchTable('leads'),
      fetchTable('employees'),
      fetchTable('invoices'),
    ])

    const exportPayload = {
      company: { id: company.id, name: company.name },
      exported_at: new Date().toISOString(),
      leads,
      employees,
      invoices,
      warnings,
    }

    const jsonString = JSON.stringify(exportPayload, null, 2)
    const sizeBytes = new TextEncoder().encode(jsonString).length
    const totalRecords = leads.length + employees.length + invoices.length

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeCompanyName = company.name.replace(/[^a-zA-Z0-9]/g, '-')
    const backupName = `${safeCompanyName}-manual-${timestamp}`
    const storagePath = `${company_id}/${backupName}.json`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('backups')
      .upload(storagePath, jsonString, {
        contentType: 'application/json',
        upsert: false,
      })

    const durationSeconds = Math.round((Date.now() - startedAt) / 1000)

    if (uploadError) {
      // Log the failed attempt
      await supabaseAdmin.from('backups').insert({
        company_id,
        backup_name: backupName,
        backup_type: 'full',
        status: 'failed',
        error_message: uploadError.message,
        duration_seconds: durationSeconds,
      })
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Log the successful backup
    const { data: backupRow, error: insertError } = await supabaseAdmin
      .from('backups')
      .insert({
        company_id,
        backup_name: backupName,
        backup_type: 'full',
        status: 'completed',
        storage_location: storagePath,
        storage_provider: 's3',
        data_size_bytes: sizeBytes,
        tables_backed_up: 3,
        total_records_backed_up: totalRecords,
        duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
        verification_status: warnings.length > 0 ? 'pending' : 'verified',
        error_message: warnings.length > 0 ? warnings.join('; ') : null,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: `Backup saved but failed to log: ${insertError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, backup: backupRow, warnings })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
