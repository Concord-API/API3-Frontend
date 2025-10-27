import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from './routes'
import { ThemeProvider } from './providers/ThemeProvider'

export function App() {
  return (
    <ThemeProvider defaultTheme={{ mode: 'dark' }} storageKey="proficio-theme">
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}