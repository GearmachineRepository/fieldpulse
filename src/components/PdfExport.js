import { APP } from '../config.js'

export function openPdf(log) {
  const productsRows = log.products
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ddd;font-weight:600">${p.name}</td>
        <td style="padding:8px 12px;border:1px solid #ddd">${p.epa}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;font-weight:700;color:#2D7A3A">${p.ozConcentrate}</td>
      </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Spray Log — ${log.property} — ${log.date}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;padding:32px;color:#1a1a18;font-size:13px;line-height:1.5}
  h1{font-size:20px;margin-bottom:2px;color:#2D7A3A}
  h2{font-size:11px;color:#666;margin-bottom:16px}
  .header{border-bottom:3px solid #2D7A3A;padding-bottom:12px;margin-bottom:20px}
  .brand{font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#2D7A3A;font-weight:800}
  .section{margin-bottom:16px}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;font-weight:700;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px}
  .row{display:flex;gap:20px;margin-bottom:8px}.field{flex:1}
  .field-label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700}
  .field-value{font-size:13px;font-weight:600;color:#1a1a18}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  th{background:#f4f4f0;padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666}
  td{font-size:13px}
  .footer{margin-top:24px;border-top:2px solid #eee;padding-top:12px;font-size:9px;color:#999}
  .warning{background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:8px 12px;margin-bottom:12px;color:#DC2626;font-weight:700;font-size:12px}
  .cert{background:#E8F5EA;border:1.5px solid #B8DEC0;border-radius:6px;padding:12px 16px;margin-top:20px;font-size:12px;color:#2D7A3A;font-weight:600}
  .crew-note{background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#2563EB}
  @media print{body{padding:16px}}
</style></head><body>

<div class="header">
  <div class="brand">${APP.name} — Pesticide Application Record</div>
  <h1>${log.property}</h1>
  <h2>${log.date} at ${log.time} · Use Code 30 — Landscape Maintenance</h2>
</div>

<div class="crew-note">
  Crew: <strong>${log.crewName || '—'}</strong> ·
  Logged by Crew Lead: <strong>${log.crewLead}</strong> ·
  This record covers all spray work performed by this crew during this application.
</div>

<div class="section">
  <div class="section-title">Application Details</div>
  <div class="row">
    <div class="field"><div class="field-label">Crew Lead / Applicator</div><div class="field-value">${log.crewLead}</div></div>
    <div class="field"><div class="field-label">Business License</div><div class="field-value">${log.license}</div></div>
  </div>
  <div class="row">
    <div class="field"><div class="field-label">Date</div><div class="field-value">${log.date}</div></div>
    <div class="field"><div class="field-label">Time</div><div class="field-value">${log.time}</div></div>
  </div>
  <div class="row">
    <div class="field"><div class="field-label">Location / GPS</div><div class="field-value">${log.location || '—'}</div></div>
    <div class="field"><div class="field-label">Target Pest / Purpose</div><div class="field-value">${log.targetPest || '—'}</div></div>
  </div>
  <div class="row">
    <div class="field"><div class="field-label">Equipment</div><div class="field-value">${log.equipment}</div></div>
    <div class="field"><div class="field-label">Total Mix Volume</div><div class="field-value">${log.totalMixVol}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Mix Sheet — Products Applied (concentrate amounts)</div>
  <table>
    <thead><tr><th>Product Name</th><th>EPA Reg #</th><th>Concentrate Used</th></tr></thead>
    <tbody>${productsRows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Weather Conditions at Time of Application</div>
  <div class="row">
    <div class="field"><div class="field-label">Temperature</div><div class="field-value">${log.weather.temp}°F</div></div>
    <div class="field"><div class="field-label">Humidity</div><div class="field-value">${log.weather.humidity}%</div></div>
    <div class="field"><div class="field-label">Wind</div><div class="field-value">${log.weather.windSpeed} mph ${log.weather.windDir}</div></div>
    <div class="field"><div class="field-label">Sky</div><div class="field-value">${log.weather.conditions}</div></div>
  </div>
  ${log.weather.windSpeed > 10 ? '<div class="warning">⚠ Wind exceeded 10 mph at time of application</div>' : ''}
</div>

${log.notes ? `<div class="section"><div class="section-title">Field Notes</div><p style="font-size:13px;color:#333">${log.notes}</p></div>` : ''}

<div class="cert">
  Recorded by Crew Lead: <strong>${log.crewLead}</strong> · License: <strong>${log.license}</strong> ·
  This record certifies that the above information is complete and accurate as entered at time of application
  on behalf of <strong>${log.crewName || 'the assigned crew'}</strong>.
</div>

<div class="footer">
  Generated by ${APP.name} · ${new Date().toLocaleString()} ·
  Retain for minimum 2 years per CA DPR.
  Submit monthly summary (DPR-PML-060) to County Ag Commissioner by the 10th of the following month.
</div>

</body></html>`

  const w = window.open('', '_blank', 'width=800,height=1000')
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 400)
  }
}
