// FILE 7: components/super-admin/backup/BackupHistory.tsx
// ============================================================================
'use client'
import { Database, Download, RotateCcw } from 'lucide-react'
import { Backup } from '@/types/admin'

interface BackupHistoryProps {
  backups: Backup[] | null
  loading?: boolean
}

export function BackupHistory({ backups, loading }: BackupHistoryProps) {
  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading backups...</div>
  if (!backups || backups.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No backups found</div>

  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl overflow-hidden shadow-sm divide-y divide-black/[0.04]">
      {backups.map(backup => (
        <div key={backup.id} className="px-5 sm:px-6 py-4 hover:bg-black/[0.02] transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Database size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-black/80">{backup.backup_name}</p>
                <div className="flex items-center gap-3 text-xs text-black/50 mt-2">
                  <span>{(backup.data_size_bytes || 0) / 1024 / 1024 / 1024}GB</span>
                  <span>•</span>
                  <span>{new Date(backup.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{backup.duration_seconds || 0}s</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                Completed
              </span>
              <button className="p-2 rounded-lg bg-black/5 hover:bg-amber-500/10 text-black/40 hover:text-amber-600 transition-all">
                <Download size={14} />
              </button>
              <button className="p-2 rounded-lg bg-black/5 hover:bg-emerald-500/10 text-black/40 hover:text-emerald-600 transition-all">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

