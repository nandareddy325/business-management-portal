// components/super-admin/dashboard/QuickActions.tsx
'use client'

import { Plus, Settings, Download, RotateCcw, Users, MessageSquare, Zap } from 'lucide-react'

interface QuickAction {
  icon: React.ReactNode
  label: string
  description: string
  onClick?: () => void
  color: 'amber' | 'blue' | 'emerald' | 'red' | 'purple'
}

interface QuickActionsProps {
  onActionClick?: (action: string) => void
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      icon: <Plus size={18} />,
      label: 'Add User',
      description: 'Create new admin user',
      color: 'emerald',
      onClick: () => onActionClick?.('add-user')
    },
    {
      icon: <RotateCcw size={18} />,
      label: 'Run Backup',
      description: 'Create system backup',
      color: 'blue',
      onClick: () => onActionClick?.('run-backup')
    },
    {
      icon: <MessageSquare size={18} />,
      label: 'Support Tickets',
      description: 'View pending tickets',
      color: 'amber',
      onClick: () => onActionClick?.('support-tickets')
    },
    {
      icon: <Download size={18} />,
      label: 'Export Reports',
      description: 'Download analytics',
      color: 'purple',
      onClick: () => onActionClick?.('export-reports')
    },
    {
      icon: <Zap size={18} />,
      label: 'System Health',
      description: 'Check service status',
      color: 'red',
      onClick: () => onActionClick?.('system-health')
    },
    {
      icon: <Settings size={18} />,
      label: 'Settings',
      description: 'Admin configuration',
      color: 'blue',
      onClick: () => onActionClick?.('settings')
    },
  ]

  const colorClasses = {
    amber: 'bg-amber-100 text-amber-600 hover:bg-amber-200',
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    emerald: 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200',
    red: 'bg-red-100 text-red-600 hover:bg-red-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
  }

  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-[#1C1712] tracking-tight">Quick Actions</h2>
        <p className="text-xs text-black/50 mt-1">Access common admin tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={`group relative p-4 rounded-xl border border-black/8 transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-black/20 ${colorClasses[action.color]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${colorClasses[action.color]} flex items-center justify-center transition-transform group-hover:scale-110`}>
                {action.icon}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-black/90 group-hover:text-black transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-black/60 mt-0.5 group-hover:text-black/70 transition-colors">
                  {action.description}
                </p>
              </div>
            </div>
            
            {/* Hover arrow indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 group-hover:text-black/60 transition-all opacity-0 group-hover:opacity-100">
              →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}