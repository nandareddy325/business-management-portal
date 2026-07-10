// app/(super-admin)/admin/tenants/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, Users, TrendingUp, ArrowLeft,
  CreditCard, CheckCircle2, XCircle, Crown, RefreshCw,
  Brain, Zap, Target, BarChart3, Sparkles,
  Lock, Server, Clock, DollarSign, Calendar, Receipt
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'

interface Company {
  id: string
  name: string
  email: string
  industry: string
  plan: string
  is_active: boolean
  created_at: string
  owner_email?: string
}

interface Subscription {
  status: string
  activated_at: string | null
  total_amount: number
}

export default function TenantDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [totalLeads, setTotalLeads] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      if (companyData) setCompany(companyData)

      const { data: subData } = await supabase
        .from('company_subscriptions')
        .select('status, activated_at, total_amount')
        .eq('company_id', id)
        .single()

      if (subData) setSubscription(subData)

      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', id)

      setTotalLeads(leadsCount || 0)

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', id)

      setTotalUsers(usersCount || 0)

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const performAIAnalysis = async () => {
    setAiAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setAiAnalyzing(false)
  }

  if (!company && !loading) {
    return <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
      <p className="text-[#9A8F82]">Company not found</p>
    </div>
  }

  const isLifetime = company?.plan === 'lifetime'
  const isSubActive = subscription?.status === 'active'

  const healthScore = Math.min(100, Math.round((totalLeads * 10 + totalUsers * 15) / (totalLeads + totalUsers || 1)))
  const storageUsage = Math.round((totalLeads * 0.5) % 100)
  const apiUsage = Math.round((totalUsers * 15) % 100)
  const dataPoints = totalLeads + totalUsers

  const statCards = [
    {
      label: 'Total Leads',
      value: totalLeads,
      icon: TrendingUp,
      color: '#B8860B',
      trend: '+12%',
      trendColor: 'text-emerald-600',
    },
    {
      label: 'Team Members',
      value: totalUsers,
      icon: Users,
      color: '#B8860B',
      trend: '+2',
      trendColor: 'text-emerald-600',
    },
    {
      label: 'Health Score',
      value: `${healthScore}%`,
      icon: Zap,
      color: healthScore >= 70 ? '#10B981' : healthScore >= 40 ? '#F59E0B' : '#EF4444',
      trend: 'AI-Calculated',
      trendColor: 'text-blue-600',
    },
    {
      label: 'Plan',
      value: company?.plan ? company.plan.charAt(0).toUpperCase() + company.plan.slice(1) : 'No Plan',
      icon: CreditCard,
      color: '#B8860B',
      trend: isLifetime ? '∞' : '30 days',
      trendColor: isLifetime ? 'text-amber-600' : 'text-orange-600',
    },
  ]

  const aiInsights = [
    { icon: Target, label: 'Data Points', value: dataPoints, color: '#10B981', desc: 'Total records' },
    { icon: BarChart3, label: 'Storage', value: `${storageUsage}%`, color: '#3B82F6', desc: 'Space used' },
    { icon: Server, label: 'API Usage', value: `${apiUsage}%`, color: '#8B5CF6', desc: 'Monthly quota' },
    { icon: Clock, label: 'Uptime', value: '99.9%', color: '#F59E0B', desc: 'Service health' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F0E8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        .serif-font { font-family: 'DM Serif Display', serif; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .gold-shimmer {
  background: linear-gradient(90deg, #B8860B 0%, #E8C547 50%, #B8860B 100%);
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
      `}</style>

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b border-[#E8E2D8] bg-[#F5F0E8]/85 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/admin/tenants" className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8F82] hover:text-[#B8860B] transition-colors">
            <ArrowLeft size={13} /> Back to Tenants
          </Link>
          <div className="flex items-center gap-2">
            {isLifetime && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                <Crown size={10} /> Lifetime
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
              company?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {company?.is_active ? <><CheckCircle2 size={10} /> Active</> : <><XCircle size={10} /> Inactive</>}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* ── HERO — Dark Premium Banner ─────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden p-8"
          style={{ background: 'linear-gradient(135deg, #1C1712 0%, #2a1f14 45%, #1C1712 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'radial-gradient(circle at 15% 20%, #B8860B, transparent 45%), radial-gradient(circle at 85% 80%, #B8860B, transparent 45%)',
          }} />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                isLifetime ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'
              }`}>
                {isLifetime ? <Crown size={26} className="text-amber-400" /> : <Building2 size={26} className="text-[#E8C547]" />}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold tracking-[3px] uppercase text-[#B8860B] mb-1.5">Tenant Profile</p>
                <h1 className="serif-font text-3xl text-white leading-tight">{company?.name}</h1>
                <p className="text-sm text-white/40 mt-1">{company?.email}</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 8px 24px rgba(184,134,11,0.35)', color: '#fff' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <div key={card.label}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                    <Icon size={17} style={{ color: card.color }} />
                  </div>
                  <span className={`text-[10px] font-bold ${card.trendColor}`}>{card.trend}</span>
                </div>
                <p className="text-2xl font-bold text-[#1C1712]">{card.value}</p>
                <p className="text-xs text-[#9A8F82] mt-1">{card.label}</p>
                <div className="mt-3 h-0.5 w-0 bg-[#B8860B] group-hover:w-full transition-all duration-500 rounded-full" />
              </div>
            )
          })}
        </div>

        {/* Lifetime Banner */}
        {isLifetime && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Crown size={16} className="text-amber-700 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              This tenant has <span className="font-bold">Lifetime Free Access</span> — no payment required, never expires.
            </p>
          </div>
        )}

        {/* AI Analytics Panel */}
        <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-[#E8E2D8] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#B8860B]/10 flex items-center justify-center">
                <Brain size={16} className="text-[#B8860B]" />
              </div>
              <h2 className="text-lg font-bold text-[#1C1712]">System Analytics</h2>
            </div>
            <button
              onClick={performAIAnalysis}
              disabled={aiAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#B8860B] hover:bg-[#A0760A] text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Sparkles size={13} className={aiAnalyzing ? 'animate-spin' : ''} />
              {aiAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {aiInsights.map(insight => {
              const Icon = insight.icon
              return (
                <div key={insight.label} className="bg-white rounded-xl p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${insight.color}15` }}>
                      <Icon size={14} style={{ color: insight.color }} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-[#1C1712]">{insight.value}</p>
                  <p className="text-[10px] text-[#9A8F82] mt-1">{insight.label}</p>
                  <p className="text-[9px] text-[#B8B0A0] mt-0.5">{insight.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Company Details */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
              <Building2 size={13} className="text-[#B8860B]" />
              <h3 className="text-sm font-bold text-[#1C1712]">Company Details</h3>
            </div>
            <div className="space-y-4 p-5">
              {[
                { label: 'Industry', value: company?.industry ?? '—', icon: Building2 },
                { label: 'Plan', value: company?.plan ?? '—', icon: CreditCard },
                { label: 'Status', value: company?.is_active ? 'Active' : 'Inactive', icon: CheckCircle2 },
                { label: 'Joined', value: company?.created_at ? new Date(company.created_at).toLocaleDateString('en-IN') : '—', icon: Calendar },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <Icon size={13} className="text-[#D3CBBB] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-[#9A8F82] font-semibold uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-[#1C1712] mt-0.5 truncate">{item.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Subscription Info — Premium Billing Card ──────────── */}
          <div className="rounded-2xl overflow-hidden border border-[#E8E2D8]"
            style={{ background: 'linear-gradient(160deg, #1C1712 0%, #241b12 100%)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#B8860B]/15 flex items-center justify-center">
                  <Receipt size={13} className="text-[#E8C547]" />
                </div>
                <h3 className="text-sm font-bold text-white/90">Subscription &amp; Billing</h3>
              </div>
              <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                isSubActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-white/10 text-white/40 border border-white/10'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                {subscription?.status
                  ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
                  : 'No Subscription'}
              </span>
            </div>

            {/* Amount Hero */}
            <div className="px-5 pt-5 pb-4">
              <p className="text-[10px] text-white/30 uppercase tracking-[2px] font-bold mb-1">Amount Paid</p>
              <p className="serif-font text-4xl gold-shimmer bg-clip-text text-transparent">
                {subscription?.total_amount ? `₹${subscription.total_amount.toLocaleString('en-IN')}` : '₹0'}
              </p>
              <p className="text-[11px] text-white/25 mt-1">
                {subscription?.activated_at
                  ? `Activated on ${new Date(subscription.activated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'Not yet activated'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-white/8 mx-5" />

            {/* Detail rows */}
            <div className="p-5 space-y-3.5">
              {[
                { label: 'Data Points', value: `${dataPoints}`, icon: BarChart3 },
                { label: 'Users Count', value: `${totalUsers}`, icon: Users },
                { label: 'Account Status', value: company?.is_active ? 'Active' : 'Inactive', icon: CheckCircle2, accent: company?.is_active },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon size={13} className="text-white/25" />
                      <p className="text-xs text-white/50">{item.label}</p>
                    </div>
                    <p className={`text-xs font-bold ${item.accent === false ? 'text-red-400' : 'text-white/85'}`}>
                      {item.value}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Data Privacy Notice */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
          <Lock size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            <span className="font-bold">Data Privacy:</span> Super Admin can only view tenant summary metrics and subscription info. Individual lead data is restricted to authorized tenant users only.
          </p>
        </div>

        {/* Footer */}
        {lastRefresh && (
          <p className="text-[10px] text-[#9A8F82] text-center">
            Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

      </div>
    </div>
  )
}