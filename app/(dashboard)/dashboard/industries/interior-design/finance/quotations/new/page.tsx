'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface RoomItem {
  description: string
  length: number
  height: number
  sft_cost: number
}

interface Room {
  name: string
  items: RoomItem[]
}

interface FalseCeiling {
  description: string
  sft: number
  sft_cost: number
}

interface Client {
  id: string
  name: string
  city?: string | null
  address?: string | null
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}

export default function NewQuotationPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')

  const [form, setForm] = useState(() => ({
    quotation_no: `HYD${String(Math.floor(Math.random() * 90000) + 10000)}`,
    client_name: '',
    client_id: '',
    status: 'draft',
    discount: 0,
    complementary: '',
  }))

  const [rooms, setRooms] = useState<Room[]>([
    { name: 'Hall', items: [{ description: '', length: 0, height: 0, sft_cost: 1600 }] },
    { name: 'Kitchen', items: [{ description: '', length: 0, height: 0, sft_cost: 1600 }] },
  ])

  const [falseCeilings, setFalseCeilings] = useState<FalseCeiling[]>([
    { description: 'False Ceiling End to End (Profile Lights Extra)', sft: 0, sft_cost: 1500 },
  ])

  const [openRooms, setOpenRooms] = useState<Record<number, boolean>>({ 0: true, 1: true })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (profile?.company_id) {
        setCompanyId(profile.company_id)
        const { data: clientList } = await supabase.from('id_clients').select('id, name, city').eq('company_id', profile.company_id).order('name')
        setClients(clientList ?? [])
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch fn is stable-in-practice, only rerun on listed deps
  }, [])

  // Calculations
  const getRoomTotal = (room: Room) =>
    room.items.reduce((s, i) => s + (i.length * i.height * i.sft_cost), 0)
  const getWoodTotal = () => rooms.reduce((s, r) => s + getRoomTotal(r), 0)
  const getFCTotal = () => falseCeilings.reduce((s, f) => s + (f.sft * f.sft_cost), 0)
  const getGrandTotal = () => getWoodTotal() + getFCTotal()
  const getFinalQuote = () => getGrandTotal() - Number(form.discount || 0)

  // Room operations
  const addRoom = () => setRooms(prev => [...prev, { name: '', items: [{ description: '', length: 0, height: 0, sft_cost: 1600 }] }])
  const removeRoom = (ri: number) => setRooms(prev => prev.filter((_, i) => i !== ri))
  const updateRoomName = (ri: number, name: string) => setRooms(prev => prev.map((r, i) => i === ri ? { ...r, name } : r))

  const addItem = (ri: number) => setRooms(prev => prev.map((r, i) => i === ri ? { ...r, items: [...r.items, { description: '', length: 0, height: 0, sft_cost: 1600 }] } : r))
  const removeItem = (ri: number, ii: number) => setRooms(prev => prev.map((r, i) => i === ri ? { ...r, items: r.items.filter((_, j) => j !== ii) } : r))
  const updateItem = (ri: number, ii: number, field: keyof RoomItem, value: string | number) =>
    setRooms(prev => prev.map((r, i) => i === ri ? { ...r, items: r.items.map((item, j) => j === ii ? { ...item, [field]: value } : item) } : r))

  // False ceiling operations
  const addFC = () => setFalseCeilings(prev => [...prev, { description: '', sft: 0, sft_cost: 200 }])
  const removeFC = (i: number) => setFalseCeilings(prev => prev.filter((_, j) => j !== i))
  const updateFC = (i: number, field: keyof FalseCeiling, value: string | number) =>
    setFalseCeilings(prev => prev.map((f, j) => j === i ? { ...f, [field]: value } : f))

  const handleSave = async () => {
    if (!form.client_name && !form.client_id) { alert('Client select cheyyi!'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('quotations').insert({
        quotation_no: form.quotation_no,
        company_id: companyId,
        amount: getFinalQuote(),
        status: form.status,
      })
      if (error) throw error
      router.push('/dashboard/industries/interior-design/finance/quotations')
    } catch (err: unknown) {
      alert('Error: ' + getErrorMessage(err, 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!form.client_name && !form.client_id) { alert('Client select cheyyi!'); return }
    setPdfLoading(true)
    try {
      const payload = {
        client_name: clientName,
        client_address: clientAddress,
        quote_no: form.quotation_no,
        quote_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        discount: Number(form.discount || 0),
        complementary: form.complementary,
        rooms: rooms.map((r, ri) => ({
          sno: ri + 1,
          name: r.name,
          items: r.items.map(i => ({
            description: i.description,
            length: i.length,
            height: i.height,
            sft: i.length * i.height,
            sft_cost: i.sft_cost,
            total: i.length * i.height * i.sft_cost,
          }))
        })),
        false_ceilings: falseCeilings.map(f => ({
          description: f.description,
          sft: f.sft,
          sft_cost: f.sft_cost,
          total: f.sft * f.sft_cost,
        })),
      }

      const res = await fetch('/api/generate-quotation-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('PDF generation failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `GK_Quotation_${form.quotation_no}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      alert('PDF Error: ' + getErrorMessage(err, 'Something went wrong'))
    } finally {
      setPdfLoading(false)
    }
  }

  const ROOM_PRESETS = ['Hall', 'Kitchen', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Dining', 'Pooja Room', 'Bathroom', 'Main Door', 'Shoe Rack']

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <Link href="/dashboard/industries/interior-design/finance/quotations"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8F82] hover:text-[#B8860B] transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Quotations
        </Link>
        <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Finance</p>
        <h1 className="font-serif text-2xl md:text-3xl text-[#1C1712]">New Quotation</h1>
        <p className="text-sm text-[#9A8F82] mt-1">GK Home Interiors — Room-wise SFT format</p>
      </div>

      {/* Quotation Details */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">Quotation Details</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Quote Number</label>
            <input value={form.quotation_no} onChange={e => setForm(f => ({ ...f, quotation_no: e.target.value }))}
              className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
          </div>
          <div>
            <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Client Name *</label>
            {clients.length > 0 ? (
              <select
                value={form.client_id}
                onChange={e => {
                  const id = e.target.value
                  setForm(f => ({ ...f, client_id: id }))
                  const c = clients.find((c: Client) => c.id === id)
                  if (c) { setClientName(c.name); setClientAddress(c.city || '') }
                }}
                className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]"
              >
                <option value="">Select Client</option>
                {clients.map((c: Client) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <input
                value={form.client_name}
                onChange={e => { setForm(f => ({ ...f, client_name: e.target.value })); setClientName(e.target.value) }}
                placeholder="e.g. Ms. Naimisha Chowdary"
                className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]"
              />
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Client Address</label>
            <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Area / Location"
              className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
          </div>
          <div>
            <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room-wise Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-[#1C1712]">Room-wise Work Items</h2>
          <button onClick={addRoom}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white transition-all">
            <Plus size={13} /> Add Room
          </button>
        </div>

        {rooms.map((room, ri) => {
          const roomTotal = getRoomTotal(room)
          const isOpen = openRooms[ri] !== false
          return (
            <div key={ri} className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
              {/* Room Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[#F0EBE0] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}
                onClick={() => setOpenRooms(prev => ({ ...prev, [ri]: !isOpen }))}>
                <span className="w-6 h-6 rounded-lg bg-[#1C1712] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{ri + 1}</span>
                <input
                  list={`room-presets-${ri}`}
                  value={room.name}
                  placeholder="Room name type cheyyi..."
                  onChange={e => { e.stopPropagation(); updateRoomName(ri, e.target.value) }}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-transparent border-none text-sm font-semibold text-[#1C1712] focus:outline-none placeholder-[#B8B0A0]"
                />
                <datalist id={`room-presets-${ri}`}>
                  {ROOM_PRESETS.map(r => <option key={r} value={r} />)}
                </datalist>
                <span className="text-sm font-bold text-[#B8860B] ml-auto">₹{roomTotal.toLocaleString('en-IN')}</span>
                <button onClick={e => { e.stopPropagation(); removeRoom(ri) }} className="text-red-400 hover:text-red-600 ml-2">
                  <Trash2 size={13} />
                </button>
                {isOpen ? <ChevronUp size={14} className="text-[#9A8F82]" /> : <ChevronDown size={14} className="text-[#9A8F82]" />}
              </div>

              {isOpen && (
                <div className="p-4 space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-[#9A8F82] uppercase tracking-wider px-1">
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2 text-center">Length</div>
                    <div className="col-span-2 text-center">Height</div>
                    <div className="col-span-2 text-center">SFT Cost</div>
                    <div className="col-span-1 text-right">Total</div>
                    <div className="col-span-1"></div>
                  </div>

                  {room.items.map((item, ii) => {
                    const sft = item.length * item.height
                    const total = sft * item.sft_cost
                    return (
                      <div key={ii} className="grid grid-cols-12 gap-2 items-center">
                        <input placeholder="e.g. TV Unit Back Paneling"
                          className="col-span-4 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-[#1C1712] focus:outline-none focus:border-[#B8860B]"
                          value={item.description}
                          onChange={e => updateItem(ri, ii, 'description', e.target.value)} />
                        <input type="number" min="0" placeholder="L"
                          className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                          value={item.length || ''}
                          onChange={e => updateItem(ri, ii, 'length', Number(e.target.value))} />
                        <input type="number" min="0" placeholder="H"
                          className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                          value={item.height || ''}
                          onChange={e => updateItem(ri, ii, 'height', Number(e.target.value))} />
                        <input type="number" min="0"
                          className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                          value={item.sft_cost || ''}
                          onChange={e => updateItem(ri, ii, 'sft_cost', Number(e.target.value))} />
                        <div className="col-span-1 text-right text-xs font-semibold text-[#1C1712]">
                          {total > 0 ? `₹${(total/1000).toFixed(0)}K` : '—'}
                        </div>
                        <button onClick={() => removeItem(ri, ii)} disabled={room.items.length === 1}
                          className="col-span-1 flex justify-center text-red-400 hover:text-red-600 disabled:opacity-20">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                  <button onClick={() => addItem(ri)}
                    className="flex items-center gap-1 text-xs text-[#B8860B] hover:underline mt-1">
                    <Plus size={11} /> Add Item
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* False Ceiling */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">False Ceiling</h2>
          <button onClick={addFC} className="flex items-center gap-1 text-xs text-[#B8860B] hover:underline font-semibold">
            <Plus size={11} /> Add
          </button>
        </div>
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-[#9A8F82] uppercase tracking-wider px-1">
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-center">SFT</div>
            <div className="col-span-2 text-center">Rate/SFT</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>
          {falseCeilings.map((fc, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input placeholder="False Ceiling description"
                className="col-span-5 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#B8860B]"
                value={fc.description} onChange={e => updateFC(i, 'description', e.target.value)} />
              <input type="number" min="0" placeholder="SFT"
                className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                value={fc.sft || ''} onChange={e => updateFC(i, 'sft', Number(e.target.value))} />
              <input type="number" min="0"
                className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                value={fc.sft_cost || ''} onChange={e => updateFC(i, 'sft_cost', Number(e.target.value))} />
              <div className="col-span-2 text-right text-xs font-semibold text-[#1C1712]">
                ₹{(fc.sft * fc.sft_cost).toLocaleString('en-IN')}
              </div>
              <button onClick={() => removeFC(i)} className="col-span-1 flex justify-center text-red-400 hover:text-red-600">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm p-6">
        <h2 className="font-serif text-base text-[#1C1712] mb-4">Summary</h2>
        <div className="space-y-3 max-w-sm ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-[#9A8F82]">Wood Work Total</span>
            <span className="font-semibold text-[#1C1712]">₹{getWoodTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#9A8F82]">False Ceiling Total</span>
            <span className="font-semibold text-[#1C1712]">₹{getFCTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-[#F0EBE0] pt-2">
            <span className="text-[#9A8F82]">Grand Total</span>
            <span className="font-semibold text-[#1C1712]">₹{getGrandTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9A8F82]">Discount (₹)</span>
            <input type="number" min="0" value={form.discount || ''}
              onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
              className="w-32 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-3 py-1 text-sm text-right focus:outline-none focus:border-[#B8860B]" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9A8F82]">Complementary</span>
            <input value={form.complementary}
              onChange={e => setForm(f => ({ ...f, complementary: e.target.value }))}
              placeholder="e.g. Utility Boxes 2 Qty"
              className="w-48 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-[#B8860B]" />
          </div>
          <div className="flex justify-between text-base font-bold border-t border-[#E8E2D8] pt-3">
            <span className="text-[#1C1712]">Final Quote</span>
            <span className="text-[#B8860B] text-lg">₹{getFinalQuote().toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#E8E2D8] text-[#9A8F82] hover:border-[#1C1712] hover:text-[#1C1712] transition-colors">
          Cancel
        </button>
        <button onClick={handleDownloadPDF} disabled={pdfLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white transition-all disabled:opacity-60">
          <Download size={15} />
          {pdfLoading ? 'Generating...' : 'Download PDF'}
        </button>
        <button onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: '#1C1712' }}>
          <Save size={15} />
          {loading ? 'Saving...' : 'Save Quotation'}
        </button>
      </div>
    </div>
  )
}