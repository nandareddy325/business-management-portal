// FILE 2: app/(super-admin)/admin/email-templates/page.tsx
// ---
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getEmailTemplates } from '@/lib/supabase/queries/admin'
import { Mail } from 'lucide-react'
import { TemplatesTable, VariablesInfo, TemplateFormModal } from '@/components/super-admin/email-templates'

export default async function EmailTemplatesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: templates } = await getEmailTemplates(supabase, undefined, 50, 0)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Mail size={11} className="text-amber-600" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-amber-700/70">Communication</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1C1712]">Email Templates</h1>
          </div>
          <TemplateFormModal mode="create" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-[#1C1712] mb-4">Templates</h2>
            <TemplatesTable templates={templates} />
          </div>

          <div>
            <VariablesInfo />
          </div>
        </div>
      </div>
    </div>
  )
}
