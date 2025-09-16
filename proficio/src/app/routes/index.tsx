import { Navigate, Outlet, createBrowserRouter } from "react-router-dom"
import { DashboardLayout } from "@/features/dashboard/layout/DashboardLayout"
import { Home } from "@/features/dashboard/pages/Home"
import { Users } from "@/features/dashboard/pages/Users"
import { Settings } from "@/features/dashboard/pages/Settings"
import { Login } from "@/features/auth/pages/Login"
import { ForgotPassword } from "@/features/auth/pages/ForgotPassword"
import { useAuth } from "@/features/auth/hooks/useAuth"

function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <DashboardLayout />,
        children: [
          { path: "", element: <Home /> },
          { path: "users", element: <Users /> },
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },
])

