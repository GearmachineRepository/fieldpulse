// ═══════════════════════════════════════════
// useToast — Data Hook
//
// Manages toast notification state.
// Auto-dismisses after a configurable duration.
// ═══════════════════════════════════════════

import { useState, useCallback, useRef } from 'react'

/**
 * @param {number} [duration=2500]  Auto-dismiss duration in ms
 * @returns {{
 *   message: string|null,
 *   show: (msg: string) => void,
 *   dismiss: () => void,
 * }}
 */
export default function useToast(duration = 2500) {
  const [message, setMessage] = useState(null)
  const timer = useRef(null)

  const show = useCallback(
    (msg) => {
      if (timer.current) clearTimeout(timer.current)
      setMessage(msg)
      timer.current = setTimeout(() => setMessage(null), duration)
    },
    [duration],
  )

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setMessage(null)
  }, [])

  return { message, show, dismiss }
}
