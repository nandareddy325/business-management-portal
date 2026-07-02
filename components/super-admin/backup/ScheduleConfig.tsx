// FILE 8: components/super-admin/backup/ScheduleConfig.tsx
// ============================================================================
'use client'
import { Calendar, Save } from 'lucide-react'

interface BackupSchedule {
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  enabled: boolean
}

interface ScheduleConfigProps {
  schedule?: BackupSchedule
  onSave?: (schedule: BackupSchedule) => void
}

export function ScheduleConfig({ schedule, onSave }: ScheduleConfigProps) {
  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Calendar size={16} className="text-amber-600" />
        <h3 className="text-sm font-bold text-black/80">Backup Schedule</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-black/60 uppercase">Frequency</label>
          <select className="w-full mt-2 px-3 py-2 rounded-lg bg-black/3 border border-black/8 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-amber-500/50">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-black/60 uppercase">Time</label>
          <input type="time" defaultValue={schedule?.time || '02:00'} className="w-full mt-2 px-3 py-2 rounded-lg bg-black/3 border border-black/8 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-black/8">
          <input type="checkbox" defaultChecked={schedule?.enabled} id="auto-backup" className="w-4 h-4 rounded" />
          <label htmlFor="auto-backup" className="text-xs font-medium text-black/70">Enable automatic backups</label>
        </div>

        <button className="w-full px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 mt-4">
          <Save size={14} /> Save Schedule
        </button>
      </div>
    </div>
  )
}

