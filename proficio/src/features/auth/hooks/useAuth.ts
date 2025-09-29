import { useMemo } from 'react'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const setUser = useAuthStore((s) => s.setUser)

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  return { token, user, login, logout, setUser, isAuthenticated }
}


