import { defineStore } from 'pinia'
import type { SessionUser, User, UserRole } from '@/types'

export const ACCOUNT_EXPIRED = 'ACCOUNT_EXPIRED'

export type LogoutReason = 'expired'

interface LoginResponse {
  token: string
  userRole?: UserRole
  fullName?: string
  isGuest?: boolean
  validTill?: string | null
}

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null as SessionUser | null,
    isLoggedIn: false,
    token: '' as string
  }),

  getters: {
    role: state => state.user?.role,
    isAdmin: state => state.user?.role === 'admin' || state.user?.role === 'superAdmin',
    isGuest: state => !!state.user?.isGuest || state.user?.role === 'guest',
    // Guests get read/write access but may never delete anything.
    canDelete(): boolean {
      return !this.isGuest
    }
  },

  actions: {
    // An action, not a getter: getters are cached and Date.now() is not reactive.
    hasGuestExpired() {
      const validTill = this.user?.isGuest ? this.user.validTill : null
      return !!validTill && new Date(validTill).getTime() <= Date.now()
    },

    async login(credentials: User): Promise<{ isLoggedIn: boolean, code?: string }> {
      try {
        const res: LoginResponse = await useAxios().$post('/api/v2/auth/login', credentials)
        if (res?.token) {
          this.user = {
            email: credentials.email,
            fullName: res.fullName,
            role: res.userRole,
            isGuest: !!res.isGuest,
            validTill: res.validTill ?? null
          }
          this.token = res.token
          this.isLoggedIn = true
        }
        return { isLoggedIn: this.isLoggedIn }
      } catch (error) {
        const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code
        return { isLoggedIn: false, code }
      }
    },

    logout(reason?: LogoutReason) {
      this.user = null
      this.isLoggedIn = false
      this.token = ''
      localStorage.clear()
      return navigateTo(reason ? { path: '/auth/login', query: { reason } } : '/auth/login')
    }
  },

  persist: {
    storage: localStorage
  }
})
