// ═══════════════════════════════════════════
// dateUtils.js — Single source of truth for
// all date formatting & helpers across the app
// ═══════════════════════════════════════════

// ── ISO date string: YYYY-MM-DD in LOCAL time (avoids UTC off-by-one) ──
export function getLocalDate() {
  return new Date().toLocaleDateString('en-CA')
}

// ── Day-of-week index (0 = Sunday … 6 = Saturday) ──
export function getLocalDow() {
  return new Date().getDay()
}

// ── ISO date string for an arbitrary day-of-week in the current week ──
export function getDateForDow(dow) {
  const today = new Date()
  const target = new Date(today)
  target.setDate(today.getDate() + (dow - today.getDay()))
  return target.toLocaleDateString('en-CA')
}

// ── "March 4" — used in route day tabs, log headers ──
export function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

// ── "Monday, March 4" — used in crew clock-in / daily headers ──
export function formatDateFull(dateStr) {
  const d = new Date((dateStr || getLocalDate()) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ── "Mar 4, 2025" — used in list cards ──
export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Today's greeting: "Good morning / afternoon / evening" ──
export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── "Mar 4" date + "9:41 AM" time from a full timestamp ──
export function formatTimestamp(isoString) {
  const d = new Date(isoString)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}