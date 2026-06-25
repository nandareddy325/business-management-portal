'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Plus } from 'lucide-react'

const DEFAULT_MILESTONES = [
  { milestone_name: 'Token', percentage: 10, sort_order: 1 },
  { milestone_name: 'False Ceiling', percentage: 20, sort_order: 2 },
  { milestone_name: 'Wood Work', percentage: 50, sort_order: 3 },
  { milestone_name: 'Hardware', percentage: 15, sort_order: 4 },
  { milestone_name: 'Closing', percentage: 5, sort_order: 5 },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  const [project, setProject] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: emp } = await supabase
        .from('employees')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      if (!emp?.company_id) return
      setCompanyId(emp.company_id)

      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      setProject(proj)

      const { data: ms } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', id)
        .order('sort_order')

      if (ms && ms.length > 0) {
        setMilestones(ms)
      } else {
        // Auto-create default milestones
        const budget = Number(proj?.budget || 0)
        const defaults = DEFAULT_MILESTONES.map(m => ({
          ...m,
          project_id: id,
          company_id: emp.company_id,
          expected_amount: Math.round(budget * m.percentage / 100),
          received_amount: 0,
        }))
        const { data: created } = await supabase
          .from('project_milestones')
          .insert(defaults)
          .select()
        setMilestones(created ?? defaults)
      }

      setLoading(false)
    }
    load()
  }, [id])

  const totalExpected = milestones.reduce((s, m) => s + Number(m.expected_amount || 0), 0)
  const totalReceived = milestones.reduce((s, m) => s + Number(m.received_amount || 0), 0)
  const totalPending = totalExpected - totalReceived

  const updateReceived = (idx: number, val: string) => {
    setMilestones(ms => ms.map((m, i) => i === idx ? { ...m, received_amount: val } : m))
  }

  const saveMilestones = async () => {
    setSaving(true)
    for (const m of milestones) {
      if (m.id) {
        await supabase
          .from('project_milestones')
          .update({ received_amount: Number(m.received_amount || 0) })
          .eq('id', m.id)
      }
    }
    setSaving(false)
    alert('Saved!')
  }

  const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN')

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#F5F0E8' }}>
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!project) return <div className="p-6 text-[#9A8F82]">Project not found</div>

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white border border-[#E2D9C8] flex items-center justify-center hover:bg-[#F5F0E8] transition-colors">
            <ArrowLeft size={16} className="text-[#1C1712]" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#B8860B]">Project</p>
            <h1 className="font-bold text-xl text-[#1C1712]">{project.project_name}</h1>
            <p className="text-sm text-[#9A8F82]">{project.client_name} · {project.location ?? ''}</p>
          </div>
        </div>
        <button onClick={saveMilestones} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: '#B8860B' }}>
          <Save size={14} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-2xl border border-[#E2D9C8] p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Budget', value: fmt(Number(project.budget || 0)), color: '#1C1712' },
          { label: 'Received', value: fmt(totalReceived), color: '#16A34A' },
          { label: 'Pending', value: fmt(totalPending), color: totalPending > 0 ? '#D97706' : '#16A34A' },
          { label: 'Status', value: project.status?.replace('_', ' ') ?? '—', color: '#7C3AED' },
        ].map(s => (
          <div key={s.label}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#9A8F82] mb-1">{s.label}</p>
            <p className="text-lg font-black capitalize" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Milestone Tracker */}
      <div className="bg-white rounded-2xl border border-[#E2D9C8] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #1C1712, #2C2218)' }}>
          <h2 className="font-bold text-white">💰 Payment Milestones</h2>
          <p className="text-xs text-[#9A8F82] mt-0.5">Token 10% → False Ceiling 20% → Wood Work 50% → Hardware 15% → Closing 5%</p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0EBE0] bg-[#FDFAF8]">
                {['Milestone', '%', 'Expected (₹)', 'Received (₹)', 'Pending (₹)', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-5 py-3 text-[#9A8F82]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0]">
              {milestones.map((m, i) => {
                const expected = Number(m.expected_amount || 0)
                const received = Number(m.received_amount || 0)
                const pending = expected - received
                const isPaid = received >= expected
                return (
                  <tr key={i} className="hover:bg-[#FFFBEF] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#1C1712]">{m.milestone_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#F5F0E8] text-[#B8860B]">{m.percentage}%</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#1C1712]">{fmt(expected)}</td>
                    <td className="px-5 py-4">
                      <input
                        type="number"
                        value={m.received_amount}
                        onChange={e => updateReceived(i, e.target.value)}
                        className="w-32 px-3 py-1.5 rounded-lg border border-[#E8E2D8] text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B] bg-[#FDFAF8]"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${pending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {fmt(Math.max(0, pending))}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-700' : received > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#F5F0E8] text-[#9A8F82]'}`}>
                        {isPaid ? '✅ Paid' : received > 0 ? '⏳ Partial' : '⭕ Pending'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1C1712' }}>
                <td colSpan={2} className="px-5 py-3 text-xs font-bold text-[#B8860B] uppercase">Total</td>
                <td className="px-5 py-3 text-sm font-black text-white">{fmt(totalExpected)}</td>
                <td className="px-5 py-3 text-sm font-black text-emerald-400">{fmt(totalReceived)}</td>
                <td className="px-5 py-3 text-sm font-black text-amber-400">{fmt(Math.max(0, totalPending))}</td>
                <td className="px-5 py-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#B8860B] text-white">
                    {Math.round((totalReceived / (totalExpected || 1)) * 100)}% collected
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-[#F0EBE0]">
          {milestones.map((m, i) => {
            const expected = Number(m.expected_amount || 0)
            const received = Number(m.received_amount || 0)
            const pending = expected - received
            const isPaid = received >= expected
            return (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1C1712]">{m.milestone_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#B8860B]">{m.percentage}%</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-700' : received > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#F5F0E8] text-[#9A8F82]'}`}>
                    {isPaid ? '✅ Paid' : received > 0 ? '⏳ Partial' : '⭕ Pending'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#F5F0E8] rounded-xl p-2">
                    <p className="text-[9px] text-[#9A8F82] font-bold uppercase">Expected</p>
                    <p className="text-xs font-black text-[#1C1712]">{fmt(expected)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-2">
                    <p className="text-[9px] text-emerald-600 font-bold uppercase">Received</p>
                    <input type="number" value={m.received_amount}
                      onChange={e => updateReceived(i, e.target.value)}
                      className="w-full text-xs font-black text-emerald-700 bg-transparent text-center focus:outline-none"
                    />
                  </div>
                  <div className="bg-amber-50 rounded-xl p-2">
                    <p className="text-[9px] text-amber-600 font-bold uppercase">Pending</p>
                    <p className="text-xs font-black text-amber-700">{fmt(Math.max(0, pending))}</p>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="p-4 flex justify-between items-center" style={{ background: '#1C1712' }}>
            <div>
              <p className="text-[9px] text-[#B8860B] font-bold uppercase">Total Received</p>
              <p className="text-base font-black text-emerald-400">{fmt(totalReceived)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-[#B8860B] font-bold uppercase">Pending</p>
              <p className="text-base font-black text-amber-400">{fmt(Math.max(0, totalPending))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
