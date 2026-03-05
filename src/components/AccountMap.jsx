// ═══════════════════════════════════════════
// AccountMap — Reusable Leaflet map component
// Shows pins for accounts. Built to be extended
// for routes (numbered pins, connecting lines) in Phase 3.
// ═══════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { C } from '../config.js'
import LocationLink from './LocationLink.jsx'

// ── Fix Leaflet's default icon paths (broken in bundlers) ──
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Custom colored marker using SVG ──
function createColoredIcon(color = '#2D7A3A', label = '') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="7" fill="#fff"/>
      ${label ? `<text x="14" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="${color}">${label}</text>` : ''}
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  })
}

// ── Type → color mapping ──
const TYPE_COLORS = {
  residential: '#2D7A3A',
  commercial: '#2563EB',
  hoa: '#D97706',
}

// ── Auto-fit map to show all markers ──
function FitBounds({ positions }) {
  const map = useMap()
  const prevLength = useRef(0)

  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length !== prevLength.current) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
      prevLength.current = positions.length
    }
  }, [positions, map])

  return null
}

export default function AccountMap({ accounts = [], selectedId, onSelect, height = '400px', showTypeColors = true }) {
  const mappable = accounts.filter(a => a.latitude && a.longitude)

  if (mappable.length === 0) {
    return (
      <div style={{
        height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f0f0ec', borderRadius: 16, border: `1.5px solid ${C.cardBorder}`,
        flexDirection: 'column', gap: 8,
      }}>
        <span style={{ fontSize: 40 }}>🗺️</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.textLight }}>No geocoded accounts yet</span>
        <span style={{ fontSize: 13, color: C.textLight }}>Add accounts with addresses to see them on the map</span>
      </div>
    )
  }

  const positions = mappable.map(a => [a.latitude, a.longitude])
  const center = positions.length === 1
    ? positions[0]
    : [
        positions.reduce((s, p) => s + p[0], 0) / positions.length,
        positions.reduce((s, p) => s + p[1], 0) / positions.length,
      ]

  return (
    // position:relative + z-index:0 creates a stacking context that contains
    // Leaflet's internal z-indexes (200-400) so they don't overlay sidebars/modals
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${C.cardBorder}`, position: 'relative', zIndex: 0 }}>
      <MapContainer center={center} zoom={12} style={{ height, width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        {mappable.map(account => {
          const color = showTypeColors
            ? (TYPE_COLORS[account.accountType] || TYPE_COLORS.residential)
            : '#2D7A3A'
          const isSelected = account.id === selectedId

          return (
            <Marker
              key={account.id}
              position={[account.latitude, account.longitude]}
              icon={createColoredIcon(isSelected ? '#DC2626' : color)}
              eventHandlers={{ click: () => onSelect && onSelect(account) }}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: "'Nunito Sans', sans-serif" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{account.name}</div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{account.address}</div>
                  {account.contactName && (
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                      📞 {account.contactName}{account.contactPhone ? ` · ${account.contactPhone}` : ''}
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <LocationLink location={account.address} compact />
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export { createColoredIcon, TYPE_COLORS }