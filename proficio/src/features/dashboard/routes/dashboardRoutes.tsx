import { ROLES, type UserRole } from '@/shared/constants/roles'
import { HomeColaborador } from '@/features/dashboard/pages/HomeColaborador'
import { HomeGestor } from '@/features/dashboard/pages/HomeGestor'
import { HomeDiretor } from '@/features/dashboard/pages/HomeDiretor'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Users } from '@/features/dashboard/pages/Users'
import { Competencias } from '@/features/dashboard/pages/Competencias'
import { PerfilColaborador } from '@/features/dashboard/pages/PerfilColaborador'
import { Home, User, Users as UsersIcon, Sparkles } from 'lucide-react'

export type DashboardRoute = {
  path: string
  element: React.ReactNode
  label: string
  icon?: React.ComponentType<any>
  allowedRoles: UserRole[]
}

function HomeByRole() {
  const { user } = useAuth()
  if (user?.role === ROLES.GESTOR) return <HomeGestor />
  if (user?.role === ROLES.DIRETOR) return <HomeDiretor />
  return <HomeColaborador />
}

export const dashboardRoutes: DashboardRoute[] = [
  { path: '', element: <HomeByRole />, label: 'Home', icon: Home, allowedRoles: [ROLES.COLABORADOR, ROLES.GESTOR, ROLES.DIRETOR] },
  { path: 'perfil', element: <PerfilColaborador />, label: 'Perfil', icon: User, allowedRoles: [ROLES.COLABORADOR] },
  { path: 'competencias', element: <Competencias />, label: 'Competências', icon: Sparkles, allowedRoles: [ROLES.COLABORADOR] },
  { path: 'users', element: <Users />, label: 'Users', icon: UsersIcon, allowedRoles: [ROLES.GESTOR, ROLES.DIRETOR] },
]

export function getRoutesForRole(role: UserRole): DashboardRoute[] {
  return dashboardRoutes.filter((r) => r.allowedRoles.includes(role))
}

export function getDefaultRouteForRole(role: UserRole): string {
  const first = getRoutesForRole(role)[0]
  return `/dashboard/${first?.path ?? ''}`.replace(/\/$/, '')
}


