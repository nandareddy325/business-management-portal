import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { AddClientButton } from '@/components/interior/add-client-button'
import ProjectsTabs from '@/components/interior/projects-tabs'
import { matchStage } from '@/lib/stage-utils'
import { fetchAllLeads } from '@/lib/fetch-all-leads'
//<ProjectsTabs />

export const dynamic = 'force-dynamic'

const avatarColors = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FDF4FF', text: '#7E22CE' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#FFF1F2', text: '#BE123C' },
  { bg: '#ECFEFF', text: '#0E7490' },
]

const ini = (name: string) => name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

// Normalize a phone number down to digits only, for dedupe matching between
// manually-added id_clients rows and auto-pulled leads.
const digitsOnly = (p?: string | null) => (p || '').replace(/\D/g, '')

interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  city?: string
  notes?: string
  created_at: string
  project?: { project_name: string } | null
}

interface Lead {
  id: string
  lead_name: string
  phone?: string | null
  city?: string | null
  notes?: string | null
  created_at: string
  pipeline_stage?: string | null
  company_id: string
  industry: string
}

// Unified row shape the table renders — either a manually-added client
// or a lead that has reached Site Visit / Quotation stage.
interface CombinedRow {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  city?: string | null
  notes?: string | null
  created_at: string
  project?: { project_name: string } | null
  entryType: 'manual' | 'sitevisit' | 'quotation'
}

export default async function IDClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  // ── Manually-added clients (existing behaviour, unchanged) ──
  const { data: manualClients } = await supabase
    .from('id_clients')
    .select('*, project:projects(project_name)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects').select('id, project_name')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')

  // ── THE NEW PART ──
  // Auto-pull leads currently sitting in Site Visit or Quotation stage,
  // so the CRE doesn't have to manually re-enter someone who's already
  // a lead in the pipeline. Uses the same `matchStage` helper as the
  // Follow Up / Site Visit pages, so it stays in sync if stage-key
  // variants (e.g. 'sitevisit' vs 'site-visit') ever change in one place.
  const allLeads = await fetchAllLeads<Lead>(
    supabase,
    profile.company_id,
    'interior-design',
    'id, lead_name, phone, city, notes, created_at, pipeline_stage, company_id, industry'
  )

  const siteVisitLeads = allLeads.filter(l => matchStage(l, 'sitevisit'))
  const quotationLeads = allLeads.filter(l => matchStage(l, 'quotation'))

  // Existing manual clients' phone numbers — used to skip auto-adding a
  // lead that's already been manually entered as a client (avoids duplicates).
  const manualPhones = new Set(
    ((manualClients as Client[] | null) ?? []).map(c => digitsOnly(c.phone)).filter(Boolean)
  )

  const manualRows: CombinedRow[] = ((manualClients as Client[] | null) ?? []).map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    city: c.city,
    notes: c.notes,
    created_at: c.created_at,
    project: c.project,
    entryType: 'manual',
  }))

  const leadRows: CombinedRow[] = [...siteVisitLeads, ...quotationLeads]
    .filter(l => {
      const d = digitsOnly(l.phone)
      return !d || !manualPhones.has(d) // skip if already a manual client with same phone
    })
    .map(l => ({
      id: `lead-${l.id}`,
      name: l.lead_name,
      phone: l.phone ?? undefined,
      city: l.city ?? undefined,
      notes: l.notes ?? undefined,
      created_at: l.created_at,
      project: null,
      entryType: matchStage(l, 'sitevisit') ? 'sitevisit' : 'quotation',
    }))

  const combined: CombinedRow[] = [...manualRows, ...leadRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const count = combined.length
  const thisMonth = combined.filter((c) => {
    const d = new Date(c.created_at), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const withProjects = combined.filter((c) => c.project?.project_name).length
  const autoCount = leadRows.length

  const ENTRY_BADGE: Record<CombinedRow['entryType'], { label: string; bg: string; color: string } | null> = {
    manual: null,
    sitevisit: { label: '🏠 Site Visit', bg: '#ECFEFF', color: '#0891B2' },
    quotation: { label: '💰 Quotation', bg: '#FDF2F8', color: '#DB2777' },
  }

  return (
    <div className="space-y-5 p-4 md:p-4" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Clients</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{count}</span> total clients
            {autoCount > 0 && (
              <span className="ml-1.5 text-[#B0A798]">
                ({autoCount} auto from Site Visit / Quotation)
              </span>
            )}
          </p>
        </div>
        <AddClientButton companyId={profile.company_id} projects={projects ?? []} />
      </div>
      <ProjectsTabs />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Clients', value: count,        color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'With Projects', value: withProjects, color: '#B8860B', bg: '#FFFBEB' },
          { label: 'This Month',    value: thisMonth,     color: '#059669', bg: '#F0FDF4' },
        ].map((s, i) => (
          <div key={i} className="border border-[#E2D9C8] rounded-2xl px-4 py-3" style={{ background: s.bg }}>
            <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Empty */}
      {!combined.length ? (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl py-20 text-center">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold">No clients yet</p>
          <p className="text-[#9A8F82] text-sm mt-1">Add your first client, or wait for a lead to reach Site Visit / Quotation stage</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#1C1712' }}>
                  {['#', 'Client', 'Phone', 'City', 'Project / Source', 'Added'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5" style={{ color: '#B8860B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {combined.map((c, i: number) => {
                  const av = avatarColors[i % avatarColors.length]
                  const badge = ENTRY_BADGE[c.entryType]
                  return (
                    <tr key={c.id} className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors">
                      <td className="pl-5 pr-2 py-3.5"><span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span></td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: av.bg, color: av.text }}>{ini(c.name)}</div>
                          <div>
                            <p className="text-sm font-bold text-[#1C1712]">{c.name}</p>
                            {c.notes && <p className="text-[10px] text-[#B8B0A0] truncate max-w-[140px]">{c.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-mono text-[#1C1712]">{c.phone ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        {c.city ? <span className="text-[10px] text-[#7A6E60]">📍 {c.city}</span>
                          : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.project?.project_name ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#FFFBEB', color: '#B45309' }}>
                            🏗️ {c.project.project_name}
                          </span>
                        ) : badge ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}30` }}>
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#C4BAB0] px-2 py-1 rounded-full bg-[#F5F0E8]">No project</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 pr-5 text-[10px] text-[#B8B0A0] whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {combined.map((c, i: number) => {
              const av = avatarColors[i % avatarColors.length]
              const badge = ENTRY_BADGE[c.entryType]
              return (
                <div key={c.id} className="p-4 hover:bg-[#FDFAF8] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: av.bg, color: av.text }}>{ini(c.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1C1712] truncate">{c.name}</p>
                      <p className="text-xs text-[#7A6E60]">{c.phone ?? '—'}</p>
                    </div>
                    {c.project?.project_name ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: '#FFFBEB', color: '#B45309' }}>🏗️ {c.project.project_name}</span>
                    ) : badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                      <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">Email</p>
                      <p className="text-xs font-semibold text-[#1C1712] mt-0.5 truncate">{c.email ?? '—'}</p>
                    </div>
                    <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                      <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">City</p>
                      <p className="text-xs font-semibold text-[#1C1712] mt-0.5">{c.city ? `📍 ${c.city}` : '—'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]"><span className="font-bold text-[#1C1712]">{count}</span> clients</p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}