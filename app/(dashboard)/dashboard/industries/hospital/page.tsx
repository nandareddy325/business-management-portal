'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

const patients = [
  { id: '1', name: 'Ravi Kumar', age: 45, phone: '+91 98765 43210', blood: 'B+', doctor: 'Dr. Sharma', dept: 'Cardiology', status: 'admitted', date: '03 Jun 2026', bill: '₹45,000' },
  { id: '2', name: 'Sunitha Reddy', age: 32, phone: '+91 87654 32109', blood: 'O+', doctor: 'Dr. Priya', dept: 'Gynecology', status: 'outpatient', date: '03 Jun 2026', bill: '₹3,500' },
  { id: '3', name: 'Mohammed Ali', age: 58, phone: '+91 76543 21098', blood: 'A+', doctor: 'Dr. Venkat', dept: 'Orthopedics', status: 'discharged', date: '02 Jun 2026', bill: '₹28,000' },
  { id: '4', name: 'Priya Sharma', age: 28, phone: '+91 65432 10987', blood: 'AB+', doctor: 'Dr. Anita', dept: 'Dermatology', status: 'outpatient', date: '03 Jun 2026', bill: '₹2,000' },
  { id: '5', name: 'Venkat Rao', age: 62, phone: '+91 54321 09876', blood: 'B-', doctor: 'Dr. Sharma', dept: 'Cardiology', status: 'critical', date: '03 Jun 2026', bill: '₹1,20,000' },
  { id: '6', name: 'Lakshmi Devi', age: 41, phone: '+91 43210 98765', blood: 'O-', doctor: 'Dr. Ravi', dept: 'Neurology', status: 'admitted', date: '01 Jun 2026', bill: '₹65,000' },
]

const doctors = [
  { id: '1', name: 'Dr. Anil Sharma', dept: 'Cardiology', qual: 'MD, DM Cardiology', patients: 24, available: true, timing: '9AM - 2PM', exp: '15 years' },
  { id: '2', name: 'Dr. Priya Nair', dept: 'Gynecology', qual: 'MS Gynecology', patients: 18, available: true, timing: '10AM - 3PM', exp: '10 years' },
  { id: '3', name: 'Dr. Venkat Rao', dept: 'Orthopedics', qual: 'MS Orthopedics', patients: 15, available: false, timing: '2PM - 7PM', exp: '12 years' },
  { id: '4', name: 'Dr. Anita Patel', dept: 'Dermatology', qual: 'MD Dermatology', patients: 22, available: true, timing: '9AM - 1PM', exp: '8 years' },
  { id: '5', name: 'Dr. Ravi Shankar', dept: 'Neurology', qual: 'DM Neurology', patients: 12, available: true, timing: '11AM - 4PM', exp: '18 years' },
  { id: '6', name: 'Dr. Meena Kumari', dept: 'Pediatrics', qual: 'MD Pediatrics', patients: 30, available: false, timing: '9AM - 2PM', exp: '9 years' },
]

const appointments = [
  { id: '1', patient: 'Ravi Kumar', doctor: 'Dr. Sharma', dept: 'Cardiology', date: '04 Jun 2026', time: '10:00 AM', type: 'follow-up', status: 'confirmed' },
  { id: '2', patient: 'Anita Verma', doctor: 'Dr. Priya', dept: 'Gynecology', date: '04 Jun 2026', time: '11:30 AM', type: 'new', status: 'confirmed' },
  { id: '3', patient: 'Suresh Babu', doctor: 'Dr. Venkat', dept: 'Orthopedics', date: '04 Jun 2026', time: '2:00 PM', type: 'surgery-consult', status: 'pending' },
  { id: '4', patient: 'Kavitha Devi', doctor: 'Dr. Ravi', dept: 'Neurology', date: '04 Jun 2026', time: '3:30 PM', type: 'new', status: 'confirmed' },
  { id: '5', patient: 'Harish Kumar', doctor: 'Dr. Anita', dept: 'Dermatology', date: '05 Jun 2026', time: '9:30 AM', type: 'follow-up', status: 'pending' },
  { id: '6', patient: 'Sita Reddy', doctor: 'Dr. Meena', dept: 'Pediatrics', date: '05 Jun 2026', time: '10:30 AM', type: 'new', status: 'confirmed' },
]

const bills = [
  { id: 'BILL-001', patient: 'Mohammed Ali', dept: 'Orthopedics', amount: 28000, paid: 28000, status: 'paid', date: '02 Jun 2026', type: 'Surgery' },
  { id: 'BILL-002', patient: 'Ravi Kumar', dept: 'Cardiology', amount: 45000, paid: 20000, status: 'partial', date: '03 Jun 2026', type: 'Admission' },
  { id: 'BILL-003', patient: 'Sunitha Reddy', dept: 'Gynecology', amount: 3500, paid: 3500, status: 'paid', date: '03 Jun 2026', type: 'OPD' },
  { id: 'BILL-004', patient: 'Venkat Rao', dept: 'Cardiology', amount: 120000, paid: 0, status: 'pending', date: '03 Jun 2026', type: 'ICU' },
  { id: 'BILL-005', patient: 'Lakshmi Devi', dept: 'Neurology', amount: 65000, paid: 30000, status: 'partial', date: '01 Jun 2026', type: 'Admission' },
]

const departments = [
  { name: 'Cardiology', patients: 24, doctors: 2, beds: 20, available: 5, color: 'bg-red-50 text-red-700', icon: '❤️' },
  { name: 'Orthopedics', patients: 18, doctors: 2, beds: 15, available: 3, color: 'bg-blue-50 text-blue-700', icon: '🦴' },
  { name: 'Gynecology', patients: 15, doctors: 1, beds: 12, available: 4, color: 'bg-pink-50 text-pink-700', icon: '🌸' },
  { name: 'Neurology', patients: 12, doctors: 1, beds: 10, available: 2, color: 'bg-purple-50 text-purple-700', icon: '🧠' },
  { name: 'Dermatology', patients: 22, doctors: 1, beds: 5, available: 5, color: 'bg-amber-50 text-amber-700', icon: '🩺' },
  { name: 'Pediatrics', patients: 30, doctors: 1, beds: 18, available: 6, color: 'bg-emerald-50 text-emerald-700', icon: '👶' },
]

const statusStyle: Record<string, string> = {
  admitted: 'bg-blue-50 text-blue-700',
  outpatient: 'bg-emerald-50 text-emerald-700',
  discharged: 'bg-[#F0EBE0] text-[#7A6E60]',
  critical: 'bg-red-50 text-red-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  'surgery-consult': 'bg-purple-50 text-purple-700',
  'follow-up': 'bg-blue-50 text-blue-700',
  new: 'bg-emerald-50 text-emerald-700',
}

const avatarColors = [
  'bg-red-50 text-red-700',
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-purple-50 text-purple-700',
  'bg-amber-50 text-amber-700',
  'bg-pink-50 text-pink-700',
]

const tabs = ['Overview', 'Patients', 'Doctors', 'Appointments', 'Billing', 'Departments']

export default function HospitalDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview')
  const [userEmail, setUserEmail] = useState('')
    const [userRole, setUserRole] = useState('user')
  const [userName, setUserName] = useState('User')
  const [search, setSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState('All')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?industry=hospital'); return }
      setUserEmail(user.email ?? '')
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])
      if (profile?.role) setUserRole(profile.role)
    }
    getUser()
  }, [router])

  const todayPatients = patients.filter(p => p.date === '03 Jun 2026')
  const admittedPatients = patients.filter(p => p.status === 'admitted')
  const criticalPatients = patients.filter(p => p.status === 'critical')

  const filteredPatients = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.doctor.toLowerCase().includes(search.toLowerCase())
    const matchFilter = patientFilter === 'All' ? true : p.status === patientFilter.toLowerCase()
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
          title="Hospital"
          subtitle="CRM Portal"
           />
        <main className="flex-1 p-5 md:p-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl text-[#1C1712]">Welcome back, {userName} 👋</h1>
              <p className="text-sm text-[#7A6E60] mt-1">Hospital Management CRM Portal</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                <span className="text-xl">🏥</span>
                <div>
                  <p className="text-[10px] text-[#888] uppercase tracking-wide">Industry</p>
                  <p className="text-[13px] font-semibold text-emerald-700">Hospital</p>
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
              { label: 'Today Patients', value: `${todayPatients.length}`, change: 'Visited today', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '📅', tab: 'Patients' },
              { label: 'Admitted', value: `${admittedPatients.length}`, change: 'Currently admitted', color: 'text-amber-600', bg: 'bg-amber-50', icon: '🛏️', tab: 'Patients' },
              { label: 'Critical', value: `${criticalPatients.length}`, change: 'Need attention', color: 'text-red-600', bg: 'bg-red-50', icon: '🚨', tab: 'Patients' },
              { label: 'Doctors', value: `${doctors.length}`, change: `${doctors.filter(d => d.available).length} available`, color: 'text-purple-600', bg: 'bg-purple-50', icon: '👨‍⚕️', tab: 'Doctors' },
              { label: 'Revenue', value: '₹25.7L', change: '+12% this month', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '₹', tab: 'Billing' },
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
              <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); setPatientFilter('All') }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-[#1C1712] text-white' : 'bg-[#FDFAF4] border border-[#E2D9C8] text-[#7A6E60] hover:bg-[#F0EBE0]'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Today Appointments */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Today Appointments</h3>
                  <button onClick={() => setActiveTab('Appointments')} className="text-xs text-[#B8860B] hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-3">
                  {appointments.slice(0, 4).map((apt, i) => (
                    <div key={apt.id} className="flex items-center gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        {apt.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712]">{apt.patient}</p>
                        <p className="text-xs text-[#7A6E60]">{apt.doctor} — {apt.dept}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-[#1C1712]">{apt.time}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusStyle[apt.status]}`}>{apt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Patients */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Critical & Admitted</h3>
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">{criticalPatients.length} Critical</span>
                </div>
                <div className="flex flex-col gap-2">
                  {patients.filter(p => ['critical', 'admitted'].includes(p.status)).map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl ${p.status === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-[#F5F0E8]'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712]">{p.name}</p>
                        <p className="text-xs text-[#7A6E60]">{p.doctor} — {p.dept}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle[p.status]}`}>{p.status}</span>
                        <p className="text-[10px] text-[#7A6E60] mt-0.5">{p.blood}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Doctors */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Available Doctors</h3>
                  <button onClick={() => setActiveTab('Doctors')} className="text-xs text-[#B8860B] hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-2">
                  {doctors.filter(d => d.available).slice(0, 4).map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-3 py-2 border-b border-[#F0EBE0] last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712]">{doc.name}</p>
                        <p className="text-xs text-[#7A6E60]">{doc.dept} — {doc.timing}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Available</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Beds */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Bed Availability</h3>
                  <button onClick={() => setActiveTab('Departments')} className="text-xs text-[#B8860B] hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-3">
                  {departments.slice(0, 4).map((dept) => (
                    <div key={dept.name} className="flex items-center gap-3">
                      <span className="text-base w-6">{dept.icon}</span>
                      <p className="text-sm text-[#1C1712] font-medium w-28 flex-shrink-0">{dept.name}</p>
                      <div className="flex-1 h-2 bg-[#F0EBE0] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(dept.available / dept.beds) * 100}%` }} />
                      </div>
                      <p className="text-xs text-[#7A6E60] w-16 text-right">{dept.available}/{dept.beds} free</p>
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
                  { label: 'Admitted', value: `${admittedPatients.length}`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', filter: 'Admitted' },
                  { label: 'Outpatient', value: `${patients.filter(p => p.status === 'outpatient').length}`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', filter: 'Outpatient' },
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
                    {['All', 'Admitted', 'Outpatient', 'Discharged', 'Critical'].map((f) => (
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
                        {['Patient', 'Age/Blood', 'Doctor', 'Department', 'Date', 'Bill', 'Status', 'Action'].map((h) => (
                          <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p, i) => (
                        <tr key={p.id} className={`hover:bg-[#F5F0E8] transition-colors ${p.status === 'critical' ? 'bg-red-50/30' : ''}`}>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                                {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <p className="text-sm font-medium text-[#1C1712] whitespace-nowrap">{p.name}</p>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="text-xs text-[#1C1712]">{p.age} yrs</p>
                            <p className="text-[10px] font-semibold text-red-600">{p.blood}</p>
                          </td>
                          <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{p.doctor}</td>
                          <td className="py-3 pr-3 text-xs text-[#7A6E60]">{p.dept}</td>
                          <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{p.date}</td>
                          <td className="py-3 pr-3 text-sm font-semibold text-[#1C1712]">{p.bill}</td>
                          <td className="py-3 pr-3">
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle[p.status]}`}>{p.status}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              <button className="px-2 py-1 rounded-lg bg-[#F0EBE0] text-[10px] font-medium hover:bg-[#E8E0D0]">View</button>
                              <button className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-medium hover:bg-blue-100">Bill</button>
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

          {/* DOCTORS TAB */}
          {activeTab === 'Doctors' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doc, i) => (
                  <div key={doc.id} className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${avatarColors[i % avatarColors.length]}`}>
                        {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${doc.available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {doc.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <h3 className="font-serif text-base text-[#1C1712]">{doc.name}</h3>
                    <p className="text-xs text-[#7A6E60] mt-0.5">{doc.qual}</p>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#E2D9C8]">
                      <div>
                        <p className="text-[10px] text-[#7A6E60]">Department</p>
                        <p className="text-xs font-semibold text-[#1C1712]">{doc.dept}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#7A6E60]">Experience</p>
                        <p className="text-xs font-semibold text-[#1C1712]">{doc.exp}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#7A6E60]">Patients</p>
                        <p className="text-xs font-semibold text-[#1C1712]">{doc.patients} today</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#7A6E60]">Timing</p>
                        <p className="text-xs font-semibold text-[#1C1712]">{doc.timing}</p>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-1.5 bg-[#1C1712] text-white rounded-xl text-xs font-medium hover:bg-[#2d2822] transition-colors">Book Appointment</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'Appointments' && (
            <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-base text-[#1C1712]">All Appointments</h3>
                  <p className="text-xs text-[#7A6E60] mt-0.5">Today + Upcoming appointments</p>
                </div>
                <button className="bg-[#1C1712] text-white px-3 py-1.5 rounded-lg text-xs font-medium">+ Book Appointment</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Patient', 'Doctor', 'Department', 'Date', 'Time', 'Type', 'Status', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt, i) => (
                      <tr key={apt.id} className="hover:bg-[#F5F0E8] transition-colors">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                              {apt.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <p className="text-sm font-medium text-[#1C1712] whitespace-nowrap">{apt.patient}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{apt.doctor}</td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60]">{apt.dept}</td>
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

          {/* BILLING TAB */}
          {activeTab === 'Billing' && (
            <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-base text-[#1C1712]">Hospital Billing</h3>
                  <p className="text-xs text-[#7A6E60] mt-0.5">Patient bills and payments</p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">Collected: ₹81,500</span>
                  <button className="bg-[#1C1712] text-white px-3 py-1.5 rounded-lg text-xs font-medium">+ Generate Bill</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Bill ID', 'Patient', 'Department', 'Type', 'Amount', 'Paid', 'Balance', 'Status', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill, i) => (
                      <tr key={bill.id} className="hover:bg-[#F5F0E8] transition-colors">
                        <td className="py-3 pr-3 text-xs font-semibold text-[#B8860B]">{bill.id}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                              {bill.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <p className="text-sm font-medium text-[#1C1712] whitespace-nowrap">{bill.patient}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60]">{bill.dept}</td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60]">{bill.type}</td>
                        <td className="py-3 pr-3 text-sm font-semibold text-[#1C1712]">₹{bill.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 pr-3 text-sm text-emerald-600">₹{bill.paid.toLocaleString('en-IN')}</td>
                        <td className="py-3 pr-3 text-sm text-red-500">{bill.amount - bill.paid > 0 ? `₹${(bill.amount - bill.paid).toLocaleString('en-IN')}` : '—'}</td>
                        <td className="py-3 pr-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle[bill.status]}`}>{bill.status}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="px-2 py-1 rounded-lg bg-[#F0EBE0] text-[10px] font-medium hover:bg-[#E8E0D0]">Print</button>
                            <button className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-medium hover:bg-blue-100">Collect</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DEPARTMENTS TAB */}
          {activeTab === 'Departments' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div key={dept.name} className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${dept.color.split(' ')[0]}`}>{dept.icon}</div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${dept.available > 3 ? 'bg-emerald-50 text-emerald-700' : dept.available > 1 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      {dept.available} beds free
                    </span>
                  </div>
                  <h3 className="font-serif text-lg text-[#1C1712]">{dept.name}</h3>
                  <div className="mt-3 h-2 bg-[#F0EBE0] rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(dept.available / dept.beds) * 100}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E2D9C8]">
                    <div className="text-center">
                      <p className="text-[10px] text-[#7A6E60]">Patients</p>
                      <p className="text-base font-serif text-[#1C1712]">{dept.patients}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#7A6E60]">Doctors</p>
                      <p className="text-base font-serif text-[#1C1712]">{dept.doctors}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#7A6E60]">Total Beds</p>
                      <p className="text-base font-serif text-[#1C1712]">{dept.beds}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}