// components/super-admin/UserManagementPanel.tsx
'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Search, Download, Plus, Sparkles, Shield, Users, Activity,
  Edit2, X, AlertTriangle, ChevronUp, ChevronDown, Trash2,
  CheckCircle, Loader2, Building2,
} from 'lucide-react'
import {
  addUserAction, updateRoleAction,
  bulkUpdateRoleAction, removeUserAction,
} from '@/app/(super-admin)/admin/users/actions'

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  company_id: string
}

interface Company {
  id: string
  name: string
}

interface Props {
  initialUsers: User[]
  currentUserId: string
  currentCompanyId: string   // super admin's own company
  companies: Company[]       // ALL registered companies
}

interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  pageBg: '#F5F0E8',
  cardBg: '#FFFFFF',
  borderLight: 'rgba(0,0,0,0.08)',
  borderMed: 'rgba(0,0,0,0.13)',
  rowDivider: '#F0EAE0',
  textPrimary: '#1C1712',
  textSecond: '#6B5E52',
  textMuted: '#9E8E7E',
  gold: '#B8860B',
  goldBg: 'rgba(184,134,11,0.08)',
  goldBorder: 'rgba(184,134,11,0.25)',
  goldText: '#92650A',
  inp: {
    width: '100%', padding: '9px 12px', background: '#FDFAF5',
    border: '1px solid rgba(0,0,0,0.13)', borderRadius: 8,
    color: '#1C1712', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  },
  lbl: {
    fontSize: 11, fontWeight: 600 as const, color: '#6B5E52',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    display: 'block' as const, marginBottom: 5,
  },
}

const ROLE_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  super_admin:  { label: 'Super Admin',  bg: 'rgba(184,134,11,0.10)', color: '#92650A', border: 'rgba(184,134,11,0.30)' },
  tenant_admin: { label: 'Tenant Admin', bg: 'rgba(37,99,235,0.08)',  color: '#1D4ED8', border: 'rgba(37,99,235,0.22)'  },
  employee:     { label: 'Employee',     bg: 'rgba(22,163,74,0.08)',  color: '#15803D', border: 'rgba(22,163,74,0.22)'  },
}

const AVATAR_COLORS = ['#7C3AED','#B45309','#0369A1','#047857','#BE123C','#0891B2','#4F46E5','#9D174D']

// Company tag colours — cycles through a palette
const COMPANY_COLORS = [
  { bg: 'rgba(124,58,237,0.08)', color: '#6D28D9', border: 'rgba(124,58,237,0.22)' },
  { bg: 'rgba(3,105,161,0.08)',  color: '#0369A1', border: 'rgba(3,105,161,0.22)'  },
  { bg: 'rgba(4,120,87,0.08)',   color: '#065F46', border: 'rgba(4,120,87,0.22)'   },
  { bg: 'rgba(190,18,60,0.08)',  color: '#9F1239', border: 'rgba(190,18,60,0.22)'  },
  { bg: 'rgba(8,145,178,0.08)',  color: '#0E7490', border: 'rgba(8,145,178,0.22)'  },
]

// ─── Utils ────────────────────────────────────────────────────────────────────
function initials(name: string | null, email: string) {
  if (name?.trim()) return name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
  return email.slice(0,2).toUpperCase()
}
function avatarColor(id: string) {
  return AVATAR_COLORS[(id.charCodeAt(0) + id.charCodeAt(id.length-1)) % AVATAR_COLORS.length]
}
function companyColor(companyId: string) {
  const idx = companyId.charCodeAt(0) % COMPANY_COLORS.length
  return COMPANY_COLORS[idx]
}
function calcScore(u: User) {
  const seed = u.id.replace(/-/g,'').split('').reduce((a,c) => a + c.charCodeAt(0), 0)
  const base = (seed % 35) + 50
  const rBonus = u.role === 'super_admin' ? 12 : u.role === 'tenant_admin' ? 6 : 0
  const age = Math.min(Math.floor((Date.now() - new Date(u.created_at).getTime()) / 86_400_000 / 4), 12)
  return Math.min(Math.round(base + rBonus + age), 99)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}
function scoreColor(s: number) {
  return s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626'
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:100, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:500,
          display:'flex', alignItems:'center', gap:8, pointerEvents:'auto',
          background: t.type==='success'?'#f0fdf4': t.type==='error'?'#fef2f2':'#fffbeb',
          border:`1px solid ${t.type==='success'?'rgba(22,163,74,0.25)': t.type==='error'?'rgba(220,38,38,0.25)':'rgba(217,119,6,0.25)'}`,
          color: t.type==='success'?'#15803d': t.type==='error'?'#b91c1c':'#92400e',
          boxShadow:'0 4px 12px rgba(0,0,0,0.08)', animation:'slideIn 0.2s ease-out',
        }}>
          {t.type==='success'?<CheckCircle size={14}/>:t.type==='error'?<AlertTriangle size={14}/>:<Sparkles size={14}/>}
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score, highlight }: { score:number; highlight?:boolean }) {
  const c = scoreColor(score)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:4, background: highlight?'rgba(220,38,38,0.15)':'#E8E0D0', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${score}%`, background:c, borderRadius:2, transition:'width 0.4s' }}/>
      </div>
      <span style={{ fontSize:11, color: highlight?'#dc2626':c, fontWeight:700, minWidth:22 }}>{score}</span>
    </div>
  )
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width=420 }: {
  title:string; onClose:()=>void; children:React.ReactNode; width?:number
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} onClick={e=>{ if(e.target===ref.current) onClose() }} style={{ position:'fixed', inset:0, background:'rgba(28,23,18,0.35)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
      <div style={{ background:'#fff', borderRadius:14, padding:'22px 24px', width, maxWidth:'92vw', maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 8px 32px rgba(0,0,0,0.14)', animation:'popIn 0.18s ease-out' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:T.textPrimary }}>{title}</h3>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:T.textMuted, cursor:'pointer', display:'flex' }}><X size={16}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Add User Modal (multi-tenant) ────────────────────────────────────────────
function AddUserModal({ companies, defaultCompanyId, onClose, onSuccess }: {
  companies: Company[]
  defaultCompanyId: string
  onClose: ()=>void
  onSuccess: (msg:string)=>void
}) {
  const [form, setForm] = useState({ fullName:'', email:'', role:'employee', companyId: defaultCompanyId })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    if (!form.email.trim()) { setErr('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Enter a valid email'); return }
    if (!form.companyId) { setErr('Select a company'); return }
    setLoading(true); setErr('')
    const res = await addUserAction(form.companyId, form.fullName, form.email, form.role)
    setLoading(false)
    if (res.error) setErr(res.error)
    else { onSuccess(`${form.fullName || form.email} added to ${companies.find(c=>c.id===form.companyId)?.name ?? 'company'}`); onClose() }
  }

  const selectedCompany = companies.find(c => c.id === form.companyId)

  return (
    <Modal title="Add New User" onClose={onClose} width={440}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {/* Company selector — key for multi-tenant */}
        <div>
          <label style={T.lbl}>Company *</label>
          <div style={{ position:'relative' }}>
            <Building2 size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.textMuted, pointerEvents:'none' }}/>
            <select style={{ ...T.inp, paddingLeft:30, cursor:'pointer' }} value={form.companyId} onChange={set('companyId')}>
              <option value="">— Select Company —</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {selectedCompany && (
            <div style={{ marginTop:5, fontSize:11, color:T.textMuted }}>
              Adding user to <strong style={{ color:T.goldText }}>{selectedCompany.name}</strong>
            </div>
          )}
        </div>

        <div>
          <label style={T.lbl}>Full Name</label>
          <input style={T.inp} value={form.fullName} onChange={set('fullName')} placeholder="Ravi Kumar"/>
        </div>
        <div>
          <label style={T.lbl}>Email *</label>
          <input style={T.inp} type="email" value={form.email} onChange={set('email')} placeholder="ravi@company.com"/>
        </div>
        <div>
          <label style={T.lbl}>Role</label>
          <select style={{ ...T.inp, cursor:'pointer' }} value={form.role} onChange={set('role')}>
            <option value="employee">Employee</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {err && (
          <div style={{ padding:'8px 12px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', borderRadius:7, fontSize:12, color:'#b91c1c', display:'flex', alignItems:'center', gap:6 }}>
            <AlertTriangle size={12}/> {err}
          </div>
        )}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:6 }}>
          <button onClick={onClose} disabled={loading} style={{ padding:'9px 16px', background:'#F5F0E8', border:`1px solid ${T.borderMed}`, borderRadius:8, fontSize:13, cursor:'pointer', color:T.textSecond, fontWeight:600 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ padding:'9px 18px', background:T.gold, border:'none', color:'#fff', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6, opacity:loading?0.7:1, boxShadow:'0 2px 6px rgba(184,134,11,0.25)' }}>
            {loading ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Adding...</> : <><Plus size={13}/> Add User</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, companies, onClose, onSuccess }: {
  user:User; companies:Company[]; onClose:()=>void; onSuccess:(msg:string)=>void
}) {
  const [role, setRole] = useState(user.role)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const company = companies.find(c => c.id === user.company_id)

  const submit = async () => {
    setLoading(true); setErr('')
    const res = await updateRoleAction(user.id, role)
    setLoading(false)
    if (res.error) setErr(res.error)
    else { onSuccess(`${user.full_name ?? user.email} role updated`); onClose() }
  }

  return (
    <Modal title="Edit User" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#F5F0E8', borderRadius:8 }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:avatarColor(user.id), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>
            {initials(user.full_name, user.email)}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary }}>{user.full_name ?? 'No Name'}</div>
            <div style={{ fontSize:11, color:T.textMuted }}>{user.email}</div>
            {company && <div style={{ fontSize:11, color:T.goldText, marginTop:2 }}>📍 {company.name}</div>}
          </div>
        </div>
        <div>
          <label style={T.lbl}>Role</label>
          <select style={{ ...T.inp, cursor:'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        {err && <div style={{ padding:'8px 12px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', borderRadius:7, fontSize:12, color:'#b91c1c' }}>{err}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:6 }}>
          <button onClick={onClose} style={{ padding:'9px 16px', background:'#F5F0E8', border:`1px solid ${T.borderMed}`, borderRadius:8, fontSize:13, cursor:'pointer', color:T.textSecond, fontWeight:600 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ padding:'9px 18px', background:T.gold, border:'none', color:'#fff', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6, opacity:loading?0.7:1 }}>
            {loading ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ user, companies, onClose, onSuccess }: {
  user:User; companies:Company[]; onClose:()=>void; onSuccess:(msg:string)=>void
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const company = companies.find(c => c.id === user.company_id)

  const confirm = async () => {
    setLoading(true)
    const res = await removeUserAction(user.id)
    setLoading(false)
    if (res.error) setErr(res.error)
    else { onSuccess(`${user.full_name ?? user.email} removed`); onClose() }
  }

  return (
    <Modal title="Remove User" onClose={onClose} width={380}>
      <div style={{ textAlign:'center', padding:'4px 0 16px' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(220,38,38,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <Trash2 size={20} style={{ color:'#dc2626' }}/>
        </div>
        <p style={{ margin:'0 0 6px', fontSize:14, fontWeight:600, color:T.textPrimary }}>Remove {user.full_name ?? user.email}?</p>
        {company && <p style={{ margin:'0 0 6px', fontSize:12, color:T.goldText }}>from {company.name}</p>}
        <p style={{ margin:0, fontSize:12, color:T.textMuted }}>This deletes their account permanently. Cannot be undone.</p>
        {err && <div style={{ marginTop:10, fontSize:12, color:'#b91c1c' }}>{err}</div>}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:'9px 0', background:'#F5F0E8', border:`1px solid ${T.borderMed}`, borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:T.textSecond }}>Cancel</button>
        <button onClick={confirm} disabled={loading} style={{ flex:1, padding:'9px 0', background:'#dc2626', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity:loading?0.7:1 }}>
          {loading ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={13}/>}
          {loading ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </Modal>
  )
}

// ─── AI Insight Panel ─────────────────────────────────────────────────────────
function AiInsightPanel({ user, score, company, onClose }: {
  user:User; score:number; company?:Company; onClose:()=>void
}) {
  const c = scoreColor(score)
  const ageDays = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86_400_000)
  const rec = score > 85 && user.role === 'employee' ? 'Role Upgrade' : score < 50 ? 'Needs Attention' : 'Stable'
  const recC = score > 85 ? '#16a34a' : score < 50 ? '#dc2626' : '#d97706'

  return (
    <div style={{ background:'#FFFDF8', border:'1px solid rgba(184,134,11,0.25)', borderRadius:10, padding:14, boxShadow:'0 2px 8px rgba(184,134,11,0.08)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Sparkles size={13} style={{ color:T.gold }}/>
          <span style={{ fontSize:12, fontWeight:600, color:T.goldText }}>AI Insights — {user.full_name?.split(' ')[0] ?? user.email.split('@')[0]}</span>
          {company && <span style={{ fontSize:10, color:T.textMuted }}>· {company.name}</span>}
          <span style={{ fontSize:9, padding:'1px 6px', borderRadius:20, background:T.goldBg, color:T.goldText, border:`1px solid ${T.goldBorder}`, fontWeight:700, letterSpacing:'0.06em' }}>BETA</span>
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', color:T.textMuted, cursor:'pointer', display:'flex' }}><X size={13}/></button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
        {[
          { l:'Activity Score', v:`${score}/100`, s: score>=80?'High performer':score>=60?'Average':'Below average', c },
          { l:'Account Age', v:`${ageDays}d`, s: ageDays>30?'Experienced':'Recently joined', c:'#1D4ED8' },
          { l:'Recommendation', v:rec, s: score>85?'Eligible for upgrade':score<50?'Assign mentor':'Continue monitoring', c:recC },
        ].map((i,idx) => (
          <div key={idx} style={{ background:'#F5F0E8', borderRadius:7, padding:'9px 11px', border:'1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:9, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{i.l}</div>
            <div style={{ fontSize:14, fontWeight:700, color:i.c }}>{i.v}</div>
            <div style={{ fontSize:10, color:T.textSecond, marginTop:2 }}>{i.s}</div>
          </div>
        ))}
      </div>
      {score < 50 && (
        <div style={{ marginTop:8, padding:'7px 11px', background:'rgba(220,38,38,0.05)', border:'1px solid rgba(220,38,38,0.15)', borderRadius:7, fontSize:11, color:'#b91c1c', display:'flex', gap:5 }}>
          <AlertTriangle size={11} style={{ flexShrink:0, marginTop:1 }}/> Low engagement. Consider a 1:1 or workload review.
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function UserManagementPanel({ initialUsers, currentUserId, currentCompanyId, companies }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')  // ← NEW: multi-tenant filter
  const [sortBy, setSortBy] = useState<'joined'|'score'|'name'>('joined')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [selected, setSelected] = useState<string[]>([])
  const [insightId, setInsightId] = useState<string|null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState<User|null>(null)
  const [deleteUser, setDeleteUser] = useState<User|null>(null)
  const [bulkRoleOpen, setBulkRoleOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [riskIds, setRiskIds] = useState<string[]>([])
  const [realtimePulse, setRealtimePulse] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  // Company lookup map
  const companyMap = useMemo(() => {
    const m: Record<string, Company> = {}
    companies.forEach(c => { m[c.id] = c })
    return m
  }, [companies])

  // Supabase browser client
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── Real-time: subscribe to ALL profiles (super admin sees all companies) ───
  // IMPORTANT: Enable Realtime on `profiles` table in Supabase Dashboard
  useEffect(() => {
    const channel = supabase
      .channel('profiles-rt-global')
      .on('postgres_changes', { event:'*', schema:'public', table:'profiles' }, (payload) => {
        setRealtimePulse(true)
        setTimeout(() => setRealtimePulse(false), 600)
        if (payload.eventType === 'INSERT') {
          const newUser = payload.new as User
          setUsers(prev => prev.find(u => u.id === newUser.id) ? prev : [newUser, ...prev])
          const co = companyMap[newUser.company_id]
          addToast(`New user joined ${co ? co.name : 'a company'}`, 'info')
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.id === (payload.new as User).id ? payload.new as User : u))
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id !== (payload.old as { id:string }).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, addToast, companyMap])

  // Scores
  const scores = useMemo(() => {
    const m: Record<string,number> = {}
    users.forEach(u => { m[u.id] = calcScore(u) })
    return m
  }, [users])

  // Filtered + sorted
  const filtered = useMemo(() => {
    return users
      .filter(u => {
        const q = search.toLowerCase()
        return (
          ((u.full_name ?? '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
           (companyMap[u.company_id]?.name ?? '').toLowerCase().includes(q)) &&
          (roleFilter === 'all' || u.role === roleFilter) &&
          (companyFilter === 'all' || u.company_id === companyFilter)   // ← company filter
        )
      })
      .sort((a, b) => {
        const cmp =
          sortBy === 'name' ? (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email) :
          sortBy === 'score' ? scores[a.id] - scores[b.id] :
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [users, search, roleFilter, companyFilter, sortBy, sortDir, scores, companyMap])

  // Stats (across ALL companies)
  const totalAdmins = users.filter(u => u.role !== 'employee').length
  const avgScore = users.length ? Math.round(users.reduce((s, u) => s + scores[u.id], 0) / users.length) : 0
  const companiesActive = new Set(users.map(u => u.company_id)).size

  // Select
  const toggleSel = (id: string) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(u => u.id))

  // Sort
  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  // Export CSV (includes company name)
  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Company', 'Role', 'AI Score', 'Joined'],
      ...filtered.map(u => [
        u.full_name ?? '', u.email,
        companyMap[u.company_id]?.name ?? u.company_id,
        ROLE_CFG[u.role]?.label ?? u.role,
        scores[u.id], fmtDate(u.created_at),
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }))
    a.download = `gk-crm-users-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    addToast(`Exported ${filtered.length} users`, 'success')
  }

  // AI Risk Scan
  const runScan = async () => {
    if (scanning) return
    setScanning(true); setRiskIds([])
    addToast('AI Risk Scan started…', 'info')
    await new Promise(r => setTimeout(r, 1800))
    const risks = users.filter(u => scores[u.id] < 65).map(u => u.id)
    setRiskIds(risks); setScanning(false)
    if (risks.length === 0) addToast('All users are healthy ✓', 'success')
    else addToast(`${risks.length} user(s) need attention`, 'error')
  }

  // Bulk role
  const applyBulkRole = async (newRole: string) => {
    setBulkLoading(true)
    const res = await bulkUpdateRoleAction(selected, newRole)
    setBulkLoading(false); setBulkRoleOpen(false)
    if (res.error) addToast(res.error, 'error')
    else { addToast(`${res.count ?? selected.length} users updated`, 'success'); setSelected([]) }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy !== col
      ? <ChevronDown size={10} style={{ color:T.textMuted, opacity:0.4 }}/>
      : sortDir === 'asc'
        ? <ChevronUp size={10} style={{ color:T.gold }}/>
        : <ChevronDown size={10} style={{ color:T.gold }}/>

  const GRID = '32px minmax(0,1fr) 130px 130px 110px 90px 90px'

  return (
    <>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popIn   { from{opacity:0;transform:scale(0.96)}     to{opacity:1;transform:scale(1)}    }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .usr-row:hover { background:#FDFAF5 !important; }
        .act-btn:hover { border-color:rgba(0,0,0,0.22)!important; color:#1C1712!important; }
      `}</style>

      <div style={{ minHeight:'100vh', background:T.pageBg, fontFamily:'Inter,system-ui,sans-serif' }}>

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div style={{ padding:'16px 28px', borderBottom:`1px solid ${T.borderLight}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:`${T.pageBg}f5`, backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:T.textPrimary }}>User Management</h1>
              <div style={{ width:7, height:7, borderRadius:'50%', background: realtimePulse?'#B8860B':'#16a34a', boxShadow:`0 0 ${realtimePulse?6:4}px ${realtimePulse?'#B8860B':'#16a34a'}`, transition:'all 0.3s' }} title="Real-time active"/>
              {/* Total company count badge */}
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:T.goldBg, color:T.goldText, border:`1px solid ${T.goldBorder}`, fontWeight:600 }}>
                {companiesActive} {companiesActive === 1 ? 'company' : 'companies'}
              </span>
            </div>
            <p style={{ margin:'2px 0 0', fontSize:11, color:T.textMuted }}>
              All tenants · all roles · AI-monitored · real-time
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={exportCSV} style={{ padding:'8px 14px', background:T.cardBg, border:`1px solid ${T.borderMed}`, color:T.textSecond, borderRadius:8, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <Download size={13}/> Export
            </button>
            <button onClick={() => setShowAdd(true)} style={{ padding:'8px 18px', background:T.gold, border:'none', color:'#fff', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6, boxShadow:'0 2px 6px rgba(184,134,11,0.30)' }}>
              <Plus size={14}/> Add User
            </button>
          </div>
        </div>

        <div style={{ padding:'22px 28px' }}>

          {/* ── Stats (now across ALL companies) ──────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            {[
              { l:'Total Users',       v:users.length,    c:T.textPrimary, I:Users    },
              { l:'Active Companies',  v:companiesActive, c:'#6D28D9',     I:Building2 },
              { l:'Avg AI Score',      v:avgScore,        c:T.gold,        I:Sparkles },
              { l:'Total Admins',      v:totalAdmins,     c:'#1D4ED8',     I:Shield   },
            ].map(({ l, v, c, I }, i) => (
              <div key={i} style={{ background:T.cardBg, border:`1px solid ${T.borderLight}`, borderRadius:10, padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                <I size={16} style={{ color:c, marginBottom:6, opacity:0.75 }}/>
                <div style={{ fontSize:26, fontWeight:700, color:c, marginBottom:2 }}>{v}</div>
                <div style={{ fontSize:10, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* ── Toolbar ───────────────────────────────────────────────────────── */}
          <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:1, position:'relative', minWidth:180 }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.textMuted }}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users or companies..." style={{ ...T.inp, paddingLeft:30, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}/>
            </div>
            {/* Company filter ← KEY multi-tenant filter */}
            <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ ...T.inp, width:'auto', padding:'8px 12px', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              <option value="all">All Companies ({companies.length})</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...T.inp, width:'auto', padding:'8px 12px', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="tenant_admin">Tenant Admin</option>
              <option value="employee">Employee</option>
            </select>
            <button onClick={runScan} disabled={scanning} style={{ padding:'8px 14px', background:T.goldBg, border:`1px solid ${T.goldBorder}`, borderRadius:8, color:T.goldText, fontSize:12, cursor:scanning?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', opacity:scanning?0.7:1 }}>
              {scanning ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Scanning...</> : <><Sparkles size={13}/> AI Risk Scan</>}
            </button>
            {riskIds.length > 0 && (
              <button onClick={() => setRiskIds([])} style={{ padding:'8px 12px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', borderRadius:8, color:'#b91c1c', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <X size={12}/> Clear {riskIds.length} flags
              </button>
            )}
          </div>

          {/* ── Bulk Bar ──────────────────────────────────────────────────────── */}
          {selected.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:T.goldBg, border:`1px solid ${T.goldBorder}`, borderRadius:8, marginBottom:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:T.goldText, fontWeight:600 }}>{selected.length} selected</span>
              <div style={{ flex:1 }}/>
              {bulkRoleOpen ? (
                <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  {['employee','tenant_admin','super_admin'].map(r => (
                    <button key={r} onClick={() => applyBulkRole(r)} disabled={bulkLoading} style={{ padding:'4px 10px', background:ROLE_CFG[r].bg, border:`1px solid ${ROLE_CFG[r].border}`, borderRadius:6, color:ROLE_CFG[r].color, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                      {ROLE_CFG[r].label}
                    </button>
                  ))}
                  <button onClick={() => setBulkRoleOpen(false)} style={{ padding:'4px 8px', background:'transparent', border:`1px solid ${T.borderMed}`, borderRadius:6, color:T.textMuted, fontSize:11, cursor:'pointer' }}><X size={11}/></button>
                </div>
              ) : (
                <>
                  <button onClick={() => setBulkRoleOpen(true)} style={{ padding:'5px 12px', background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.22)', borderRadius:6, color:'#1D4ED8', fontSize:11, cursor:'pointer', fontWeight:600 }}>Change Role</button>
                  <button onClick={() => setSelected([])} style={{ padding:'5px 10px', background:'transparent', border:`1px solid ${T.borderMed}`, borderRadius:6, color:T.textMuted, fontSize:11, cursor:'pointer', display:'flex' }}><X size={12}/></button>
                </>
              )}
            </div>
          )}

          {/* ── Table ─────────────────────────────────────────────────────────── */}
          <div style={{ background:T.cardBg, border:`1px solid ${T.borderLight}`, borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:GRID, padding:'10px 18px', borderBottom:`1px solid ${T.borderLight}`, background:'#FDFAF5', alignItems:'center' }}>
              <div><input type="checkbox" checked={selected.length===filtered.length && filtered.length>0} onChange={toggleAll} style={{ accentColor:T.gold, cursor:'pointer' }}/></div>
              {(['name','company','role','score','joined'] as const).map(col => {
                const labels: Record<string,string> = { name:'User', company:'Company', role:'Role', score:'AI Score', joined:'Joined' }
                return (col==='role' || col==='company') ? (
                  <div key={col} style={{ fontSize:10, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>{labels[col]}</div>
                ) : (
                  <button key={col} onClick={() => handleSort(col as typeof sortBy)} style={{ display:'flex', alignItems:'center', gap:4, background:'transparent', border:'none', color:T.textMuted, fontSize:10, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.08em', padding:0, fontWeight:600 }}>
                    {labels[col]} <SortIcon col={col as typeof sortBy}/>
                  </button>
                )
              })}
              <div style={{ fontSize:10, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>Actions</div>
            </div>

            {/* Rows */}
            {filtered.length === 0
              ? <div style={{ padding:'40px', textAlign:'center', color:T.textMuted, fontSize:13 }}>No users match your filters</div>
              : filtered.map(user => {
                const rc = ROLE_CFG[user.role] ?? ROLE_CFG.employee
                const isSel = selected.includes(user.id)
                const isIns = insightId === user.id
                const isRisk = riskIds.includes(user.id)
                const sc = scores[user.id]
                const isMe = user.id === currentUserId
                const co = companyMap[user.company_id]
                const cc = companyColor(user.company_id)

                return (
                  <div key={user.id}>
                    <div className="usr-row" style={{ display:'grid', gridTemplateColumns:GRID, padding:'12px 18px', borderBottom:`1px solid ${T.rowDivider}`, background: isRisk?'rgba(220,38,38,0.03)': isIns?'rgba(184,134,11,0.04)': isSel?'rgba(184,134,11,0.03)':T.cardBg, alignItems:'center', transition:'background 0.12s', borderLeft:`3px solid ${isRisk?'rgba(220,38,38,0.5)':'transparent'}` }}>
                      <div><input type="checkbox" checked={isSel} onChange={() => toggleSel(user.id)} style={{ accentColor:T.gold, cursor:'pointer' }}/></div>

                      {/* User */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:avatarColor(user.id), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                          {initials(user.full_name, user.email)}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <span style={{ fontSize:13, fontWeight:500, color:T.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.full_name ?? 'No Name'}</span>
                            {isMe && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:20, background:T.goldBg, color:T.goldText, border:`1px solid ${T.goldBorder}`, fontWeight:700 }}>You</span>}
                            {isRisk && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:20, background:'rgba(220,38,38,0.08)', color:'#b91c1c', border:'1px solid rgba(220,38,38,0.2)', fontWeight:700 }}>⚠ Risk</span>}
                          </div>
                          <div style={{ fontSize:11, color:T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                        </div>
                      </div>

                      {/* Company badge ← NEW column */}
                      <div>
                        <span style={{ padding:'3px 8px', borderRadius:20, background:cc.bg, color:cc.color, border:`1px solid ${cc.border}`, fontSize:10, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'inline-block', maxWidth:120 }}>
                          {co?.name ?? '—'}
                        </span>
                      </div>

                      {/* Role */}
                      <div>
                        <span style={{ padding:'3px 9px', borderRadius:20, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}`, fontSize:10, fontWeight:600, whiteSpace:'nowrap' }}>{rc.label}</span>
                      </div>

                      {/* AI Score */}
                      <div style={{ paddingRight:8 }}><ScoreBar score={sc} highlight={isRisk}/></div>

                      {/* Joined */}
                      <div style={{ fontSize:11, color:T.textMuted }}>{fmtDate(user.created_at)}</div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="act-btn" onClick={() => setInsightId(isIns?null:user.id)} title="AI Insights" style={{ width:28, height:28, borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:isIns?T.goldBg:'transparent', border:`1px solid ${isIns?T.goldBorder:T.borderMed}`, color:isIns?T.goldText:T.textMuted, transition:'all 0.15s' }}><Sparkles size={13}/></button>
                        <button className="act-btn" onClick={() => setEditUser(user)} title="Edit" style={{ width:28, height:28, background:'transparent', border:`1px solid ${T.borderMed}`, borderRadius:6, color:T.textMuted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}><Edit2 size={13}/></button>
                        {!isMe && (
                          <button className="act-btn" onClick={() => setDeleteUser(user)} title="Remove" style={{ width:28, height:28, background:'transparent', border:`1px solid ${T.borderMed}`, borderRadius:6, color:T.textMuted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}><Trash2 size={13}/></button>
                        )}
                      </div>
                    </div>

                    {isIns && (
                      <div style={{ padding:'0 18px 14px', background:'#FDFAF5' }}>
                        <AiInsightPanel user={user} score={sc} company={co} onClose={() => setInsightId(null)}/>
                      </div>
                    )}
                  </div>
                )
              })
            }
          </div>

          {/* ── Footer ─────────────────────────────────────────────────────────── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, fontSize:11, color:T.textMuted }}>
            <span>Showing {filtered.length} of {users.length} users across {companiesActive} {companiesActive===1?'company':'companies'}</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#16a34a', boxShadow:'0 0 4px #16a34a' }}/>
              <span>Real-time active · AI monitoring on</span>
            </div>
          </div>

        </div>
      </div>

      {showAdd    && <AddUserModal     companies={companies} defaultCompanyId={currentCompanyId} onClose={() => setShowAdd(false)}    onSuccess={m => addToast(m,'success')}/>}
      {editUser   && <EditUserModal    user={editUser}   companies={companies} onClose={() => setEditUser(null)}   onSuccess={m => addToast(m,'success')}/>}
      {deleteUser && <ConfirmDeleteModal user={deleteUser} companies={companies} onClose={() => setDeleteUser(null)} onSuccess={m => addToast(m,'success')}/>}
      <ToastList toasts={toasts}/>
    </>
  )
}