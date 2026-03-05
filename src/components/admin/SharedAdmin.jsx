// ═══════════════════════════════════════════
// Shared Admin Components
// Used across all admin sections
// ═══════════════════════════════════════════

import { useRef, useEffect } from 'react'
import { C, cardStyle, labelStyle, inputStyle, btnStyle } from '../../config.js'

// ── Section Header with optional Add button ──
export function SectionHeader({ title, count, onAdd, addLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
        {count !== undefined && <div style={{ fontSize: 13, color: C.textLight }}>{count} total</div>}
      </div>
      {onAdd && (
        <button tabIndex={0} onClick={onAdd}
          style={{ ...btnStyle(C.accent, '#fff', { width: 'auto', padding: '10px 20px', fontSize: 14 }) }}>
          + {addLabel || 'Add New'}
        </button>
      )}
    </div>
  )
}

// ── Sub-tab navigation ──
export function SubTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: C.card, borderRadius: 12, border: `1.5px solid ${C.cardBorder}`, padding: 4, overflow: 'hidden' }}>
      {tabs.map(t => (
        <div key={t.key} tabIndex={0} role="button"
          onClick={() => onChange(t.key)}
          onKeyDown={e => e.key === 'Enter' && onChange(t.key)}
          style={{
            flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', borderRadius: 9,
            color: active === t.key ? '#fff' : C.textLight,
            background: active === t.key ? C.accent : 'transparent',
            transition: 'all 0.15s',
          }}>
          {t.label}
        </div>
      ))}
    </div>
  )
}

// ── Modal with focus trap ──
// FIX: Use refs for callbacks so the effect only runs once on mount.
// Previously, the inline onCancel arrow function caused the effect to
// re-run on every render, stealing focus from whatever input was active.
export function FormModal({ title, children, onSave, onCancel, onDelete, saving }) {
  const modalRef = useRef(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    // Focus first focusable element on mount only
    const focusable = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (focusable.length) focusable[0].focus()

    const trap = (e) => {
      if (e.key === 'Escape') { onCancelRef.current(); return }
      if (e.key !== 'Tab') return
      // Re-query focusable elements on each Tab press (form content may change)
      const currentFocusable = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (currentFocusable.length === 0) return
      const first = currentFocusable[0]
      const last = currentFocusable[currentFocusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    modal.addEventListener('keydown', trap)
    return () => modal.removeEventListener('keydown', trap)
  }, []) // ← empty deps: runs once on mount, not on every render

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onCancelRef.current() }}>
      <div ref={modalRef} style={{ background: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>{title}</div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {onDelete && <button tabIndex={0} onClick={onDelete} style={{ ...btnStyle(C.red, '#fff', { width: 'auto', padding: '12px 18px' }) }}>🗑 Delete</button>}
          <div style={{ flex: 1 }} />
          <button tabIndex={0} onClick={onCancel} style={{ ...btnStyle('#eee', C.text, { width: 'auto', padding: '12px 20px', boxShadow: 'none' }) }}>Cancel</button>
          <button tabIndex={0} onClick={onSave} disabled={saving} style={{ ...btnStyle(C.accent, '#fff', { width: 'auto', padding: '12px 20px', opacity: saving ? 0.6 : 1 }) }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm delete dialog ──
// Same ref-based fix as FormModal above.
export function ConfirmDelete({ name, onConfirm, onCancel }) {
  const modalRef = useRef(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
    if (focusable.length) focusable[0].focus()

    const trap = (e) => {
      if (e.key === 'Escape') { onCancelRef.current(); return }
      if (e.key !== 'Tab') return
      const currentFocusable = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
      if (currentFocusable.length === 0) return
      const first = currentFocusable[0]
      const last = currentFocusable[currentFocusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    modal.addEventListener('keydown', trap)
    return () => modal.removeEventListener('keydown', trap)
  }, []) // ← empty deps

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div ref={modalRef} style={{ background: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Delete "{name}"?</div>
        <div style={{ fontSize: 14, color: C.textMed, marginBottom: 20 }}>This will deactivate the item. Existing logs are preserved.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button tabIndex={0} onClick={onCancel} style={{ ...btnStyle('#eee', C.text, { flex: 1, boxShadow: 'none' }) }}>Cancel</button>
          <button tabIndex={0} onClick={onConfirm} style={{ ...btnStyle(C.red, '#fff', { flex: 1 }) }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Generic form field (supports text, checkbox, textarea) ──
export const Field = ({ label, value, onChange, placeholder, type, required }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={labelStyle}>{label}{required && <span style={{ color: C.red }}> *</span>}</div>
    {type === 'checkbox' ? (
      <div tabIndex={0} role="button"
        onClick={() => onChange(!value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!value) } }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${value ? C.accent : C.cardBorder}`,
          background: value ? C.accent : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
          {value && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</span>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.textMed }}>{placeholder}</span>
      </div>
    ) : type === 'textarea' ? (
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={inputStyle({ resize: 'vertical', minHeight: 80 })}
      />
    ) : (
      <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        type={type || 'text'} style={inputStyle()} />
    )}
  </div>
)

// ── Crew filter pills (used in SprayLogs + Rosters) ──
export function FilterPills({ crewNames, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      <div tabIndex={0} role="button" onClick={() => onChange('')}
        onKeyDown={e => e.key === 'Enter' && onChange('')}
        style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          background: !active ? C.accent : '#eee', color: !active ? '#fff' : C.textMed }}>
        All Crews
      </div>
      {crewNames.map(c => (
        <div key={c} tabIndex={0} role="button" onClick={() => onChange(c)}
          onKeyDown={e => e.key === 'Enter' && onChange(c)}
          style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: active === c ? C.accent : '#eee', color: active === c ? '#fff' : C.textMed }}>
          {c}
        </div>
      ))}
    </div>
  )
}

// ── Date range picker (used in Reports + Roster Reports) ──
export function DateRangePicker({ rangeType, setRangeType, month, setMonth, year, setYear, startDate, setStartDate, endDate, setEndDate, accentColor }) {
  const color = accentColor || C.accent
  const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <>
      <div style={labelStyle}>Report Period</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[{ k: 'monthly', l: 'Monthly' }, { k: 'biweekly', l: 'Bi-Weekly' }, { k: 'custom', l: 'Custom Range' }].map(r => (
          <div key={r.k} tabIndex={0} role="button"
            onClick={() => setRangeType(r.k)}
            onKeyDown={e => e.key === 'Enter' && setRangeType(r.k)}
            style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: rangeType === r.k ? color : '#eee', color: rangeType === r.k ? '#fff' : C.textMed }}>
            {r.l}
          </div>
        ))}
      </div>

      {rangeType === 'monthly' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Month</div>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={inputStyle()}>
              {monthNames.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Year</div>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={inputStyle()}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {rangeType === 'biweekly' && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: C.blueLight, border: `1.5px solid ${C.blueBorder}`, marginBottom: 16, fontSize: 14, color: C.blue, fontWeight: 600 }}>
          Last 14 days from today
        </div>
      )}

      {rangeType === 'custom' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Start Date</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle()} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>End Date</div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle()} />
          </div>
        </div>
      )}
    </>
  )
}

// ── Helper to compute date range from picker state ──
export function getDateRange(rangeType, month, year, startDate, endDate) {
  const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December']
  if (rangeType === 'monthly') {
    return { start: `${year}-${String(month).padStart(2, '0')}-01`, end: new Date(year, month, 1).toISOString().split('T')[0], label: `${monthNames[month]} ${year}` }
  } else if (rangeType === 'biweekly') {
    const s = new Date(); s.setDate(s.getDate() - 14)
    return { start: s.toISOString().split('T')[0], end: new Date().toLocaleDateString('en-CA'), label: 'Last 14 Days' }
  } else {
    return { start: startDate, end: endDate, label: `${startDate} to ${endDate}` }
  }
}