// ═══════════════════════════════════════════
// PDF Export — XSS-safe HTML generation
// All user data is escaped before injection
// ═══════════════════════════════════════════

import { APP } from '@/config/index.js'

// Escape HTML entities to prevent XSS
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
function esc(str) {
  if (str == null) return ''
  return String(str).replace(/[&<>"']/g, ch => ESCAPE_MAP[ch])
}

export function openPdf(log) {
  const productsRows = log.products.map(p => `
    <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600">${esc(p.name)}</td>
    <td style="padding:8px 12px;border:1px solid #ddd">${esc(p.epa)}</td>
    <td style="padding:8px 12px;border:1px solid #ddd;font-weight:700;color:#2D7A3A">${esc(p.ozConcentrate)}</td></tr>`).join('')

  const membersHtml = log.members && log.members.length > 0
    ? `<div class="section"><div class="section-title">Crew Members Present</div>
       <div style="display:flex;flex-wrap:wrap;gap:8px">${log.members.map(m =>
         `<span style="padding:6px 14px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;font-size:13px;font-weight:600;color:#2563EB">${esc(m.name)}</span>`
       ).join('')}</div></div>` : ''

  // Photos use filenames from the server — sanitize the filename and alt text
  const photosHtml = log.photos && log.photos.length > 0
    ? `<div class="section" style="page-break-before:auto"><div class="section-title">Field Photos (${log.photos.length})</div>
       <div style="display:flex;flex-wrap:wrap;gap:12px">${log.photos.map(ph =>
         `<div style="text-align:center"><img src="/uploads/${encodeURIComponent(ph.filename)}" style="max-width:280px;max-height:220px;border-radius:8px;border:1px solid #ddd;object-fit:cover" />
          <div style="font-size:10px;color:#999;margin-top:4px">${esc(ph.originalName || 'Photo')}</div></div>`
       ).join('')}</div></div>` : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Spray Log — ${esc(log.property)} — ${esc(log.date)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;padding:32px;color:#1a1a18;font-size:13px;line-height:1.5}
  .header{border-bottom:3px solid #2D7A3A;padding-bottom:12px;margin-bottom:20px}
  .brand{font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#2D7A3A;font-weight:800}
  h1{font-size:20px;margin-bottom:2px;color:#2D7A3A}h2{font-size:11px;color:#666;margin-bottom:16px}
  .section{margin-bottom:16px}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;font-weight:700;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px}
  .row{display:flex;gap:20px;margin-bottom:8px}.field{flex:1}
  .field-label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700}
  .field-value{font-size:13px;font-weight:600;color:#1a1a18}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  th{background:#f4f4f0;padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666}
  td{font-size:13px}
  .warning{background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:8px 12px;margin-bottom:12px;color:#DC2626;font-weight:700;font-size:12px}
  .cert{background:#E8F5EA;border:1.5px solid #B8DEC0;border-radius:6px;padding:12px 16px;margin-top:20px;font-size:12px;color:#2D7A3A;font-weight:600}
  .crew-note{background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#2563EB}
  .footer{margin-top:24px;border-top:2px solid #eee;padding-top:12px;font-size:9px;color:#999}
  @media print{body{padding:16px}img{max-width:250px!important}}
</style></head><body>
<div class="header">
  <div class="brand">${esc(APP.name)} — Pesticide Application Record</div>
  <h1>${esc(log.property)}</h1>
  <h2>${esc(log.date)} at ${esc(log.time)} · Use Code 30 — Landscape Maintenance</h2>
</div>
<div class="crew-note">Crew: <strong>${esc(log.crewName || '—')}</strong> · Logged by Crew Lead: <strong>${esc(log.crewLead)}</strong></div>
${membersHtml}
<div class="section"><div class="section-title">Application Details</div>
  <div class="row"><div class="field"><div class="field-label">Crew Lead</div><div class="field-value">${esc(log.crewLead)}</div></div><div class="field"><div class="field-label">License</div><div class="field-value">${esc(log.license)}</div></div></div>
  <div class="row"><div class="field"><div class="field-label">Date</div><div class="field-value">${esc(log.date)}</div></div><div class="field"><div class="field-label">Time</div><div class="field-value">${esc(log.time)}</div></div></div>
  <div class="row"><div class="field"><div class="field-label">Equipment</div><div class="field-value">${esc(log.equipment)}</div></div><div class="field"><div class="field-label">Total Mix Volume</div><div class="field-value">${esc(log.totalMixVol)}</div></div></div>
  <div class="row"><div class="field"><div class="field-label">Target Pest</div><div class="field-value">${esc(log.targetPest || '—')}</div></div><div class="field"><div class="field-label">Location</div><div class="field-value">${esc(log.location || '—')}</div></div></div>
</div>
<div class="section"><div class="section-title">Products Applied</div>
  <table><thead><tr><th>Product</th><th>EPA Reg. No.</th><th>Amount</th></tr></thead><tbody>${productsRows}</tbody></table>
</div>
<div class="section"><div class="section-title">Weather Conditions</div>
  <div class="row"><div class="field"><div class="field-label">Temperature</div><div class="field-value">${esc(log.weather?.temp)}°F</div></div><div class="field"><div class="field-label">Humidity</div><div class="field-value">${esc(log.weather?.humidity)}%</div></div></div>
  <div class="row"><div class="field"><div class="field-label">Wind</div><div class="field-value">${esc(log.weather?.windSpeed)} mph ${esc(log.weather?.windDir)}</div></div><div class="field"><div class="field-label">Conditions</div><div class="field-value">${esc(log.weather?.conditions)}</div></div></div>
  ${(log.weather?.windSpeed || 0) > 10 ? '<div class="warning">⚠ Wind speed exceeds 10 mph — potential drift hazard</div>' : ''}
</div>
${log.notes ? `<div class="section"><div class="section-title">Notes</div><div style="font-size:13px;white-space:pre-wrap">${esc(log.notes)}</div></div>` : ''}
${photosHtml}
<div class="cert">✓ I certify that all information in this pesticide application record is accurate and complete.</div>
<div class="footer">${esc(APP.name)} · Generated ${new Date().toLocaleString('en-US')} · Use Code 30 — Landscape Maintenance</div>
</body></html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}