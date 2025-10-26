import { create } from 'zustand'
import { authService } from '../services/authService'
import type { UserRole } from '@/shared/constants/roles'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  login: (args: { email: string; password: string }) => Promise<void>
  logout: () => void
  setUser: (user: AuthUser | null) => void
}

function loadInitialAuth(): { token: string | null; user: AuthUser | null } {
  let token: string | null = null
  let user: AuthUser | null = null
  try {
    token = localStorage.getItem('auth_token')
  } catch {}
  try {
    const raw = localStorage.getItem('auth_user')
    if (raw) user = JSON.parse(raw)
  } catch {}
  return { token, user }
}

export const useAuthStore = create<AuthState>((set) => {
  const initial = loadInitialAuth()
  return {
    token: initial.token,
    user: initial.user,
    login: async ({ email, password }) => {
      const { token, user } = await authService.login({ email, password })
      try {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user))
      } catch {}
      set({ token, user })
    },
    logout: () => {
      try {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      } catch {}
      set({ token: null, user: null })
    },
    setUser: (user) => {
      try {
        if (user) localStorage.setItem('auth_user', JSON.stringify(user))
        else localStorage.removeItem('auth_user')
      } catch {}
      set({ user })
    },
  }
})


