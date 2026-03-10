// ═══════════════════════════════════════════
// MIGRATION EXAMPLE: Converting a page component
//
// This shows how to convert existing components
// from inline styles → UI Kit primitives.
//
// The key insight: you're not rewriting logic.
// You're replacing HOW things look (inline styles)
// with WHAT things are (semantic components).
// ═══════════════════════════════════════════


// ─────────────────────────────────────────
// BEFORE: Inline styles, direct config imports
// ─────────────────────────────────────────

/*
import { C, cardStyle, labelStyle, btnStyle, inputStyle } from '@/config/index.js'

function ChemicalCard({ chemical, onEdit, onDelete }) {
  return (
    <div style={cardStyle()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{chemical.name}</div>
          <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
            EPA: {chemical.epa}
          </div>
        </div>
        <div style={{
          padding: '3px 10px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          background: C.accentLight,
          color: C.accent,
        }}>
          {chemical.signal}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onEdit}
          style={btnStyle(C.blue, '#fff', { width: 'auto', padding: '8px 16px', fontSize: 13 })}>
          Edit
        </button>
        <button onClick={onDelete}
          style={btnStyle(C.red, '#fff', { width: 'auto', padding: '8px 16px', fontSize: 13 })}>
          Delete
        </button>
      </div>
    </div>
  )
}
*/


// ─────────────────────────────────────────
// AFTER: UI Kit primitives, no inline styles
// ─────────────────────────────────────────

import { Card, Badge, Button } from '@/ui'

const SIGNAL_VARIANTS = {
  CAUTION: 'accent',
  WARNING: 'amber',
  DANGER:  'red',
}

function ChemicalCard({ chemical, onEdit, onDelete }) {
  return (
    <Card>
      <Card.Header
        title={chemical.name}
        subtitle={`EPA: ${chemical.epa}`}
        action={
          <Badge variant={SIGNAL_VARIANTS[chemical.signal] || 'neutral'}>
            {chemical.signal}
          </Badge>
        }
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button variant="blue" size="sm" fullWidth={false} onClick={onEdit}>
          Edit
        </Button>
        <Button variant="red" size="sm" fullWidth={false} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  )
}


// ─────────────────────────────────────────
// BEFORE: Modal with inline styles
// ─────────────────────────────────────────

/*
import { Modal as OldModal } from '@/admin/components/SharedAdmin.jsx'
// The old Modal required passing C, cardStyle, etc. internally

<OldModal open={editing} onCancel={() => setEditing(null)} title="Edit Chemical">
  <div>
    <div style={labelStyle}>Name</div>
    <input style={inputStyle()} value={name} onChange={e => setName(e.target.value)} />
  </div>
  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
    <button style={btnStyle(C.accent)} onClick={handleSave}>Save</button>
    <button style={btnStyle(C.card, C.text, { border: `1.5px solid ${C.cardBorder}` })} onClick={() => setEditing(null)}>Cancel</button>
  </div>
</OldModal>
*/


// ─────────────────────────────────────────
// AFTER: UI Kit Modal + Input + Button
// ─────────────────────────────────────────

import { Modal, Input } from '@/ui'

function EditChemicalModal({ open, onClose, chemical, onSave }) {
  // State management stays the same — hooks don't change
  // Only the JSX markup changes

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Chemical"
      footer={
        <>
          <Button variant="accent" onClick={onSave}>Save</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <Input label="Name" value={chemical?.name || ''} onChange={() => {}} />
      <Input label="EPA Number" value={chemical?.epa || ''} onChange={() => {}} />
    </Modal>
  )
}


// ─────────────────────────────────────────
// MIGRATION CHECKLIST (per component)
// ─────────────────────────────────────────
//
// 1. Replace `import { C, cardStyle, btnStyle, ... } from '@/config'`
//    with `import { Card, Button, Input, ... } from '@/ui'`
//
// 2. Replace `<div style={cardStyle()}>` with `<Card>`
//
// 3. Replace `<button style={btnStyle(C.accent)}>` with `<Button>`
//
// 4. Replace `<input style={inputStyle()}>` with `<Input>`
//
// 5. Replace `<div style={labelStyle}>` — it's now built into <Input label="...">
//
// 6. Replace inline color references (C.textLight, C.red, etc.)
//    with CSS Module classes or component variants
//
// 7. Any remaining one-off layout styles can stay as inline styles
//    or move to a local .module.css file — these are the minority
//
// 8. Test the component. Commit. Move on.

export { ChemicalCard, EditChemicalModal }
