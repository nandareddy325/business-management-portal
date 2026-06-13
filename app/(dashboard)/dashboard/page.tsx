'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    const redirectUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      router.replace('/dashboard/industries/interior-design')
    }

    redirectUser()
  }, [router])

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#7A6E60]">
          Loading your dashboard...
        </p>
      </div>
    </div>
  )
}