'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, Plus, RefreshCw } from 'lucide-react'
import { BackupHistory } from '@/components/super-admin/backup'

interface Company {
  id: string
  name: string
}

interface Backup {
  id: string
  backup_name: string
  status: string
  data_size_bytes: number | null
  duration_seconds: number | null
  created_at: string
  total_records_backed_up: number | null
  error_message: string | null
}

interface Stats {
  total_backups: number
  completed_backups: number
  failed_backups: number
  total_data_size_gb: number
}

export default function BackupPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [backups, setBackups] = useState<Backup[]>([])
  const [stats, setStats] = useState<Stats>({
    total_backups: 0,
    completed_backups: 0,
    failed_backups: 0,
    total_data_size_gb: 0,
  })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async (companyId: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (companyId) params.set('company_id', companyId)
      const res = await fetch(`/api/admin/backup/list?${params}`)
      const json = await res.json()
      setCompanies(json.companies || [])
      setBackups(json.backups || [])
      setStats(json.stats || stats)
    } catch (error) {
      console.error('Error fetching backup data:', error)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable fetch, only companyId matters
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount-driven sync
    fetchData(selectedCompany)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when selected company changes
  }, [selectedCompany])

  const handleCreateBackup = async () => {
    if (!selectedCompany) {
      setMessage({ type: 'error', text: 'ముందు company select చేయి' })
      return
    }
    setCreating(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: selectedCompany }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: json.error || 'Backup failed' })
      } else {
        setMessage({ type: 'success', text: `Backup created — ${json.backup?.total_records_backed_up ?? 0} records` })
        fetchData(selectedCompany)
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      setMessage({ type: 'error', text: 'Backup failed' })
    } finally {
      setCreating(false)
    }
  }

  const handleDownload = async (backupId: string) => {
    try {
      const res = await fetch(`/api/admin/backup/download?id=${backupId}`)
      const json = await res.json()
      if (json.url) {
        window.open(json.url, '_blank')
      } else {
        setMessage({ type: 'error', text: json.error || 'Download link failed' })
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      setMessage({ type: 'error', text: 'Download failed' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Database size={11} className="text-blue-600" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-blue-700/70">Protection</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1C1712]">Backup Management</h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-black/10 text-xs font-semibold text-black/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-w-[180px]"
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => fetchData(selectedCompany)}
              disabled={loading}
              className="p-2 rounded-lg bg-black/5 hover:bg-black/10 text-black/50 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleCreateBackup}
              disabled={creating || !selectedCompany}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {creating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {creating ? 'Creating...' : 'Create Backup'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {message && (
          <div className={`px-4 py-3 rounded-lg text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {!selectedCompany ? (
          <div className="bg-white ring-1 ring-black/8 rounded-2xl p-10 text-center text-sm text-black/50">
            Backup చూడాలంటే పైన company select చేయి. ఇందులో ఆ tenant యొక్క leads, employees, invoices export అవుతాయి.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <StatCard label="Total Backups" value={stats.total_backups} />
              <StatCard label="Completed" value={stats.completed_backups} color="emerald" />
              <StatCard label="Failed" value={stats.failed_backups} color="red" />
              <StatCard label="Total Size" value={`${stats.total_data_size_gb.toFixed(4)}GB`} color="blue" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#1C1712] mb-4">Recent Backups</h2>
              <BackupHistory backups={backups} loading={loading} onDownload={handleDownload} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'black' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-semibold text-black/60 uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${
        color === 'emerald' ? 'text-emerald-700' :
        color === 'red' ? 'text-red-700' :
        color === 'blue' ? 'text-blue-700' :
        'text-black/80'
      }`}>{value}</p>
    </div>
  )
}
