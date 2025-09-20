import { Outlet, NavLink, useNavigate, useLocation, matchPath } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
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
import { HomeIcon } from 'lucide-react'
import { getRoutesForRole } from '@/features/dashboard/routes/dashboardRoutes'
import { AnimatedLogo } from '@/shared/components/AnimatedLogo'
import logoUrl from '@/assets/logo.svg'

export function DashboardLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {getRoutesForRole(user?.role ?? 'COLABORADOR').map((r) => (
                  <SidebarMenuItem key={r.path || 'root'}>
                    <SidebarMenuButton
                      asChild
                      isActive={isRouteActive(`/dashboard/${r.path}`, r.path === '')}
                      tooltip={r.label}
                    >
                      <NavLink to={`/dashboard/${r.path}`.replace(/\/$/, '')} end={r.path === ''}>
                        {/* ícones reais podem ser adicionados em dashboardRoutes */}
                        <HomeIcon />
                        <span>{r.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 rounded-md border px-2 py-2 text-left hover:bg-accent">
                <Avatar className="size-7">
                  <AvatarImage src={"https://github.com/shadcn.png"} alt={user?.name ?? 'Usuário'} />
                  <AvatarFallback>{user?.name?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{user?.name ?? 'Usuário'}</div>
                  <div className="truncate text-xs text-muted-foreground">{user?.email ?? 'm@example.com'}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" alignOffset={0} sideOffset={8} collisionPadding={12} className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={"https://github.com/shadcn.png"} alt={user?.name ?? 'Usuário'} />
                    <AvatarFallback>{user?.name?.[0] ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-none truncate">{user?.name ?? 'Usuário'}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email ?? 'm@example.com'}</div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header
          className="flex h-[--header-height] shrink-0 items-center gap-2 border-b px-4 lg:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        >
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-6" />
          <div className="text-sm font-medium">Proficio</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block text-sm text-muted-foreground">{user?.email}</div>
            <Button variant="outline" onClick={handleLogout}>Sair</Button>
          </div>
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


