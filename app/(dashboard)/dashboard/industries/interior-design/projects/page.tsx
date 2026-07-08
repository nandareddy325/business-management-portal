import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsTabs from '@/components/interior/projects-tabs'
import { AddProjectButton } from '@/components/interior/add-project-button'
import { ProjectsListClient } from '@/components/interior/projects-list-client'

export const dynamic = 'force-dynamic'

export default async function AllProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get company_id + industry for the logged-in user
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id

  let projects: any[] = []
  if (companyId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .eq('industry', 'interior-design')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Projects fetch error:', error)
    } else {
      projects = data ?? []
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#F5F0E8' }}>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1C1712]">Projects</h1>
            <p className="text-xs text-[#7A6E60] mt-0.5">
              Won leads become projects automatically, or add one manually
            </p>
          </div>
          <AddProjectButton companyId={companyId ?? ''} />
        </div>

        <ProjectsTabs />

        <ProjectsListClient initialProjects={projects} />
      </div>
    </div>
  )
}