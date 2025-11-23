import { Outlet, NavLink, useNavigate, useLocation, matchPath } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
} from '@/shared/components/ui/sidebar'
import { Separator } from '@/shared/components/ui/separator'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Home } from 'lucide-react'
import { getRoutesForRole } from '@/features/dashboard/routes/dashboardRoutes'
import { AnimatedLogo } from '@/shared/components/AnimatedLogo'
import { Roles } from '@/shared/constants/roles'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import ThemeModeToggle from '@/shared/components/ThemeModeToggle'
import logoUrl from '@/assets/logo.svg'
import { api } from '@/shared/lib/api'

export function DashboardLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatar, setAvatar] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!user?.id) {
      setAvatar(undefined)
      return
    }
    ;(async () => {
      try {
        const res = await api.get<any>(`/colaboradores/${encodeURIComponent(user.id)}/perfil`)
        const vm: any = res.data
        const normalize = (s?: string | null) => {
          if (!s) return undefined as unknown as string
          return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
        }
        setAvatar(normalize(vm?.avatar))
      } catch {
        setAvatar(undefined)
      }
    })()
    const handler = (e: any) => {
      const s = e?.detail as string | undefined
      setAvatar(s ?? undefined)
    }
    window.addEventListener('profile-avatar-updated', handler as any)
    return () => window.removeEventListener('profile-avatar-updated', handler as any)
  }, [user?.id])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function isRouteActive(pattern: string, end = false) {
    return !!matchPath({ path: pattern, end }, location.pathname)
  }

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 64)',
        '--header-height': 'calc(var(--spacing) * 12)',
      } as React.CSSProperties}
    >
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                className="justify-start group-data-[collapsible=icon]:justify-center"
              >
                <NavLink to="/dashboard">
                  <AnimatedLogo src={logoUrl} className="size-7" />
                  <span className="font-semibold group-data-[collapsible=icon]:hidden">Proficio</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {(() => {
            const role = user?.role ?? Roles.COLABORADOR
            const routes = getRoutesForRole(role)
            const general = routes.filter(r => (r.section ?? 'general') === 'general')
            const org = routes.filter(r => r.section === 'org')

            function renderGrouped(list: typeof routes, groups: { label: string, keys: string[] }[]) {
              return (
                <SidebarMenu>
                  {groups.map(group => {
                    const items = list.filter(r => group.keys.includes(r.path))
                    if (items.length === 0) return null
                    return (
                      <div key={group.label} className="mb-2">
                        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground
                        group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:m-0 group-data-[collapsible=icon]:p-0">
                          {group.label}
                        </div>
                        {items.map((r) => {
                          const Icon = r.icon ?? Home
                          return (
                            <SidebarMenuItem key={r.path || 'root'}>
                              <SidebarMenuButton
                                asChild
                                isActive={isRouteActive(`/dashboard/${r.path}`, r.path === '')}
                                tooltip={r.label}
                              >
                                <NavLink to={`/dashboard/${r.path}`.replace(/\/$/, '')} end={r.path === ''}>
                                  <Icon />
                                  <span>{r.label}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </div>
                    )
                  })}
                </SidebarMenu>
              )
            }

            const generalGroups = [
              { label: 'Início', keys: [''] },
              { label: 'Meu perfil', keys: ['perfil', 'competencias', 'minhas-avaliacoes'] },
            ]
            const orgGroups = [
              { label: 'Estrutura', keys: ['cargos', 'setores', 'equipes'] },
              { label: 'Pessoas', keys: ['colaboradores'] },
              { label: 'Avaliações', keys: ['avaliacoes', 'aprovacao-competencias'] },
            ]
            return (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel>Geral</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {renderGrouped(general, generalGroups)}
                  </SidebarGroupContent>
                </SidebarGroup>
                {org.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Organizações</SidebarGroupLabel>
                    <SidebarGroupContent>
                      {renderGrouped(org, orgGroups)}
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
              </>
            )
          })()}
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 rounded-md border px-2 py-2 text-left hover:bg-accent cursor-pointer group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:hover:bg-transparent">
                <Avatar className="size-7 group-data-[collapsible=icon]:size-9">
                  <AvatarImage src={avatar ?? undefined} alt={user?.name ?? 'Usuário'} />
                  <AvatarFallback>{user?.name?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <div className="truncate text-sm font-medium">{user?.name ?? 'Usuário'}</div>
                  <div className="truncate text-xs text-muted-foreground">{user?.email ?? 'm@example.com'}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" alignOffset={0} sideOffset={8} collisionPadding={12} className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={avatar ?? undefined} alt={user?.name ?? 'Usuário'} />
                    <AvatarFallback>{user?.name?.[0] ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-none truncate">{user?.name ?? 'Usuário'}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header
          className="flex h-[--header-height] shrink-0 items-center gap-2 border-b px-4 lg:px-6"
        >
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-6" />
          <div className="text-sm font-medium flex-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <NavLink to="/dashboard">Dashboard</NavLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {(() => {
                  const role = user?.role ?? Roles.COLABORADOR
                  const currentPath = location.pathname.replace(/^\/dashboard\/?/, '')
                  const currentKey = currentPath.split('/')[0] ?? ''
                  const current = getRoutesForRole(role).find(r => r.path === currentKey)
                  if (!currentKey || !current || current.path === '') return null
                  return (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{current.label}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )
                })()}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ThemeModeToggle />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-6">
          <div className="@container/main flex flex-1 flex-col gap-4 md:gap-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
