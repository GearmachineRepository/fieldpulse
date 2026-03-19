// ═══════════════════════════════════════════
// useShell — Shell UI state
//
// Groups boolean UI state (sidebar overlay,
// modals, menus) that was previously scattered
// as useState calls in DashboardShell.
// ═══════════════════════════════════════════

import { useState, useCallback } from 'react'

export default function useShell() {
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [qrModalOpen, setQrModalOpen]     = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)

  const openSidebar  = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const openQrModal  = useCallback(() => setQrModalOpen(true), [])
  const closeQrModal = useCallback(() => setQrModalOpen(false), [])

  return {
    sidebarOpen, setSidebarOpen, openSidebar, closeSidebar,
    qrModalOpen, setQrModalOpen, openQrModal, closeQrModal,
    avatarMenuOpen, setAvatarMenuOpen,
  }
}
