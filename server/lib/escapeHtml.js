// ═══════════════════════════════════════════
// HTML Escape — prevents XSS when injecting
// user data into HTML strings (PDF export, etc.)
// ═══════════════════════════════════════════

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(str) {
  if (str == null) return ''
  return String(str).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch])
}
