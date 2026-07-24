// FILE: app/(super-admin)/admin/email-templates/page.tsx
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
    <div style={{ background: '#F5F0E8', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 sm:px-8 py-4" style={{ background: 'rgba(245,240,232,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(184,134,11,0.15)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#FFF3D6', border: '1px solid #F5DFA0' }}>
                <Mail size={11} style={{ color: '#B8860B' }} />
              </span>
              <span className="text-[9px] font-black tracking-[3px] uppercase" style={{ color: '#B8860B' }}>Communication</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: '#1C1712' }}>Email Templates</h1>
          </div>
          <TemplateFormModal mode="create" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6 fade-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-[9px] font-black uppercase tracking-[3px]" style={{ color: '#B8860B' }}>Templates</p>
              {templates && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: '#FFFBEB', color: '#B8860B', border: '1px solid #FDE68A' }}>
                  {templates.length}
                </span>
              )}
            </div>
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