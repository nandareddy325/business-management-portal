export interface Company {
  id: string
  name: string
  slug?: string
  is_active: boolean
  plan_status: string
  trial_ends_at: string
  email?: string | null
}

export interface Profile {
  id: string
  company_id: string | null
  full_name: string | null
  email?: string | null

  role: string
  is_active: boolean

  company?: Company
}

export interface Lead {
  id: string

  company_id?: string | null
  industry_id?: string | null

  assigned_to?: string | null
  created_by?: string | null

  lead_name: string
  phone?: string | null
  email?: string | null

  source?: string | null
  status?: string | null
  pipeline_stage?: string | null

  budget?: string | null
  property_type?: string | null
  city?: string | null

  interest?: string | null
  notes?: string | null

  created_at?: string
}

export interface Customer {
  id: string
  company_id?: string | null

  customer_name: string
  phone?: string | null
  email?: string | null

  status?: string | null
  created_at?: string
}