'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName]     = useState('User')
  const [role, setRole]             = useState<'admin'|'employee'>('employee')
  const [loading, setLoading]       = useState(true)
  const [activeSlug, setActiveSlug] = useState('interior-design')

  const [pipeline, setPipeline] = useState({
    total:0, new:0, called:0, interested:0, followup:0,
    sitevisit:0, quotation:0, won:0, project_started:0, lost:0, active:0,
  })
  const [projects,   setProjects]   = useState({ total:0, active:0, clients:0, designs:0, materials:0 })
  const [hr,         setHr]         = useState({ employees:0, attendance:0 })
  const [finance,    setFinance]    = useState({ invoices:0, payments:0, pending:0 })
  const [myPipeline, setMyPipeline] = useState({ total:0, followup:0, sitevisit:0, quotation:0, won:0 })

  useEffect(() => {
    const saved = localStorage.getItem('gk-active-industry')
    if (saved) setActiveSlug(saved)
  }, [])

  const IND = `/dashboard/industries/${activeSlug}`

  useEffect(() => {
    const init = async () => {
      try {
        const { data:{ user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: profile } = await supabase
          .from('profiles').select('full_name,role,company_id,id').eq('id', user.id).single()
        if (!profile) return

        const isAdmin = ['admin','tenant_admin','manager'].includes(profile.role)
        setRole(isAdmin ? 'admin' : 'employee')
        if (profile.full_name) setUserName(profile.full_name.split(' ')[0])
        const cid = profile.company_id
        if (!cid) return

        // Pipeline
        const { data: leads } = await supabase
          .from('leads').select('pipeline_stage,assigned_to').eq('company_id', cid)
        if (leads) {
          const p = { total:0,new:0,called:0,interested:0,followup:0,sitevisit:0,quotation:0,won:0,project_started:0,lost:0,active:0 }
          leads.forEach(l => {
            const s = l.pipeline_stage || 'new'
            p.total++
            if (s in p) (p as any)[s]++
            if (!['won','lost','project_started'].includes(s)) p.active++
          })
          setPipeline(p)
          if (!isAdmin) {
            const my = leads.filter(l => l.assigned_to === user.id)
            setMyPipeline({
              total:    my.length,
              followup: my.filter(l=>l.pipeline_stage==='followup').length,
              sitevisit:my.filter(l=>l.pipeline_stage==='sitevisit').length,
              quotation:my.filter(l=>l.pipeline_stage==='quotation').length,
              won:      my.filter(l=>l.pipeline_stage==='won').length,
            })
          }
        }

        // Projects
        const [{ data:proj },{ data:cli },{ data:des },{ data:mat }] = await Promise.all([
          supabase.from('projects').select('status').eq('company_id', cid),
          supabase.from('clients').select('id').eq('company_id', cid),
          supabase.from('designs').select('id').eq('company_id', cid),
          supabase.from('materials').select('id').eq('company_id', cid),
        ])
        setProjects({
          total:     proj?.length||0,
          active:    proj?.filter(p=>['active','in_progress'].includes(p.status)).length||0,
          clients:   cli?.length||0,
          designs:   des?.length||0,
          materials: mat?.length||0,
        })

        // HR
        const [{ data:emp },{ data:att }] = await Promise.all([
          supabase.from('employees').select('id').eq('company_id', cid),
          supabase.from('attendance').select('id').eq('company_id', cid).eq('date', new Date().toISOString().split('T')[0]),
        ])
        setHr({ employees:emp?.length||0, attendance:att?.length||0 })

        // Finance
        const [{ data:inv },{ data:pay }] = await Promise.all([
          supabase.from('invoices').select('id,status').eq('company_id', cid),
          supabase.from('payments').select('id').eq('company_id', cid),
        ])
        setFinance({
          invoices: inv?.length||0,
          payments: pay?.length||0,
          pending:  inv?.filter(i=>['pending','unpaid'].includes(i.status)).length||0,
        })

      } catch(err) { console.error(err) }
      finally { setLoading(false) }
    }
    init()
  }, [router])

  const hour = new Date().getHours()
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const winRate = pipeline.total>0 ? Math.round(((pipeline.won+pipeline.project_started)/pipeline.total)*100) : 0

  const SECTIONS = [
    {
      id:'pipeline', title:'Pipeline', icon:'🎯', color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE',
      show: true,
      href: IND,
      subtext: `${pipeline.total} total leads · ${winRate}% win rate`,
      badge: winRate>0 ? `${winRate}% win` : null, badgeColor:'#16A34A', badgeBg:'#F0FDF4', badgeBorder:'#BBF7D0',
      stats:[
        { label:'Total',      value:pipeline.total,                        color:'#7C3AED' },
        { label:'Active',     value:pipeline.active,                       color:'#D97706' },
        { label:'Follow Ups', value:pipeline.followup,                     color:'#EA580C' },
        { label:'Site Visits',value:pipeline.sitevisit,                    color:'#0891B2' },
        { label:'Quotations', value:pipeline.quotation,                    color:'#2563EB' },
        { label:'Won',        value:pipeline.won+pipeline.project_started, color:'#16A34A' },
      ],
      rows:[
        { icon:'🎯', label:'New Leads',       value:pipeline.new,            href:`${IND}?stage=new` },
        { icon:'📞', label:'Called',           value:pipeline.called,         href:`${IND}?stage=called` },
        { icon:'✨', label:'Interested',       value:pipeline.interested,     href:`${IND}?stage=interested` },
        { icon:'🔄', label:'Follow Ups',       value:pipeline.followup,       href:`${IND}?stage=followup` },
        { icon:'🏠', label:'Site Visits',      value:pipeline.sitevisit,      href:`${IND}?stage=sitevisit` },
        { icon:'💰', label:'Quotation Sent',   value:pipeline.quotation,      href:`${IND}?stage=quotation` },
        { icon:'✅', label:'Won / Closed',     value:pipeline.won,            href:`${IND}?stage=won` },
        { icon:'🚀', label:'Project Started',  value:pipeline.project_started,href:`${IND}?stage=project_started` },
        { icon:'❌', label:'Lost',             value:pipeline.lost,           href:`${IND}?stage=lost` },
      ],
      extra: (
        <div style={{ padding:'0 18px 14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <p style={{ fontSize:10, fontWeight:700, color:'#AAA', margin:0 }}>Win Rate</p>
            <p style={{ fontSize:10, fontWeight:800, color:'#16A34A', margin:0 }}>{winRate}%</p>
          </div>
          <div style={{ height:6, background:'#F0F0EE', borderRadius:10, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${winRate}%`, background:'linear-gradient(90deg,#22C55E,#16A34A)', borderRadius:10, transition:'width 0.8s ease' }}/>
          </div>
        </div>
      ),
    },
    {
      id:'my-pipeline', title:'My Pipeline', icon:'📋', color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC',
      show: role==='employee',
      href: IND,
      subtext:`${myPipeline.total} leads assigned to you`,
      badge:null,
      stats:[
        { label:'My Leads',    value:myPipeline.total,     color:'#0891B2' },
        { label:'Follow Ups',  value:myPipeline.followup,  color:'#D97706' },
        { label:'Site Visits', value:myPipeline.sitevisit, color:'#EA580C' },
        { label:'Quotations',  value:myPipeline.quotation, color:'#2563EB' },
        { label:'Won',         value:myPipeline.won,       color:'#16A34A' },
      ],
      rows:[
        { icon:'🎯', label:'My Leads',        value:myPipeline.total,     href:IND },
        { icon:'🔄', label:'Follow Ups',       value:myPipeline.followup,  href:`${IND}?stage=followup` },
        { icon:'🏠', label:'Site Visits',      value:myPipeline.sitevisit, href:`${IND}?stage=sitevisit` },
        { icon:'💰', label:'Quotation Sent',   value:myPipeline.quotation, href:`${IND}?stage=quotation` },
        { icon:'✅', label:'Won',              value:myPipeline.won,       href:`${IND}?stage=won` },
      ],
      extra: null,
    },
    {
      id:'projects', title:'Projects', icon:'🏗️', color:'#EA580C', bg:'#FFF7ED', border:'#FED7AA',
      show: true,
      href:`${IND}/projects`,
      subtext:`${projects.total} projects · ${projects.clients} clients`,
      badge:null,
      stats:[
        { label:'Total',     value:projects.total,     color:'#EA580C' },
        { label:'Active',    value:projects.active,    color:'#16A34A' },
        { label:'Clients',   value:projects.clients,   color:'#2563EB' },
        { label:'Designs',   value:projects.designs,   color:'#7C3AED' },
        { label:'Materials', value:projects.materials, color:'#D97706' },
      ],
      rows:[
        { icon:'🏗️', label:'All Projects', value:projects.total,     href:`${IND}/projects` },
        { icon:'👥', label:'Clients',       value:projects.clients,   href:`${IND}/clients` },
        { icon:'🎨', label:'Designs',       value:projects.designs,   href:`${IND}/designs` },
        { icon:'📦', label:'Materials',     value:projects.materials, href:`${IND}/materials` },
      ],
      extra: null,
    },
    {
      id:'hr', title:'HR & Admin', icon:'👔', color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE',
      show: role==='admin',
      href:'/hr/employees',
      subtext:`${hr.employees} employees · ${hr.attendance} present today`,
      badge:null,
      stats:[
        { label:'Employees',  value:hr.employees,  color:'#2563EB' },
        { label:'Today Att.', value:hr.attendance, color:'#16A34A' },
      ],
      rows:[
        { icon:'👔', label:'HRMS',       value:hr.employees,  href:'/hr/employees' },
        { icon:'📅', label:'Attendance', value:hr.attendance, href:'/hr/attendance' },
      ],
      extra: null,
    },
    {
      id:'finance', title:'Finance', icon:'💳', color:'#16A34A', bg:'#F0FDF4', border:'#BBF7D0',
      show: true,
      href:'/billing/invoices',
      subtext:`${finance.invoices} invoices · ${finance.pending} pending`,
      badge: finance.pending>0 ? `${finance.pending} pending` : null, badgeColor:'#DC2626', badgeBg:'#FEF2F2', badgeBorder:'#FECACA',
      stats:[
        { label:'Invoices', value:finance.invoices, color:'#16A34A' },
        { label:'Payments', value:finance.payments, color:'#7C3AED' },
        { label:'Pending',  value:finance.pending,  color:'#DC2626' },
      ],
      rows:[
        { icon:'🧾', label:'Invoices', value:finance.invoices, href:'/billing/invoices' },
        { icon:'💳', label:'Payments', value:finance.payments, href:'/billing/payments' },
        { icon:'📊', label:'Reports',  value:null,             href:'/reports' },
      ],
      extra: null,
    },
    {
      id:'system', title:'System', icon:'⚙️', color:'#64748B', bg:'#F8FAFC', border:'#E2E8F0',
      show: role==='admin',
      href:'/dashboard/settings',
      subtext:'Settings & configuration',
      badge:null,
      stats:[],
      rows:[
        { icon:'⚙️', label:'Settings',       value:null, href:'/dashboard/settings' },
        { icon:'🏢', label:'Company Profile', value:null, href:'/dashboard/settings' },
        { icon:'👥', label:'User Management', value:null, href:'/hr/employees' },
        { icon:'🔔', label:'Notifications',   value:null, href:'/dashboard/settings' },
        { icon:'🔒', label:'Security',        value:null, href:'/dashboard/settings' },
      ],
      extra: null,
    },
  ]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F7F7F5' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'3px solid #F5C518', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }}/>
        <p style={{ color:'#999', fontSize:14, margin:0 }}>Loading...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{font-family:'Inter',sans-serif;box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .sec{animation:fadeUp 0.3s ease both;}
        .rlink{transition:background 0.12s;}
        .rlink:hover{background:#F5F5F3 !important;}
      `}</style>

      <main style={{ background:'#F7F7F5', minHeight:'100vh', padding:'24px 20px 48px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* HEADER */}
        <div style={{ marginBottom:4 }}>
          <p style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:4, color:'#F5C518', margin:'0 0 5px' }}>GK CRM</p>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#1C1C1E', margin:0 }}>{greeting}, {userName} 👋</h1>
          <p style={{ fontSize:12, color:'#999', margin:'4px 0 0' }}>
            {pipeline.total} leads · {winRate}% win rate · {projects.active} active projects
          </p>
        </div>

        {/* SECTION CARDS */}
        {SECTIONS.filter(s => s.show).map((sec, si) => (
          <div key={sec.id} className="sec" style={{ animationDelay:`${si*0.05}s`, background:'#fff', border:'1px solid #F0F0EE', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>

            {/* Header */}
            <Link href={sec.href} style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:sec.bg, borderBottom:`2px solid ${sec.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:14, background:`${sec.color}18`, border:`1px solid ${sec.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{sec.icon}</div>
                <div>
                  <p style={{ fontSize:15, fontWeight:800, color:sec.color, margin:0 }}>{sec.title}</p>
                  <p style={{ fontSize:10, color:'#AAA', margin:'2px 0 0' }}>{sec.subtext}</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {sec.badge && (
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:(sec as any).badgeBg, color:(sec as any).badgeColor, border:`1px solid ${(sec as any).badgeBorder}` }}>{sec.badge}</span>
                )}
                <span style={{ fontSize:18, color:sec.color, opacity:0.4 }}>›</span>
              </div>
            </Link>

            {/* Stat pills */}
            {sec.stats.length > 0 && (
              <div style={{ display:'flex', gap:8, padding:'12px 16px', borderBottom:'1px solid #F5F5F3', flexWrap:'wrap' }}>
                {sec.stats.map(st => (
                  <div key={st.label} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'#F9F9F7', border:'1px solid #EBEBEB', flexShrink:0 }}>
                    <span style={{ fontSize:17, fontWeight:900, color:st.color, lineHeight:1 }}>{st.value}</span>
                    <span style={{ fontSize:10, fontWeight:600, color:'#BBB' }}>{st.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Row links */}
            <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:2 }}>
              {sec.rows.map(row => (
                <Link key={row.label} href={row.href} className="rlink"
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 10px', borderRadius:14, textDecoration:'none', background:'transparent' }}>
                  <div style={{ width:36, height:36, borderRadius:12, background:`${sec.color}10`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{row.icon}</div>
                  <p style={{ flex:1, fontSize:13, fontWeight:600, color:'#1C1C1E', margin:0 }}>{row.label}</p>
                  {row.value !== null && row.value !== undefined && (
                    <span style={{ fontSize:15, fontWeight:900, color:sec.color, minWidth:28, textAlign:'right' }}>{row.value}</span>
                  )}
                  <span style={{ fontSize:15, color:'#DDD', flexShrink:0, marginLeft:4 }}>›</span>
                </Link>
              ))}
            </div>

            {/* Extra (win rate bar etc) */}
            {sec.extra}

          </div>
        ))}

      </main>
    </>
  )
}