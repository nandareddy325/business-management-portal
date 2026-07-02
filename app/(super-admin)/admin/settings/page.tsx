// app/(super-admin)/admin/settings/page.tsx
'use client'

import { useState } from 'react'
import { Shield, Bell, Database, Globe, Lock, ChevronRight, Activity, Server, Users, Building2, Zap, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear all cached data? This will force a refresh.')) return
    
    setLoading('cache')
    try {
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      
      // Clear localStorage
      localStorage.clear()
      
      // Revalidate all data
      await fetch('/api/revalidate', { method: 'POST' })
      
      setMessage({ type: 'success', text: '✅ Cache cleared successfully! Reloading...' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error clearing cache: ' + String(error) })
    } finally {
      setLoading(null)
    }
  }

  const handleMaintenanceMode = async () => {
    if (!window.confirm('Enable Maintenance Mode? All tenants will be temporarily blocked.')) return
    
    setLoading('maintenance')
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      })
      
      if (!response.ok) throw new Error('Failed to enable maintenance mode')
      
      setMessage({ type: 'success', text: '✅ Maintenance mode enabled!' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error: ' + String(error) })
    } finally {
      setLoading(null)
    }
  }

  const handleResetPlatform = async () => {
    const confirmText = prompt('⚠️ TYPE "RESET EVERYTHING" to confirm. This is IRREVERSIBLE!')
    if (confirmText !== 'RESET EVERYTHING') {
      setMessage({ type: 'error', text: '❌ Confirmation failed' })
      return
    }
    
    setLoading('reset')
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) throw new Error('Failed to reset platform')
      
      setMessage({ type: 'success', text: '✅ Platform reset complete. Redirecting...' })
      setTimeout(() => window.location.href = '/', 2000)
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error: ' + String(error) })
    } finally {
      setLoading(null)
    }
  }

  const now = new Date()
  const lastLogin = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE8DE 100%)' }}>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-[#B8860B] flex items-center justify-center">
                <Shield size={11} className="text-white" />
              </div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B]">Super Admin · Settings</p>
            </div>
            <h1 className="font-serif text-3xl text-[#1C1712]">Platform Configuration</h1>
            <p className="text-sm text-[#9A8F82] mt-1">Real-time platform health & system preferences</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Live · All Systems Go</span>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="text-sm font-semibold">{message.text}</p>
          </div>
        )}

        {/* Premium Admin Profile */}
        <div className="rounded-3xl overflow-hidden shadow-xl relative" style={{ background: 'linear-gradient(135deg, #1C1712 0%, #2C2218 50%, #1C1712 100%)' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(184,134,11,0.2), transparent 50%), radial-gradient(circle at 85% 15%, rgba(184,134,11,0.1), transparent 50%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B8860B, transparent)' }} />
          
          <div className="relative p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #B8860B, #D4A520, #B8860B)' }}>
                  S
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-[#1C1712] flex items-center justify-center">
                  <CheckCircle size={12} className="text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white">Super Admin</h2>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
                    style={{ background: 'rgba(184,134,11,0.2)', color: '#F0C040', border: '1px solid rgba(184,134,11,0.3)' }}>
                    ⚡ Super Admin
                  </span>
                </div>
                <p className="text-white/50 text-sm mb-4">admin@gkcrm.in</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-white/30" />
                    <span className="text-[11px] text-white/40">Last login: {lastLogin}</span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Active session</span>
                  </div>
                </div>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Companies', value: '12', icon: Building2, color: '#60A5FA' },
                  { label: 'Users', value: '45', icon: Users, color: '#34D399' },
                ].map(s => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="rounded-xl px-4 py-3 text-center"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Icon size={14} style={{ color: s.color }} className="mx-auto mb-1" />
                      <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">{s.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Database', uptime: '99.9%', status: 'Healthy', icon: Database, color: '#34D399', bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20' },
            { label: 'Auth Service', uptime: '100%', status: 'Healthy', icon: Lock, color: '#60A5FA', bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20' },
            { label: 'Realtime', uptime: '99.7%', status: 'Healthy', icon: Activity, color: '#A78BFA', bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/20' },
            { label: 'Storage', uptime: '100%', status: 'Healthy', icon: Server, color: '#F59E0B', bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className={`relative rounded-2xl border ${item.border} bg-white overflow-hidden p-4 shadow-sm`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} pointer-events-none`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={16} style={{ color: item.color }} />
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: item.color }} />
                      <span className="text-[9px] font-bold" style={{ color: item.color }}>LIVE</span>
                    </div>
                  </div>
                  <p className="text-lg font-black text-[#1C1712]">{item.uptime}</p>
                  <p className="text-[10px] text-[#9A8F82] font-medium">{item.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Platform Settings */}
          <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
              <div className="w-8 h-8 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <Globe size={15} className="text-[#B8860B]" />
              </div>
              <div>
                <h2 className="font-serif text-sm font-bold text-[#1C1712]">Platform Settings</h2>
                <p className="text-[10px] text-[#9A8F82]">Core configuration</p>
              </div>
            </div>
            <div className="divide-y divide-[#F0EBE0]">
              {[
                { label: 'Platform Name', value: 'GK CRM' },
                { label: 'Support Email', value: 'support@gkcrm.in' },
                { label: 'Default Trial Days', value: '14 days' },
                { label: 'Plan', value: 'Enterprise' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FFFBEF] transition-colors group cursor-pointer">
                  <p className="text-xs font-semibold text-[#1C1712]">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#9A8F82]">{item.value}</span>
                    <ChevronRight size={12} className="text-[#D3CBBB] group-hover:text-[#B8860B] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
              <div className="w-8 h-8 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <Lock size={15} className="text-[#B8860B]" />
              </div>
              <div>
                <h2 className="font-serif text-sm font-bold text-[#1C1712]">Security</h2>
                <p className="text-[10px] text-[#9A8F82]">Access & protection</p>
              </div>
            </div>
            <div className="divide-y divide-[#F0EBE0]">
              {[
                { label: 'Two-Factor Auth', value: 'Enabled', type: 'green' },
                { label: 'Session Timeout', value: '24 hours', type: 'text' },
                { label: 'IP Whitelist', value: 'Disabled', type: 'gray' },
                { label: 'RLS Policies', value: 'Active', type: 'green' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FFFBEF] transition-colors group cursor-pointer">
                  <p className="text-xs font-semibold text-[#1C1712]">{item.label}</p>
                  <div className="flex items-center gap-2">
                    {item.type === 'green' && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{item.value}</span>}
                    {item.type === 'gray' && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F5F0E8] text-[#9A8F82]">{item.value}</span>}
                    {item.type === 'text' && <span className="text-xs text-[#9A8F82]">{item.value}</span>}
                    <ChevronRight size={12} className="text-[#D3CBBB] group-hover:text-[#B8860B] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-200 shadow-sm overflow-hidden bg-white">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={15} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-red-700">Danger Zone</h2>
              <p className="text-[10px] text-red-400">Irreversible actions — proceed with caution</p>
            </div>
          </div>
          <div className="divide-y divide-red-50">
            {[
              { 
                label: 'Clear All Cache', 
                sub: 'Force refresh all cached data across platform',
                onClick: handleClearCache,
                loading: 'cache',
                btn: 'Clear Cache', 
                style: 'border border-[#E8E2D8] text-[#1C1712] hover:border-[#B8860B] hover:text-[#B8860B]' 
              },
              { 
                label: 'Maintenance Mode', 
                sub: 'Temporarily disable access for all tenants',
                onClick: handleMaintenanceMode,
                loading: 'maintenance',
                btn: 'Enable Mode', 
                style: 'border border-amber-300 text-amber-700 hover:bg-amber-50' 
              },
              { 
                label: 'Reset Platform', 
                sub: 'This action is irreversible. All tenant data will be permanently deleted.',
                onClick: handleResetPlatform,
                loading: 'reset',
                btn: 'Reset Everything', 
                style: 'border border-red-300 text-red-600 hover:bg-red-50' 
              },
            ].map(action => (
              <div key={action.label} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-[#1C1712]">{action.label}</p>
                  <p className="text-xs text-[#9A8F82] mt-0.5 max-w-md">{action.sub}</p>
                </div>
                <button 
                  onClick={action.onClick}
                  disabled={loading !== null}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${action.style}`}
                >
                  {loading === action.loading ? '⏳ Processing...' : action.btn}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}