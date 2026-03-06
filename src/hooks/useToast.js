// ═══════════════════════════════════════════
// useToast — auto-dismissing toast state
// ═══════════════════════════════════════════

import { useState, useCallback } from 'react'

const DEFAULT_DURATION_MS = 2500

/**
 * Returns a toast message and a showToast trigger.
 *
 * @param {number} [duration]  Auto-dismiss delay in ms
 * @returns {{ toast: string|null, showToast: (msg: string) => void }}
 *
 * @example
 * const { toast, showToast } = useToast()
 * showToast('Saved ✓')
 */
export function useToast(duration = DEFAULT_DURATION_MS) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), duration)
  }, [duration])

  return { toast, showToast }
}
