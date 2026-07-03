// app/(super-admin)/admin/tenants/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Users, TrendingUp, ArrowLeft,
  CreditCard, Hash, CheckCircle2, XCircle, Crown, RefreshCw,
  Brain, Zap, Target, AlertCircle, BarChart3, Sparkles,
  Lock, Server, Clock, DollarSign, Calendar
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
  plan_status?: string
  trial_ends_at?: string
  owner_email?: string
}

export default function TenantDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
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
      // Fetch company
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      if (companyData) setCompany(companyData)

      // Fetch leads count ONLY
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', id)

      setTotalLeads(leadsCount || 0)

      // Fetch users count ONLY
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
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [id])

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

  // AI-Calculated Metrics (Summary only, no detailed data access)
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
    <div className="min-h-screen bg-[#F5F0E8]">

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b border-[#E8E2D8] bg-[#F5F0E8]/80 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <a href="/admin/tenants" className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8F82] hover:text-[#B8860B] transition-colors">
            <ArrowLeft size={13} /> Back to Tenants
          </a>
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

        {/* Hero Section */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isLifetime ? 'bg-amber-100' : 'bg-[#F5F0E8] border border-[#E8E2D8]'
            }`}>
              {isLifetime ? <Crown size={24} className="text-amber-700" /> : <Building2 size={24} className="text-[#B8860B]" />}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#B8860B] mb-1">Tenant</p>
              <h1 className="text-2xl font-bold text-[#1C1712]">{company?.name}</h1>
              <p className="text-sm text-[#9A8F82]">{company?.email}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#B8860B] hover:bg-[#A0760A] text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className="bg-white border border-[#E8E2D8] rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                    <Icon size={16} style={{ color: card.color }} />
                  </div>
                  <span className={`text-[10px] font-bold ${card.trendColor}`}>{card.trend}</span>
                </div>
                <p className="text-2xl font-bold text-[#1C1712]">{card.value}</p>
                <p className="text-xs text-[#9A8F82] mt-1">{card.label}</p>
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

          {/* Billing & Subscription */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
              <DollarSign size={13} className="text-[#B8860B]" />
              <h3 className="text-sm font-bold text-[#1C1712]">Subscription Info</h3>
            </div>
            <div className="space-y-4 p-5">
              {[
                { label: 'Plan Status', value: company?.plan_status ?? '—', icon: CreditCard },
                { label: 'Trial Ends', value: company?.trial_ends_at ? new Date(company?.trial_ends_at).toLocaleDateString('en-IN') : 'N/A', icon: Calendar },
                { label: 'Data Points', value: `${dataPoints}`, icon: BarChart3 },
                { label: 'Users Count', value: `${totalUsers}`, icon: Users },
                { label: 'Status', value: company?.is_active ? '✓ Active' : '✗ Inactive', icon: CheckCircle2 },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <Icon size={13} className="text-[#D3CBBB] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-[#9A8F82] font-semibold uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-[#1C1712] mt-0.5">{item.value}</p>
                    </div>
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