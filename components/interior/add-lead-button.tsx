'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { AddLeadModal } from '@/components/dashboard/add-lead-modal'

export function AddLeadButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm"
        style={{ background: 'linear-gradient(135deg, #B8860B, #D4A017)' }}
      >
        <UserPlus className="w-4 h-4" />
        Add Lead
      </button>

      <AddLeadModal
        isOpen={open}
        onClose={() => setOpen(false)}
        industry="interior-design"
        onLeadsAdded={() => {
          setOpen(false)
          window.location.reload()
        }}
      />
    </>
  )
}