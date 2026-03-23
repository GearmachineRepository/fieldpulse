// ═══════════════════════════════════════════
// AddressLink — Clickable address that opens Google Maps
// Use for any address/location display across the platform
// ═══════════════════════════════════════════

import { MapPin } from "lucide-react"

function buildMapsUrl(parts) {
  const q = [parts.address, parts.city, parts.state, parts.zip]
    .filter(Boolean)
    .join(", ")
  if (!q) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/**
 * Renders address text as a clickable Google Maps link.
 *
 * Usage variants:
 *   <AddressLink address="123 Main" city="LA" state="CA" zip="90001" />
 *   <AddressLink location="123 Main St, Los Angeles" />
 *   <AddressLink address="123 Main" />  (partial)
 */
export default function AddressLink({
  address, city, state, zip,
  location,
  icon = false,
  className,
  style,
}) {
  // Build display text
  let display
  let url

  if (location) {
    display = location
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
  } else {
    const parts = []
    if (address) parts.push(address)
    if (city) parts.push(city)
    if (state) parts.push(state)
    if (zip) parts.push(zip)
    display = parts.join(", ")
    url = buildMapsUrl({ address, city, state, zip })
  }

  if (!display) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        color: "inherit",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        cursor: "pointer",
        ...style,
      }}
      title="Open in Google Maps"
      onMouseEnter={e => { e.currentTarget.style.color = "var(--amb)" }}
      onMouseLeave={e => { e.currentTarget.style.color = "inherit" }}
    >
      {icon && <MapPin size={14} style={{ flexShrink: 0 }} />}
      <span style={{ borderBottom: "1px dashed currentColor" }}>{display}</span>
    </a>
  )
}

/**
 * Formats address parts into a single display string.
 * Useful when you need just the text without the link.
 */
export function formatAddress({ address, city, state, zip }) {
  return [address, city, state, zip].filter(Boolean).join(", ")
}
