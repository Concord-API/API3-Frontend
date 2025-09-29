import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import { App } from './app/App.tsx'

async function enableMocks() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('@/shared/mocks/browser')
    await worker.start({ serviceWorker: { url: '/mockServiceWorker.js' }, onUnhandledRequest: 'bypass' })
  }
}

enableMocks().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})