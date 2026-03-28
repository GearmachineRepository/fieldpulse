/* eslint-disable react-refresh/only-export-components */
// ═══════════════════════════════════════════
// ToastContext — Global toast provider
//
// Renders the toast UI once in the dashboard shell.
// Pages call useGlobalToast().show("message")
// without needing their own toast rendering.
// ═══════════════════════════════════════════

import { createContext, useContext } from 'react'
import useToast from '@/hooks/useToast.js'
import s from '@/app/dashboard/DashboardShell.module.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const toast = useToast()
  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toast.message && (
        <div className={s.globalToast} role="status" aria-live="polite" onClick={toast.dismiss}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useGlobalToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useGlobalToast must be used within ToastProvider')
  return ctx
}
