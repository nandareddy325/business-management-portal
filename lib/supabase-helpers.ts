import { supabase } from './supabase'

// ─── Company ID ───────────────────────────────────────────────────────────────
export async function getCompanyId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    return data?.company_id || null
  } catch {
    return null
  }
}

// ─── Fetch Leads ──────────────────────────────────────────────────────────────
export async function fetchLeads(industry?: string) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) return []

    let query = supabase
      .from('leads')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (industry) {
      query = query.eq('industry', industry)
    }

    const { data, error } = await query
    if (error) {
      console.error('fetchLeads error:', error.message)
      return []
    }

    // lead_name → name గా normalize చేయి
    return (data || []).map((l: Record<string, string>) => ({
      ...l,
      name: l.lead_name || l.name || '',
    }))
  } catch (err) {
    console.error('fetchLeads exception:', err)
    return []
  }
}

// ─── Insert Single Lead ───────────────────────────────────────────────────────
export async function insertLead(lead: {
  name: string
  phone?: string
  email?: string
  source?: string
  interest?: string
  budget?: string
  status?: string
  notes?: string
  industry?: string
  property_type?: string
  city?: string
}) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) {
      console.error('insertLead: No company_id found')
      return null
    }

    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })

    const { data, error } = await supabase
      .from('leads')
      .insert({
        company_id:    companyId,
        lead_name:     lead.name.trim(),
        phone:         lead.phone || null,
        email:         lead.email || null,
        source:        lead.source || null,
        interest:      lead.interest || null,
        budget:        lead.budget || null,
        status:        lead.status
          ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1)
          : 'New',
        notes:         lead.notes || null,
        industry:      lead.industry || 'general',
        property_type: lead.property_type || null,
        city:          lead.city || null,
        date:          today,
      })
      .select()
      .single()

    if (error) {
      console.error('insertLead error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.error('insertLead exception:', err)
    return null
  }
}

// ─── Insert Bulk Leads ────────────────────────────────────────────────────────
export async function insertLeadsBulk(leads: {
  name: string
  phone?: string
  email?: string
  source?: string
  interest?: string
  budget?: string
  status?: string
  notes?: string
  industry?: string
  property_type?: string
  city?: string
}[]) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) {
      console.error('insertLeadsBulk: No company_id found')
      return []
    }

    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })

    const toInsert = leads
      .filter(l => l.name?.trim())
      .map(l => ({
        company_id:    companyId,
        lead_name:     l.name.trim(),
        phone:         l.phone || null,
        email:         l.email || null,
        source:        l.source || null,
        interest:      l.interest || null,
        budget:        l.budget || null,
        status:        l.status
          ? l.status.charAt(0).toUpperCase() + l.status.slice(1)
          : 'New',
        notes:         l.notes || null,
        industry:      l.industry || 'general',
        property_type: l.property_type || null,
        city:          l.city || null,
        date:          today,
      }))

    if (toInsert.length === 0) return []

    const { data, error } = await supabase
      .from('leads')
      .insert(toInsert)
      .select()

    if (error) {
      console.error('insertLeadsBulk error:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error('insertLeadsBulk exception:', err)
    return []
  }
}

// ─── Update Lead Status ───────────────────────────────────────────────────────
export async function updateLeadStatus(id: string, status: string) {
  try {
    const { error } = await supabase
      .from('leads')
      .update({
        status: status.charAt(0).toUpperCase() + status.slice(1),
      })
      .eq('id', id)
    if (error) {
      console.error('updateLeadStatus error:', error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

// ─── Delete Lead ──────────────────────────────────────────────────────────────
export async function deleteLead(id: string) {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('deleteLead error:', error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

// ─── Fetch Patients ───────────────────────────────────────────────────────────
export async function fetchPatients(industry?: string) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) return []

    let query = supabase
      .from('patients')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (industry) {
      query = query.eq('industry', industry)
    }

    const { data, error } = await query
    if (error) {
      console.error('fetchPatients error:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error('fetchPatients exception:', err)
    return []
  }
}

// ─── Insert Patient ───────────────────────────────────────────────────────────
export async function insertPatient(patient: {
  name: string
  age?: number
  phone?: string
  email?: string
  blood_group?: string
  doctor?: string
  issue?: string
  next_visit?: string
  status?: string
  industry?: string
}) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) return null

    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })

    const { data, error } = await supabase
      .from('patients')
      .insert({
        company_id:  companyId,
        name:        patient.name.trim(),
        age:         patient.age || null,
        phone:       patient.phone || null,
        email:       patient.email || null,
        blood_group: patient.blood_group || null,
        doctor:      patient.doctor || null,
        issue:       patient.issue || null,
        next_visit:  patient.next_visit || null,
        status:      patient.status || 'new',
        industry:    patient.industry || 'general',
        last_visit:  today,
      })
      .select()
      .single()

    if (error) {
      console.error('insertPatient error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.error('insertPatient exception:', err)
    return null
  }
}

// ─── Fetch Appointments ───────────────────────────────────────────────────────
export async function fetchAppointments(industry?: string) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) return []

    let query = supabase
      .from('appointments')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (industry) {
      query = query.eq('industry', industry)
    }

    const { data, error } = await query
    if (error) {
      console.error('fetchAppointments error:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error('fetchAppointments exception:', err)
    return []
  }
}

// ─── Insert Appointment ───────────────────────────────────────────────────────
export async function insertAppointment(apt: {
  patient_name: string
  doctor?: string
  dept?: string
  date?: string
  time?: string
  type?: string
  industry?: string
}) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) return null

    const { count } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)

    const token = `T-${String((count || 0) + 1).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        company_id:   companyId,
        patient_name: apt.patient_name.trim(),
        doctor:       apt.doctor || null,
        dept:         apt.dept || null,
        date:         apt.date || null,
        time:         apt.time || null,
        type:         apt.type || 'new',
        status:       'pending',
        token:        token,
        industry:     apt.industry || 'general',
      })
      .select()
      .single()

    if (error) {
      console.error('insertAppointment error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.error('insertAppointment exception:', err)
    return null
  }
}