'use client'
import { MessageSquare } from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  category: string | null
  priority: string
  status: string
  message_count: number
  created_at: string
}

interface TicketsTableProps {
  tickets: Ticket[] | null
  loading?: boolean
  onStatusChange?: (ticketId: string, status: string) => void
}

export function TicketsTable({ tickets, loading, onStatusChange }: TicketsTableProps) {
  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading tickets...</div>
  if (!tickets || tickets.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No support tickets found</div>

  return (
    <div className="space-y-3">
      {tickets.map(ticket => {
        const priorityColor = ticket.priority === 'high' || ticket.priority === 'urgent'
          ? 'text-red-700 bg-red-50'
          : ticket.priority === 'medium'
          ? 'text-amber-700 bg-amber-50'
          : 'text-black/50 bg-black/5'
        const statusColor = ticket.status === 'open'
          ? 'bg-red-500/10 text-red-700'
          : ticket.status === 'in_progress'
          ? 'bg-blue-500/10 text-blue-700'
          : 'bg-emerald-500/10 text-emerald-700'

        return (
          <div key={ticket.id} className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2 flex-wrap">
                    <p className="text-xs font-bold text-black/60 uppercase">{ticket.ticket_number}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${priorityColor}`}>
                      {ticket.priority}
                    </span>
                    {ticket.category && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 text-black/50 capitalize">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-black/80 group-hover:text-amber-600 transition-colors">{ticket.subject}</p>
                  <p className="text-xs text-black/50 mt-1 line-clamp-2">{ticket.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <select
                  value={ticket.status}
                  onChange={(e) => onStatusChange?.(ticket.id, e.target.value)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 capitalize cursor-pointer ${statusColor}`}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <p className="text-[10px] text-black/40">{new Date(ticket.created_at).toLocaleDateString('en-IN')}</p>
                <div className="flex items-center gap-1 text-[10px] text-black/50 mt-1">
                  <MessageSquare size={12} /> {ticket.message_count}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
