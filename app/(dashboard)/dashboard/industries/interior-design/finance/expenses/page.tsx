import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingDown, Plus, AlertCircle, Tag } from 'lucide-react'

interface Expense {
  id: string
  expense_name?: string | null
  category?: string | null
  amount: number
  expense_date?: string | null
  notes?: string | null
}

export default async function ExpensesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('expense_date', { ascending: false })

  const all: Expense[] = expenses ?? []
  const totalExpenses = all.reduce((s, e) => s + Number(e.amount || 0), 0)

  // Group by category
  const byCategory: Record<string, number> = {}
  all.forEach(e => {
    const cat = e.category || 'Other'
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount || 0)
  })

  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Finance</p>
          <h1 className="font-serif text-2xl md:text-3xl text-[#1C1712]">Expenses</h1>
          <p className="text-sm text-[#9A8F82] mt-1">{all.length} expense entries</p>
        </div>
        <a href="/dashboard/industries/interior-design/finance/expenses/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#1C1712' }}>
          <Plus size={15} /> Add Expense
        </a>
      </div>

      {/* Total Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden border border-red-100 bg-red-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Total Expenses</p>
            <p className="font-serif text-3xl font-bold text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</p>
            <p className="text-xs text-red-400 mt-1">{all.length} transactions</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <TrendingDown size={28} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* By Category */}
      {sortedCategories.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <h2 className="font-serif text-base text-[#1C1712]">By Category</h2>
          </div>
          <div className="p-5 space-y-4">
            {sortedCategories.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Tag size={12} className="text-[#B8860B]" />
                    <span className="text-sm font-semibold text-[#1C1712]">{cat}</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">₹{Number(amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 bg-[#F5F0E8] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                    style={{ width: `${totalExpenses > 0 ? (Number(amount) / totalExpenses) * 100 : 0}%` }} />
                </div>
                <p className="text-[10px] text-[#9A8F82] mt-0.5">
                  {totalExpenses > 0 ? Math.round((Number(amount) / totalExpenses) * 100) : 0}% of total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">All Expenses</h2>
        </div>
        {all.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} className="text-[#9A8F82]" />
            </div>
            <p className="text-sm font-semibold text-[#1C1712]">No expenses yet</p>
            <p className="text-xs text-[#9A8F82] mt-1">Add your first expense</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0EBE0]">
            {all.map((exp: Expense) => (
              <div key={exp.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#FFFBEF] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <TrendingDown size={15} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C1712]">{exp.expense_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#B8860B] font-semibold">{exp.category}</span>
                      <span className="text-xs text-[#9A8F82]">
                        {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    {exp.notes && <p className="text-xs text-[#B8B0A0] mt-0.5">{exp.notes}</p>}
                  </div>
                </div>
                <p className="text-sm font-bold text-red-500">−₹{Number(exp.amount).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}