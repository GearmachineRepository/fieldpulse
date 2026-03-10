// ═══════════════════════════════════════════
// Shared Admin Components — UI Kit Edition
//
// Same exports, same prop interfaces.
// Internals now use @/ui primitives instead of
// inline styles. Every admin page that imports
// { SectionHeader, SubTabs, FormModal, ... }
// works without changes.
// ═══════════════════════════════════════════

import UiSectionHeader from '@/ui/primitives/SectionHeader.jsx'
import Tabs            from '@/ui/primitives/Tabs.jsx'
import Modal           from '@/ui/primitives/Modal.jsx'
import Button          from '@/ui/primitives/Button.jsx'
import Input           from '@/ui/primitives/Input.jsx'
import styles          from './SharedAdmin.module.css'

// ── Section Header ──
export function SectionHeader(props) {
  return <UiSectionHeader {...props} />
}

// ── Sub-tab navigation ──
export function SubTabs({ tabs, active, onChange }) {
  return <Tabs tabs={tabs} active={active} onChange={onChange} />
}

// ── Filter Pills (crew filter row) ──
export function FilterPills({ crewNames, active, onChange }) {
  return (
    <div className={styles.filterPills}>
      <div
        tabIndex={0} role="button"
        onClick={() => onChange('')}
        onKeyDown={e => e.key === 'Enter' && onChange('')}
        className={`${styles.pill} ${!active ? styles.pillActive : ''}`}
      >
        All Crews
      </div>
      {crewNames.map(c => (
        <div
          key={c}
          tabIndex={0} role="button"
          onClick={() => onChange(c)}
          onKeyDown={e => e.key === 'Enter' && onChange(c)}
          className={`${styles.pill} ${active === c ? styles.pillActive : ''}`}
        >
          {c}
        </div>
      ))}
    </div>
  )
}

// ── Date range picker ──
export function DateRangePicker({ rangeType, setRangeType, month, setMonth, year, setYear, startDate, setStartDate, endDate, setEndDate, accentColor }) {
  const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <>
      <div className={styles.label}>Report Period</div>
      <div className={styles.rangeButtons}>
        {[{ k: 'monthly', l: 'Monthly' }, { k: 'biweekly', l: 'Bi-Weekly' }, { k: 'custom', l: 'Custom Range' }].map(r => (
          <div key={r.k} tabIndex={0} role="button"
            onClick={() => setRangeType(r.k)}
            onKeyDown={e => e.key === 'Enter' && setRangeType(r.k)}
            className={`${styles.pill} ${rangeType === r.k ? styles.pillActive : ''}`}
            style={rangeType === r.k && accentColor ? { background: accentColor } : undefined}
          >
            {r.l}
          </div>
        ))}
      </div>

      {rangeType === 'monthly' && (
        <div className={styles.dateRow}>
          <div className={styles.dateCol}>
            <div className={styles.label}>Month</div>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className={styles.select}>
              {monthNames.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className={styles.dateCol}>
            <div className={styles.label}>Year</div>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className={styles.select}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {rangeType === 'biweekly' && (
        <div className={styles.biweeklyNote}>
          Last 14 days from today
        </div>
      )}

      {rangeType === 'custom' && (
        <div className={styles.dateRow}>
          <div className={styles.dateCol}>
            <div className={styles.label}>Start Date</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={styles.select} />
          </div>
          <div className={styles.dateCol}>
            <div className={styles.label}>End Date</div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={styles.select} />
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

// ── Modal with focus trap ──
export function FormModal({ title, children, onSave, onCancel, onDelete, saving }) {
  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={title}
      footer={
        <div className={styles.modalFooter}>
          {onDelete && (
            <Button variant="red" size="sm" fullWidth={false} onClick={onDelete}>
              🗑 Delete
            </Button>
          )}
          <div className={styles.spacer} />
          <Button variant="ghost" size="sm" fullWidth={false} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="accent" size="sm" fullWidth={false} onClick={onSave} disabled={saving} loading={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  )
}

// ── Confirm delete dialog ──
export function ConfirmDelete({ name, onConfirm, onCancel }) {
  return (
    <Modal open={true} onClose={onCancel} size="sm">
      <div className={styles.confirmCenter}>
        <div className={styles.confirmIcon}>🗑️</div>
        <div className={styles.confirmTitle}>Delete &ldquo;{name}&rdquo;?</div>
        <div className={styles.confirmText}>
          This will deactivate the item. Existing logs are preserved.
        </div>
        <div className={styles.confirmActions}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="red" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Generic form field ──
export function Field({ label, value, onChange, placeholder, type, required, options }) {
  if (type === 'checkbox') {
    return (
      <div className={styles.fieldWrap}>
        <div
          tabIndex={0} role="button"
          onClick={() => onChange(!value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!value) } }}
          className={styles.checkboxRow}
        >
          <div className={`${styles.checkbox} ${value ? styles.checkboxChecked : ''}`}>
            {value && '✓'}
          </div>
          <span className={styles.checkboxLabel}>
            {label}{required && <span className={styles.required}> *</span>}
          </span>
        </div>
      </div>
    )
  }

  if (type === 'textarea') {
    return (
      <div className={styles.fieldWrap}>
        <Input
          label={label ? `${label}${required ? ' *' : ''}` : undefined}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    )
  }

  if (type === 'select' && options) {
    return (
      <div className={styles.fieldWrap}>
        <div className={styles.label}>
          {label}{required && <span className={styles.required}> *</span>}
        </div>
        <select
          className={styles.select}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options.map(opt => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className={styles.fieldWrap}>
      <Input
        label={label ? `${label}${required ? ' *' : ''}` : undefined}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type={type || 'text'}
      />
    </div>
  )
}
