import { create } from 'zustand'

type AuthStore = {
  userId: string | null
  companyId: string | null
  role: string | null
  industry: string | null
  setAuth: (data: Partial<Omit<AuthStore, 'setAuth' | 'clear'>>) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  companyId: null,
  role: null,
  industry: null,
  setAuth: (data) => set(data),
  clear: () => set({ userId: null, companyId: null, role: null, industry: null }),
}))