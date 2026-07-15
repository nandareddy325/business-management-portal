'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react'
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

// Standalone items that sit outside any room but still get a
// continuing S.no in the main table — e.g. "Main Door Elevation",
// "Shoe Rack", "False Ceiling Pending Payment".
interface ExtraItem {
  description: string
  length: number
  height: number
  sft_cost: number
  // Some extra items (like a pending-payment adjustment) only have a
  // fixed value and no L x H x rate breakdown.
  fixedValue?: number
}

interface FalseCeiling {
  description: string
  sft: number
  sft_cost: number
  note: string // materials line shown under the row, e.g. "Ultra Channels, gypsum Board, Finolex Wire..."
}

interface Client {
  id: string
  name: string
  phone?: string | null
  city?: string | null
  address?: string | null
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}

// Builds the disambiguated label shown in the dropdown, e.g.
// "Immanail — 9876543210 (Miyapur)" so two clients with the same
// name are never confused with each other.
function clientOptionLabel(c: Client): string {
  const parts = [c.name]
  if (c.phone) parts.push(`— ${c.phone}`)
  if (c.city) parts.push(`(${c.city})`)
  return parts.join(' ')
}

// Roman numerals for the False Ceiling section (I, II, III, ...)
function toRoman(num: number): string {
  const romans: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let n = num, out = ''
  for (const [val, sym] of romans) {
    while (n >= val) { out += sym; n -= val }
  }
  return out
}

// Standard terms & conditions block — same wording as the printed
// template. Edit here if the company's terms change.
const NOTES = [
  'Play wood: Austin BWP(IS710).',
  'Hardware: Hinges - Soft Closer (Ebco,Nummuy).',
  'Laminations: Inner laminate (White) .8 MM • Outside Laminate: 1 MM.',
  'Laminates price limit is 1300 to 1500 Rs. If crossed the limited Additional price will be added in Final Quotation.',
  'We will provide 2 Draws with Locks for Each Room.',
  'All designs need to be approved prior commencing the work. Any changes later will be charged based on actuals.',
  'Other additional work apart from the above quotation will be charged extra.',
  'We will remove all the wood pieces after work Completed.',
  'Customer need to provide basic sanitary facility, Electricity feasibility etc.',
  'Payment Terms: 10% Token Amount, 50% Advance before starting the work, 30% After completion of Box & Door works, 5% while handles/Profile Glass fixing time, 5% Before handover the flat. (Token Amount Non-Refundable).',
]

const OFFICE_ADDRESS = 'F12, 3RD FLOOR, Alluri Trade Centre, Kukatpally Housing Board Rd Near kphb metro station Above the Dominos, Bhagya Nagar Colony, Kukatpally, Hyderabad, Telangana 500072'

export default function NewQuotationPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [selectedClientPhone, setSelectedClientPhone] = useState('')

  const [form, setForm] = useState(() => ({
    quotation_no: `HYD${String(Math.floor(Math.random() * 90000) + 10000)}`,
    client_name: '',
    client_id: '',
    status: 'draft',
    discount: 0,
    complementary: '',
    receivedAmount: 0,
    preparedByName: 'Harikrishna.c',
    preparedByPhone: '+91 9742483054',
  }))

  const [rooms, setRooms] = useState<Room[]>([
    { name: 'Hall', items: [{ description: '', length: 0, height: 0, sft_cost: 1600 }] },
    { name: 'Kitchen', items: [{ description: '', length: 0, height: 0, sft_cost: 1600 }] },
  ])

  // Standalone items (Main Door Elevation, Shoe Rack, False Ceiling
  // Pending Payment, etc.) — these continue the S.no sequence after
  // the rooms but are not nested under any room.
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([])

  const [falseCeilings, setFalseCeilings] = useState<FalseCeiling[]>([
    {
      description: 'False Ceiling End to End (Profile Lights Extra)',
      sft: 0,
      sft_cost: 1500,
      note: 'Ultra Channels, gypsum Board, Finolex Wire, Wipro Lights & Putti & Paint',
    },
  ])

  const [openRooms, setOpenRooms] = useState<Record<number, boolean>>({ 0: true, 1: true })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (profile?.company_id) {
        setCompanyId(profile.company_id)
        const { data: clientList } = await supabase.from('id_clients').select('id, name, phone, city').eq('company_id', profile.company_id).order('name')
        setClients(clientList ?? [])
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch fn is stable-in-practice, only rerun on listed deps
  }, [])

  // ── Calculations ──
  const getRoomTotal = (room: Room) =>
    room.items.reduce((s, i) => s + (i.length * i.height * i.sft_cost), 0)
  const getRoomSft = (room: Room) =>
    room.items.reduce((s, i) => s + (i.length * i.height), 0)

  const getExtraItemSft = (i: ExtraItem) => i.length * i.height
  const getExtraItemTotal = (i: ExtraItem) =>
    i.fixedValue !== undefined ? i.fixedValue : i.length * i.height * i.sft_cost

  // "A" — Wood Work Cost: rooms + standalone extra items
  const getWoodSftTotal = () =>
    rooms.reduce((s, r) => s + getRoomSft(r), 0) + extraItems.reduce((s, i) => s + getExtraItemSft(i), 0)
  const getWoodTotal = () =>
    rooms.reduce((s, r) => s + getRoomTotal(r), 0) + extraItems.reduce((s, i) => s + getExtraItemTotal(i), 0)

  const getFCTotal = () => falseCeilings.reduce((s, f) => s + (f.sft * f.sft_cost), 0)

  // "B" — Total Cost (Wood Work + False Ceiling)
  const getGrandTotal = () => getWoodTotal() + getFCTotal()

  // "C" — Final Quote Value
  const getFinalQuote = () => getGrandTotal() - Number(form.discount || 0)
  const getPending = () => getFinalQuote() - Number(form.receivedAmount || 0)

  // Room operations
  const addRoom = () => setRooms(prev => [...prev, { name: '', items: [{ description: '', length: 0, height: 0, sft_cost: 1600 }] }])
  const removeRoom = (ri: number) => setRooms(prev => prev.filter((_, i) => i !== ri))
  const updateRoomName = (ri: number, name: string) => setRooms(prev => prev.map((r, i) => i === ri ? { ...r, name } : r))

  const addItem = (ri: number) => setRooms(prev => prev.map((r, i) => i === ri ? { ...r, items: [...r.items, { description: '', length: 0, height: 0, sft_cost: 1600 }] } : r))
  const removeItem = (ri: number, ii: number) => setRooms(prev => prev.map((r, i) => i === ri ? { ...r, items: r.items.filter((_, j) => j !== ii) } : r))
  const updateItem = (ri: number, ii: number, field: keyof RoomItem, value: string | number) =>
    setRooms(prev => prev.map((r, i) => i === ri ? { ...r, items: r.items.map((item, j) => j === ii ? { ...item, [field]: value } : item) } : r))

  // Extra (standalone) item operations
  const addExtraItem = () => setExtraItems(prev => [...prev, { description: '', length: 0, height: 0, sft_cost: 1500 }])
  const removeExtraItem = (i: number) => setExtraItems(prev => prev.filter((_, j) => j !== i))
  const updateExtraItem = (i: number, field: keyof ExtraItem, value: string | number) =>
    setExtraItems(prev => prev.map((item, j) => j === i ? { ...item, [field]: value } : item))
  // Toggle between "L x H x Rate" mode and a plain fixed-value mode
  // (used for things like "False Ceiling Pending Payment" that only
  // carry a Total Value column in the reference format).
  const toggleExtraItemFixed = (i: number) =>
    setExtraItems(prev => prev.map((item, j) => {
      if (j !== i) return item
      if (item.fixedValue !== undefined) {
        const { fixedValue, ...rest } = item
        void fixedValue
        return rest
      }
      return { ...item, fixedValue: 0 }
    }))

  // False ceiling operations
  const addFC = () => setFalseCeilings(prev => [...prev, { description: '', sft: 0, sft_cost: 200, note: '' }])
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

  // ── Excel export ── (matches the reference: rooms -> extra items ->
  // "A Wood Work Cost" -> roman-numeral false ceiling rows (+ note
  // line) -> "B Total Cost" -> Discount -> Complementary -> "C Final
  // Quote Value" -> Payment Terms)
  const handleDownloadExcel = async () => {
    if (!form.client_name && !form.client_id) { alert('Client select cheyyi!'); return }
    setExcelLoading(true)
    try {
      const XLSX = await import('xlsx')

      const rows: (string | number)[][] = []

      rows.push(['GK HOME INTERIORS'])
      rows.push(['Quotation No', form.quotation_no, '', 'Date', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })])
      rows.push(['Client', clientName, '', 'Address', clientAddress])
      rows.push([])

      rows.push(['S.No', 'Work', 'Scope of Work', 'Length (ft)', 'Height (ft)', 'Total SFT', 'Sft Cost (₹)', 'Total Value (₹)'])

      let sno = 0
      rooms.forEach((room) => {
        sno++
        room.items.forEach((item, ii) => {
          const sft = item.length * item.height
          const total = sft * item.sft_cost
          rows.push([
            ii === 0 ? sno : '',
            ii === 0 ? room.name : '',
            item.description,
            item.length,
            item.height,
            sft,
            item.sft_cost,
            total,
          ])
        })
      })

      extraItems.forEach((item) => {
        sno++
        const sft = getExtraItemSft(item)
        const total = getExtraItemTotal(item)
        rows.push([
          sno,
          '',
          item.description,
          item.fixedValue !== undefined ? '' : item.length,
          item.fixedValue !== undefined ? '' : item.height,
          item.fixedValue !== undefined ? '' : sft,
          item.fixedValue !== undefined ? '' : item.sft_cost,
          total,
        ])
      })

      rows.push([])
      rows.push(['A', 'Wood Work Cost', '', '', '', getWoodSftTotal(), '', getWoodTotal()])
      rows.push([])

      falseCeilings.forEach((fc, i) => {
        rows.push([toRoman(i + 1), fc.description, '', '', '', fc.sft, fc.sft_cost, fc.sft * fc.sft_cost])
        if (fc.note) rows.push(['', fc.note])
      })

      rows.push([])
      rows.push(['B', 'Total Cost (Wood Work + False Ceiling)', '', '', '', '', '', getGrandTotal()])
      rows.push(['', 'Discount', '', '', '', '', '', Number(form.discount || 0)])
      if (form.complementary) {
        rows.push(['', 'Complementary', form.complementary])
      }
      rows.push(['C', 'Final Quote Value', '', '', '', '', '', getFinalQuote()])
      rows.push([])

      rows.push(['Payment Terms'])
      rows.push(['First payment', '50%', Math.round(getFinalQuote() * 0.5)])
      rows.push(['Second payment', '30%', Math.round(getFinalQuote() * 0.3)])
      rows.push(['Third Payment', '15%', Math.round(getFinalQuote() * 0.15)])
      rows.push(['Fourth Payment', '5%', Math.round(getFinalQuote() * 0.05)])
      rows.push(['Total payment', '', getFinalQuote()])
      rows.push(['Received Amount', '', Number(form.receivedAmount || 0), 'Pending', getPending()])

      const worksheet = XLSX.utils.aoa_to_sheet(rows)
      worksheet['!cols'] = [
        { wch: 8 }, { wch: 16 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotation')

      XLSX.writeFile(workbook, `GK_Quotation_${form.quotation_no}.xlsx`)
    } catch (err: unknown) {
      alert('Excel Error: ' + getErrorMessage(err, 'Something went wrong'))
    } finally {
      setExcelLoading(false)
    }
  }

  // ── PDF export — full branded template (About Us, Services, Brands,
  // Projects, then the dynamic quotation table + payment terms + notes) ──
  const handleDownloadPDF = async () => {
    if (!form.client_name && !form.client_id) { alert('Client select cheyyi!'); return }
    setPdfLoading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const A = '/quotation-template' // public/quotation-template/...

      const quoteDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      const fmt = (n: number) => n.toLocaleString('en-IN')

      const icon1 = ['1-tailored-design', '2-quality-materials', '3-crafted-interior', '4-timely-delivery', '5-turnkey-solutions', '6-wide-range-services']
      const icon1Titles = ['Tailored Design Solutions', 'Quality Materials', 'Crafted Interior Designs & Quality Workmanship', 'Timely Delivery', 'Turnkey solutions', 'Wide range of Services']
      const icon1Text = [
        'We offer personalized design solutions tailored to meet the unique needs, preferences, and lifestyle of each client.',
        'We source high-quality materials and work with skilled craftsmen to deliver durable and visually stunning design elements that stand the test of time.',
        'Showcase the artistry and attention to detail in your interior designs and a commitment to delivering high-quality work.',
        'Our efficient project management ensures timely completion of projects, allowing our clients to enjoy their transformed spaces on schedule.',
        'Our turnkey approach ensures a hassle-free experience for our customers, handling every aspect of the project with expertise and efficiency.',
        'We take pride in offering a diverse range of services to cater to all your interior design needs. Providing you with a seamless and satisfying experience from start to finish.',
      ]

      const icon2 = ['1-interior-design', '2-home-automation', '3-painting', '4-gardening', '5-furniture-decor', '6-home-theatre']
      const icon2Ext = ['png', 'jpg', 'jpg', 'jpg', 'jpg', 'jpg']
      const icon2Titles = ['Interior Design', 'Home Automation', 'Painting', 'Gardening', 'Furniture & Décor', 'Home Theatre']
      const icon2Text = [
        'From conceptualization to execution, we bring creativity and innovation to every aspect of interior design, ensuring a personalized and cohesive look.',
        'We specialize in integrating smart technology into your home for easy control of lighting, temperature, security, and entertainment—all from your smartphone or tablet.',
        'Transform your space with our professional painting services. From interior to exterior, we bring quality paints and expert skills for a fresh and vibrant look.',
        'From nurturing indoor plants to crafting inviting outdoor landscapes, we bring tailored solutions to beautify every aspect of your property.',
        'Our experts help you create a welcoming and comfortable environment with quality furniture and thoughtful decor choices.',
        'Immerse yourself in entertainment with our home theater services. We design and install custom home theater systems tailored to your space and preferences.',
      ]

      const brandLogos = ['1-hettich.png', '2-ebco.png', '3-virgo.png', '4-centuryply.png', '5-austin-plywood.png', '6-saint-gobain.png', '7-godrej-locks.png', '8-sb-logo.jpg']
      const projectPhotos = Array.from({ length: 18 }, (_, i) => `photo-${String(i + 1).padStart(2, '0')}.jpg`)

      // Rooms — rowspan the S.no / Work columns across each room's items
      let sno = 0
      const roomRowsHtml = rooms.map((room) => {
        sno++
        const roomSno = sno
        return room.items.map((item, ii) => {
          const sft = item.length * item.height
          const total = sft * item.sft_cost
          return `<tr>
            ${ii === 0 ? `<td rowspan="${room.items.length}" style="text-align:center;">${roomSno}</td><td rowspan="${room.items.length}">${room.name}</td>` : ''}
            <td>${item.description || '—'}</td>
            <td style="text-align:center;">${item.length}</td>
            <td style="text-align:center;">${item.height}</td>
            <td style="text-align:center;">${sft}</td>
            <td style="text-align:center;">${item.sft_cost}</td>
            <td style="text-align:right;">${fmt(total)}</td>
          </tr>`
        }).join('')
      }).join('')

      // Standalone extra items — continue the same S.no sequence,
      // single row each, no room grouping.
      const extraItemsHtml = extraItems.map((item) => {
        sno++
        const sft = getExtraItemSft(item)
        const total = getExtraItemTotal(item)
        const hasDims = item.fixedValue === undefined
        return `<tr>
          <td style="text-align:center;">${sno}</td>
          <td></td>
          <td>${item.description || '—'}</td>
          <td style="text-align:center;">${hasDims ? item.length : ''}</td>
          <td style="text-align:center;">${hasDims ? item.height : ''}</td>
          <td style="text-align:center;">${hasDims ? sft : ''}</td>
          <td style="text-align:center;">${hasDims ? item.sft_cost : ''}</td>
          <td style="text-align:right;">${fmt(total)}</td>
        </tr>`
      }).join('')

      // Wood Work Cost — row "A"
      const woodCostRowHtml = `
        <tr style="background:#DCE6F5; font-weight:bold;">
          <td colspan="5" style="text-align:center;">A</td>
          <td style="text-align:center;">${getWoodSftTotal()}</td>
          <td></td>
          <td style="text-align:right;">${fmt(getWoodTotal())}</td>
        </tr>
      `

      // False Ceiling — roman numerals + a full-width materials note row
      const fcRowsHtml = falseCeilings.map((fc, i) => `
        <tr style="background:#FCE9E9;">
          <td colspan="2" style="text-align:center; font-weight:bold;">${toRoman(i + 1)}</td>
          <td colspan="4" style="font-weight:bold;">${fc.description}</td>
          <td style="text-align:center;">${fc.sft_cost}</td>
          <td style="text-align:right; font-weight:bold;">${fmt(fc.sft * fc.sft_cost)}</td>
        </tr>
        ${fc.note ? `<tr><td colspan="8" style="font-size:10px; color:#555;">${fc.note}</td></tr>` : ''}
      `).join('')

      const html = `
      <div style="font-family: Calibri, Arial, sans-serif; color:#1a1a1a; font-size: 12px;">

        <!-- PAGE 1: Cover + About Us + Why Choose Us -->
        <div style="padding: 30px 40px; page-break-after: always;">
          <img src="${A}/gk-logo.jpg" style="width:90px; margin-bottom:20px;" />
          <table style="width:100%; margin-bottom:20px; font-size:13px;">
            <tr>
              <td style="font-weight:bold;">${clientName || form.client_name}<br/>${clientAddress || ''}.</td>
              <td style="text-align:right; font-weight:bold;">Quote No; ${form.quotation_no}<br/>Date: ${quoteDate}.</td>
            </tr>
          </table>

          <h2 style="text-align:center; font-size:15px;">About Us:</h2>
          <p style="line-height:1.6;">
            Welcome to Gk Home Interiors, where craftsmanship and creativity merge seamlessly. As the Managing
            Director, I lead a team of experts and dedicated artisans, offering end-to-end interior design
            solutions. We take pride in delivering top-notch quality and customer satisfaction, crafting
            personalized spaces that blend functionality with beauty. From cozy residential havens to dynamic
            commercial spaces, we are dedicated to bringing your dream spaces to life, one exquisite detail at a time.
          </p>

          <h3 style="text-align:center; background:#EAF2FF; padding:8px; border:1px dashed #999; font-size:13px;">
            Why choose GK homeinterior .in for your interior design needs?
          </h3>
          <table style="width:100%; border-collapse:collapse; border:1px dashed #999;">
            ${[0,2,4].map(i => `
              <tr>
                <td style="width:15%; border:1px dashed #999; padding:6px; text-align:center;"><img src="${A}/icons-page1/${icon1[i]}.png" style="width:70px;" /></td>
                <td style="width:35%; border:1px dashed #999; padding:8px;"><b>${icon1Titles[i]}:</b><br/>${icon1Text[i]}</td>
                <td style="width:15%; border:1px dashed #999; padding:6px; text-align:center;"><img src="${A}/icons-page1/${icon1[i+1]}.png" style="width:70px;" /></td>
                <td style="width:35%; border:1px dashed #999; padding:8px;"><b>${icon1Titles[i+1]}:</b><br/>${icon1Text[i+1]}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <!-- PAGE 2: Services + Brand logos row 1 -->
        <div style="padding: 30px 40px; page-break-after: always;">
          <img src="${A}/gk-logo.jpg" style="width:70px; margin-bottom:14px;" />
          <h3 style="text-align:center; background:#EAF2FF; padding:8px; border:1px dashed #999; font-size:13px;">
            We offer a wide range of interior design services
          </h3>
          <table style="width:100%; border-collapse:collapse; border:1px dashed #999; margin-bottom:20px;">
            ${[0,2,4].map(i => `
              <tr>
                <td style="width:15%; border:1px dashed #999; padding:6px; text-align:center;"><img src="${A}/icons-page2/${icon2[i]}.${icon2Ext[i]}" style="width:65px;" /></td>
                <td style="width:35%; border:1px dashed #999; padding:8px;"><b>${icon2Titles[i]}:</b><br/>${icon2Text[i]}</td>
                <td style="width:15%; border:1px dashed #999; padding:6px; text-align:center;"><img src="${A}/icons-page2/${icon2[i+1]}.${icon2Ext[i+1]}" style="width:65px;" /></td>
                <td style="width:35%; border:1px dashed #999; padding:8px;"><b>${icon2Titles[i+1]}:</b><br/>${icon2Text[i+1]}</td>
              </tr>
            `).join('')}
          </table>

          <h3 style="text-align:center; background:#EAF2FF; padding:8px; border:1px dashed #999; font-size:13px;">Top Brands we are associated with</h3>
          <table style="width:100%; border-collapse:collapse; border:1px dashed #999;">
            <tr>
              ${brandLogos.slice(0,4).map(b => `<td style="width:25%; border:1px dashed #999; padding:10px; text-align:center;"><img src="${A}/brand-logos/${b}" style="max-width:100px; max-height:60px;" /></td>`).join('')}
            </tr>
          </table>
        </div>

        <!-- PAGE 3: Brand logos row 2 + Projects grid 1 -->
        <div style="padding: 30px 40px; page-break-after: always;">
          <img src="${A}/gk-logo.jpg" style="width:70px; margin-bottom:14px;" />
          <table style="width:100%; border-collapse:collapse; border:1px dashed #999; margin-bottom:20px;">
            <tr>
              ${brandLogos.slice(4,8).map(b => `<td style="width:25%; border:1px dashed #999; padding:10px; text-align:center;"><img src="${A}/brand-logos/${b}" style="max-width:100px; max-height:60px;" /></td>`).join('')}
            </tr>
          </table>

          <h3 style="text-align:center; color:#2563EB; font-size:15px;">SOME OF OUR PRESTIGIOUS PROJECTS</h3>
          <table style="width:100%; border-collapse:collapse; border:1px dashed #999;">
            ${[0,3,6].map(i => `
              <tr>
                ${[0,1,2].map(j => `<td style="width:33%; border:1px dashed #999; padding:2px;"><img src="${A}/project-photos/${projectPhotos[i+j]}" style="width:100%; display:block;" /></td>`).join('')}
              </tr>
            `).join('')}
          </table>
        </div>

        <!-- PAGE 4: Projects grid 2 + Office address -->
        <div style="padding: 30px 40px; page-break-after: always;">
          <img src="${A}/gk-logo.jpg" style="width:70px; margin-bottom:14px;" />
          <table style="width:100%; border-collapse:collapse; border:1px dashed #999; margin-bottom:20px;">
            ${[9,12,15].map(i => `
              <tr>
                ${[0,1,2].map(j => `<td style="width:33%; border:1px dashed #999; padding:2px;"><img src="${A}/project-photos/${projectPhotos[i+j]}" style="width:100%; display:block;" /></td>`).join('')}
              </tr>
            `).join('')}
          </table>
          <p style="font-weight:bold; font-size:11px;">Office Address: ${OFFICE_ADDRESS}</p>
        </div>

        <!-- PAGE 5: Quotation table (dynamic, reference-format) -->
        <div style="padding: 30px 40px; page-break-after: always;">
          <img src="${A}/gk-logo.jpg" style="width:70px; margin-bottom:14px;" />
          <table style="width:100%; border-collapse:collapse; font-size:11px;">
            <thead>
              <tr style="background:#1C1712; color:#fff;">
                <th style="padding:6px; border:1px solid #999;">S.No</th>
                <th style="padding:6px; border:1px solid #999;">Work</th>
                <th style="padding:6px; border:1px solid #999;">Scope of Work</th>
                <th style="padding:6px; border:1px solid #999;">Length</th>
                <th style="padding:6px; border:1px solid #999;">Height</th>
                <th style="padding:6px; border:1px solid #999;">Total SFT</th>
                <th style="padding:6px; border:1px solid #999;">Sft Cost</th>
                <th style="padding:6px; border:1px solid #999;">Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${roomRowsHtml}
              ${extraItemsHtml}
              ${woodCostRowHtml}
              ${fcRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background:#D8D2E0; font-weight:bold;"><td colspan="7" style="padding:6px; border:1px solid #999;">B — Total Cost (Wood Work + False Ceiling)</td><td style="padding:6px; border:1px solid #999; text-align:right;">${fmt(getGrandTotal())}</td></tr>
              <tr><td colspan="7" style="padding:6px; border:1px solid #999;">Discount</td><td style="padding:6px; border:1px solid #999; text-align:right;">${fmt(Number(form.discount || 0))}</td></tr>
              ${form.complementary ? `<tr><td colspan="7" style="padding:6px; border:1px solid #999;">Complementary</td><td style="padding:6px; border:1px solid #999;">${form.complementary}</td></tr>` : ''}
              <tr style="background:#F7D9B0; font-weight:bold; font-size:13px;"><td colspan="7" style="padding:8px; border:1px solid #999;">C — Final Quote Value</td><td style="padding:8px; border:1px solid #999; text-align:right;">${fmt(getFinalQuote())}</td></tr>
            </tfoot>
          </table>

          <table style="width:60%; margin-top:20px; border-collapse:collapse; font-size:11px;">
            <tr style="background:#1C3A6B; color:#fff;"><td colspan="3" style="padding:6px; text-align:center; font-weight:bold;">Payment Terms</td></tr>
            <tr><td style="border:1px solid #999; padding:5px;">First payment</td><td style="border:1px solid #999; padding:5px; text-align:center;">50%</td><td style="border:1px solid #999; padding:5px; text-align:right;">${fmt(Math.round(getFinalQuote()*0.5))}</td></tr>
            <tr><td style="border:1px solid #999; padding:5px;">Second payment</td><td style="border:1px solid #999; padding:5px; text-align:center;">30%</td><td style="border:1px solid #999; padding:5px; text-align:right;">${fmt(Math.round(getFinalQuote()*0.3))}</td></tr>
            <tr><td style="border:1px solid #999; padding:5px;">Third Payment</td><td style="border:1px solid #999; padding:5px; text-align:center;">15%</td><td style="border:1px solid #999; padding:5px; text-align:right;">${fmt(Math.round(getFinalQuote()*0.15))}</td></tr>
            <tr><td style="border:1px solid #999; padding:5px;">Fourth Payment</td><td style="border:1px solid #999; padding:5px; text-align:center;">5%</td><td style="border:1px solid #999; padding:5px; text-align:right;">${fmt(Math.round(getFinalQuote()*0.05))}</td></tr>
            <tr style="background:#1C3A6B; color:#fff; font-weight:bold;"><td colspan="2" style="padding:6px;">Total payment</td><td style="padding:6px; text-align:right;">${fmt(getFinalQuote())}</td></tr>
            <tr><td style="border:1px solid #999; padding:5px;">Received Amount</td><td style="border:1px solid #999; padding:5px; text-align:right;">${fmt(Number(form.receivedAmount||0))}</td><td style="border:1px solid #999; padding:5px; text-align:right;">Pending: ${fmt(getPending())}</td></tr>
          </table>

          <p style="font-weight:bold; font-size:10px; margin-top:20px;">Office Address: ${OFFICE_ADDRESS}</p>
        </div>

        <!-- PAGE 6: Notes + Signature -->
        <div style="padding: 30px 40px;">
          <img src="${A}/gk-logo.jpg" style="width:70px; margin-bottom:20px;" />
          <p style="font-weight:bold; text-decoration:underline; font-size:13px;">Note:</p>
          <ol style="font-size:11px; line-height:1.8; padding-left:18px;">
            ${NOTES.map(n => `<li>${n}</li>`).join('')}
          </ol>
          <p style="margin-top:30px; font-family: 'Times New Roman', serif; font-size:14px;">Thanks &amp; Regards,</p>
          <p style="margin-top:40px; font-weight:bold;">${form.preparedByName}<br/>
            <span style="font-weight:normal;">Managing Director<br/>${form.preparedByPhone}</span>
          </p>
        </div>

      </div>
      `

      const container = document.createElement('div')
      container.innerHTML = html
      document.body.appendChild(container)

      await html2pdf()
        .set({
          margin: 0,
          filename: `GK_Quotation_${form.quotation_no}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save()

      document.body.removeChild(container)
    } catch (err: unknown) {
      alert('PDF Error: ' + getErrorMessage(err, 'Something went wrong'))
    } finally {
      setPdfLoading(false)
    }
  }

  const ROOM_PRESETS = ['Hall', 'Kitchen', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Dining', 'Pooja Room', 'Bathroom', 'Main Door', 'Shoe Rack']

  // Running S.no shown in the on-screen room headers (rooms first, then extra items continue)
  let onScreenSno = 0

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
              <>
                <select
                  value={form.client_id}
                  onChange={e => {
                    const id = e.target.value
                    setForm(f => ({ ...f, client_id: id }))
                    const c = clients.find((c: Client) => c.id === id)
                    if (c) {
                      setClientName(c.name)
                      setClientAddress(c.city || '')
                      setSelectedClientPhone(c.phone || '')
                    } else {
                      setSelectedClientPhone('')
                    }
                  }}
                  className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]"
                >
                  <option value="">Select Client</option>
                  {clients.map((c: Client) => (
                    <option key={c.id} value={c.id}>{clientOptionLabel(c)}</option>
                  ))}
                </select>
                {selectedClientPhone && (
                  <p className="text-[11px] text-[#9A8F82] mt-1.5 ml-1">
                    📞 {selectedClientPhone}
                  </p>
                )}
              </>
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
          <div>
            <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Prepared By (Name)</label>
            <input value={form.preparedByName} onChange={e => setForm(f => ({ ...f, preparedByName: e.target.value }))}
              className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
          </div>
          <div>
            <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Prepared By (Phone)</label>
            <input value={form.preparedByPhone} onChange={e => setForm(f => ({ ...f, preparedByPhone: e.target.value }))}
              className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
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
          onScreenSno++
          const roomSno = onScreenSno
          return (
            <div key={ri} className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
              {/* Room Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[#F0EBE0] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}
                onClick={() => setOpenRooms(prev => ({ ...prev, [ri]: !isOpen }))}>
                <span className="w-6 h-6 rounded-lg bg-[#1C1712] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{roomSno}</span>
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

      {/* Extra / Standalone Items — Main Door Elevation, Shoe Rack, etc.
          These are not nested inside a room; they continue the same
          S.no sequence as the rooms above, matching the reference format. */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">Extra Items <span className="text-[#9A8F82] font-normal text-xs">(Main Door, Shoe Rack, etc.)</span></h2>
          <button onClick={addExtraItem} className="flex items-center gap-1 text-xs text-[#B8860B] hover:underline font-semibold">
            <Plus size={11} /> Add Item
          </button>
        </div>
        <div className="p-4 space-y-2">
          {extraItems.length === 0 && (
            <p className="text-xs text-[#B8B0A0] italic px-1">No extra items — add Main Door Elevation, Shoe Rack, or a fixed-value adjustment.</p>
          )}
          {extraItems.length > 0 && (
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-[#9A8F82] uppercase tracking-wider px-1">
              <div className="col-span-1 text-center">S.No</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2 text-center">Length</div>
              <div className="col-span-2 text-center">Height</div>
              <div className="col-span-2 text-center">Rate / Fixed</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
          )}
          {extraItems.map((item, i) => {
            onScreenSno++
            const rowSno = onScreenSno
            const total = getExtraItemTotal(item)
            const isFixed = item.fixedValue !== undefined
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-center text-xs font-bold text-[#9A8F82]">{rowSno}</div>
                <input placeholder="e.g. Main Door Elevation"
                  className="col-span-3 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#B8860B]"
                  value={item.description} onChange={e => updateExtraItem(i, 'description', e.target.value)} />
                {isFixed ? (
                  <div className="col-span-4 text-center text-[10px] text-[#B8B0A0]">fixed value —</div>
                ) : (
                  <>
                    <input type="number" min="0" placeholder="L"
                      className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                      value={item.length || ''} onChange={e => updateExtraItem(i, 'length', Number(e.target.value))} />
                    <input type="number" min="0" placeholder="H"
                      className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                      value={item.height || ''} onChange={e => updateExtraItem(i, 'height', Number(e.target.value))} />
                  </>
                )}
                <input type="number" min="0" placeholder={isFixed ? 'Total ₹' : 'Rate'}
                  className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                  value={isFixed ? (item.fixedValue || '') : (item.sft_cost || '')}
                  onChange={e => updateExtraItem(i, isFixed ? 'fixedValue' : 'sft_cost', Number(e.target.value))} />
                <div className="col-span-1 text-right text-xs font-semibold text-[#1C1712]">
                  {total > 0 ? `₹${(total/1000).toFixed(0)}K` : '—'}
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1.5">
                  <button onClick={() => toggleExtraItemFixed(i)} title="Toggle fixed value / L×H×rate"
                    className="text-[9px] font-bold text-[#B8860B] hover:underline">
                    {isFixed ? 'L×H' : '₹'}
                  </button>
                  <button onClick={() => removeExtraItem(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Wood Work Cost summary — row "A" */}
      <div className="flex items-center justify-between bg-[#DCE6F5] rounded-2xl px-5 py-3 border border-[#C7D6EE]">
        <span className="text-sm font-bold text-[#1C1712]">A — Wood Work Cost <span className="font-normal text-[#5A6B8C]">({getWoodSftTotal()} SFT)</span></span>
        <span className="text-base font-black text-[#1C1712]">₹{getWoodTotal().toLocaleString('en-IN')}</span>
      </div>

      {/* False Ceiling — roman numerals + materials note */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">False Ceiling</h2>
          <button onClick={addFC} className="flex items-center gap-1 text-xs text-[#B8860B] hover:underline font-semibold">
            <Plus size={11} /> Add
          </button>
        </div>
        <div className="p-4 space-y-3">
          {falseCeilings.map((fc, i) => (
            <div key={i} className="border border-[#F0EBE0] rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-center text-xs font-bold text-[#DB2777]">{toRoman(i + 1)}</div>
                <input placeholder="False Ceiling description"
                  className="col-span-4 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#B8860B]"
                  value={fc.description} onChange={e => updateFC(i, 'description', e.target.value)} />
                <input type="number" min="0" placeholder="SFT"
                  className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                  value={fc.sft || ''} onChange={e => updateFC(i, 'sft', Number(e.target.value))} />
                <input type="number" min="0" placeholder="Rate/SFT"
                  className="col-span-2 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#B8860B]"
                  value={fc.sft_cost || ''} onChange={e => updateFC(i, 'sft_cost', Number(e.target.value))} />
                <div className="col-span-2 text-right text-xs font-semibold text-[#1C1712]">
                  ₹{(fc.sft * fc.sft_cost).toLocaleString('en-IN')}
                </div>
                <button onClick={() => removeFC(i)} className="col-span-1 flex justify-center text-red-400 hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              </div>
              <input placeholder="Materials note (e.g. Ultra Channels, gypsum Board, Finolex Wire, Wipro Lights & Putti & Paint)"
                className="w-full bg-[#FAFAF8] border border-[#F0EBE0] rounded-lg px-2 py-1.5 text-[11px] text-[#7A6E60] focus:outline-none focus:border-[#B8860B]"
                value={fc.note} onChange={e => updateFC(i, 'note', e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Summary — B (Total Cost), Discount, Complementary, C (Final Quote) */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm p-6">
        <h2 className="font-serif text-base text-[#1C1712] mb-4">Summary</h2>
        <div className="space-y-3 max-w-sm ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-[#9A8F82]">A — Wood Work Cost</span>
            <span className="font-semibold text-[#1C1712]">₹{getWoodTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#9A8F82]">False Ceiling Total</span>
            <span className="font-semibold text-[#1C1712]">₹{getFCTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-[#F0EBE0] pt-2">
            <span className="text-[#9A8F82]">B — Total Cost (Wood Work + False Ceiling)</span>
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
              placeholder="e.g. Shoe Rack & Utility Boxes (2/2) 2 Qty"
              className="w-48 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-[#B8860B]" />
          </div>
          <div className="flex justify-between text-base font-bold border-t border-[#E8E2D8] pt-3">
            <span className="text-[#1C1712]">C — Final Quote Value</span>
            <span className="text-[#B8860B] text-lg">₹{getFinalQuote().toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-[#F0EBE0] pt-3">
            <span className="text-[#9A8F82]">Received Amount (₹)</span>
            <input type="number" min="0" value={form.receivedAmount || ''}
              onChange={e => setForm(f => ({ ...f, receivedAmount: Number(e.target.value) }))}
              className="w-32 bg-[#F7F5F1] border border-[#E8E2D8] rounded-lg px-3 py-1 text-sm text-right focus:outline-none focus:border-[#B8860B]" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#9A8F82]">Pending</span>
            <span className="font-semibold text-red-600">₹{getPending().toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#E8E2D8] text-[#9A8F82] hover:border-[#1C1712] hover:text-[#1C1712] transition-colors">
          Cancel
        </button>
        <button onClick={handleDownloadExcel} disabled={excelLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#059669] text-[#059669] hover:bg-[#059669] hover:text-white transition-all disabled:opacity-60">
          <FileText size={15} />
          {excelLoading ? 'Generating...' : 'Download Excel'}
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