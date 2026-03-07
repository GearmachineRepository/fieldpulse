import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext.jsx'
import App from '@/App.jsx'
import '@/global.css'

// BrowserRouter lives here — one level above everything — so all shells
// (marketing, field, admin) share the same router context and can use
// useNavigate, useLocation, Link etc. without any extra setup.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
)