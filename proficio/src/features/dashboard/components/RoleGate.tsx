import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserRole } from '@/shared/constants/roles'

type RoleGateProps = {
  allowed: UserRole[]
  children: React.ReactNode
  fallbackTo?: string
}

export function RoleGate({ allowed, children, fallbackTo = '/dashboard' }: RoleGateProps) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allowed.includes(user.role)) return <Navigate to={fallbackTo} replace />
  return <>{children}</>
}


