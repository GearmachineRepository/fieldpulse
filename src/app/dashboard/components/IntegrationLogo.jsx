// ═══════════════════════════════════════════
// Integration Logo — Clearbit-powered with fallback
// ═══════════════════════════════════════════

import { useState } from "react"
import { PROVIDER_META } from "@/lib/integrations/index.js"
import s from "./IntegrationLogo.module.css"

export default function IntegrationLogo({ provider, size = 40 }) {
  const [error, setError] = useState(false)
  const meta = PROVIDER_META[provider]

  if (error || !meta?.logoUrl) {
    return (
      <div
        className={s.fallback}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {meta?.name?.[0] || "?"}
      </div>
    )
  }

  return (
    <img
      src={meta.logoUrl}
      alt={meta.name}
      width={size}
      height={size}
      className={s.logo}
      onError={() => setError(true)}
    />
  )
}
