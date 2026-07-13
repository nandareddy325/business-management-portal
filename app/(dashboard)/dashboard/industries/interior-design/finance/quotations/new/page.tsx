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

interface FalseCeiling {
  description: string
  sft: number
  sft_cost: number
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
        const { data: clientList } = await supabase.from('id_clients').select('id, name, phone, city').eq('company_id', profile.company_id).order('name')
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
  const getPending = () => getFinalQuote() - Number(form.receivedAmount || 0)

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

  // ── Excel export ──
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

      rows.push(['S.No', 'Room', 'Description', 'Length (ft)', 'Height (ft)', 'SFT', 'Rate/SFT (₹)', 'Total (₹)'])
      rooms.forEach((room, ri) => {
        room.items.forEach((item, ii) => {
          const sft = item.length * item.height
          const total = sft * item.sft_cost
          rows.push([
            ii === 0 ? ri + 1 : '',
            ii === 0 ? room.name : '',
            item.description,
            item.length,
            item.height,
            sft,
            item.sft_cost,
            total,
          ])
        })
        rows.push(['', `${room.name} Total`, '', '', '', '', '', getRoomTotal(room)])
      })

      rows.push([])
      rows.push(['False Ceiling', '', 'Description', '', '', 'SFT', 'Rate/SFT (₹)', 'Total (₹)'])
      falseCeilings.forEach(fc => {
        rows.push(['', '', fc.description, '', '', fc.sft, fc.sft_cost, fc.sft * fc.sft_cost])
      })
      rows.push(['', '', 'False Ceiling Total', '', '', '', '', getFCTotal()])

      rows.push([])
      rows.push(['', '', '', '', '', '', 'Wood Work Total', getWoodTotal()])
      rows.push(['', '', '', '', '', '', 'False Ceiling Total', getFCTotal()])
      rows.push(['', '', '', '', '', '', 'Grand Total', getGrandTotal()])
      rows.push(['', '', '', '', '', '', 'Discount', Number(form.discount || 0)])
      if (form.complementary) {
        rows.push(['', '', '', '', '', '', 'Complementary', form.complementary])
      }
      rows.push(['', '', '', '', '', '', 'FINAL QUOTE', getFinalQuote()])
      rows.push([])
      rows.push(['', '', '', '', '', '', 'Received', Number(form.receivedAmount || 0)])
      rows.push(['', '', '', '', '', '', 'Pending', getPending()])

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

      const roomRowsHtml = rooms.map((room, ri) => {
        const itemRows = room.items.map((item, ii) => {
          const sft = item.length * item.height
          const total = sft * item.sft_cost
          return `<tr>
            ${ii === 0 ? `<td rowspan="${room.items.length}" style="text-align:center;">${ri + 1}</td><td rowspan="${room.items.length}">${room.name}</td>` : ''}
            <td>${item.description || '—'}</td>
            <td style="text-align:center;">${item.length}</td>
            <td style="text-align:center;">${item.height}</td>
            <td style="text-align:center;">${sft}</td>
            <td style="text-align:center;">${item.sft_cost}</td>
            <td style="text-align:right;">${fmt(total)}</td>
          </tr>`
        }).join('')
        return itemRows
      }).join('')

      const fcRowsHtml = falseCeilings.map(fc => `
        <tr style="background:#FCE9E9;">
          <td colspan="2" style="text-align:center; font-weight:bold;">False Ceiling</td>
          <td>${fc.description}</td>
          <td style="text-align:center;">${fc.sft}</td>
          <td style="text-align:center;">${fc.sft_cost}</td>
          <td colspan="2" style="text-align:right; font-weight:bold;">${fmt(fc.sft * fc.sft_cost)}</td>
        </tr>
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

        <!-- PAGE 5: Quotation table (dynamic) -->
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
              ${fcRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background:#EAE6DD; font-weight:bold;"><td colspan="7" style="padding:6px; border:1px solid #999;">Wood Work Cost</td><td style="padding:6px; border:1px solid #999; text-align:right;">${fmt(getWoodTotal())}</td></tr>
              <tr style="background:#EAE6DD; font-weight:bold;"><td colspan="7" style="padding:6px; border:1px solid #999;">False Ceiling Total</td><td style="padding:6px; border:1px solid #999; text-align:right;">${fmt(getFCTotal())}</td></tr>
              <tr style="background:#D8D2E0; font-weight:bold;"><td colspan="7" style="padding:6px; border:1px solid #999;">Total Cost (Wood Work + False Ceiling)</td><td style="padding:6px; border:1px solid #999; text-align:right;">${fmt(getGrandTotal())}</td></tr>
              <tr><td colspan="7" style="padding:6px; border:1px solid #999;">Discount</td><td style="padding:6px; border:1px solid #999; text-align:right;">${fmt(Number(form.discount || 0))}</td></tr>
              ${form.complementary ? `<tr><td colspan="7" style="padding:6px; border:1px solid #999;">Complementary</td><td style="padding:6px; border:1px solid #999;">${form.complementary}</td></tr>` : ''}
              <tr style="background:#F7D9B0; font-weight:bold; font-size:13px;"><td colspan="7" style="padding:8px; border:1px solid #999;">Final Quote Value</td><td style="padding:8px; border:1px solid #999; text-align:right;">${fmt(getFinalQuote())}</td></tr>
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
