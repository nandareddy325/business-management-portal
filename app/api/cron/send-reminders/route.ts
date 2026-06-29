import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'Cron job endpoint',
    message: 'Send reminders cron' 
  })
}

export async function POST() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Reminders processed' 
  })
}