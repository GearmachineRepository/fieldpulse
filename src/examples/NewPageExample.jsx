// ═══════════════════════════════════════════
// EXAMPLE: Building a New Page (Decoupled)
//
// This file shows the COMPLETE pattern for
// building a new admin page. Copy this as
// your starting point.
//
// Notice:
// - No prop drilling from shells
// - No AppContext dispatch calls
// - No inline style objects
// - Data comes from useData(), UI from @/ui
// - The page is 100% self-contained
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useData } from '@/context/DataProvider.jsx'
import {
  Card,
  Button,
  Input,
  Modal,
  Tabs,
  Badge,
  EmptyState,
  SectionHeader,
} from '@/ui'

// ─────────────────────────────────────────
// This page manages chemicals. It fetches
// its own data, handles CRUD, shows toasts.
// It doesn't know what shell it lives in.
// ─────────────────────────────────────────

export default function ChemicalsPageExample() {
  const { chemicals, toast } = useData()
  const [editing, setEditing] = useState(null)

  // Fetch on mount
  useEffect(() => {
    chemicals.refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Create ──
  const handleCreate = async (formData) => {
    try {
      await chemicals.create(formData)
      toast.show('Chemical added ✓')
      setEditing(null)
    } catch {
      toast.show('Failed to add chemical')
    }
  }

  // ── Update ──
  const handleUpdate = async (id, formData) => {
    try {
      await chemicals.update(id, formData)
      toast.show('Chemical updated ✓')
      setEditing(null)
    } catch {
      toast.show('Failed to update')
    }
  }

  // ── Delete ──
  const handleDelete = async (id) => {
    try {
      await chemicals.remove(id)
      toast.show('Chemical deleted ✓')
    } catch {
      toast.show('Failed to delete')
    }
  }

  // ── Loading state ──
  if (chemicals.loading && chemicals.data.length === 0) {
    return <EmptyState icon="⏳" title="Loading chemicals..." />
  }

  // ── Empty state ──
  if (chemicals.data.length === 0) {
    return (
      <EmptyState
        icon="🧪"
        title="No Chemicals"
        subtitle="Add your first chemical to get started."
        action={
          <Button onClick={() => setEditing({})}>
            + Add Chemical
          </Button>
        }
      />
    )
  }

  // ── Main view ──
  return (
    <div>
      <SectionHeader
        title="Chemicals"
        count={chemicals.data.length}
        onAdd={() => setEditing({})}
        addLabel="Add Chemical"
      />

      {chemicals.data.map(chem => (
        <Card key={chem.id}>
          <Card.Header
            title={chem.name}
            subtitle={`EPA: ${chem.epa || '—'}`}
            action={
              <Badge variant={chem.signal === 'DANGER' ? 'red' : chem.signal === 'WARNING' ? 'amber' : 'accent'}>
                {chem.signal}
              </Badge>
            }
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="blue" size="sm" fullWidth={false} onClick={() => setEditing(chem)}>
              Edit
            </Button>
            <Button variant="red" size="sm" fullWidth={false} onClick={() => handleDelete(chem.id)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}

      {/* ── Edit/Create Modal ── */}
      {editing && (
        <ChemicalForm
          chemical={editing}
          onSave={editing.id ? (d) => handleUpdate(editing.id, d) : handleCreate}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}


// ─────────────────────────────────────────
// Form component — also uses UI Kit
// ─────────────────────────────────────────

function ChemicalForm({ chemical, onSave, onClose }) {
  const [name, setName] = useState(chemical.name || '')
  const [epa, setEpa]   = useState(chemical.epa || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSave({ name, epa })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={chemical.id ? 'Edit Chemical' : 'New Chemical'}
      footer={
        <>
          <Button variant="ghost" fullWidth={false} onClick={onClose}>Cancel</Button>
          <Button variant="accent" fullWidth={false} onClick={handleSubmit} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="EPA Number" value={epa} onChange={e => setEpa(e.target.value)} />
      </div>
    </Modal>
  )
}


// ─────────────────────────────────────────
// TO ADD THIS PAGE TO THE APP:
//
// 1. Save this file as:
//      src/admin/pages/admin/ChemicalsPage.jsx
//
// 2. In AdminDashboard.jsx, add:
//      import ChemicalsPage from './admin/ChemicalsPage.jsx'
//      if (page === 'admin-chemicals') return <ChemicalsPage />
//
// 3. In AdminSidebar.jsx NAV_GROUPS, add:
//      { key: 'admin-chemicals', icon: '🧪', label: 'Chemicals' }
//
// That's it. No prop drilling. No shell changes.
// The page fetches its own data via useData().
// ─────────────────────────────────────────
