'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Pencil, Check, X, Download } from 'lucide-react'

const DEFAULT_MILESTONES = [
  { milestone_name: 'Token', percentage: 10, sort_order: 1 },
  { milestone_name: 'False Ceiling', percentage: 20, sort_order: 2 },
  { milestone_name: 'Wood Work', percentage: 50, sort_order: 3 },
  { milestone_name: 'Hardware', percentage: 15, sort_order: 4 },
  { milestone_name: 'Closing', percentage: 5, sort_order: 5 },
]

interface Project {
  id: string
  company_id: string
  client_name?: string
  project_name?: string
  phone?: string
  budget?: number | string
  deadline?: string
  house_type?: string
  location?: string
  mode_of_work?: string
  status?: string
}

interface Milestone {
  id: string
  milestone_name: string
  percentage: number
  expected_amount?: number
  received_amount?: number | string
  sort_order?: number
  updated_at?: string
}

interface Payment {
  id: string
  milestone_id: string
  amount: number
  payment_date: string
  notes?: string | null
  project_id?: string | string[]
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [, setCompanyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Budget negotiation editing
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [budgetSaving, setBudgetSaving] = useState(false)

  // Toast notification (replaces browser alert())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

  // Dated payment entries (single global "+ Add Payment" form)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)

  const downloadInvoice = async () => {
    setDownloadingInvoice(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default

      const totalExpectedNow = milestones.reduce((s, m) => s + Number(m.expected_amount || 0), 0)
      const totalReceivedNow = milestones.reduce((s, m) => s + getMilestoneReceived(m), 0)
      const totalPendingNow = totalExpectedNow - totalReceivedNow
      const invoiceNo = 'GKHI/INV/' + new Date().getFullYear() + '/' + String(project.id).slice(0, 6).toUpperCase()
      const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      const fmtMoney = (n: number) => 'Rs. ' + Number(n).toLocaleString('en-IN')

      // Milestone name lookup for payment history descriptions
      const milestoneNameById: Record<string, string> = {}
      milestones.forEach(m => { milestoneNameById[m.id] = m.milestone_name })

      const sortedPayments = [...payments].sort((a, b) => a.payment_date.localeCompare(b.payment_date))

      let paymentHistoryHtml = ''
      if (sortedPayments.length > 0) {
        let running = 0
        const histRows = sortedPayments.map((p, idx) => {
          running += Number(p.amount || 0)
          const desc = milestoneNameById[p.milestone_id] || p.notes || 'Payment'
          const dateStr = new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          return `<tr>
            <td style="padding:7px 10px;border-bottom:1px solid #E2D9C8;text-align:center;">${idx + 1}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #E2D9C8;">${dateStr}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #E2D9C8;">${desc}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #E2D9C8;text-align:right;">${fmtMoney(Number(p.amount))}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #E2D9C8;text-align:right;">${fmtMoney(running)}</td>
          </tr>`
        }).join('')

        paymentHistoryHtml = `
          <div style="background:#1C1712;color:#fff;padding:8px 10px;font-weight:bold;font-size:10px;margin-top:18px;">PAYMENT HISTORY</div>
          <table style="width:100%;border-collapse:collapse;font-size:9.5px;">
            <thead>
              <tr style="background:#2C2218;color:#fff;">
                <th style="padding:7px 10px;">#</th>
                <th style="padding:7px 10px;text-align:left;">Date</th>
                <th style="padding:7px 10px;text-align:left;">Description</th>
                <th style="padding:7px 10px;text-align:right;">Amount (Rs.)</th>
                <th style="padding:7px 10px;text-align:right;">Running Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>${histRows}</tbody>
            <tfoot>
              <tr style="background:#1C1712;color:#fff;font-weight:bold;">
                <td colspan="3" style="padding:7px 10px;">TOTAL RECEIVED</td>
                <td></td>
                <td style="padding:7px 10px;text-align:right;color:#4ADE80;">${fmtMoney(running)}</td>
              </tr>
            </tfoot>
          </table>
        `
      }

      const rows = milestones.map(m => {
        const exp = Number(m.expected_amount || 0)
        const rec = getMilestoneReceived(m)
        const isPaid = rec >= exp
        const statusColor = isPaid ? '#16A34A' : rec > 0 ? '#D97706' : '#9A8F82'
        const statusLabel = isPaid ? 'Paid' : rec > 0 ? 'Partial' : 'Pending'
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #E2D9C8;">${m.milestone_name}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #E2D9C8;text-align:center;">${m.percentage}%</td>
          <td style="padding:8px 10px;border-bottom:1px solid #E2D9C8;text-align:right;">${fmtMoney(exp)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #E2D9C8;text-align:right;">${fmtMoney(rec)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #E2D9C8;text-align:center;color:${statusColor};font-weight:bold;">${statusLabel}</td>
        </tr>`
      }).join('')

      const html = `
        <div style="font-family:Helvetica,Arial,sans-serif;padding:24px;color:#1C1712;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:20px;font-weight:bold;">GK HOME INTERIORS</div>
              <div style="font-size:9px;color:#7A6E60;margin-top:4px;">A unit of GKA1 Enterprises Private Limited<br/>Hyderabad, Telangana</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:22px;font-weight:bold;color:#B8860B;">INVOICE</div>
              <div style="font-size:9px;margin-top:4px;">Invoice No: ${invoiceNo}<br/>Date: ${today}</div>
            </div>
          </div>
          <hr style="border:none;border-top:1.5px solid #B8860B;margin:14px 0;" />
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:16px;">
            <div>
              <div style="color:#9A8F82;font-size:8px;font-weight:bold;">BILL TO</div>
              <div style="font-weight:bold;font-size:11px;margin:2px 0;">${project.client_name || '—'}</div>
              <div>${project.phone || ''}</div>
            </div>
            <div style="text-align:right;">
              <div style="color:#9A8F82;font-size:8px;font-weight:bold;">PROJECT</div>
              <div style="font-weight:bold;font-size:11px;margin:2px 0;">${project.project_name}</div>
              <div>${project.location || ''} ${project.house_type ? '· ' + project.house_type : ''}</div>
            </div>
          </div>

          ${paymentHistoryHtml}

          <div style="background:#1C1712;color:#fff;padding:8px 10px;font-weight:bold;font-size:10px;margin-top:18px;">MILESTONE SUMMARY</div>
          <table style="width:100%;border-collapse:collapse;font-size:10px;">
            <thead>
              <tr style="background:#2C2218;color:#fff;">
                <th style="padding:8px 10px;text-align:left;">Milestone</th>
                <th style="padding:8px 10px;">%</th>
                <th style="padding:8px 10px;text-align:right;">Expected (Rs.)</th>
                <th style="padding:8px 10px;text-align:right;">Received (Rs.)</th>
                <th style="padding:8px 10px;text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="background:#1C1712;color:#fff;font-weight:bold;">
                <td colspan="2" style="padding:8px 10px;">TOTAL</td>
                <td style="padding:8px 10px;text-align:right;">${fmtMoney(totalExpectedNow)}</td>
                <td style="padding:8px 10px;text-align:right;color:#4ADE80;">${fmtMoney(totalReceivedNow)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top:16px;font-size:11px;">
            <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Total Project Value</span><b>${fmtMoney(totalExpectedNow)}</b></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;color:#16A34A;"><span>Total Received</span><b>${fmtMoney(totalReceivedNow)}</b></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;color:#D97706;border-top:1px solid #E2D9C8;"><span>Balance Pending</span><b>${fmtMoney(totalPendingNow)}</b></div>
          </div>
          <div style="margin-top:40px;text-align:right;font-size:10px;">
            <div style="font-weight:bold;">For GK Home Interiors</div>
            <div style="height:40px;"></div>
            <div style="border-top:1px solid #1C1712;display:inline-block;padding-top:4px;color:#7A6E60;font-size:8px;">Authorised Signatory</div>
          </div>
          <div style="margin-top:24px;font-size:7.5px;color:#9A8F82;border-top:1px solid #E2D9C8;padding-top:8px;">
            This is a computer-generated invoice reflecting payments received to date under the agreed milestone schedule
            (Token 10% &rarr; False Ceiling 20% &rarr; Wood Work 50% &rarr; Hardware 15% &rarr; Closing 5%).
          </div>
        </div>
      `

      const container = document.createElement('div')
      container.innerHTML = html
      document.body.appendChild(container)

      await html2pdf()
        .set({
          margin: 10,
          filename: `Invoice_${(project.client_name || 'Client').replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save()

      document.body.removeChild(container)

      // Sync this invoice into the Finance > Invoices list (upsert by project_id
      // so repeated downloads update the same invoice row instead of duplicating)
      const invoiceStatus = totalPendingNow <= 0 ? 'paid' : (totalReceivedNow > 0 ? 'pending' : 'pending')
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('project_id', id)
        .maybeSingle()

      const invoicePayload = {
        invoice_no: invoiceNo,
        amount: totalExpectedNow,
        paid_amount: totalReceivedNow,
        status: invoiceStatus,
        client_name: project.client_name || null,
        company_id: project.company_id,
        project_id: id,
        due_date: project.deadline || null,
        notes: 'Auto-generated from project payment milestones',
      }

      if (existingInvoice) {
        await supabase.from('invoices').update(invoicePayload).eq('id', existingInvoice.id)
      } else {
        await supabase.from('invoices').insert(invoicePayload)
      }

      showToast('Invoice downloaded!')
    } catch (err: unknown) {
      console.error(err)
      showToast('Failed to generate invoice', 'error')
    }
    setDownloadingInvoice(false)
  }

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
        // Auto-create default milestones (upsert avoids duplicate rows if
        // this effect fires twice, e.g. React Strict Mode in dev)
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
          .upsert(defaults, { onConflict: 'project_id,milestone_name', ignoreDuplicates: true })
          .select()

        if (created && created.length > 0) {
          setMilestones(created)
        } else {
          // Another concurrent call already inserted them — fetch what's there
          const { data: existing } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('project_id', id)
            .order('sort_order')
          setMilestones(existing ?? [])
        }
      }

      setLoading(false)

      // Fetch dated payment entries for this project
      const { data: pays } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', id)
        .order('payment_date', { ascending: true })
      setPayments(pays ?? [])
    }
    load()
  }, [id, supabase])
  const getMilestoneReceived = (m: Milestone) => {
    const logged = payments.filter(p => p.milestone_id === m.id)
    if (logged.length > 0) return logged.reduce((s, p) => s + Number(p.amount || 0), 0)
    return Number(m.received_amount || 0)
  }
  const getMilestonePayments = (m: Milestone) =>
    payments.filter(p => p.milestone_id === m.id).sort((a, b) => a.payment_date.localeCompare(b.payment_date))

  const totalExpected = milestones.reduce((s, m) => s + Number(m.expected_amount || 0), 0)
  const totalReceived = milestones.reduce((s, m) => s + getMilestoneReceived(m), 0)
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
    showToast('Milestones saved!')
  }

  // ---- Budget negotiation handlers ----
  const startEditBudget = () => {
    setBudgetInput(String(project?.budget ?? ''))
    setEditingBudget(true)
  }

  const cancelEditBudget = () => {
    setEditingBudget(false)
    setBudgetInput('')
  }

  const saveNegotiatedBudget = async () => {
    const newBudget = Number(budgetInput)
    if (!newBudget || newBudget <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setBudgetSaving(true)

    // 1. Update project's budget
    const { error: projErr } = await supabase
      .from('projects')
      .update({ budget: newBudget })
      .eq('id', id)

    if (projErr) {
      showToast('Failed to update budget: ' + projErr.message, 'error')
      setBudgetSaving(false)
      return
    }

    // 2. Recalculate each milestone's expected_amount based on the same percentages
    //    (received_amount already entered is left untouched)
    const recalculated = milestones.map(m => ({
      ...m,
      expected_amount: Math.round(newBudget * Number(m.percentage) / 100),
    }))

    for (const m of recalculated) {
      if (m.id) {
        await supabase
          .from('project_milestones')
          .update({ expected_amount: m.expected_amount })
          .eq('id', m.id)
      }
    }

    setMilestones(recalculated)
    setProject((p) => p ? { ...p, budget: newBudget } : p)
    setBudgetSaving(false)
    setEditingBudget(false)
    showToast('Budget updated to ' + fmt(newBudget))
  }

  // ---- Dated payment entry handlers (single "+ Add Payment" form, auto-allocated) ----
  const openAddPayment = () => {
    setShowAddPayment(true)
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setPaymentAmount('')
  }

  const cancelAddPayment = () => {
    setShowAddPayment(false)
    setPaymentDate('')
    setPaymentAmount('')
  }

  const submitPayment = async () => {
    const amt = Number(paymentAmount)
    if (!amt || amt <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }
    if (!paymentDate) {
      showToast('Pick a date', 'error')
      return
    }
    setPaymentSaving(true)

    // Waterfall allocation: fill milestones in order (Token → False Ceiling →
    // Wood Work → Hardware → Closing). Whatever completes one milestone's
    // remaining balance overflows automatically into the next.
    const sorted = [...milestones].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))

    let remaining = amt
    const rowsToInsert: Omit<Payment, 'id'>[] = []
    const milestoneNewTotals: Record<string, number> = {}

    for (const m of sorted) {
      if (remaining <= 0) break
      const expected = Number(m.expected_amount || 0)
      const alreadyReceived = getMilestoneReceived(m)
      const needed = expected - alreadyReceived
      if (needed <= 0) continue // this milestone is already fully paid — skip

      const portion = Math.min(remaining, needed)

      // First time logging a dated payment for a milestone that already has
      // a manually-entered received_amount — migrate that as a "previous
      // total" entry so nothing is lost when we switch to dated tracking.
      const existingForMilestone = payments.filter(p => p.milestone_id === m.id)
      if (existingForMilestone.length === 0 && alreadyReceived > 0) {
        rowsToInsert.push({
          project_id: id,
          milestone_id: m.id,
          amount: alreadyReceived,
          payment_date: m.updated_at ? String(m.updated_at).slice(0, 10) : paymentDate,
          notes: 'Previously recorded total (migrated)',
        })
      }

      rowsToInsert.push({
        project_id: id,
        milestone_id: m.id,
        amount: portion,
        payment_date: paymentDate,
        notes: null,
      })

      milestoneNewTotals[m.id] = alreadyReceived + portion
      remaining -= portion
    }

    if (rowsToInsert.length === 0) {
      showToast('All milestones are already fully paid', 'error')
      setPaymentSaving(false)
      return
    }

    const { data: inserted, error } = await supabase
      .from('payments')
      .insert(rowsToInsert)
      .select()

    if (error) {
      showToast('Failed to save payment: ' + error.message, 'error')
      setPaymentSaving(false)
      return
    }

    const updatedPayments = [...payments, ...(inserted ?? [])]
    setPayments(updatedPayments)

    for (const [milestoneId, newTotal] of Object.entries(milestoneNewTotals)) {
      await supabase
        .from('project_milestones')
        .update({ received_amount: newTotal })
        .eq('id', milestoneId)
    }

    setMilestones(ms => ms.map(x =>
      milestoneNewTotals[x.id] !== undefined ? { ...x, received_amount: milestoneNewTotals[x.id] } : x
    ))

    setPaymentSaving(false)
    setShowAddPayment(false)
    setPaymentDate('')
    setPaymentAmount('')

    if (remaining > 0) {
      showToast(`Logged ${fmt(amt)}, but ${fmt(remaining)} exceeds the remaining project balance`, 'error')
    } else {
      showToast(`Payment of ${fmt(amt)} added — auto-allocated across milestones`)
    }
  }

  const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN')

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#F5F0E8' }}>
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!project) return <div className="p-6 text-[#9A8F82]">Project not found</div>

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto relative" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Toast notification (replaces browser alert) */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]"
          style={{ background: toast.type === 'success' ? '#16A34A' : '#DC2626' }}
        >
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-[#E2D9C8] flex items-center justify-center hover:bg-[#F5F0E8] hover:border-[#B8860B] transition-all shadow-sm">
            <ArrowLeft size={17} className="text-[#1C1712]" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#B8860B] mb-0.5">Project</p>
            <h1 className="font-black text-2xl text-[#1C1712] leading-tight">{project.project_name}</h1>
            <p className="text-sm text-[#9A8F82] mt-1">{project.client_name} {project.location ? '· ' + project.location : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={downloadInvoice} disabled={downloadingInvoice}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 disabled:opacity-60 shadow-sm hover:shadow-md transition-shadow"
            style={{ borderColor: '#B8860B', color: '#B8860B', background: 'white' }}>
            <Download size={14} />
            {downloadingInvoice ? 'Generating...' : 'Download Invoice'}
          </button>
          <button onClick={saveMilestones} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 shadow-sm hover:shadow-md transition-shadow"
            style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)' }}>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Project Info (client / mobile / location / house type / mode of work) */}
      <div className="bg-white rounded-3xl border border-[#E2D9C8] p-6 grid grid-cols-2 md:grid-cols-5 gap-6 shadow-sm">
        {[
          { label: 'Client', value: project.client_name || '—' },
          { label: 'Mobile No', value: project.phone || '—' },
          { label: 'Location', value: project.location || '—' },
          { label: 'House Type', value: project.house_type || '—' },
          { label: 'Mode of Work', value: project.mode_of_work || '—' },
        ].map(f => (
          <div key={f.label}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#9A8F82] mb-1.5">{f.label}</p>
            <p className="text-sm font-semibold text-[#1C1712]">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Budget / Received / Pending / Status */}
      <div className="bg-white rounded-3xl border border-[#E2D9C8] p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#9A8F82] mb-1.5">Budget</p>
            {editingBudget ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  autoFocus
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  placeholder="Negotiated amount"
                  className="w-28 px-2 py-1 rounded-lg border border-[#B8860B] text-sm font-bold text-[#1C1712] outline-none"
                />
                <button
                  onClick={saveNegotiatedBudget}
                  disabled={budgetSaving}
                  title="Save negotiated amount"
                  className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 disabled:opacity-50"
                >
                  <Check size={13} className="text-emerald-700" />
                </button>
                <button
                  onClick={cancelEditBudget}
                  disabled={budgetSaving}
                  title="Cancel"
                  className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200"
                >
                  <X size={13} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <p className="text-xl font-black text-[#1C1712]">{fmt(Number(project.budget || 0))}</p>
                <button
                  onClick={startEditBudget}
                  title="Edit negotiated budget"
                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-[#F5F0E8] transition-colors"
                >
                  <Pencil size={12} className="text-[#9A8F82]" />
                </button>
              </div>
            )}
          </div>
          {[
            { label: 'Received', value: fmt(totalReceived), color: '#16A34A' },
            { label: 'Pending', value: fmt(totalPending), color: totalPending > 0 ? '#D97706' : '#16A34A' },
            { label: 'Status', value: project.status?.replace('_', ' ') ?? '—', color: '#7C3AED' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#9A8F82] mb-1.5">{s.label}</p>
              <p className="text-xl font-black capitalize" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Collection progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A8F82]">Collection Progress</span>
            <span className="text-xs font-black" style={{ color: '#B8860B' }}>
              {Math.round((totalReceived / (totalExpected || 1)) * 100)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#F0EBE0] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((totalReceived / (totalExpected || 1)) * 100))}%`,
                background: 'linear-gradient(90deg, #D4A017, #B8860B)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Milestone Tracker */}
      <div className="bg-white rounded-3xl border border-[#E2D9C8] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[#F0EBE0] flex items-center justify-between gap-3 flex-wrap" style={{ background: 'linear-gradient(135deg, #1C1712, #2C2218)' }}>
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-2">💰 Payment Milestones</h2>
            <p className="text-xs text-[#B8A896] mt-1">Token 10% → False Ceiling 20% → Wood Work 50% → Hardware 15% → Closing 5%</p>
          </div>
          {!showAddPayment && (
            <button
              onClick={openAddPayment}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm hover:shadow-md transition-shadow"
              style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#1C1712' }}
            >
              + Add Payment
            </button>
          )}
        </div>

        {showAddPayment && (
          <div className="px-5 py-4 bg-[#FFFBEF] border-b border-[#F0EBE0] flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#7A6E60]">Payment auto-fills Token → False Ceiling → Wood Work → Hardware → Closing in order:</span>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E8E2D8] text-sm text-[#1C1712] outline-none focus:border-[#B8860B] bg-white"
            />
            <input
              type="number"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              placeholder="Amount"
              autoFocus
              className="w-36 px-3 py-2 rounded-lg border border-[#E8E2D8] text-sm text-[#1C1712] outline-none focus:border-[#B8860B] bg-white"
            />
            <button
              onClick={submitPayment}
              disabled={paymentSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
              style={{ background: '#16A34A' }}
            >
              <Check size={14} /> {paymentSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={cancelAddPayment}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        )}

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0EBE0] bg-[#FDFAF8]">
                {['Milestone', '%', 'Expected (₹)', 'Received (₹)', 'Pending (₹)', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-6 py-3.5 text-[#9A8F82]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0]">
              {milestones.map((m, i) => {
                const expected = Number(m.expected_amount || 0)
                const received = getMilestoneReceived(m)
                const pending = expected - received
                const isPaid = received >= expected
                const loggedPayments = getMilestonePayments(m)
                return (
                  <tr key={i} className="hover:bg-[#FFFBEF] transition-colors align-top border-l-4"
                    style={{ borderLeftColor: isPaid ? '#16A34A' : received > 0 ? '#D97706' : 'transparent' }}>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-[#1C1712]">{m.milestone_name}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F5F0E8] text-[#B8860B]">{m.percentage}%</span>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-[#1C1712]">{fmt(expected)}</td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        {loggedPayments.length > 0 ? (
                          <span className="text-sm font-bold text-[#1C1712] px-3 py-1.5 rounded-lg bg-[#FDFAF8] border border-[#E8E2D8] inline-block">
                            {fmt(received)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={m.received_amount}
                            onChange={e => updateReceived(i, e.target.value)}
                            className="w-28 px-3 py-1.5 rounded-lg border border-[#E8E2D8] text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B] bg-[#FDFAF8]"
                          />
                        )}
                        {loggedPayments.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {loggedPayments.map(p => (
                              <span key={p.id} className="text-[9px] px-1.5 py-0.5 rounded bg-[#F5F0E8] text-[#7A6E60]">
                                {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}: {fmt(Number(p.amount))}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-sm font-bold ${pending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {fmt(Math.max(0, pending))}
                      </span>
                    </td>
                    <td className="px-6 py-5">
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
                <td colSpan={2} className="px-6 py-4 text-xs font-bold text-[#B8860B] uppercase">Total</td>
                <td className="px-6 py-4 text-sm font-black text-white">{fmt(totalExpected)}</td>
                <td className="px-6 py-4 text-sm font-black text-emerald-400">{fmt(totalReceived)}</td>
                <td className="px-6 py-4 text-sm font-black text-amber-400">{fmt(Math.max(0, totalPending))}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#1C1712' }}>
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
            const received = getMilestoneReceived(m)
            const pending = expected - received
            const isPaid = received >= expected
            const loggedPayments = getMilestonePayments(m)
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
                    {loggedPayments.length > 0 ? (
                      <p className="text-xs font-black text-emerald-700">{fmt(received)}</p>
                    ) : (
                      <input type="number" value={m.received_amount}
                        onChange={e => updateReceived(i, e.target.value)}
                        className="w-full text-xs font-black text-emerald-700 bg-transparent text-center focus:outline-none"
                      />
                    )}
                  </div>
                  <div className="bg-amber-50 rounded-xl p-2">
                    <p className="text-[9px] text-amber-600 font-bold uppercase">Pending</p>
                    <p className="text-xs font-black text-amber-700">{fmt(Math.max(0, pending))}</p>
                  </div>
                </div>
                {loggedPayments.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {loggedPayments.map(p => (
                      <span key={p.id} className="text-[9px] px-1.5 py-0.5 rounded bg-[#F5F0E8] text-[#7A6E60]">
                        {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}: {fmt(Number(p.amount))}
                      </span>
                    ))}
                  </div>
                )}
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