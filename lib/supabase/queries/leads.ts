import { createServerSupabaseClient } from '@/lib/supabase/server'

// All lead queries — single source of truth
// TODO: implement getLeadsByStage, getLeadById, createLead, updateLeadStage, getAllLeads

export async function getLeadsByStage(companyId: string, stage: string) {
  const supabase = await createServerSupabaseClient()
  throw new Error('Not implemented yet')
}

export async function getLeadById(leadId: string) {
  const supabase = await createServerSupabaseClient()
  throw new Error('Not implemented yet')
}
