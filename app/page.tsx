'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import GKCRMPricing from "@/app/pricing/page";

const industries = [
  { id: 'interior-design', name: 'Interior Design', icon: '🛋️', color: 'from-purple-500 to-violet-700', desc: 'Lead pipeline, projects, designs & materials tracking', comingSoon: false },
  { id: 'real-estate',     name: 'Real Estate',     icon: '🏠', color: 'from-blue-500 to-cyan-700',    desc: 'Property leads, site visits & deal management', comingSoon: true },
  { id: 'hospital',        name: 'Hospital',         icon: '🏥', color: 'from-red-500 to-rose-700',     desc: 'Patients, doctors, appointments & billing', comingSoon: true },
  { id: 'b2b-business',    name: 'B2B Business',     icon: '🤝', color: 'from-amber-500 to-orange-700', desc: 'Clients, deals, invoices & pipeline management', comingSoon: true },
  { id: 'clinics',         name: 'Clinics',          icon: '🩺', color: 'from-emerald-500 to-teal-700', desc: 'Patients, prescriptions, doctors & billing', comingSoon: true },
]

const features = [
  { icon: '🎯', title: 'Smart Lead Pipeline', desc: 'New → Called → Follow Up → Site Visit → Quotation → Won. Every stage tracked.' },
  { icon: '📞', title: 'One-Click Calling', desc: 'Call any lead directly. Update stage right from the call popup.' },
  { icon: '⚡', title: 'Real-time Updates', desc: 'Live notifications when leads are added. Pipeline syncs instantly across devices.' },
  { icon: '👑', title: 'Role-Based Access', desc: 'Admin sees everything. Staff sees only their own leads and assigned tasks.' },
  { icon: '📅', title: 'Attendance & HRMS', desc: 'Track staff attendance, leaves, salaries and HR data in one portal.' },
  { icon: '💳', title: 'Billing & Invoices', desc: 'Generate, send and collect payments. Track paid, partial and overdue.' },
  { icon: '🏗️', title: 'Project Management', desc: 'Budgets, timelines, materials and client approvals — all in one view.' },
  { icon: '📊', title: 'Analytics & Reports', desc: 'Win rates, revenue, pipeline health. Make decisions with real data.' },
]

const testimonials = [
  { name: 'Rajesh Kumar',  role: 'Interior Designer, Hyderabad',  init: 'RK', bg: '#EEEDFE', fg: '#3C3489', text: 'GK CRM transformed how we handle leads. Our conversion rate jumped 40% in 3 months. The pipeline view is incredible — every stage is crystal clear.' },
  { name: 'Priya Sharma',  role: 'Real Estate Agency Owner',       init: 'PS', bg: '#E6F1FB', fg: '#0C447C', text: 'We manage 200+ leads a month. Before GK CRM it was complete chaos. Now everything is organized — site visits, follow-ups, deals. Night and day difference.' },
  { name: 'Dr. Venkat Rao',role: 'Clinic Director, Warangal',      init: 'VR', bg: '#E1F5EE', fg: '#085041', text: 'Patient management, billing and doctor schedules in one place. My staff adapted within a day. Exactly what we needed for a busy multi-doctor clinic.' },
  { name: 'Mohammed Ali',  role: 'B2B Business Owner',             init: 'MA', bg: '#FAEEDA', fg: '#633806', text: 'The role-based access is perfect. My sales team sees their leads, I see everything. Clean, fast and reliable. Best investment for our agency this year.' },
  { name: 'Sunitha Reddy', role: 'Hospital Administrator',         init: 'SR', bg: '#FCEBEB', fg: '#791F1F', text: 'Appointment tracking and billing used to take hours. Now it takes minutes. GK CRM paid for itself in week one — I recommend it to every hospital admin I know.' },
]

const stats = [
  { value: 3800,  suffix: '+',   label: 'Active Users' },
  { value: 120,   prefix: '₹',  suffix: 'Cr+', label: 'Revenue Tracked' },
  { value: 99.9,  suffix: '%',   label: 'Uptime' },
  { value: 48,    suffix: 'hrs', label: 'Avg Onboarding' },
]

const faqs = [
  { q: 'Can I switch industries after signup?',  a: 'Yes! Admin can manage multiple industries from the same portal with no extra setup.' },
  { q: 'Is my data secure?',                     a: 'Absolutely. We use Supabase with Row Level Security — your company data is completely isolated.' },
  { q: 'Can staff members see all leads?',        a: 'No. Staff (User role) only see leads in their pipeline. Admin sees all leads across the team.' },
  { q: 'Is there a free trial?',                  a: 'Yes — Professional plan has 14 days free, no credit card required. Cancel anytime.' },
  { q: 'How do I add team members?',              a: 'Admin can add unlimited staff from the signup page with User role for controlled access.' },
  { q: 'Does it work on mobile?',                 a: 'Yes — GK CRM is fully responsive. Works on desktop, tablet and mobile browsers.' },
]

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(target)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

function StatCounter({ value, prefix = '', suffix = '', label, start }: {
  value: number; prefix?: string; suffix?: string; label: string; start: boolean
}) {
  const count = useCountUp(value, 2200, start)
  const display = value % 1 !== 0 ? (start ? value.toFixed(1) : '0.0') : count.toLocaleString()
  return (
    <div className="text-center">
      <p className="font-serif text-3xl md:text-5xl text-white mb-1 md:mb-2 tabular-nums">
        {prefix}{display}{suffix}
      </p>
      <p className="text-xs md:text-sm text-white/50 font-medium">{label}</p>
    </div>
  )
}

function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const DURATION = 4500

  const startProgress = () => {
    setProgress(0)
    if (progRef.current) clearInterval(progRef.current)
    progRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + 100 / (DURATION / 50)
        return next >= 100 ? 100 : next
      })
    }, 50)
  }

  const goTo = (idx: number) => {
    const next = (idx + testimonials.length) % testimonials.length
    setCurrent(next)
    if (timerRef.current) clearInterval(timerRef.current)
    startProgress()
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % testimonials.length)
      startProgress()
    }, DURATION)
  }

  useEffect(() => {
    goTo(0)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (progRef.current) clearInterval(progRef.current)
    }
  }, [])

  const t = testimonials[current]

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs font-bold text-[#B8860B] uppercase tracking-[4px] mb-4">Testimonials</p>
          <h2 className="font-serif text-3xl md:text-5xl text-[#1C1712]">
            What our customers <em className="italic font-normal text-[#B8860B]">say</em>
          </h2>
        </div>
        <div className="bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl p-6 md:p-10 relative overflow-hidden">
          <span className="absolute top-4 left-8 font-serif text-8xl text-[#B8860B] opacity-10 leading-none select-none italic">"</span>
          <div className="flex gap-1 mb-5">
            {[...Array(5)].map((_, i) => <span key={i} className="text-[#B8860B] text-sm">★</span>)}
          </div>
          <p className="text-[#4A4035] text-sm md:text-base font-light leading-relaxed mb-8 min-h-[60px] md:min-h-[80px]">
            "{t.text}"
          </p>
          <div className="flex items-center gap-4 border-t border-[#E2D9C8] pt-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: t.bg, color: t.fg }}>{t.init}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1C1712]">{t.name}</p>
              <p className="text-xs text-[#9A8F82]">{t.role}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-[8px]">✓</span>
              Verified
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-5 mt-8">
          <button onClick={() => goTo(current - 1)}
            className="w-10 h-10 rounded-full bg-white border border-[#E2D9C8] text-[#7A6E60] flex items-center justify-center hover:bg-[#1C1712] hover:text-white transition-all">←</button>
          <div className="flex items-center gap-1.5">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-[#B8860B]' : 'w-1.5 bg-[#D3CBBB]'}`} />
            ))}
          </div>
          <button onClick={() => goTo(current + 1)}
            className="w-10 h-10 rounded-full bg-white border border-[#E2D9C8] text-[#7A6E60] flex items-center justify-center hover:bg-[#1C1712] hover:text-white transition-all">→</button>
        </div>
        <div className="flex justify-center gap-2.5 mt-6">
          {testimonials.map((t, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-semibold transition-all duration-300 border-[1.5px] ${
                i === current ? 'scale-110 border-[#B8860B] opacity-100' : 'border-transparent opacity-30'
              }`}
              style={{ background: t.bg, color: t.fg }}>{t.init}</button>
          ))}
        </div>
        <div className="mt-7 h-0.5 bg-[#E2D9C8] rounded-full overflow-hidden">
          <div className="h-full bg-[#B8860B] rounded-full transition-none" style={{ width: `${Math.round(progress)}%` }} />
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState('')
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [industryIdx, setIndustryIdx] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [supportForm, setSupportForm] = useState({ name: '', email: '', message: '' })
  const [supportSent, setSupportSent] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setActiveNav(id)
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        @keyframes strokeCycle {
          0%   { stroke: #ef4444; } 16% { stroke: #84cc16; } 32% { stroke: #06b6d4; }
          48%  { stroke: #8b5cf6; } 64% { stroke: #f43f5e; } 80% { stroke: #22c55e; }
          100% { stroke: #ef4444; }
        }
        @keyframes colorCycle {
          0% { background-color: #ef4444; } 20% { background-color: #22c55e; }
          40% { background-color: #3b82f6; } 60% { background-color: #ec4899; }
          80% { background-color: #f59e0b; } 100% { background-color: #ef4444; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F5F0E8] overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── NAVBAR ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2D9C8] shadow-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-md">G</div>
              <span className="font-serif text-xl text-[#1C1712]">GK · CRM</span>
              <span className="hidden md:block text-[9px] font-bold text-[#B8860B] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">Premium</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Features', id: 'features' },
                { label: 'Industries', id: 'industries' },
                { label: 'Pricing', id: 'pricing' },
                { label: 'Support', id: 'support' },
              ].map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={`text-sm font-medium transition-all relative pb-0.5 ${activeNav === item.id ? 'text-[#B8860B]' : 'text-[#7A6E60] hover:text-[#1C1712]'}`}>
                  {item.label}
                  {activeNav === item.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full" />}
                </button>
              ))}
            </div>

            {/* Right buttons */}
            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={() => router.push('/login')}
                className="hidden md:block text-sm font-medium text-[#7A6E60] hover:text-[#1C1712] transition-colors">
                Sign In
              </button>
              <button onClick={() => router.push('/signup')}
                className="bg-[#1C1712] text-white text-xs md:text-sm font-semibold px-3 md:px-5 py-2 md:py-2.5 rounded-xl hover:bg-[#2d2822] transition-all shadow-md">
                Sign Up Free →
              </button>
              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-[#E2D9C8] text-[#7A6E60]">
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-[#E2D9C8] px-4 py-4 space-y-1">
              {[
                { label: 'Features', id: 'features' },
                { label: 'Industries', id: 'industries' },
                { label: 'Pricing', id: 'pricing' },
                { label: 'Support', id: 'support' },
              ].map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-[#7A6E60] hover:bg-[#F5F0E8] hover:text-[#1C1712] transition-colors">
                  {item.label}
                </button>
              ))}
              <button onClick={() => { router.push('/login'); setMobileMenuOpen(false) }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-[#7A6E60] hover:bg-[#F5F0E8] transition-colors">
                Sign In
              </button>
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        <section className="relative max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-14 items-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-4 py-2 rounded-full mb-5 md:mb-7">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ animation: 'colorCycle 60s linear infinite' }} />
              #1 CRM for Indian Businesses
            </div>

            {/* ✅ Mobile font size fix */}
            <h1 className="font-serif text-[38px] sm:text-5xl md:text-[64px] text-[#1C1712] leading-[1.05] mb-4 md:mb-6">
              One CRM Portal<br />
              <span className="relative inline-block">
                <span className="text-[#B8860B]">for All Industries</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 300 6" fill="none">
                  <path d="M0 3 Q75 0 150 3 Q225 6 450 3" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"
                    style={{ animation: 'strokeCycle 60s linear infinite' }} />
                </svg>
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#7A6E60] leading-relaxed mb-7 md:mb-10 max-w-lg">
              Manage leads, clients, staff, projects, billing and operations — from a single premium platform built for every Indian business.
            </p>

            {/* ✅ Mobile buttons full width */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => router.push('/signup')}
                className="w-full sm:w-auto bg-[#1C1712] text-white px-8 py-4 rounded-xl text-sm font-bold hover:bg-[#2d2822] transition-all shadow-xl shadow-black/15 text-center">
                Start Free Trial →
              </button>
              <button onClick={() => scrollTo('industries')}
                className="w-full sm:w-auto border-2 border-[#E2D9C8] text-[#1C1712] px-8 py-4 rounded-xl text-sm font-bold hover:bg-[#F0EBE0] hover:border-[#B8860B] transition-all text-center">
                View Industries
              </button>
            </div>

            {/* ✅ Stats row mobile fix */}
            <div className="flex items-center gap-6 mt-6 md:mt-8 flex-wrap">
              {[
                { val: '14 days', lbl: 'Free trial' },
                { val: 'No card',  lbl: 'Required' },
                { val: '5 min',    lbl: 'Setup time' },
              ].map(s => (
                <div key={s.lbl} className="flex items-center gap-2">
                  <span className="text-emerald-500 text-lg">✓</span>
                  <div>
                    <p className="text-xs font-bold text-[#1C1712]">{s.val}</p>
                    <p className="text-[10px] text-[#9A8F82]">{s.lbl}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero mockup — hidden on mobile */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-purple-200/20 rounded-3xl blur-xl" />
            <div className="relative bg-white rounded-2xl border border-[#E2D9C8] shadow-2xl shadow-black/15 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-[#FDFAF8] border-b border-[#F0EBE0]">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-[#9A8F82] font-medium">GK CRM — Interior Design Dashboard</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[9px] text-emerald-600 font-semibold">LIVE</span>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Total Leads', value: '248',   color: 'text-blue-600',    bg: 'bg-blue-50' },
                    { label: 'Today',       value: '12',    color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Revenue',     value: '₹4.2L', color: 'text-amber-600',   bg: 'bg-amber-50' },
                    { label: 'Won',         value: '38',    color: 'text-purple-600',  bg: 'bg-purple-50' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                      <p className={`font-serif text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] text-[#9A8F82] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#F7F5F1] rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-[#9A8F82] uppercase tracking-wide">Pipeline Overview</p>
                    <span className="text-[9px] text-emerald-600 font-semibold">↑ 24% this month</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-14">
                    {[35, 60, 42, 78, 55, 88, 67, 92].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md" style={{
                        height: `${h}%`,
                        background: 'linear-gradient(to top, #1C1712, #B8860B)',
                        opacity: 0.6 + i * 0.05,
                      }} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { name: 'Rajesh Kumar', action: 'moved to Site Visit 🏠', time: '2m ago',  dot: 'bg-orange-400' },
                    { name: 'Priya Sharma', action: 'new lead added 🎯',      time: '5m ago',  dot: 'bg-blue-400' },
                    { name: 'Suresh Nair',  action: 'deal won ✅ ₹8.5L',      time: '12m ago', dot: 'bg-emerald-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-[#F0EBE0] last:border-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                      <p className="text-[10px] text-[#1C1712] font-semibold">{item.name}</p>
                      <p className="text-[10px] text-[#9A8F82] flex-1">{item.action}</p>
                      <p className="text-[9px] text-[#B8B0A0]">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#1C1712] text-white rounded-2xl px-4 py-3 shadow-xl">
              <p className="text-[10px] text-white/60 uppercase tracking-widest">Win Rate</p>
              <p className="font-serif text-2xl text-emerald-400">+38%</p>
            </div>
            <div className="absolute -top-4 -right-4 bg-white border border-[#E2D9C8] rounded-2xl px-4 py-3 shadow-xl">
              <p className="text-[10px] text-[#9A8F82] uppercase tracking-widest">Live Leads</p>
              <p className="font-serif text-2xl text-[#B8860B]">248</p>
            </div>
          </div>

          {/* Mobile mockup — simplified card */}
          <div className="lg:hidden bg-white rounded-2xl border border-[#E2D9C8] shadow-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#FDFAF8] border-b border-[#F0EBE0]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[10px] text-[#9A8F82]">GK CRM Dashboard</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] text-emerald-600 font-semibold">LIVE</span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Leads', value: '248', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Today', value: '12',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Revenue', value: '₹4.2L', color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Won', value: '38', color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
                    <p className={`font-serif text-base font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[8px] text-[#9A8F82]">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-1 h-10 bg-[#F7F5F1] rounded-xl px-3 py-2">
                {[35, 60, 42, 78, 55, 88, 67, 92].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{
                    height: `${h}%`,
                    background: 'linear-gradient(to top, #1C1712, #B8860B)',
                    opacity: 0.6 + i * 0.05,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS COUNTER ── */}
        <section ref={statsRef} className="bg-[#1C1712] mx-4 md:mx-8 lg:mx-16 rounded-2xl relative overflow-hidden py-8 md:py-12">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #B8860B 0%, transparent 50%), radial-gradient(circle at 75% 50%, #6B3FA0 0%, transparent 50%)' }} />
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map(s => (
              <StatCounter key={s.label} value={s.value} prefix={s.prefix} suffix={s.suffix} label={s.label} start={statsVisible} />
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-xs font-bold text-[#B8860B] uppercase tracking-[4px] mb-4">Features</p>
            <h2 className="font-serif text-3xl md:text-5xl text-[#1C1712] mb-4 md:mb-5">Everything your business needs</h2>
            <p className="text-[#7A6E60] max-w-xl mx-auto text-base md:text-lg">From first lead to final invoice — your entire business workflow in one premium CRM.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i}
                className="group bg-white border border-[#E2D9C8] rounded-2xl p-5 md:p-6 hover:-translate-y-2 hover:shadow-xl hover:border-[#B8860B]/30 transition-all duration-300">
                <div className="w-12 h-12 bg-[#F5F0E8] group-hover:bg-amber-50 rounded-2xl flex items-center justify-center text-2xl mb-4 md:mb-5 transition-colors">{f.icon}</div>
                <h3 className="font-bold text-[#1C1712] mb-2 text-sm">{f.title}</h3>
                <p className="text-sm text-[#7A6E60] leading-relaxed">{f.desc}</p>
                <div className="mt-4 h-0.5 w-0 bg-[#B8860B] group-hover:w-full transition-all duration-500 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* ── INDUSTRIES ── */}
        <section id="industries" className="bg-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="text-center mb-10 md:mb-16">
              <p className="text-xs font-bold text-[#B8860B] uppercase tracking-[4px] mb-4">Industries</p>
              <h2 className="font-serif text-3xl md:text-5xl text-[#1C1712] mb-4 md:mb-5">Built for every sector</h2>
              <p className="text-[#7A6E60] text-base md:text-lg">One platform, five industries. Choose yours and get started in minutes.</p>
            </div>
            {/* ✅ Mobile: 2 cols, Desktop: 5 cols */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {industries.map((ind, i) => (
                <button key={ind.id}
                  disabled={ind.comingSoon}
                  onClick={() => {
                    if (ind.comingSoon) return
                    setIndustryIdx(i)
                    router.push(`/signup?industry=${ind.id}`)
                  }}
                  onMouseEnter={() => { if (!ind.comingSoon) setIndustryIdx(i) }}
                  className={`group relative overflow-hidden rounded-2xl p-4 md:p-5 text-left transition-all duration-300 ${
                    ind.comingSoon
                      ? 'opacity-60 cursor-not-allowed'
                      : `hover:-translate-y-1 hover:shadow-xl ${industryIdx === i ? 'shadow-xl -translate-y-1' : ''}`
                  }`}>
                  {ind.comingSoon ? (
                    <div className="absolute inset-0 bg-[#F7F5F1] border border-[#E2D9C8] rounded-2xl" />
                  ) : (
                    <>
                      <div className={`absolute inset-0 bg-gradient-to-br ${ind.color} opacity-${industryIdx === i ? '100' : '0'} group-hover:opacity-100 transition-opacity duration-300`} />
                      <div className={`absolute inset-0 bg-[#F7F5F1] opacity-${industryIdx === i ? '0' : '100'} group-hover:opacity-0 border border-[#E2D9C8] rounded-2xl transition-opacity duration-300`} />
                    </>
                  )}
                  <div className="relative">
                    <p className="text-3xl md:text-4xl mb-3">{ind.icon}</p>
                    <h3 className={`font-bold text-xs md:text-sm mb-1.5 transition-colors ${
                      ind.comingSoon
                        ? 'text-[#9A8F82]'
                        : industryIdx === i ? 'text-white' : 'text-[#1C1712] group-hover:text-white'
                    }`}>{ind.name}</h3>
                    <p className={`text-[10px] md:text-xs leading-relaxed transition-colors hidden sm:block ${
                      ind.comingSoon
                        ? 'text-[#B8B0A0]'
                        : industryIdx === i ? 'text-white/80' : 'text-[#9A8F82] group-hover:text-white/80'
                    }`}>{ind.desc}</p>
                    {ind.comingSoon ? (
                      <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold mt-3 text-[#B8860B] bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                        🔒 Coming Soon
                      </span>
                    ) : (
                      <p className={`text-xs font-bold mt-3 transition-colors ${industryIdx === i ? 'text-white' : 'text-[#B8860B] group-hover:text-white'}`}>Start →</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing">
          <GKCRMPricing />
        </section>

        {/* ── TESTIMONIALS ── */}
        <TestimonialsCarousel />

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-xs font-bold text-[#B8860B] uppercase tracking-[4px] mb-4">FAQ</p>
            <h2 className="font-serif text-3xl md:text-5xl text-[#1C1712]">Frequently asked</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${activeFaq === i ? 'border-[#B8860B]/40 shadow-md' : 'border-[#E2D9C8]'}`}>
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 md:px-6 py-4 md:py-5 text-left hover:bg-[#FDFAF8] transition-colors">
                  <span className="text-sm font-semibold text-[#1C1712] pr-4">{faq.q}</span>
                  <span className={`text-[#B8860B] text-xl transition-transform duration-300 flex-shrink-0 ${activeFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                  <p className="text-sm text-[#7A6E60] px-5 md:px-6 pb-5 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SUPPORT ── */}
        <section id="support" className="bg-white py-16 md:py-24">
          <div className="text-center px-4">
            <p className="text-xs font-bold text-[#B8860B] uppercase tracking-[4px] mb-4">Support</p>
            <h2 className="font-serif text-3xl md:text-5xl text-[#1C1712] mb-4 md:mb-5">We're here to help</h2>
            <p className="text-[#7A6E60] mb-8 md:mb-10 text-base md:text-lg">Our team responds within 24 hours. For urgent issues, WhatsApp us directly.</p>
          </div>
          <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
            <div className="space-y-3">
              {[
                { icon: '📧', label: 'Email',    value: 'support@gkcrm.in',    sub: 'Reply within 24 hours' },
                { icon: '📞', label: 'Phone',    value: '+91 98765 43210',      sub: 'Mon–Sat, 9AM – 7PM' },
                { icon: '💬', label: 'WhatsApp', value: 'Chat instantly',       sub: 'For urgent support' },
                { icon: '📍', label: 'Location', value: 'Hyderabad, Telangana', sub: 'India' },
              ].map(item => (
                <div key={item.label}
                  className="flex items-center gap-4 bg-[#F7F5F1] border border-[#E2D9C8] rounded-2xl p-4 hover:border-[#B8860B]/30 transition-colors group">
                  <div className="w-11 h-11 bg-white group-hover:bg-amber-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-[#E2D9C8] shadow-sm">{item.icon}</div>
                  <div>
                    <p className="text-[10px] text-[#9A8F82] font-semibold uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold text-[#1C1712]">{item.value}</p>
                    <p className="text-[10px] text-[#B8B0A0]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#F7F5F1] border border-[#E2D9C8] rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="font-serif text-2xl text-[#1C1712] mb-1">Send us a message</h3>
              <p className="text-sm text-[#9A8F82] mb-6 md:mb-7">We'll get back to you within 24 hours.</p>
              {supportSent ? (
                <div className="text-center py-10 md:py-14">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
                  <p className="font-bold text-[#1C1712] text-lg">Message sent!</p>
                  <p className="text-sm text-[#9A8F82] mt-2">We'll reply within 24 hours.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'name',  label: 'Your Name', placeholder: 'Ghana Kumar',   type: 'text' },
                      { key: 'email', label: 'Email',     placeholder: 'you@email.com', type: 'email' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">{field.label}</label>
                        <input type={field.type} placeholder={field.placeholder}
                          value={supportForm[field.key as 'name' | 'email']}
                          onChange={e => setSupportForm(f => ({ ...f, [field.key]: e.target.value }))}
                          className="w-full bg-white border border-[#E2D9C8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#B8860B] transition-colors" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#7A6E60] uppercase tracking-wider block mb-1.5">Message</label>
                    <textarea rows={5} placeholder="How can we help you?"
                      value={supportForm.message}
                      onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full bg-white border border-[#E2D9C8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#B8860B] transition-colors resize-none" />
                  </div>
                  <button onClick={() => { if (supportForm.name && supportForm.email && supportForm.message) setSupportSent(true) }}
                    className="w-full bg-[#1C1712] text-white py-3.5 rounded-xl text-sm font-bold hover:bg-[#2d2822] transition-all shadow-lg">
                    Send Message →
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-16 md:pb-24">
          <div className="relative bg-[#1C1712] rounded-3xl px-6 md:px-10 py-12 md:py-16 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #B8860B, transparent 50%), radial-gradient(circle at 70% 50%, #6B3FA0, transparent 50%)' }} />
            <div className="relative">
              <p className="text-xs font-bold text-[#B8860B] uppercase tracking-[4px] mb-4">Get Started Today</p>
              <h2 className="font-serif text-3xl md:text-5xl text-white mb-4 md:mb-5">Ready to grow your business?</h2>
              <p className="text-white/60 text-base md:text-lg mb-8 md:mb-10 max-w-xl mx-auto">Join 3,800+ businesses using GK CRM to manage leads, projects, staff and billing — all in one place.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => router.push('/signup')}
                  className="bg-[#B8860B] text-white px-8 md:px-10 py-4 rounded-xl text-sm font-bold hover:bg-[#9A7009] transition-all shadow-xl shadow-amber-900/30">
                  Start Free Trial — 14 Days →
                </button>
                <button onClick={() => router.push('/login')}
                  className="border-2 border-white/20 text-white px-8 md:px-10 py-4 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-[#1C1712] border-t border-white/10 py-10 md:py-14">
  <div className="max-w-6xl mx-auto px-4 md:px-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-10 md:mb-12 pb-10 md:pb-12 border-b border-white/10">
      <div className="col-span-2 md:col-span-2">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-bold text-white">G</div>
          <span className="font-serif text-xl text-white">GK · CRM</span>
        </div>
        <p className="text-sm text-white/40 leading-relaxed max-w-xs">Premium CRM platform for Indian businesses. Manage everything from leads to billing in one place.</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[3px] mb-4">Product</p>
        <div className="space-y-2.5">
          {['Features', 'Industries', 'Pricing', 'Security'].map(item => (
            <button key={item} onClick={() => scrollTo(item.toLowerCase())}
              className="block text-sm text-white/50 hover:text-white transition-colors">{item}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[3px] mb-4">Company</p>
        <div className="space-y-2.5">
          <button onClick={() => scrollTo('support')}
            className="block text-sm text-white/50 hover:text-white transition-colors">About Us</button>
          <button onClick={() => scrollTo('support')}
            className="block text-sm text-white/50 hover:text-white transition-colors">Support</button>
          {/* ✅ Links గా మార్చాను */}
          <a href="/privacy"
            className="block text-sm text-white/50 hover:text-white transition-colors">Privacy Policy</a>
          <a href="/terms"
            className="block text-sm text-white/50 hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-xs text-white/25">© 2026 GK CRM. All rights reserved.</p>
      <div className="flex items-center gap-4">
        <a href="/privacy" className="text-xs text-white/25 hover:text-white/50 transition-colors">Privacy</a>
        <span className="text-white/10">·</span>
        <a href="/terms" className="text-xs text-white/25 hover:text-white/50 transition-colors">Terms</a>
        <span className="text-white/10">·</span>
        <p className="text-xs text-white/25">Built with ❤️ for Indian businesses · Hyderabad, India</p>
      </div>
    </div>
  </div>
</footer>
      </div>
    </>
  )
}