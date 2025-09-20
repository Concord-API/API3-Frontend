import { ROLES, type UserRole } from '@/shared/constants/roles'
import { HomeColaborador } from '@/features/dashboard/pages/HomeColaborador'
import { HomeGestor } from '@/features/dashboard/pages/HomeGestor'
import { HomeDiretor } from '@/features/dashboard/pages/HomeDiretor'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Users } from '@/features/dashboard/pages/Users'
import { Settings } from '@/features/dashboard/pages/Settings'
import { PerfilColaborador } from '@/features/dashboard/pages/PerfilColaborador'

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
  { path: '', element: <HomeByRole />, label: 'Home', allowedRoles: [ROLES.COLABORADOR, ROLES.GESTOR, ROLES.DIRETOR] },
  { path: 'perfil', element: <PerfilColaborador />, label: 'Perfil', allowedRoles: [ROLES.COLABORADOR] },
  { path: 'users', element: <Users />, label: 'Users', allowedRoles: [ROLES.GESTOR, ROLES.DIRETOR] },
  { path: 'settings', element: <Settings />, label: 'Settings', allowedRoles: [ROLES.COLABORADOR, ROLES.GESTOR, ROLES.DIRETOR] },
]

export function getRoutesForRole(role: UserRole): DashboardRoute[] {
  return dashboardRoutes.filter((r) => r.allowedRoles.includes(role))
}

export function getDefaultRouteForRole(role: UserRole): string {
  const first = getRoutesForRole(role)[0]
  return `/dashboard/${first?.path ?? ''}`.replace(/\/$/, '')
}


