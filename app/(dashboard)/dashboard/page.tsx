'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import {
  Users, TrendingUp, CheckCircle, Clock, IndianRupee,
  FileText, Calendar, ArrowRight, Building2, Target,
  PhoneCall, AlertCircle, Briefcase
} from 'lucide-react'

export default function OverallDashboard() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [userName, setUserName] = useState('User')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Stats
  const [leadStats, setLeadStats] = useState({
    total: 0, active: 0, won: 0, followup: 0,
    sitevisit: 0, quotation: 0, today: 0, winRate: 0,
  })
  const [empStats, setEmpStats] = useState({
    total: 0, presentToday: 0, absentToday: 0,
  })
  const [financeStats, setFinanceStats] = useState({
    totalInvoices: 0, paidAmount: 0, pendingAmount: 0, invoiceCount: 0,
  })
  const [activeIndustries, setActiveIndustries] = useState<{ slug: string; name: string; icon: string }[]>([])

  const industryIcons: Record<string, string> = {
    'interior-design': '🛋️',
    'real-estate': '🏠',
    'hospital': '🏥',
    'b2b-business': '🤝',
    'clinics': '🩺',
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, company_id, role')
          .eq('id', user.id)
          .single()

        if (!profile) return
        if (profile.full_name) setUserName(profile.full_name.split(' ')[0])
        const cid = profile.company_id
        setCompanyId(cid)

        // Active industries
        const { data: ci } = await supabase
          .from('company_industries')
          .select('industries(slug, name)')
          .eq('company_id', cid)
          .eq('is_active', true)
        if (ci) {
          setActiveIndustries(ci.map((c: any) => ({
            slug: c.industries?.slug,
            name: c.industries?.name,
            icon: industryIcons[c.industries?.slug] ?? '🏢',
          })).filter(i => i.slug))
        }

        // Leads
        const { data: leads } = await supabase
          .from('leads')
          .select('pipeline_stage, date, created_at')
          .eq('company_id', cid)

        if (leads) {
          const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          const won = leads.filter(l => ['won', 'project_started'].includes(l.pipeline_stage)).length
          const total = leads.length
          setLeadStats({
            total,
            active: leads.filter(l => !['won', 'lost', 'project_started'].includes(l.pipeline_stage)).length,
            won,
            followup: leads.filter(l => l.pipeline_stage === 'followup').length,
            sitevisit: leads.filter(l => l.pipeline_stage === 'sitevisit').length,
            quotation: leads.filter(l => l.pipeline_stage === 'quotation').length,
            today: leads.filter(l => l.date === 'Today' || l.date === todayStr).length,
            winRate: total > 0 ? Math.round((won / total) * 100) : 0,
          })
        }

        // Employees
        const { data: emps } = await supabase
          .from('employees')
          .select('id')
          .eq('company_id', cid)
          .eq('is_active', true)

        const today = new Date().toISOString().split('T')[0]
        const { data: att } = await supabase
          .from('attendance')
          .select('status')
          .eq('company_id', cid)
          .eq('date', today)

        setEmpStats({
          total: emps?.length ?? 0,
          presentToday: att?.filter(a => a.status === 'present').length ?? 0,
          absentToday: att?.filter(a => a.status === 'absent').length ?? 0,
        })

        // Finance
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, status')
          .eq('company_id', cid)

        if (invoices) {
          const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
          const pending = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
          setFinanceStats({
            totalInvoices: invoices.length,
            paidAmount: paid,
            pendingAmount: pending,
            invoiceCount: invoices.filter(i => i.status !== 'paid').length,
          })
        }

      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    init()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const fmt = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="min-h-screen bg-[#F5F0E8] p-4 md:p-6 space-y-5">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] text-[#B8860B] mb-1">Overview</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1C1712]">{greeting}, {userName} 👋</h1>
          <p className="text-sm mt-1 text-[#9A8F82]">{todayDate}</p>
        </div>
        <Link href="/dashboard/industries/interior-design"
          className="px-4 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 4px 20px rgba(184,134,11,0.4)' }}>
          + Add Lead
        </Link>
      </div>

      {/* ── INDUSTRIES QUICK SWITCH ── */}
      {activeIndustries.length > 0 && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F82] mb-3">Active Industries</p>
          <div className="flex gap-2 flex-wrap">
            {activeIndustries.map(ind => (
              <Link key={ind.slug} href={`/dashboard/industries/${ind.slug}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#F7F5F1] hover:bg-[#F0EBE0] hover:border-[#B8860B] transition-all group">
                <span className="text-lg">{ind.icon}</span>
                <span className="text-xs font-semibold text-[#1C1712]">{ind.name}</span>
                <ArrowRight className="w-3 h-3 text-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── PIPELINE STATS ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F82] mb-3 px-1">📊 Pipeline Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Leads',    value: leadStats.total,    icon: Target,      color: '#7C3AED', sub: `${leadStats.today} today` },
            { label: 'Active',         value: leadStats.active,   icon: TrendingUp,  color: '#D97706', sub: `${leadStats.winRate}% win rate` },
            { label: 'Won Deals',      value: leadStats.won,      icon: CheckCircle, color: '#16A34A', sub: 'Closed successfully' },
            { label: 'Follow-ups Due', value: leadStats.followup, icon: PhoneCall,   color: '#EA580C', sub: 'Need callback' },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}15` }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-3xl font-black text-[#1C1712] mb-1">{card.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: card.color }}>{card.label}</p>
              <p className="text-[10px] mt-0.5 text-[#B8B0A0]">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PIPELINE MINI STRIP ── */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F82] mb-3">Stage Breakdown</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[
            { label: 'Quotation',   value: leadStats.quotation,  color: '#2563EB', icon: '💰' },
            { label: 'Site Visit',  value: leadStats.sitevisit,  color: '#EA580C', icon: '🏠' },
            { label: 'Follow Up',   value: leadStats.followup,   color: '#D97706', icon: '🔄' },
            { label: 'Won',         value: leadStats.won,        color: '#16A34A', icon: '✅' },
            { label: 'Active',      value: leadStats.active,     color: '#7C3AED', icon: '🎯' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-3 text-center"
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
              <p className="text-base mb-1">{s.icon}</p>
              <p className="text-xl font-black text-[#1C1712]">{s.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HR + FINANCE ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* HR */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E2D8] flex items-center justify-between"
            style={{ background: '#F9F9F7' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-[#1C1712]">👥 HR & Attendance</p>
            </div>
            <Link href="/hr/employees" className="text-[10px] font-bold text-[#B8860B] hover:underline">
              View all →
            </Link>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Total Staff',    value: empStats.total,        color: '#1C1712', icon: '👔' },
              { label: 'Present Today',  value: empStats.presentToday, color: '#16A34A', icon: '✅' },
              { label: 'Absent Today',   value: empStats.absentToday,  color: '#DC2626', icon: '❌' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-3 text-center"
                style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                <p className="text-base mb-1">{s.icon}</p>
                <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] font-bold text-[#9A8F82] mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
            <Link href="/hr/attendance"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#F7F5F1] hover:bg-[#F0EBE0] transition-colors">
              <Calendar className="w-3.5 h-3.5 text-[#B8860B]" />
              <span className="text-xs font-semibold text-[#1C1712]">Attendance</span>
            </Link>
            <Link href="/hr/employees"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#F7F5F1] hover:bg-[#F0EBE0] transition-colors">
              <Briefcase className="w-3.5 h-3.5 text-[#B8860B]" />
              <span className="text-xs font-semibold text-[#1C1712]">Employees</span>
            </Link>
          </div>
        </div>

        {/* Finance */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E2D8] flex items-center justify-between"
            style={{ background: '#F9F9F7' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-[#1C1712]">💳 Finance Summary</p>
            </div>
            <Link href="/billing/invoices" className="text-[10px] font-bold text-[#B8860B] hover:underline">
              View all →
            </Link>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Total Invoices', value: financeStats.totalInvoices, color: '#1C1712', icon: '🧾', isNum: true },
              { label: 'Collected',      value: fmt(financeStats.paidAmount), color: '#16A34A', icon: '✅', isNum: false },
              { label: 'Pending',        value: fmt(financeStats.pendingAmount), color: '#DC2626', icon: '⏳', isNum: false },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-3 text-center"
                style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                <p className="text-base mb-1">{s.icon}</p>
                <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] font-bold text-[#9A8F82] mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
            <Link href="/billing/invoices"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#F7F5F1] hover:bg-[#F0EBE0] transition-colors">
              <FileText className="w-3.5 h-3.5 text-[#B8860B]" />
              <span className="text-xs font-semibold text-[#1C1712]">Invoices</span>
            </Link>
            <Link href="/billing/payments"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#F7F5F1] hover:bg-[#F0EBE0] transition-colors">
              <IndianRupee className="w-3.5 h-3.5 text-[#B8860B]" />
              <span className="text-xs font-semibold text-[#1C1712]">Payments</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── QUICK LINKS ── */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F82] mb-3">🔗 Quick Links</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Lead Pipeline',  href: '/dashboard/industries/interior-design', icon: '🎯', color: '#7C3AED' },
            { label: 'HR / HRMS',      href: '/hr/employees',                         icon: '👔', color: '#0891B2' },
            { label: 'Attendance',     href: '/hr/attendance',                        icon: '📅', color: '#059669' },
            { label: 'Invoices',       href: '/billing/invoices',                     icon: '🧾', color: '#D97706' },
            { label: 'Payments',       href: '/billing/payments',                     icon: '💳', color: '#16A34A' },
            { label: 'Reports',        href: '/reports',                              icon: '📊', color: '#2563EB' },
            { label: 'Settings',       href: '/dashboard/settings',                   icon: '⚙️', color: '#64748B' },
            { label: 'My Account',     href: '/settings/users',                       icon: '👤', color: '#B8860B' },
          ].map((link, i) => (
            <Link key={i} href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E8E2D8] bg-[#F7F5F1] hover:bg-[#F0EBE0] hover:border-[#B8860B] transition-all group">
              <span className="text-lg">{link.icon}</span>
              <span className="text-xs font-semibold text-[#1C1712] flex-1">{link.label}</span>
              <ArrowRight className="w-3 h-3 text-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── ALERTS ── */}
      {(leadStats.followup > 0 || financeStats.invoiceCount > 0) && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A8F82] px-1">⚠️ Attention Needed</p>
          {leadStats.followup > 0 && (
            <Link href="/dashboard/industries/interior-design?stage=followup"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs font-semibold text-amber-800 flex-1">
                {leadStats.followup} follow-up leads pending — Call them today!
              </p>
              <ArrowRight className="w-3 h-3 text-amber-600" />
            </Link>
          )}
          {financeStats.invoiceCount > 0 && (
            <Link href="/billing/invoices"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-xs font-semibold text-red-800 flex-1">
                {financeStats.invoiceCount} invoices pending — {fmt(financeStats.pendingAmount)} to collect
              </p>
              <ArrowRight className="w-3 h-3 text-red-600" />
            </Link>
          )}
        </div>
      )}

    </main>
  )
}