// ═══════════════════════════════════════════
// Placeholder Page — "Coming soon" for unbuilt pages
// ═══════════════════════════════════════════

import { FileText } from "lucide-react"
import { T } from "@/app/tokens.js"

export default function PlaceholderPage({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: T.textLight }}>
      <div style={{ textAlign: "center" }}>
        <FileText size={48} strokeWidth={1} />
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginTop: 16 }}>{title}</div>
        <div style={{ fontSize: 14, color: T.textMed, marginTop: 6 }}>Full page coming soon</div>
      </div>
    </div>
  )
}
