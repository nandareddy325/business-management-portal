import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const backupId = searchParams.get('id')

    if (!backupId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data: backup, error: backupError } = await supabaseAdmin
      .from('backups')
      .select('storage_location, status')
      .eq('id', backupId)
      .single()

    if (backupError || !backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    }

    if (!backup.storage_location) {
      return NextResponse.json({ error: 'This backup has no stored file' }, { status: 404 })
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from('backups')
      .createSignedUrl(backup.storage_location, 60) // valid for 60 seconds

    if (signError || !signed) {
      return NextResponse.json({ error: signError?.message || 'Failed to create download link' }, { status: 500 })
    }

    return NextResponse.json({ url: signed.signedUrl })
  } catch (error) {
    console.error('Error creating download link:', error)
    return NextResponse.json({ error: 'Failed to create download link' }, { status: 500 })
  }
}
