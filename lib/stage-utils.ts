// lib/stage-utils.ts
//
// SINGLE SOURCE OF TRUTH for pipeline stage matching / counting.
// Both Sidebar.tsx and All-Leads page (and any future page) MUST import
// from here instead of writing their own matchStage/count logic.
// This is what was causing 85 vs 59 vs 12 style mismatches — every
// component had its own slightly different idea of what counts as
// "Follow Up" or "New Leads".

export type CanonicalStage =
  | 'new'
  | 'followup'
  | 'rnr'
  | 'sitevisit'
  | 'quotation'
  | 'won'
  | 'lost'

export interface StageAwareLead {
  pipeline_stage?: string | null
  notes?: string | null
}

/**
 * Maps every raw DB value (including legacy hyphenated variants) to one
 * canonical stage key. If your DB ever gains a new spelling variant,
 * add it here ONCE and every component updates automatically.
 */
export function normalizeStage(lead: StageAwareLead): CanonicalStage {
  const raw = (lead.pipeline_stage || 'new').toLowerCase().trim()

  // RNR is stored as pipeline_stage = 'followup' + a "[RNR]" prefix in notes
  // in some older records. Treat that as rnr consistently everywhere.
  if (raw === 'rnr') return 'rnr'
  if ((raw === 'followup' || raw === 'follow-up') && String(lead.notes || '').startsWith('[RNR]')) {
    return 'rnr'
  }

  switch (raw) {
    case 'new':
    case 'new-leads':
      return 'new'
    case 'followup':
    case 'follow-up':
      return 'followup'
    case 'sitevisit':
    case 'site-visit':
      return 'sitevisit'
    case 'quotation':
    case 'quotations':
      return 'quotation'
    case 'won':
      return 'won'
    case 'lost':
      return 'lost'
    default:
      // Unknown/legacy value — bucket under 'new' so it's still counted
      // somewhere visible instead of silently vanishing from every badge.
      return 'new'
  }
}

export function matchStage(lead: StageAwareLead, key: CanonicalStage): boolean {
  return normalizeStage(lead) === key
}

/** Returns counts for every canonical stage in one pass. */
export function getStageCounts(leads: StageAwareLead[]): Record<CanonicalStage, number> {
  const counts: Record<CanonicalStage, number> = {
    new: 0, followup: 0, rnr: 0, sitevisit: 0, quotation: 0, won: 0, lost: 0,
  }
  for (const lead of leads) {
    counts[normalizeStage(lead)]++
  }
  return counts
}

export const UNIQUE_STAGES: { key: CanonicalStage; label: string }[] = [
  { key: 'new',       label: '🆕 New Leads' },
  { key: 'followup',  label: '🔄 Follow Up' },
  { key: 'rnr',       label: '📵 RNR' },
  { key: 'sitevisit', label: '🏠 Site Visit' },
  { key: 'quotation', label: '💰 Quotations' },
  { key: 'won',       label: '🏆 Won' },
  { key: 'lost',      label: '❌ Lost' },
]