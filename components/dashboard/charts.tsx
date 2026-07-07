'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { createBrowserClient } from '@supabase/ssr'

const formatINR = (value: number) => `₹${(value / 100000).toFixed(1)}L`

const revenueTooltipFormatter = (value: number | string) => {
  return [`${formatINR(Number(value))}`, '']
}

const convTooltipFormatter = (value: number | string) => {
  return [`${Number(value)}%`, '']
}

const STAGE_COLORS: Record<string, string> = {
  new: '#94A3B8', followup: '#FBBF24', rnr: '#F87171',
  sitevisit: '#60A5FA', quotation: '#A78BFA', won: '#34D399', lost: '#EF4444',
}
const STAGE_LABELS: Record<string, string> = {
  new: 'New', followup: 'Follow-up', rnr: 'RNR',
  sitevisit: 'Site Visit', quotation: 'Quotation', won: 'Won', lost: 'Lost',
}

function getLast6MonthLabels() {
  const labels: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'short' }),
    })
  }
  return labels
}

function useSupabase() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  return supabase
}

export function RevenueChart() {
  const supabase = useSupabase()
  const [barData, setBarData] = useState<{ month: string; revenue: number; expenses: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) { setLoading(false); return }

      const months = getLast6MonthLabels()
      const rangeStart = `${months[0].key}-01`

      const [{ data: invoices }, { data: expenses }] = await Promise.all([
        supabase.from('invoices').select('total_amount, invoice_date').eq('company_id', profile.company_id).gte('invoice_date', rangeStart),
        supabase.from('expenses').select('amount, created_at').eq('company_id', profile.company_id).gte('created_at', rangeStart),
      ])

      const revenueByMonth: Record<string, number> = {}
      const expensesByMonth: Record<string, number> = {}
      months.forEach(m => { revenueByMonth[m.key] = 0; expensesByMonth[m.key] = 0 })

      ;(invoices || []).forEach((inv: any) => {
        const key = inv.invoice_date?.slice(0, 7)
        if (key && revenueByMonth[key] !== undefined) revenueByMonth[key] += Number(inv.total_amount) || 0
      })
      ;(expenses || []).forEach((exp: any) => {
        const key = exp.created_at?.slice(0, 7)
        if (key && expensesByMonth[key] !== undefined) expensesByMonth[key] += Number(exp.amount) || 0
      })

      setBarData(months.map(m => ({ month: m.label, revenue: revenueByMonth[m.key], expenses: expensesByMonth[m.key] })))
      setLoading(false)
    }
    load()
  }, [supabase])

  const totalRevenue = barData.reduce((s, d) => s + d.revenue, 0)
  const totalExpenses = barData.reduce((s, d) => s + d.expenses, 0)
  const netMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0

  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-base text-[#1C1712]">Revenue Analytics</h3>
          <p className="text-xs text-[#7A6E60] mt-0.5">Monthly revenue vs expenses — last 6 months</p>
        </div>
        {!loading && (
          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {netMargin}% margin
          </span>
        )}
      </div>

      <div className="flex gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-[#7A6E60]">
          <span className="w-3 h-3 rounded-sm bg-[#1C1712] inline-block" /> Revenue
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#7A6E60]">
          <span className="w-3 h-3 rounded-sm bg-[#E2D9C8] inline-block" /> Expenses
        </span>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-[#7A6E60]">Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7A6E60' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#7A6E60' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={revenueTooltipFormatter} contentStyle={{ fontSize: 12, borderColor: '#E2D9C8', borderRadius: 8, backgroundColor: '#FDFAF4' }} />
            <Bar dataKey="revenue" fill="#1C1712" radius={[5, 5, 0, 0]} />
            <Bar dataKey="expenses" fill="#E2D9C8" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ConversionChart() {
  const supabase = useSupabase()
  const [conversionData, setConversionData] = useState<{ name: string; value: number; color: string }[]>([])
  const [wonRate, setWonRate] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) { setLoading(false); return }

      const { data: leads } = await supabase.from('leads').select('pipeline_stage').eq('company_id', profile.company_id)
      const total = leads?.length || 0
      const counts: Record<string, number> = {}
      ;(leads || []).forEach((l: any) => {
        const stage = l.pipeline_stage || 'new'
        counts[stage] = (counts[stage] || 0) + 1
      })

      const chartData = Object.keys(STAGE_LABELS)
        .filter(stage => counts[stage] > 0)
        .map(stage => ({
          name: STAGE_LABELS[stage],
          value: total > 0 ? Math.round((counts[stage] / total) * 100) : 0,
          color: STAGE_COLORS[stage],
        }))

      setConversionData(chartData)
      setWonRate(total > 0 ? Math.round(((counts['won'] || 0) / total) * 100) : 0)
      setLoading(false)
    }
    load()
  }, [supabase])

  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-base text-[#1C1712]">Lead Conversion</h3>
          <p className="text-xs text-[#7A6E60] mt-0.5">Current pipeline breakdown</p>
        </div>
        {!loading && (
          <span className="bg-[#F7EDD4] text-[#8B6508] text-xs font-semibold px-2.5 py-1 rounded-full">
            {wonRate}% won
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-[#7A6E60]">Loading...</div>
      ) : conversionData.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-[#7A6E60]">No leads yet</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={conversionData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip formatter={convTooltipFormatter} contentStyle={{ fontSize: 12, borderColor: '#E2D9C8', borderRadius: 8, backgroundColor: '#FDFAF4' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {conversionData.map((d) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-[#7A6E60]">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: d.color }} />
                {d.name} {d.value}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
