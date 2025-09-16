import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function DashboardLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4 sticky top-0 h-dvh">
        <div className="font-semibold mb-6">Dashboard</div>
        <nav className="grid gap-2">
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'text-primary font-medium' : ''}>Home</NavLink>
          <NavLink to="/dashboard/users" className={({ isActive }) => isActive ? 'text-primary font-medium' : ''}>Users</NavLink>
          <NavLink to="/dashboard/settings" className={({ isActive }) => isActive ? 'text-primary font-medium' : ''}>Settings</NavLink>
        </nav>
        <div className="mt-auto pt-6 flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <Button variant="outline" onClick={handleLogout}>Sair</Button>
        </div>
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}


