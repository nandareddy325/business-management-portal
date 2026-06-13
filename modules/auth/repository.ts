import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile, Company } from '@/types/database'

export const authRepository = {
  async getProfileById(userId: string): Promise<Profile | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) return null
    return data
  },

  async getProfileWithCompany(userId: string): Promise<(Profile & { company: Company }) | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*, company:companies(*)')
      .eq('id', userId)
      .single()
    if (error) return null
    return data as Profile & { company: Company }
  },

  async createProfile(profile: Partial<Profile>): Promise<Profile | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updateLastLogin(userId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async deactivateProfile(userId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)
  },
}
