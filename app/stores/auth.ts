import { defineStore } from 'pinia'
import type { User } from '@/types'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false,
    token: '' as string
  }),

  actions: {
    async login(user: User) {
      try {
        const { token } = await useAxios().$post('/api/v2/auth/login', user)
        if (token) {
          this.user = user
          this.token = token
          this.isLoggedIn = !!token
        }
        return { isLoggedIn: this.isLoggedIn }
      } catch {
        //
      }
    },

    logout() {
      this.user = null
      this.isLoggedIn = false
      this.token = ''
      return navigateTo('/auth/login')
    }
  },

  persist: {
    storage: localStorage
  }
})
