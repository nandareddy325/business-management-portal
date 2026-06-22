'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import CREWorkReportModal from '@/components/dashboard/CREWorkReportModal'

const GRADIENTS = [
  ['#7C3AED','#4F46E5'],['#0891B2','#0E7490'],['#059669','#047857'],
  ['#D97706','#B45309'],['#DB2777','#BE185D'],
]

const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0,2).toUpperCase() || '?'

export function CRMTeamSection({ crmTeam, leadBase }: { crmTeam: any[]; leadBase: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{ id: string; full_name: string; email?: string } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function handleNameClick(member: any) {
    setSelectedMember({
      id: member.id,
      full_name: member.name,
      email: member.email,
    })
    setModalOpen(true)
  }

  return (
    <div>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between mb-3 group">
        <p className="text-[10px] font-bold uppercase tracking-[4px]" style={{ color: '#B8860B' }}>
          CRM Team
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#FFFBEB', color: '#B8860B' }}>
            {crmTeam.length} members
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{ color: '#B8860B', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          {crmTeam.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-1">👥</p>
              <p className="text-sm text-[#9A8F82]">No team members found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE0]">
              {crmTeam.map((member: any, i: number) => {
                const g = GRADIENTS[i % GRADIENTS.length]
                return (
                  <div key={member.id} className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                        {ini(member.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Clickable Name */}
                        <button
                          onClick={() => handleNameClick(member)}
                          className="group/name flex items-center gap-1.5"
                        >
                          <p className="text-sm font-bold text-[#1C1712] underline decoration-dotted underline-offset-2 group-hover/name:text-[#B8860B] transition-colors">
                            {member.name}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full opacity-0 group-hover/name:opacity-100 transition-opacity font-medium"
                            style={{ background: '#FFFBEB', color: '#B8860B' }}>
                            view report
                          </span>
                        </button>

                        <p className="text-[10px] text-[#9A8F82] mt-0.5">{member.email}</p>

                        {/* Call counts */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ background: member.todayCount > 0 ? '#F0FDF4' : '#F5F0E8' }}>
                            <span className="text-[10px]">📞</span>
                            <span className="text-[10px] font-black"
                              style={{ color: member.todayCount > 0 ? '#16A34A' : '#9A8F82' }}>
                              {member.todayCount} today
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ background: member.yestCount > 0 ? '#FFFBEB' : '#F5F0E8' }}>
                            <span className="text-[10px]">📋</span>
                            <span className="text-[10px] font-black"
                              style={{ color: member.yestCount > 0 ? '#D97706' : '#9A8F82' }}>
                              {member.yestCount} yesterday
                            </span>
                          </div>
                        </div>

                        {/* Last call */}
                        {member.lastCallLead && member.lastCallId ? (
                          <Link href={`${leadBase}/${member.lastCallId}`}>
                            <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl w-fit hover:bg-[#F0FDF4] transition-colors"
                              style={{ background: '#F7F5F1', border: '1px solid #E8E2D8' }}>
                              <span className="text-[9px]">🕐</span>
                              <span className="text-[9px] font-bold text-[#1C1712] truncate max-w-[150px]">
                                {member.lastCallLead}
                              </span>
                              <span className="text-[9px] text-[#C4BAB0]">
                                · {new Date(member.lastCallTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </Link>
                        ) : (
                          <p className="text-[9px] text-[#C4BAB0] mt-2">No calls logged yet</p>
                        )}
                      </div>

                      {/* Total badge */}
                      <div className="flex-shrink-0 text-right">
                        <span className="text-lg font-black"
                          style={{ color: member.totalCalls > 0 ? g[0] : '#C4BAB0' }}>
                          {member.totalCalls}
                        </span>
                        <p className="text-[8px] text-[#C4BAB0]">total</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-[#F0EBE0] flex items-center justify-between"
            style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">{crmTeam.length} team members</p>
            <p className="text-[10px] text-[#B8B0A0]">Based on activity logs</p>
          </div>
        </div>
      )}

      {/* Today's Work Report Modal */}
      <CREWorkReportModal
        user={selectedMember}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedMember(null)
        }}
      />
    </div>
  )
}