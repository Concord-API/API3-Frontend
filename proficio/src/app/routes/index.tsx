import { Navigate, Outlet, createBrowserRouter } from "react-router-dom"
import { DashboardLayout } from "@/features/dashboard/layout/DashboardLayout"
import { Login } from "@/features/auth/pages/Login"
import { ForgotPassword } from "@/features/auth/pages/ForgotPassword"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { RoleGate } from "@/features/dashboard/components/RoleGate"
import { dashboardRoutes } from "@/features/dashboard/routes/dashboardRoutes"

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
        children: dashboardRoutes.map((r) => ({
          path: r.path,
          element: <RoleGate allowed={r.allowedRoles}>{r.element}</RoleGate>,
        })),
      },
    ],
  },
])

