'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Phone,
  PhoneMissed,
  CalendarClock,
  MapPin,
  FileText,
  Trophy,
  ThumbsDown,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react'

interface CREUser {
  id: string
  full_name: string
  email?: string
  avatar_url?: string
}

interface WorkStats {
  calls: number
  rnr: number
  followUps: number
  siteVisits: number
  quotations: number
  won: number
  lost: number
}

interface Props {
  user: CREUser | null
  open: boolean
  onClose: () => void
}

const STAT_CARDS = [
  {
    key: 'calls' as keyof WorkStats,
    label: 'Total Calls',
    icon: Phone,
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    key: 'rnr' as keyof WorkStats,
    label: 'RNR',
    icon: PhoneMissed,
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
  {
    key: 'followUps' as keyof WorkStats,
    label: 'Follow-ups',
    icon: CalendarClock,
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    key: 'siteVisits' as keyof WorkStats,
    label: 'Site Visits',
    icon: MapPin,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
  {
    key: 'quotations' as keyof WorkStats,
    label: 'Quotations',
    icon: FileText,
    color: '#EC4899',
    bg: '#FDF2F8',
    border: '#FBCFE8',
  },
  {
    key: 'won' as keyof WorkStats,
    label: 'Won',
    icon: Trophy,
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
  {
    key: 'lost' as keyof WorkStats,
    label: 'Lost',
    icon: ThumbsDown,
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
]

export default function CREWorkReportModal({ user, open, onClose }: Props) {
  const supabase = createClientSupabaseClient()
  const router = useRouter()
  const [stats, setStats] = useState<WorkStats | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchTodayStats(userId: string) {
    setLoading(true)
    setStats(null)

    // Get today's date range in ISO format
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('lead_activities')
      .select('type, outcome')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())

    if (error) {
      console.error('Error fetching activities:', error)
      setLoading(false)
      return
    }

    const activities = data || []

    const result: WorkStats = {
      calls: activities.filter(a => a.type === 'call').length,
      rnr: activities.filter(a => a.type === 'call' && a.outcome === 'rnr').length,
      followUps: activities.filter(
        a =>
          a.type === 'call' &&
          ['callback_tomorrow', 'callback_2weeks', 'callback_3months'].includes(a.outcome)
      ).length,
      siteVisits: activities.filter(a => a.type === 'site_visit').length,
      quotations: activities.filter(a => a.type === 'quotation').length,
      won: activities.filter(a => a.outcome === 'won' || a.type === 'won').length,
      lost: activities.filter(a => a.outcome === 'lost' || a.type === 'lost').length,
    }

    setStats(result)
    setLoading(false)
  }

  useEffect(() => {
    if (open && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch when modal opens
      fetchTodayStats(user.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch fn is stable-in-practice, only rerun on listed deps
  }, [open, user])


  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const totalActivity = stats
    ? stats.calls + stats.siteVisits + stats.quotations + stats.won + stats.lost
    : 0

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="max-w-2xl w-full p-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        style={{ background: '#FAFAF8' }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5"
          style={{
            background: 'linear-gradient(135deg, #1C1712 0%, #2D2416 100%)',
          }}
        >
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: '#B8860B', color: '#1C1712' }}
                >
                  {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <DialogTitle
                    className="text-white text-lg font-semibold leading-tight"
                  >
                    {user?.full_name}
                  </DialogTitle>
                  <p className="text-xs mt-0.5" style={{ color: '#B8860B' }}>
                    Today&apos;s Work Report
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>

            {/* Date + activity summary */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                📅 {today}
              </p>
              {!loading && stats && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: '#B8860B22', color: '#B8860B' }}
                >
                  {totalActivity} activit{totalActivity === 1 ? 'y' : 'ies'} logged
                </span>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: '#B8860B' }} />
              <p className="text-sm text-gray-400">Loading today&apos;s report…</p>
            </div>
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {STAT_CARDS.slice(0, 4).map(card => {
                  const Icon = card.icon
                  const value = stats[card.key]
                  return (
                    <div
                      key={card.key}
                      className="rounded-xl p-3.5 border flex flex-col gap-2 transition-shadow hover:shadow-md"
                      style={{
                        background: card.bg,
                        borderColor: card.border,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: card.color + '20' }}
                      >
                        <Icon size={15} style={{ color: card.color }} />
                      </div>
                      <div>
                        <p
                          className="text-2xl font-bold leading-none"
                          style={{ color: card.color }}
                        >
                          {value}
                        </p>
                        <p className="text-xs mt-1 text-gray-500 font-medium">
                          {card.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {STAT_CARDS.slice(4).map(card => {
                  const Icon = card.icon
                  const value = stats[card.key]
                  return (
                    <div
                      key={card.key}
                      className="rounded-xl p-3.5 border flex flex-col gap-2 transition-shadow hover:shadow-md"
                      style={{
                        background: card.bg,
                        borderColor: card.border,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: card.color + '20' }}
                      >
                        <Icon size={15} style={{ color: card.color }} />
                      </div>
                      <div>
                        <p
                          className="text-2xl font-bold leading-none"
                          style={{ color: card.color }}
                        >
                          {value}
                        </p>
                        <p className="text-xs mt-1 text-gray-500 font-medium">
                          {card.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Zero-state nudge */}
              {totalActivity === 0 && (
                <div
                  className="mt-4 rounded-xl px-4 py-3 text-sm text-center border"
                  style={{
                    background: '#FEF3C7',
                    borderColor: '#FDE68A',
                    color: '#92400E',
                  }}
                >
                  No activities logged today yet.
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              Failed to load report. Please try again.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: '#E5E7EB', background: '#FFFFFF' }}
        >
          <p className="text-xs text-gray-400">Showing data for today only</p>
          <button
            onClick={() => {
              onClose()
              router.push(`/crm/activity/${user?.id}`)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
            style={{ background: '#1C1712' }}
          >
            <ExternalLink size={13} />
            View Full Activity
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}