'use client'
// @ts-nocheck
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
import { revenueData, conversionData } from '@/lib/mock-data'

const barData = revenueData.labels.map((label, i) => ({
  month: label,
  revenue: revenueData.revenue[i],
  expenses: revenueData.expenses[i],
}))

const formatINR = (value: number) => `₹${(value / 100000).toFixed(1)}L`

// ✅ Fix: Proper Tooltip formatter type for Recharts
const revenueTooltipFormatter = (value: number | string) => {
  return [`${formatINR(Number(value))}`, '']
}

const convTooltipFormatter = (value: number | string) => {
  return [`${Number(value)}%`, '']
}

export function RevenueChart() {
  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-base text-[#1C1712]">Revenue Analytics</h3>
          <p className="text-xs text-[#7A6E60] mt-0.5">
            Monthly revenue vs expenses — 2026
          </p>
        </div>
        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          +22%
        </span>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-[#7A6E60]">
          <span className="w-3 h-3 rounded-sm bg-[#1C1712] inline-block" />
          Revenue
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#7A6E60]">
          <span className="w-3 h-3 rounded-sm bg-[#E2D9C8] inline-block" />
          Expenses
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={barData} barGap={4}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#7A6E60' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatINR}
            tick={{ fontSize: 11, fill: '#7A6E60' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={revenueTooltipFormatter}
            contentStyle={{
              fontSize: 12,
              borderColor: '#E2D9C8',
              borderRadius: 8,
              backgroundColor: '#FDFAF4',
            }}
          />
          <Bar dataKey="revenue" fill="#1C1712" radius={[5, 5, 0, 0]} />
          <Bar dataKey="expenses" fill="#E2D9C8" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ConversionChart() {
  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-base text-[#1C1712]">Lead Conversion</h3>
          <p className="text-xs text-[#7A6E60] mt-0.5">This month&apos;s funnel</p>
        </div>
        <span className="bg-[#F7EDD4] text-[#8B6508] text-xs font-semibold px-2.5 py-1 rounded-full">
          34%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={conversionData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            dataKey="value"
            paddingAngle={3}
          >
            {conversionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={convTooltipFormatter}
            contentStyle={{
              fontSize: 12,
              borderColor: '#E2D9C8',
              borderRadius: 8,
              backgroundColor: '#FDFAF4',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {conversionData.map((d) => (
          <span
            key={d.name}
            className="flex items-center gap-1 text-xs text-[#7A6E60]"
          >
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ background: d.color }}
            />
            {d.name} {d.value}%
          </span>
        ))}
      </div>
    </div>
  )
}