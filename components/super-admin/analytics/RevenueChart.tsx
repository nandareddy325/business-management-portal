// FILE 14: components/super-admin/analytics/RevenueChart.tsx
// ============================================================================
'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const REVENUE_DATA = [
  { month: 'Jan', revenue: 45000, target: 50000 },
  { month: 'Feb', revenue: 52000, target: 50000 },
  { month: 'Mar', revenue: 48000, target: 50000 },
  { month: 'Apr', revenue: 61000, target: 60000 },
  { month: 'May', revenue: 68000, target: 65000 },
  { month: 'Jun', revenue: 75000, target: 70000 },
]

export function RevenueChart() {
  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-black/80 mb-5">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={REVENUE_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
          <XAxis dataKey="month" stroke="#00000040" />
          <YAxis stroke="#00000040" />
          <Tooltip contentStyle={{ background: '#F5F0E8', border: '1px solid #00000010', borderRadius: '8px' }} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#B8860B" strokeWidth={2} dot={{ fill: '#B8860B', r: 4 }} />
          <Line type="monotone" dataKey="target" stroke="#00000020" strokeDasharray="5 5" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
