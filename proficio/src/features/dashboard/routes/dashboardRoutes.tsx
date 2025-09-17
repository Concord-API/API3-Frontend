import { ROLES, type UserRole } from '@/shared/constants/roles'
import { Home } from '@/features/dashboard/pages/Home'
import { Users } from '@/features/dashboard/pages/Users'
import { Settings } from '@/features/dashboard/pages/Settings'

export type DashboardRoute = {
  path: string
  element: React.ReactNode
  label: string
  icon?: React.ComponentType<any>
  allowedRoles: UserRole[]
}

export const dashboardRoutes: DashboardRoute[] = [
  { path: '', element: <Home />, label: 'Home', allowedRoles: [ROLES.FUNCIONARIO, ROLES.GESTOR, ROLES.DIRETOR] },
  { path: 'users', element: <Users />, label: 'Users', allowedRoles: [ROLES.GESTOR, ROLES.DIRETOR] },
  { path: 'settings', element: <Settings />, label: 'Settings', allowedRoles: [ROLES.FUNCIONARIO, ROLES.GESTOR, ROLES.DIRETOR] },
]

export function getRoutesForRole(role: UserRole): DashboardRoute[] {
  return dashboardRoutes.filter((r) => r.allowedRoles.includes(role))
}

export function getDefaultRouteForRole(role: UserRole): string {
  const first = getRoutesForRole(role)[0]
  return `/dashboard/${first?.path ?? ''}`.replace(/\/$/, '')
}


