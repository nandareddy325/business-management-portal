'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, IndianRupee, Calendar, Zap, UserCircle2 } from 'lucide-react'

type Project = {
  id: string
  project_name: string
  client_name: string | null
  budget: number | null
  status: string | null
  start_date: string | null
  end_date: string | null
  deadline: string | null
  created_at: string
  source: 'lead_won' | 'manual' | null
  assigned_to: string | null
  notes: string | null
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
]

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  planning:    { bg: '#EDE8DF', text: '#7A6E60', label: 'Planning' },
  in_progress: { bg: '#FFF4D6', text: '#B8860B', label: 'In Progress' },
  completed:   { bg: '#DFF3E3', text: '#2F9E4F', label: 'Completed' },
  on_hold:     { bg: '#FBE3E3', text: '#C24444', label: 'On Hold' },
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function healthBadge(project: Project) {
  if (project.status === 'completed') return null

  const age = daysSince(project.created_at)
  const deadline = project.deadline ? new Date(project.deadline) : null
  const daysToDeadline = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  // Deadline missed
  if (daysToDeadline !== null && daysToDeadline < 0) {
    return { label: `Overdue ${Math.abs(daysToDeadline)}d`, bg: '#FBE3E3', text: '#C24444' }
  }
  // Deadline close
  if (daysToDeadline !== null && daysToDeadline <= 7) {
    return { label: `Due in ${daysToDeadline}d`, bg: '#FFF4D6', text: '#B8860B' }
  }
  // Stale — no deadline set but sitting a long time
  if (!deadline && age > 30) {
    return { label: `Stale ${age}d`, bg: '#FBE3E3', text: '#C24444' }
  }
  if (age <= 14) {
    return { label: 'On track', bg: '#DFF3E3', text: '#2F9E4F' }
  }
  return null
}

function formatCurrency(n: number | null) {
  if (!n) return '—'
  return '₹' + n.toLocaleString('en-IN')
}

export function ProjectsListClient({ initialProjects }: { initialProjects: Project[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'budget_high' | 'budget_low' | 'deadline'>('recent')

  const filtered = useMemo(() => {
    let list = [...initialProjects]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p =>
        p.project_name?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter)
    }

    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'budget_high') {
      list.sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0))
    } else if (sortBy === 'budget_low') {
      list.sort((a, b) => (a.budget ?? 0) - (b.budget ?? 0))
    } else if (sortBy === 'deadline') {
      list.sort((a, b) => {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    }

    return list
  }, [initialProjects, search, statusFilter, sortBy])

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8F82]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client or project name..."
            className="w-full bg-white border border-[#DDD5C4] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]"
        >
          <option value="recent">Most Recent</option>
          <option value="budget_high">Budget: High to Low</option>
          <option value="budget_low">Budget: Low to High</option>
          <option value="deadline">Deadline: Soonest</option>
        </select>
      </div>

      <p className="text-xs text-[#9A8F82]">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>

      {/* Projects grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#DDD5C4] rounded-2xl">
          <p className="text-sm text-[#9A8F82]">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => {
            const statusStyle = STATUS_STYLES[project.status ?? 'planning'] ?? STATUS_STYLES.planning
            const health = healthBadge(project)
            return (
              <Link
                key={project.id}
                href={`/dashboard/industries/interior-design/projects/${project.id}`}
                className="block bg-white border border-[#E2D9C8] rounded-2xl p-4 hover:border-[#B8860B] transition-colors no-underline"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-[#1C1712] leading-tight">
                    {project.project_name}
                  </h3>
                  {project.source === 'lead_won' && (
                    <span title="Auto-created from won lead" className="flex-shrink-0">
                      <Zap className="w-3.5 h-3.5 text-[#B8860B]" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#7A6E60] mb-3 flex items-center gap-1">
                  <UserCircle2 className="w-3.5 h-3.5" />
                  {project.client_name || 'No client name'}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: statusStyle.bg, color: statusStyle.text }}
                  >
                    {statusStyle.label}
                  </span>
                  {health && (
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: health.bg, color: health.text }}
                    >
                      {health.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#7A6E60] pt-3 border-t border-[#F0EBE2]">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {formatCurrency(project.budget)}
                  </span>
                  {project.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}