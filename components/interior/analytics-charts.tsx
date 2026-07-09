'use client'

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts'

const COLORS = ['#7C3AED','#0891B2','#D97706','#DB2777','#059669','#DC2626','#2563EB','#EA580C','#64748B','#B8860B']

interface TooltipPayloadItem {
  color?: string
  name?: string
  value?: number | string
  [key: string]: unknown
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-xs font-bold shadow-xl"
        style={{ background: '#1C1712', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="mb-1" style={{ color: '#B8860B' }}>{label}</p>
        {payload.map((p: TooltipPayloadItem, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

interface Props {
  sourceData:   { name: string; value: number; pct: string }[]
  stageData:    { stage: string; count: number }[]
  dailyData:    { date: string; count: number }[]
  cityData:     { city: string; leads: number; won: number }[]
  interestData: { name: string; value: number }[]
}

export function AnalyticsCharts({ sourceData, stageData, dailyData, cityData, interestData }: Props) {
  return (
    <div className="space-y-5">

      {/* Row 1: Source + Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Source Pie */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
            <p className="text-sm font-black text-[#1C1712]">📍 Lead Source Distribution</p>
          </div>
          <div className="p-4 flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                  {sourceData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5 max-h-[160px] overflow-y-auto">
              {sourceData.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <p className="text-[10px] font-medium text-[#7A6E60] truncate">{d.name}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <p className="text-[10px] font-black text-[#1C1712]">{d.value}</p>
                    <p className="text-[9px] text-[#B8B0A0]">({d.pct}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Bar */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
            <p className="text-sm font-black text-[#1C1712]">🎯 Pipeline Stage Distribution</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stageData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#9A8F82' }} />
                <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Leads" radius={[6,6,0,0]}>
                  {stageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
          <p className="text-sm font-black text-[#1C1712]">📈 Daily Lead Addition (Last 14 Days)</p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9A8F82' }} />
              <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Leads" stroke="#B8860B" strokeWidth={2.5}
                dot={{ fill: '#B8860B', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* City Bar */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
          <p className="text-sm font-black text-[#1C1712]">🏙️ City-wise Performance</p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cityData} margin={{ top: 5, right: 20, left: -20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
              <XAxis dataKey="city" tick={{ fontSize: 8, fill: '#9A8F82' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" name="Total Leads" fill="#7C3AED" radius={[4,4,0,0]} />
              <Bar dataKey="won"   name="Won"          fill="#059669" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interest Pie */}
      {interestData.length > 0 && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
            <p className="text-sm font-black text-[#1C1712]">💡 Requirement Distribution</p>
          </div>
          <div className="p-4 flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={interestData} cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={2} dataKey="value">
                  {interestData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {interestData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <p className="text-xs text-[#7A6E60] truncate max-w-[140px]">{d.name}</p>
                  </div>
                  <p className="text-xs font-black text-[#1C1712]">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}