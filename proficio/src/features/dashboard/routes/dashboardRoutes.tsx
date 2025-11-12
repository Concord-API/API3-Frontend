import { Roles, type UserRole } from '@/shared/constants/roles'
import { HomeColaborador } from '@/features/dashboard/pages/HomeColaborador'
import { HomeGestor } from '@/features/dashboard/pages/HomeGestor'
import { HomeDiretor } from '@/features/dashboard/pages/HomeDiretor'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Equipes } from '@/features/dashboard/pages/Equipes'
import { Setores } from '@/features/dashboard/pages/Setores'
import { Colaboradores } from '@/features/dashboard/pages/Colaboradores'
import { Competencias } from '@/features/dashboard/pages/Competencias'
import { Perfil } from '@/features/dashboard/pages/Perfil'
import { Home, User, Users as UsersIcon, Sparkles, Building2, Layers, ClipboardList, Briefcase } from 'lucide-react'
import { Cargos } from '@/features/dashboard/pages/Cargos'
import { Avaliacoes } from '@/features/dashboard/pages/Avaliacoes'

export type DashboardRoute = {
  path: string
  element: React.ReactNode
  label: string
  icon?: React.ComponentType<any>
  allowedRoles: UserRole[]
  section?: 'general' | 'org'
}

function HomeByRole() {
  const { user } = useAuth()
  if (user?.role === Roles.Gestor) return <HomeGestor />
  if (user?.role === Roles.Diretor) return <HomeDiretor />
  return <HomeColaborador />
}

export const dashboardRoutes: DashboardRoute[] = [
  { path: '', element: <HomeByRole />, label: 'Home', icon: Home, allowedRoles: [Roles.Colaborador, Roles.Gestor, Roles.Diretor], section: 'general' },
  { path: 'perfil', element: <Perfil />, label: 'Perfil', icon: User, allowedRoles: [Roles.Colaborador, Roles.Gestor, Roles.Diretor], section: 'general' },
  { path: 'competencias', element: <Competencias />, label: 'Minhas Competências', icon: Sparkles, allowedRoles: [Roles.Colaborador, Roles.Gestor, Roles.Diretor], section: 'general' },
  { path: 'cargos', element: <Cargos />, label: 'Cargos', icon: Briefcase, allowedRoles: [Roles.Gestor, Roles.Diretor], section: 'org' },
  { path: 'setores', element: <Setores />, label: 'Setores', icon: Building2, allowedRoles: [Roles.Gestor, Roles.Diretor], section: 'org' },
  { path: 'equipes', element: <Equipes />, label: 'Equipes', icon: Layers, allowedRoles: [Roles.Gestor, Roles.Diretor], section: 'org' },
  { path: 'colaboradores', element: <Colaboradores />, label: 'Colaboradores', icon: UsersIcon, allowedRoles: [Roles.Gestor, Roles.Diretor], section: 'org' },
  { path: 'avaliacoes', element: <Avaliacoes />, label: 'Avaliações', icon: ClipboardList, allowedRoles: [Roles.Gestor, Roles.Diretor], section: 'org' },
]

export function getRoutesForRole(role: UserRole): DashboardRoute[] {
  return dashboardRoutes.filter((r) => r.allowedRoles.includes(role))
}

export function getDefaultRouteForRole(role: UserRole): string {
  const first = getRoutesForRole(role)[0]
  return `/dashboard/${first?.path ?? ''}`.replace(/\/$/, '')
}


