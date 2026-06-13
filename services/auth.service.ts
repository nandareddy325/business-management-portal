// services/auth.service.ts
// Client-side auth API calls

import { apiClient } from './api-client'

export const authClientService = {
  async signIn(email: string, password: string) {
    return apiClient.post('/api/auth/signin', { email, password })
  },

  async signOut() {
    return apiClient.post('/api/auth/signout', {})
  },

  async signUp(data: {
    email: string
    password: string
    fullName: string
    companyName: string
  }) {
    return apiClient.post('/api/auth/signup', data)
  },

  async resetPassword(email: string) {
    return apiClient.post('/api/auth/reset-password', { email })
  },

  async updatePassword(newPassword: string) {
    return apiClient.post('/api/auth/update-password', { newPassword })
  },

  async getMe() {
    return apiClient.get('/api/auth/me')
  },
}
