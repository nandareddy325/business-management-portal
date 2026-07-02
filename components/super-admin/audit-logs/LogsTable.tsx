// FILE 1: components/super-admin/audit-logs/LogsTable.tsx
// ============================================================================
'use client'

import { AuditLog } from '@/types/admin'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface LogsTableProps {
  logs: AuditLog[] | null
  loading?: boolean
}

export function LogsTable({ logs, loading }: LogsTableProps) {
  if (loading) {
    return (
      <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 shadow-sm text-center">
        <p className="text-sm text-black/50">Loading audit logs...</p>
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 shadow-sm text-center">
        <p className="text-sm text-black/50">No audit logs found</p>
      </div>
    )
  }

  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/8 bg-black/2">
              <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase tracking-widest">Action</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase tracking-widest">User</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase tracking-widest">Timestamp</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-black/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-black/80">{log.action}</p>
                    <p className="text-[10px] text-black/40 mt-0.5">{log.action_type}</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs font-medium text-black/70">
                  {log.user?.email || 'Unknown'}
                </td>
                <td className="px-5 py-3 text-xs font-medium text-black/50">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(log.created_at).toLocaleDateString('en-IN')} {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    log.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : log.status === 'failed'
                      ? 'bg-red-500/10 text-red-700'
                      : 'bg-amber-500/10 text-amber-700'
                  }`}>
                    {log.status === 'success' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

