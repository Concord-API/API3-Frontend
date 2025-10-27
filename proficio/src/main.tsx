import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import { App } from './app/App.tsx'

async function enableMocks() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('@/shared/mocks/browser')
    const swUrl = `${import.meta.env.BASE_URL ?? '/'}mockServiceWorker.js`
    await worker.start({ serviceWorker: { url: swUrl }, onUnhandledRequest: 'bypass' })
  } else if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const reg of regs) {
        const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL
        if (!url || url.startsWith(location.origin)) {
          await reg.unregister()
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch {}
  }
}

enableMocks().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})