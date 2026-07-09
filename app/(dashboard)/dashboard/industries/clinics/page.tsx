'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

const patients = [
  { id: '1', name: 'Ravi Kumar', age: 35, phone: '+91 98765 43210', email: 'ravi@gmail.com', blood: 'B+', doctor: 'Dr. Sharma', issue: 'Diabetes', lastVisit: '03 Jun 2026', nextVisit: '10 Jun 2026', status: 'regular' },
  { id: '2', name: 'Sunitha Reddy', age: 28, phone: '+91 87654 32109', email: 'sunitha@gmail.com', blood: 'O+', doctor: 'Dr. Priya', issue: 'Thyroid', lastVisit: '03 Jun 2026', nextVisit: '17 Jun 2026', status: 'new' },
  { id: '3', name: 'Mohammed Ali', age: 52, phone: '+91 76543 21098', email: 'ali@gmail.com', blood: 'A+', doctor: 'Dr. Sharma', issue: 'BP + Sugar', lastVisit: '02 Jun 2026', nextVisit: '09 Jun 2026', status: 'critical' },
  { id: '4', name: 'Priya Sharma', age: 24, phone: '+91 65432 10987', email: 'priya@gmail.com', blood: 'AB+', doctor: 'Dr. Anita', issue: 'Skin Allergy', lastVisit: '01 Jun 2026', nextVisit: '15 Jun 2026', status: 'regular' },
  { id: '5', name: 'Venkat Rao', age: 60, phone: '+91 54321 09876', email: 'venkat@gmail.com', blood: 'B-', doctor: 'Dr. Sharma', issue: 'Heart — Follow up', lastVisit: '03 Jun 2026', nextVisit: '10 Jun 2026', status: 'critical' },
  { id: '6', name: 'Lakshmi Devi', age: 44, phone: '+91 43210 98765', email: 'lakshmi@gmail.com', blood: 'O-', doctor: 'Dr. Priya', issue: 'PCOD', lastVisit: '31 May 2026', nextVisit: '14 Jun 2026', status: 'regular' },
  { id: '7', name: 'Arjun Singh', age: 30, phone: '+91 32109 87654', email: 'arjun@gmail.com', blood: 'A-', doctor: 'Dr. Anita', issue: 'Acne Treatment', lastVisit: '28 May 2026', nextVisit: '11 Jun 2026', status: 'new' },
  { id: '8', name: 'Kavitha Nair', age: 38, phone: '+91 21098 76543', email: 'kavitha@gmail.com', blood: 'O+', doctor: 'Dr. Sharma', issue: 'Migraine', lastVisit: '01 Jun 2026', nextVisit: '15 Jun 2026', status: 'regular' },
]

const appointments = [
  { id: '1', patient: 'Ravi Kumar', doctor: 'Dr. Sharma', date: '04 Jun 2026', time: '9:00 AM', type: 'follow-up', status: 'confirmed', token: 'T-01' },
  { id: '2', patient: 'Sunitha Reddy', doctor: 'Dr. Priya', date: '04 Jun 2026', time: '9:30 AM', type: 'new', status: 'confirmed', token: 'T-02' },
  { id: '3', patient: 'Mohammed Ali', doctor: 'Dr. Sharma', date: '04 Jun 2026', time: '10:00 AM', type: 'follow-up', status: 'confirmed', token: 'T-03' },
  { id: '4', patient: 'Kavitha Nair', doctor: 'Dr. Sharma', date: '04 Jun 2026', time: '10:30 AM', type: 'follow-up', status: 'waiting', token: 'T-04' },
  { id: '5', patient: 'Priya Sharma', doctor: 'Dr. Anita', date: '04 Jun 2026', time: '11:00 AM', type: 'follow-up', status: 'confirmed', token: 'T-05' },
  { id: '6', patient: 'Harish Kumar', doctor: 'Dr. Priya', date: '05 Jun 2026', time: '9:00 AM', type: 'new', status: 'pending', token: 'T-06' },
  { id: '7', patient: 'Sita Reddy', doctor: 'Dr. Anita', date: '05 Jun 2026', time: '9:30 AM', type: 'new', status: 'pending', token: 'T-07' },
  { id: '8', patient: 'Venkat Rao', doctor: 'Dr. Sharma', date: '05 Jun 2026', time: '10:00 AM', type: 'follow-up', status: 'pending', token: 'T-08' },
]

const bills = [
  { id: 'BILL-C001', patient: 'Ravi Kumar', doctor: 'Dr. Sharma', amount: 800, paid: 800, status: 'paid', date: '03 Jun 2026', type: 'Consultation + Tests' },
  { id: 'BILL-C002', patient: 'Sunitha Reddy', doctor: 'Dr. Priya', amount: 600, paid: 600, status: 'paid', date: '03 Jun 2026', type: 'Consultation' },
  { id: 'BILL-C003', patient: 'Mohammed Ali', doctor: 'Dr. Sharma', amount: 1200, paid: 600, status: 'partial', date: '02 Jun 2026', type: 'Consultation + Medicine' },
  { id: 'BILL-C004', patient: 'Venkat Rao', doctor: 'Dr. Sharma', amount: 2500, paid: 0, status: 'pending', date: '03 Jun 2026', type: 'ECG + Consultation' },
  { id: 'BILL-C005', patient: 'Priya Sharma', doctor: 'Dr. Anita', amount: 1500, paid: 1500, status: 'paid', date: '01 Jun 2026', type: 'Skin Treatment' },
  { id: 'BILL-C006', patient: 'Lakshmi Devi', doctor: 'Dr. Priya', amount: 900, paid: 0, status: 'pending', date: '31 May 2026', type: 'Consultation + Scan' },
]

const doctors = [
  { id: '1', name: 'Dr. Anil Sharma', spec: 'General Physician', qual: 'MBBS, MD', patients: 42, timing: '9AM - 1PM', available: true, fee: '₹600' },
  { id: '2', name: 'Dr. Priya Nair', spec: 'Gynecologist', qual: 'MS Gynecology', patients: 28, timing: '10AM - 2PM', available: true, fee: '₹700' },
  { id: '3', name: 'Dr. Anita Patel', spec: 'Dermatologist', qual: 'MD Dermatology', patients: 35, timing: '2PM - 6PM', available: false, fee: '₹800' },
]

const prescriptions = [
  { id: '1', patient: 'Ravi Kumar', doctor: 'Dr. Sharma', date: '03 Jun 2026', medicines: ['Metformin 500mg', 'Glimepiride 1mg', 'Vitamin D3'], followUp: '10 Jun 2026' },
  { id: '2', patient: 'Mohammed Ali', doctor: 'Dr. Sharma', date: '02 Jun 2026', medicines: ['Amlodipine 5mg', 'Telmisartan 40mg', 'Aspirin 75mg'], followUp: '09 Jun 2026' },
  { id: '3', patient: 'Sunitha Reddy', doctor: 'Dr. Priya', date: '03 Jun 2026', medicines: ['Thyronorm 50mcg', 'Calcium + D3'], followUp: '17 Jun 2026' },
  { id: '4', patient: 'Priya Sharma', doctor: 'Dr. Anita', date: '01 Jun 2026', medicines: ['Clindamycin Gel', 'Retino A Cream', 'Cetaphil Lotion'], followUp: '15 Jun 2026' },
]

const statusStyle: Record<string, string> = {
  regular: 'bg-emerald-50 text-emerald-700',
  new: 'bg-blue-50 text-blue-700',
  critical: 'bg-red-50 text-red-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  waiting: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  'follow-up': 'bg-blue-50 text-blue-700',
}

const avatarColors = [
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-purple-50 text-purple-700',
  'bg-amber-50 text-amber-700',
  'bg-red-50 text-red-700',
  'bg-pink-50 text-pink-700',
  'bg-teal-50 text-teal-700',
  'bg-orange-50 text-orange-700',
]

const tabs = ['Overview', 'Patients', 'Appointments', 'Prescriptions', 'Bills', 'Doctors']

export default function ClinicsDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('user')
  const [userName, setUserName] = useState('User')
  const [search, setSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState('All')
  const [aptFilter, setAptFilter] = useState('All')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?industry=clinics'); return }
      setUserEmail(user.email ?? '')
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])
      if (profile?.role) setUserRole(profile.role)
    }
    getUser()
  }, [router])

  const todayApts = appointments.filter(a => a.date === '04 Jun 2026')
  const newPatients = patients.filter(p => p.status === 'new')
  const criticalPatients = patients.filter(p => p.status === 'critical')
  const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'partial')

  const filteredPatients = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.doctor.toLowerCase().includes(search.toLowerCase()) || p.issue.toLowerCase().includes(search.toLowerCase())
    const matchFilter = patientFilter === 'All' ? true : p.status === patientFilter.toLowerCase()
    return matchSearch && matchFilter
  })

  const filteredApts = appointments.filter(a => {
    const matchSearch = a.patient.toLowerCase().includes(search.toLowerCase()) || a.doctor.toLowerCase().includes(search.toLowerCase())
    const matchFilter = aptFilter === 'All' ? true : aptFilter === 'Today' ? a.date === '04 Jun 2026' : a.status === aptFilter.toLowerCase()
    return matchSearch && matchFilter
  })

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-[220px] flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)}
        userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          title="Clinics"
          subtitle="CRM Portal"
           />
        <main className="flex-1 p-5 md:p-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl text-[#1C1712]">Welcome back, {userName} 👋</h1>
              <p className="text-sm text-[#7A6E60] mt-1">Clinic Management CRM Portal</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
                <span className="text-xl">🩺</span>
                <div>
                  <p className="text-[10px] text-[#888] uppercase tracking-wide">Industry</p>
                  <p className="text-[13px] font-semibold text-red-700">Clinics</p>
                </div>
              </div>
              <button className="bg-[#1C1712] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d2822] transition-colors">+ Add Patient</button>
              <button className="border border-[#E2D9C8] text-[#1C1712] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F0EBE0] transition-colors">+ Book Appointment</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-6">
            {[
              { label: 'Total Patients', value: `${patients.length}`, change: 'All records', color: 'text-blue-600', bg: 'bg-blue-50', icon: '👥', tab: 'Patients' },
              { label: 'Today Apts', value: `${todayApts.length}`, change: 'Scheduled today', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '📅', tab: 'Appointments' },
              { label: 'New Patients', value: `${newPatients.length}`, change: 'First visit', color: 'text-purple-600', bg: 'bg-purple-50', icon: '🆕', tab: 'Patients' },
              { label: 'Critical', value: `${criticalPatients.length}`, change: 'Need attention', color: 'text-red-600', bg: 'bg-red-50', icon: '🚨', tab: 'Patients' },
              { label: 'Pending Bills', value: `${pendingBills.length}`, change: 'Unpaid/partial', color: 'text-amber-600', bg: 'bg-amber-50', icon: '💳', tab: 'Bills' },
              { label: 'Revenue', value: '₹6.4L', change: '+15% this month', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '₹', tab: 'Bills' },
            ].map((stat) => (
              <div key={stat.label} onClick={() => setActiveTab(stat.tab)} className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center text-base mb-3`}>{stat.icon}</div>
                <p className="text-xs text-[#7A6E60] font-medium">{stat.label}</p>
                <p className={`font-serif text-[24px] my-1 leading-none ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-[#7A6E60]">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setSearch('') }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-[#1C1712] text-white' : 'bg-[#FDFAF4] border border-[#E2D9C8] text-[#7A6E60] hover:bg-[#F0EBE0]'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Today Token Queue */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Today Token Queue</h3>
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{todayApts.length} patients</span>
                </div>
                <div className="flex flex-col gap-2">
                  {todayApts.map((apt) => (
                    <div key={apt.id} className={`flex items-center gap-3 p-3 rounded-xl ${apt.status === 'waiting' ? 'bg-blue-50 border border-blue-200' : 'bg-[#F5F0E8]'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${apt.status === 'waiting' ? 'bg-blue-600 text-white' : 'bg-[#E2D9C8] text-[#7A6E60]'}`}>{apt.token}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712]">{apt.patient}</p>
                        <p className="text-xs text-[#7A6E60]">{apt.doctor} — {apt.time}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusStyle[apt.status]}`}>{apt.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Patients */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Critical Patients</h3>
                  <button onClick={() => setActiveTab('Patients')} className="text-xs text-[#B8860B] hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-3">
                  {criticalPatients.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712]">{p.name}</p>
                        <p className="text-xs text-[#7A6E60]">{p.issue}</p>
                        <p className="text-[11px] text-red-600 font-medium">Next: {p.nextVisit}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-bold text-red-600">{p.blood}</p>
                        <p className="text-[10px] text-[#7A6E60] mt-0.5">{p.doctor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Bills */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Pending Collections</h3>
                  <button onClick={() => setActiveTab('Bills')} className="text-xs text-[#B8860B] hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-2">
                  {pendingBills.map((bill, i) => (
                    <div key={bill.id} className="flex items-center gap-3 py-2 border-b border-[#F0EBE0] last:border-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>💳</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712] truncate">{bill.patient}</p>
                        <p className="text-xs text-[#7A6E60]">{bill.type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-red-500">₹{(bill.amount - bill.paid).toLocaleString('en-IN')}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusStyle[bill.status]}`}>{bill.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctors Status */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Doctors Today</h3>
                  <button onClick={() => setActiveTab('Doctors')} className="text-xs text-[#B8860B] hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-3">
                  {doctors.map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712]">{doc.name}</p>
                        <p className="text-xs text-[#7A6E60]">{doc.spec} — {doc.timing}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${doc.available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {doc.available ? 'Available' : 'Busy'}
                        </span>
                        <p className="text-[10px] text-[#7A6E60] mt-0.5">{doc.patients} patients</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PATIENTS TAB */}
          {activeTab === 'Patients' && (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Total', value: `${patients.length}`, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', filter: 'All' },
                  { label: 'Regular', value: `${patients.filter(p => p.status === 'regular').length}`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', filter: 'Regular' },
                  { label: 'New', value: `${newPatients.length}`, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', filter: 'New' },
                  { label: 'Critical', value: `${criticalPatients.length}`, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', filter: 'Critical' },
                ].map((s) => (
                  <div key={s.label} onClick={() => setPatientFilter(s.filter)} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center cursor-pointer hover:opacity-80 transition-all ${patientFilter === s.filter ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
                    <p className="text-xs text-[#7A6E60] font-medium uppercase tracking-wide">{s.label}</p>
                    <p className={`font-serif text-[32px] my-1 leading-none ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {['All', 'Regular', 'New', 'Critical'].map((f) => (
                      <button key={f} onClick={() => setPatientFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${patientFilter === f ? 'bg-[#1C1712] text-white' : 'bg-[#F0EBE0] text-[#7A6E60] hover:bg-[#E8E0D0]'}`}>{f}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#B8860B] w-48" />
                    <button className="bg-[#1C1712] text-white px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap">+ Add Patient</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Patient', 'Age/Blood', 'Issue', 'Doctor', 'Last Visit', 'Next Visit', 'Status', 'Action'].map((h) => (
                          <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p, i) => (
                        <tr key={p.id} className={`hover:bg-[#F5F0E8] transition-colors ${p.status === 'critical' ? 'bg-red-50/20' : ''}`}>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                                {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#1C1712] whitespace-nowrap">{p.name}</p>
                                <p className="text-[10px] text-[#7A6E60]">{p.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="text-xs text-[#1C1712]">{p.age} yrs</p>
                            <p className="text-[10px] font-bold text-red-600">{p.blood}</p>
                          </td>
                          <td className="py-3 pr-3 text-xs text-[#7A6E60] max-w-[120px] truncate">{p.issue}</td>
                          <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{p.doctor}</td>
                          <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{p.lastVisit}</td>
                          <td className="py-3 pr-3 text-xs font-medium text-amber-600 whitespace-nowrap">{p.nextVisit}</td>
                          <td className="py-3 pr-3">
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle[p.status]}`}>{p.status}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              <button className="px-2 py-1 rounded-lg bg-[#F0EBE0] text-[10px] font-medium hover:bg-[#E8E0D0]">View</button>
                              <button className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-medium hover:bg-blue-100">Rx</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'Appointments' && (
            <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex gap-1.5 flex-wrap">
                  {['All', 'Today', 'Confirmed', 'Pending', 'Waiting'].map((f) => (
                    <button key={f} onClick={() => setAptFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${aptFilter === f ? 'bg-[#1C1712] text-white' : 'bg-[#F0EBE0] text-[#7A6E60] hover:bg-[#E8E0D0]'}`}>{f}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#B8860B] w-40" />
                  <button className="bg-[#1C1712] text-white px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap">+ Book</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Token', 'Patient', 'Doctor', 'Date', 'Time', 'Type', 'Status', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApts.map((apt, i) => (
                      <tr key={apt.id} className={`hover:bg-[#F5F0E8] transition-colors ${apt.status === 'waiting' ? 'bg-blue-50/20' : ''}`}>
                        <td className="py-3 pr-3">
                          <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg ${apt.status === 'waiting' ? 'bg-blue-600 text-white' : 'bg-[#F0EBE0] text-[#7A6E60]'}`}>{apt.token}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                              {apt.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <p className="text-sm font-medium text-[#1C1712] whitespace-nowrap">{apt.patient}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{apt.doctor}</td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{apt.date}</td>
                        <td className="py-3 pr-3 text-xs font-semibold text-[#1C1712]">{apt.time}</td>
                        <td className="py-3 pr-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle[apt.type] || 'bg-[#F0EBE0] text-[#7A6E60]'}`}>{apt.type}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyle[apt.status]}`}>{apt.status}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-medium hover:bg-emerald-100">Confirm</button>
                            <button className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-medium hover:bg-red-100">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRESCRIPTIONS TAB */}
          {activeTab === 'Prescriptions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prescriptions.map((rx, i) => (
                <div key={rx.id} className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${avatarColors[i % avatarColors.length]}`}>
                        {rx.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1C1712]">{rx.patient}</p>
                        <p className="text-xs text-[#7A6E60]">{rx.doctor}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#7A6E60]">{rx.date}</p>
                      <p className="text-[11px] text-amber-600 font-medium mt-0.5">Follow up: {rx.followUp}</p>
                    </div>
                  </div>
                  <div className="bg-[#F5F0E8] rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-[#7A6E60] uppercase tracking-wide mb-2">Medicines Prescribed</p>
                    <div className="flex flex-col gap-1.5">
                      {rx.medicines.map((med, mi) => (
                        <div key={mi} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-[#E2D9C8] flex items-center justify-center text-[9px] font-bold text-[#7A6E60] flex-shrink-0">{mi + 1}</span>
                          <p className="text-xs text-[#1C1712]">{med}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-1.5 border border-[#E2D9C8] rounded-lg text-xs font-medium text-[#1C1712] hover:bg-[#F0EBE0]">Print Rx</button>
                    <button className="flex-1 py-1.5 bg-[#1C1712] rounded-lg text-xs font-medium text-white hover:bg-[#2d2822]">Send via WhatsApp</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BILLS TAB */}
          {activeTab === 'Bills' && (
            <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-base text-[#1C1712]">Clinic Bills</h3>
                  <p className="text-xs text-[#7A6E60] mt-0.5">Collected: ₹4,400 · Pending: ₹4,700</p>
                </div>
                <button className="bg-[#1C1712] text-white px-3 py-1.5 rounded-lg text-xs font-medium">+ Generate Bill</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Bill ID', 'Patient', 'Doctor', 'Type', 'Amount', 'Paid', 'Balance', 'Date', 'Status', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill, i) => (
                      <tr key={bill.id} className={`hover:bg-[#F5F0E8] transition-colors ${bill.status === 'pending' ? 'bg-amber-50/20' : ''}`}>
                        <td className="py-3 pr-3 text-xs font-semibold text-[#B8860B]">{bill.id}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                              {bill.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <p className="text-xs font-medium text-[#1C1712] whitespace-nowrap">{bill.patient}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{bill.doctor}</td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60]">{bill.type}</td>
                        <td className="py-3 pr-3 text-sm font-semibold text-[#1C1712]">₹{bill.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 pr-3 text-sm text-emerald-600">₹{bill.paid.toLocaleString('en-IN')}</td>
                        <td className="py-3 pr-3 text-sm text-red-500">{bill.amount - bill.paid > 0 ? `₹${(bill.amount - bill.paid).toLocaleString('en-IN')}` : '—'}</td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{bill.date}</td>
                        <td className="py-3 pr-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle[bill.status]}`}>{bill.status}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="px-2 py-1 rounded-lg bg-[#F0EBE0] text-[10px] font-medium hover:bg-[#E8E0D0]">Print</button>
                            <button className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-medium hover:bg-emerald-100">Collect</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DOCTORS TAB */}
          {activeTab === 'Doctors' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {doctors.map((doc, i) => (
                <div key={doc.id} className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ${avatarColors[i % avatarColors.length]}`}>
                      {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${doc.available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {doc.available ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg text-[#1C1712]">{doc.name}</h3>
                  <p className="text-xs text-[#7A6E60] mt-0.5 mb-4">{doc.spec} — {doc.qual}</p>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E2D9C8] mb-4">
                    <div className="text-center">
                      <p className="text-[10px] text-[#7A6E60]">Patients</p>
                      <p className="text-base font-serif text-[#1C1712]">{doc.patients}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#7A6E60]">Timing</p>
                      <p className="text-[11px] font-semibold text-[#1C1712]">{doc.timing}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#7A6E60]">Fee</p>
                      <p className="text-base font-serif text-emerald-600">{doc.fee}</p>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-[#1C1712] text-white rounded-xl text-xs font-medium hover:bg-[#2d2822] transition-colors">Book Appointment</button>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}