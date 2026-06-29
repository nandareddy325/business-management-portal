import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isFresh(s: string)    { return !s || s === 'new' || s === 'rnr' }
function isFollowup(s: string) { return ['followup','sitevisit','quotation','won','lost'].includes(s) }

function toKey(s: string): string {
  const sl = (s||'').toLowerCase()
  if (sl==='rnr'||sl==='new')  return 'rnr'
  if (sl==='lost')             return 'not_interested'
  if (sl==='followup')         return 'going_followup'
  if (sl==='sitevisit')        return 'visit_scheduled'
  if (sl==='quotation')        return 'quotation'
  if (sl==='won')              return 'won'
  if (sl==='closing')          return 'closing'
  return 'going_followup'
}

function parseOutcome(desc: string): string {
  const d = (desc||'').toLowerCase()
  if (d.includes('ring no response')||d.includes('rnr'))       return 'RNR'
  if (d.includes('verified'))                                   return 'Verified'
  if (d.includes('visit scheduled')||d.includes('site visit')) return 'Visit scheduled'
  if (d.includes('callback'))                                   return 'Callback'
  if (d.includes('not interested'))                             return 'Not interested'
  if (d.includes('busy'))                                       return 'Busy'
  if (d.includes('connected'))                                  return 'Connected'
  if (d.includes('follow up')||d.includes('followup'))          return 'Callback'
  return 'Connected'
}

const SLABEL: Record<string,string> = {
  rnr:'RNR', not_interested:'NOT INTERESTED', going_followup:'GOING FOLLOWUP',
  visit_scheduled:'VISIT SCHEDULED', visit_completed:'VISIT COMPLETED',
  quotation:'QUOTATION', closing:'CLOSING', won:'WON', lost:'LOST'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const creId    = searchParams.get('creId')
    const istDate  = searchParams.get('istDate')
    const companyId = searchParams.get('companyId')

    if (!creId || !istDate || !companyId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const ts = new Date(`${istDate}T00:00:00+05:30`).toISOString()
    const te = new Date(`${istDate}T23:59:59+05:30`).toISOString()

    // ── Step 1: Today's calls for this CRE (service role — bypasses RLS) ──
    const actsUrl = `${SURL}/rest/v1/lead_activities?user_id=eq.${creId}&type=eq.call&created_at=gte.${encodeURIComponent(ts)}&created_at=lte.${encodeURIComponent(te)}&select=id,lead_id,description&limit=1000`
    const actsRes = await fetch(actsUrl, {
      headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` }
    })
    const acts: any[] = actsRes.ok ? await actsRes.json() : []

    // ── Step 2: Fetch lead data for called leads ──
    const calledIds = [...new Set(acts.map((a: any) => a.lead_id))] as string[]
    const ldm: Record<string,any> = {}

    if (calledIds.length > 0) {
      const BATCH = 200
      for (let i=0; i<calledIds.length; i+=BATCH) {
        const b = calledIds.slice(i,i+BATCH)
        const r = await fetch(
          `${SURL}/rest/v1/leads?id=in.(${b.join(',')})&company_id=eq.${companyId}&select=id,pipeline_stage,status,sitevisit_date,quotation_date,followup_date`,
          { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
        )
        if (r.ok) { const d = await r.json(); d.forEach((l: any) => { ldm[l.id]=l }) }
      }
    }

    // ── Step 3: Classify ──
    const freshCalled    = calledIds.filter(id => isFresh(ldm[id]?.pipeline_stage||''))
    const followupCalled = calledIds.filter(id => isFollowup(ldm[id]?.pipeline_stage||''))

    // ── Step 4: Stage breakdown ──
    const initSt = (): Record<string,{count:number;calls:number}> => {
      const m: Record<string,{count:number;calls:number}> = {}
      Object.keys(SLABEL).forEach(k => { m[k]={count:0,calls:0} })
      return m
    }
    const freshSt    = initSt()
    const followupSt = initSt()
    const freshOut: Record<string,number>  = {}
    const followOut: Record<string,number> = {}
    const fuMap: Record<string,number>     = {}

    freshCalled.forEach(lid => {
      const sk = toKey(ldm[lid]?.pipeline_stage||'')
      const la = acts.filter((a: any) => a.lead_id===lid)
      if (freshSt[sk]) { freshSt[sk].count++; freshSt[sk].calls+=la.length }
      la.forEach((a: any) => { const o=parseOutcome(a.description); freshOut[o]=(freshOut[o]||0)+1 })
    })

    followupCalled.forEach(lid => {
      const sk = toKey(ldm[lid]?.pipeline_stage||'')
      const la = acts.filter((a: any) => a.lead_id===lid)
      if (followupSt[sk]) { followupSt[sk].count++; followupSt[sk].calls+=la.length }
      la.forEach((a: any) => {
        const o=parseOutcome(a.description)
        followOut[o]=(followOut[o]||0)+1
        fuMap[o]=(fuMap[o]||0)+1
      })
    })

    // ── Step 5: Pending/uncalled — last 30 days ──
    const thirtyAgo = new Date(`${istDate}T00:00:00+05:30`)
    thirtyAgo.setDate(thirtyAgo.getDate() - 30)
    const allActsRes = await fetch(
      `${SURL}/rest/v1/lead_activities?user_id=eq.${creId}&type=eq.call&created_at=gte.${encodeURIComponent(thirtyAgo.toISOString())}&select=lead_id&limit=2000`,
      { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
    )
    const allActsData: any[] = allActsRes.ok ? await allActsRes.json() : []
    const allLeadIds = [...new Set(allActsData.map((a: any) => a.lead_id))] as string[]

    const allLdm: Record<string,any> = { ...ldm }
    const missing = allLeadIds.filter(id => !allLdm[id])
    if (missing.length > 0) {
      for (let i=0; i<missing.length; i+=200) {
        const b = missing.slice(i,i+200)
        const r = await fetch(
          `${SURL}/rest/v1/leads?id=in.(${b.join(',')})&company_id=eq.${companyId}&select=id,pipeline_stage,status,sitevisit_date,quotation_date,followup_date`,
          { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
        )
        if (r.ok) { const d = await r.json(); d.forEach((l: any) => { allLdm[l.id]=l }) }
      }
    }

    const allLeadData = Object.values(allLdm)
    const calledSet   = new Set(calledIds)
    const now         = new Date()

    const verified      = calledIds.filter(id=>(ldm[id]?.status||'').toLowerCase()==='verified').length
    const uncalledFresh = allLeadData.filter((l: any)=>isFresh(l.pipeline_stage)&&!calledSet.has(l.id)).length
    const pending       = allLeadData.filter((l: any)=>l.followup_date&&new Date(l.followup_date)<=now&&!calledSet.has(l.id)).length
    const noFollowup    = allLeadData.filter((l: any)=>isFollowup(l.pipeline_stage)&&!l.followup_date).length

    const fvd  = freshCalled.filter(id=>{const d=ldm[id]?.sitevisit_date;return d&&new Date(d).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})===istDate}).length
    const fvc  = freshCalled.filter(id=>ldm[id]?.sitevisit_date).length
    const fq   = freshCalled.filter(id=>ldm[id]?.quotation_date).length
    const fuvd = followupCalled.filter(id=>{const d=ldm[id]?.sitevisit_date;return d&&new Date(d).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})===istDate}).length
    const fuvc = followupCalled.filter(id=>ldm[id]?.sitevisit_date).length
    const fuq  = followupCalled.filter(id=>ldm[id]?.quotation_date).length

    const freshCalls    = acts.filter((a: any)=>isFresh(ldm[a.lead_id]?.pipeline_stage||'')).length
    const followupCalls = acts.filter((a: any)=>isFollowup(ldm[a.lead_id]?.pipeline_stage||'')).length

    return NextResponse.json({
      totalLeads: calledIds.length,
      freshTotal: freshCalled.length, freshCalls,
      followupTotal: followupCalled.length, followupCalls, followupFuDone: followupCalled.length,
      verified, uncalledFresh, noFollowup, pending,
      freshStages: freshSt, followupStages: followupSt,
      freshOutcomes: freshOut, followupOutcomes: followOut, fuCompletionMap: fuMap,
      freshVisitDone: fvd, freshVisitsCreated: fvc, freshQuotations: fq,
      followupVisitDone: fuvd, followupVisitsCreated: fuvc, followupQuotations: fuq,
    })

  } catch(e) {
    console.error('[cre-performance]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}