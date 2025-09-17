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

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  login: async ({ email, password }) => {
    const { token, user } = await authService.login({ email, password })
    set({ token, user })
  },
  logout: () => set({ token: null, user: null }),
  setUser: (user) => set({ user }),
}))


