// ═══════════════════════════════════════════
// LocationLink — Tappable location that opens in Maps
// Detects GPS coords vs addresses automatically.
// On mobile: opens native Maps app.
// On desktop: opens Google Maps in browser.
// ═══════════════════════════════════════════

import { C, MONO } from '../config.js'

// Match patterns like "34.0522, -118.2437" or "34.0522,-118.2437"
const GPS_PATTERN = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/

function getMapsUrl(location) {
  const match = location.trim().match(GPS_PATTERN)
  if (match) {
    const [, lat, lng] = match
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`
}

function isGpsCoords(location) {
  return GPS_PATTERN.test(location.trim())
}

export default function LocationLink({ location, style = {}, compact = false }) {
  if (!location || location === '—') {
    return <span style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: C.textLight }}>—</span>
  }

  const isGps = isGpsCoords(location)
  const url = getMapsUrl(location)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: compact ? 13 : 14,
        fontWeight: 600,
        color: C.blue,
        textDecoration: 'none',
        fontFamily: isGps ? MONO : 'inherit',
        cursor: 'pointer',
        borderBottom: `1px dashed ${C.blueBorder}`,
        paddingBottom: 1,
        transition: 'color 0.15s',
        ...style,
      }}
    >
      <span style={{ fontSize: compact ? 14 : 16, lineHeight: 1 }}>📍</span>
      <span>{location}</span>
      <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
    </a>
  )
}

export { getMapsUrl, isGpsCoords }