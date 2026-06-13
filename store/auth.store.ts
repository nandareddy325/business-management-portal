// @ts-nocheck
/* eslint-disable */
const create = (fn: any) => {
  let state = fn((partial: any) => {
    state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) }
  })
  return () => state
}

type AuthStore = {
  userId: string | null
  companyId: string | null
  role: string | null
  industry: string | null
  setAuth: (data: any) => void
  clear: () => void
}

export const useAuthStore = create((set: any) => ({
  userId: null,
  companyId: null,
  role: null,
  industry: null,
  setAuth: (data: any) => set(data),
  clear: () => set({ userId: null, companyId: null, role: null, industry: null }),
}))