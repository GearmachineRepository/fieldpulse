// ═══════════════════════════════════════════
// App Entry Point — Mounts React root
// ═══════════════════════════════════════════
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth.jsx'
import { DataProvider } from '@/context/DataProvider.jsx'
import App from '@/App.jsx'
import '@/ui/tokens/index.css'
import '@/global.css'
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
