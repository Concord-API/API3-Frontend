import { Outlet, NavLink, useNavigate, useLocation, matchPath } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
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
import { HomeIcon, SettingsIcon, UsersIcon } from 'lucide-react'
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
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isRouteActive('/dashboard', true)} tooltip="Home">
                    <NavLink to="/dashboard" end>
                      <HomeIcon />
                      <span>Home</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isRouteActive('/dashboard/users')} tooltip="Users">
                    <NavLink to="/dashboard/users">
                      <UsersIcon />
                      <span>Users</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isRouteActive('/dashboard/settings')} tooltip="Settings">
                    <NavLink to="/dashboard/settings">
                      <SettingsIcon />
                      <span>Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="px-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button variant="outline" onClick={handleLogout}>Sair</Button>
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


