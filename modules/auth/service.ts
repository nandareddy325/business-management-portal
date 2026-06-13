import { createServerSupabaseClient } from '@/lib/supabase/server'
import { authRepository } from './repository'
import { tenantRepository } from '@/modules/tenant/repository'
import type { Profile } from '@/types/database'

export type AuthUser = {
  id: string
  email: string
  profile: Profile
  companyId: string
  role: string
  industryAccess: string[]
}

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) throw new Error(error.message)

    if (data.user) {
      await authRepository.updateLastLogin(data.user.id)
    }

    return data
  },

  async signOut() {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  async getSession() {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const profile = await authRepository.getProfileWithCompany(user.id)
    if (!profile || !profile.company_id) return null

    const industryAccess = await tenantRepository.getCompanyIndustries(profile.company_id)

    return {
      id: user.id,
      email: user.email!,
      profile,
      companyId: profile.company_id,
      role: profile.role,
      industryAccess,
    }
  },

  async signUp(email: string, password: string, fullName: string, companyName: string) {
    const supabase = await  createServerSupabaseClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('User creation failed')

    // 2. Create company (tenant)
    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName, slug, email })
      .select()
      .single()
    if (companyError) throw new Error(companyError.message)

    // 3. Create profile as tenant_admin
    await authRepository.createProfile({
      id: authData.user.id,
      company_id: company.id,
      role: 'tenant_admin',
      full_name: fullName,
      email,
      is_active: true,
    })

    return { user: authData.user, company }
  },

  async resetPassword(email: string) {
    const supabase = await  createServerSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXTAUTH_URL}/auth/reset-password`,
    })
    if (error) throw new Error(error.message)
  },

  async updatePassword(newPassword: string) {
    const supabase = await  createServerSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  },

  async validateSession(userId: string): Promise<{
    isValid: boolean
    reason?: string
  }> {
    const profile = await authRepository.getProfileWithCompany(userId)
    if (!profile) return { isValid: false, reason: 'profile_not_found' }
    if (!profile.is_active) return { isValid: false, reason: 'account_suspended' }
    if (!profile.company) return { isValid: false, reason: 'company_not_found' }
    if (!profile.company.is_active) return { isValid: false, reason: 'company_suspended' }

    // Check trial
    if (profile.company.plan_status === 'trial') {
      const trialEnd = new Date(profile.company.trial_ends_at)
      if (trialEnd < new Date()) return { isValid: false, reason: 'trial_expired' }
    }

    if (profile.company.plan_status === 'expired') return { isValid: false, reason: 'subscription_expired' }
    if (profile.company.plan_status === 'cancelled') return { isValid: false, reason: 'subscription_cancelled' }

    return { isValid: true }
  },
}
