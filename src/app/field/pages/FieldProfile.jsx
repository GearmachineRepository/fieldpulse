// ═══════════════════════════════════════════
// Field Profile — Employee info, clock-in, resources
// Certifications always visible. Bottom sheet for resource filtering.
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
  Clock,
  Shield,
  BookOpen,
  ChevronRight,
  LogOut,
  Users,
  CheckCircle2,
  Loader2,
  Search,
  ExternalLink,
  Download,
  FileText,
  Pin,
  Truck,
  GraduationCap,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { T } from '@/app/tokens.js'
import useAuth from '@/hooks/useAuth.jsx'
import { submitRoster, getTodayRoster } from '@/lib/api/rosters.js'
import { getEmployees } from '@/lib/api/employees.js'
import { getResources, getResourceCategories } from '@/lib/api/resources.js'
import { getEmployeeCertifications } from '@/lib/api/certifications.js'
import { getTrainingSessions } from '@/lib/api/training.js'
import {
  BottomSheet,
  BottomSheetOption,
  FilterButton,
} from '@/app/field/components/BottomSheet.jsx'

export default function FieldProfile({ initialView, onViewConsumed }) {
  const { employee, crew, vehicle, logout } = useAuth()
  const [view, setView] = useState('main')

  // Handle external navigation (e.g., clock-in from FieldHome)
  useEffect(() => {
    if (initialView) {
      setView(initialView) // eslint-disable-line react-hooks/set-state-in-effect -- Sync view from prop
      onViewConsumed?.()
    }
  }, [initialView, onViewConsumed])

  if (view === 'clockin')
    return <ClockInView crew={crew} employee={employee} onBack={() => setView('main')} />
  if (view === 'resources') return <ResourcesView onBack={() => setView('main')} />
  if (view === 'certs') return <CertsView employee={employee} onBack={() => setView('main')} />

  return (
    <div style={{ padding: 20 }}>
      {/* Profile card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          padding: 20,
          background: T.card,
          borderRadius: 3,
          border: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 3,
            background: T.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 600,
            color: T.card,
            flexShrink: 0,
          }}
        >
          {employee?.firstName?.[0] || ''}
          {employee?.lastName?.[0] || ''}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>
            {employee?.firstName} {employee?.lastName}
          </div>
          <div style={{ fontSize: 13, color: T.textLight }}>
            {crew?.name || 'No crew'}
            {employee?.isCrewLead ? ' · Crew Lead' : ''}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <InfoCard
          icon={Shield}
          label="License"
          value={employee?.license}
          placeholder="Not set"
          color={T.accent}
        />
        <InfoCard
          icon={Shield}
          label="Certification"
          value={employee?.certNumber}
          placeholder="None"
          color={T.blue}
        />
        <InfoCard
          icon={Users}
          label="Crew"
          value={crew?.name}
          placeholder="Unassigned"
          color={T.purple}
        />
        <InfoCard
          icon={Truck}
          label="Vehicle"
          value={vehicle?.name}
          placeholder="None"
          color={T.amber}
        />
      </div>

      {/* Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MenuButton
          icon={Clock}
          label="Clock In / Out"
          color={T.blue}
          onClick={() => setView('clockin')}
        />
        <MenuButton
          icon={BookOpen}
          label="Safety & Resources"
          sublabel="SDS sheets, manuals, policies"
          color={T.amber}
          onClick={() => setView('resources')}
        />
        <MenuButton
          icon={Shield}
          label="Certifications & Training"
          sublabel={employee?.license ? `License: ${employee.license}` : 'View details'}
          color={T.accent}
          onClick={() => setView('certs')}
        />
        <div style={{ height: 12 }} />
        <MenuButton icon={LogOut} label="Sign Out" color={T.red} onClick={logout} />
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, placeholder, color }) {
  const hasValue = !!value
  return (
    <div
      style={{
        padding: '14px 16px',
        background: T.card,
        borderRadius: 3,
        border: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={hasValue ? color : T.textLight} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: T.textLight,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: hasValue ? T.text : T.textLight }}>
        {value || placeholder}
      </div>
    </div>
  )
}

function MenuButton({ icon: Icon, label, sublabel, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '16px 18px',
        background: T.card,
        borderRadius: 3,
        border: `1px solid ${T.border}`,
        cursor: 'pointer',
        fontFamily: T.font,
      }}
    >
      <Icon size={20} color={color} />
      <div style={{ flex: 1, textAlign: 'left' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{label}</span>
        {sublabel && (
          <div style={{ fontSize: 12, color: T.textLight, marginTop: 1 }}>{sublabel}</div>
        )}
      </div>
      <ChevronRight size={18} color={T.textLight} />
    </button>
  )
}

// ═══════════════════════════════════════════
// Certifications & Training View
// ═══════════════════════════════════════════
function CertsView({ employee, onBack }) {
  const [tab, setTab] = useState('certs')
  const [certs, setCerts] = useState([])
  const [training, setTraining] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [certsData, trainingData] = await Promise.all([
          getEmployeeCertifications(employee?.id).catch(() => []),
          getTrainingSessions().catch(() => []),
        ])
        setCerts(certsData)
        // Filter training to sessions this employee signed off on, or all if crew lead
        setTraining(trainingData)
      } catch {}
      setLoading(false)
    }
    if (employee?.id) load()
  }, [employee?.id])

  const now = new Date()
  const soon = new Date(now.getTime() + 30 * 86400000)

  const getCertStatus = (cert) => {
    if (!cert.expiry_date) return { label: 'No expiry', color: T.textLight }
    const exp = new Date(cert.expiry_date)
    if (exp < now) return { label: 'Expired', color: T.red }
    if (exp < soon) return { label: 'Expiring soon', color: T.amber }
    return { label: 'Valid', color: T.accent }
  }

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—'

  const tabs = [
    { key: 'certs', label: 'Certifications', count: certs.length },
    { key: 'training', label: 'Training', count: training.length },
  ]

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: T.font,
          fontSize: 14,
          color: T.textLight,
          fontWeight: 600,
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Back
      </button>

      <div style={{ fontSize: 22, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        Certifications & Training
      </div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 16 }}>
        Contact your admin to update details.
      </div>

      {/* Quick stats from employee record */}
      {(employee?.license || employee?.certNumber) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {employee?.license && (
            <div
              style={{
                padding: '12px 14px',
                background: T.card,
                borderRadius: 3,
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Shield size={12} color={T.accent} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: T.textLight,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  License
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{employee.license}</div>
            </div>
          )}
          {employee?.certNumber && (
            <div
              style={{
                padding: '12px 14px',
                background: T.card,
                borderRadius: 3,
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <ClipboardCheck size={12} color={T.blue} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: T.textLight,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Cert #
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                {employee.certNumber}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: T.font,
              border: `1.5px solid ${tab === t.key ? T.accent : T.border}`,
              background: tab === t.key ? T.accentLight : T.card,
              color: tab === t.key ? T.accent : T.textMed,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.label} {t.count > 0 && <span style={{ opacity: 0.7 }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 30 }}>
          <Loader2 size={24} color={T.textLight} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : tab === 'certs' ? (
        /* ── Certifications Tab ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {certs.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                background: T.card,
                borderRadius: 3,
                border: `1px dashed ${T.border}`,
                textAlign: 'center',
              }}
            >
              <Shield
                size={32}
                color={T.textLight}
                strokeWidth={1}
                style={{ margin: '0 auto 12px' }}
              />
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                No certifications
              </div>
              <div style={{ fontSize: 13, color: T.textLight }}>
                Your admin will add certifications here.
              </div>
            </div>
          ) : (
            certs.map((cert) => {
              const status = getCertStatus(cert)
              return (
                <div
                  key={cert.id}
                  style={{
                    padding: '16px 18px',
                    background: T.card,
                    borderRadius: 3,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                        {cert.name}
                      </div>
                      {cert.type_name && (
                        <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>
                          {cert.type_name}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 3,
                        background: `${status.color}15`,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {cert.issuing_authority && (
                      <div style={{ fontSize: 12, color: T.textLight }}>
                        <span style={{ fontWeight: 600 }}>Issuer:</span> {cert.issuing_authority}
                      </div>
                    )}
                    {cert.cert_number && (
                      <div style={{ fontSize: 12, color: T.textLight }}>
                        <span style={{ fontWeight: 600 }}>#:</span> {cert.cert_number}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                    <div style={{ fontSize: 12, color: T.textLight }}>
                      <span style={{ fontWeight: 600 }}>Issued:</span>{' '}
                      {formatDate(cert.issued_date)}
                    </div>
                    <div style={{ fontSize: 12, color: T.textLight }}>
                      <span style={{ fontWeight: 600 }}>Expires:</span>{' '}
                      {formatDate(cert.expiry_date)}
                    </div>
                  </div>
                  {cert.notes && (
                    <div
                      style={{ fontSize: 12, color: T.textMed, marginTop: 6, fontStyle: 'italic' }}
                    >
                      {cert.notes}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* ── Training Tab ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {training.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                background: T.card,
                borderRadius: 3,
                border: `1px dashed ${T.border}`,
                textAlign: 'center',
              }}
            >
              <GraduationCap
                size={32}
                color={T.textLight}
                strokeWidth={1}
                style={{ margin: '0 auto 12px' }}
              />
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                No training sessions
              </div>
              <div style={{ fontSize: 13, color: T.textLight }}>
                Training records will appear here.
              </div>
            </div>
          ) : (
            training.map((session) => {
              const statusColors = { scheduled: T.blue, in_progress: T.amber, completed: T.accent }
              const statusColor = statusColors[session.status] || T.textLight
              return (
                <TrainingCard
                  key={session.id}
                  session={session}
                  statusColor={statusColor}
                  formatDate={formatDate}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function TrainingCard({ session, statusColor, formatDate }) {
  const [expanded, setExpanded] = useState(false)
  const typeLabels = {
    safety: 'Safety',
    heat_illness: 'Heat Illness Prevention',
    pesticide_safety: 'Pesticide Safety',
    equipment_operation: 'Equipment Operation',
    tailgate: 'Tailgate Meeting',
    video: 'Video Training',
    other: 'Other',
  }
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 3,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 18px',
          width: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: T.font,
          textAlign: 'left',
        }}
      >
        <GraduationCap size={18} color={statusColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{session.title}</div>
          <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>
            {typeLabels[session.type] || session.type || 'Training'} ·{' '}
            {formatDate(session.training_date)}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 3,
            background: `${statusColor}15`,
            color: statusColor,
            textTransform: 'capitalize',
            flexShrink: 0,
          }}
        >
          {(session.status || '').replace('_', ' ')}
        </span>
        {expanded ? (
          <ChevronUp size={16} color={T.textLight} />
        ) : (
          <ChevronDown size={16} color={T.textLight} />
        )}
      </button>
      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {session.trainer && (
              <div style={{ fontSize: 12, color: T.textLight }}>
                <span style={{ fontWeight: 600 }}>Trainer:</span> {session.trainer}
              </div>
            )}
            {session.location && (
              <div style={{ fontSize: 12, color: T.textLight }}>
                <span style={{ fontWeight: 600 }}>Location:</span> {session.location}
              </div>
            )}
            {session.duration_hours && (
              <div style={{ fontSize: 12, color: T.textLight }}>
                <span style={{ fontWeight: 600 }}>Duration:</span> {session.duration_hours}h
              </div>
            )}
            {session.description && (
              <div style={{ fontSize: 12, color: T.textMed, marginTop: 4 }}>
                {session.description}
              </div>
            )}
            {session.signoff_count > 0 && (
              <div style={{ fontSize: 12, color: T.accent, marginTop: 4, fontWeight: 600 }}>
                {session.signoff_count} attendee{session.signoff_count !== 1 ? 's' : ''} signed off
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Clock In View
// ═══════════════════════════════════════════
function ClockInView({ crew, employee, onBack }) {
  const [crewMembers, setCrewMembers] = useState([])
  const [allEmployees, setAllEmployees] = useState([])
  const [todayRoster, setTodayRoster] = useState(null)
  const [selected, setSelected] = useState([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAllEmployees, setShowAllEmployees] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const allEmps = await getEmployees()
        setAllEmployees(allEmps)
        const members = allEmps.filter((e) => e.default_crew_id === crew?.id)
        setCrewMembers(members)
        const roster = await getTodayRoster(crew?.id)
        setTodayRoster(roster)
        if (roster) {
          setSelected(roster.members.map((m) => ({ id: m.employeeId, name: m.name })))
          setNotes(roster.notes || '')
        } else {
          setSelected(members.map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}` })))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [crew])

  // Employees from other crews (not in current crew)
  const otherEmployees = allEmployees.filter((e) => e.default_crew_id !== crew?.id)

  const toggleMember = (emp) => {
    const exists = selected.find((m) => m.id === emp.id)
    if (exists) setSelected(selected.filter((m) => m.id !== emp.id))
    else setSelected([...selected, { id: emp.id, name: `${emp.first_name} ${emp.last_name}` }])
  }

  const handleSubmit = async () => {
    if (selected.length === 0) return
    setSubmitting(true)
    try {
      await submitRoster({
        crewId: crew?.id,
        crewName: crew?.name || '—',
        submittedById: employee?.id,
        submittedByName: `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim(),
        members: selected.map((m) => ({ id: m.id, name: m.name, present: true })),
        notes: notes || null,
      })
      setTodayRoster(await getTodayRoster(crew?.id))
    } catch {}
    setSubmitting(false)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (loading)
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Loader2 size={24} color={T.textLight} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: T.font,
          fontSize: 14,
          color: T.textLight,
          fontWeight: 600,
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Back
      </button>

      <div style={{ fontSize: 14, color: T.textLight, marginBottom: 4 }}>{today}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: T.text, marginBottom: 20 }}>
        {crew?.name || 'My Crew'} — Clock In
      </div>

      {todayRoster && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            background: T.accentLight,
            borderRadius: 3,
            border: `1px solid ${T.accentBorder}`,
            marginBottom: 20,
          }}
        >
          <CheckCircle2 size={22} color={T.accent} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.accent }}>Crew Clocked In</div>
            <div style={{ fontSize: 12, color: '#047857' }}>{selected.length} members today</div>
          </div>
          <button
            onClick={() => setTodayRoster(null)}
            style={{
              padding: '6px 14px',
              borderRadius: 3,
              border: `1px solid ${T.accentBorder}`,
              background: T.card,
              cursor: 'pointer',
              fontFamily: T.font,
              fontSize: 12,
              fontWeight: 600,
              color: T.accent,
            }}
          >
            Edit
          </button>
        </div>
      )}

      {!todayRoster && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textLight, marginBottom: 10 }}>
            Who's working today?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {crewMembers.map((emp) => {
              const isSelected = selected.some((m) => m.id === emp.id)
              return (
                <button
                  key={emp.id}
                  onClick={() => toggleMember(emp)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    background: T.card,
                    borderRadius: 3,
                    border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                    cursor: 'pointer',
                    fontFamily: T.font,
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 3,
                      border: `2px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accent : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <span style={{ color: T.card, fontSize: 12, fontWeight: 600 }}>✓</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                      {emp.first_name} {emp.last_name}
                    </div>
                  </div>
                  {emp.is_crew_lead && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: T.accentLight,
                        color: T.accent,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      Lead
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Add from other crews */}
          {otherEmployees.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowAllEmployees(!showAllEmployees)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontFamily: T.font,
                  background: showAllEmployees ? `${T.blue}10` : T.bg,
                  border: `1.5px solid ${showAllEmployees ? T.blue : T.border}`,
                  color: showAllEmployees ? T.blue : T.textMed,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Users size={16} />
                {showAllEmployees ? 'Hide fill-ins' : 'Add fill-in from other crews'}
              </button>
              {showAllEmployees && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  {otherEmployees.map((emp) => {
                    const isSelected = selected.some((m) => m.id === emp.id)
                    return (
                      <button
                        key={emp.id}
                        onClick={() => toggleMember(emp)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 16px',
                          background: T.card,
                          borderRadius: 3,
                          border: `1.5px solid ${isSelected ? T.blue : T.border}`,
                          cursor: 'pointer',
                          fontFamily: T.font,
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 3,
                            border: `2px solid ${isSelected ? T.blue : T.border}`,
                            background: isSelected ? T.blue : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && (
                            <span style={{ color: T.card, fontSize: 12, fontWeight: 600 }}>✓</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div style={{ fontSize: 11, color: T.textLight }}>Fill-in</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes (optional)"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 3,
                background: T.bg,
                border: `1.5px solid ${T.border}`,
                color: T.text,
                fontSize: 14,
                fontFamily: T.font,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || selected.length === 0}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 3,
              border: 'none',
              cursor: 'pointer',
              background: T.accent,
              color: T.card,
              fontSize: 16,
              fontWeight: 600,
              fontFamily: T.font,
              opacity: submitting || selected.length === 0 ? 0.5 : 1,
            }}
          >
            {submitting
              ? 'Submitting...'
              : `Clock In ${selected.length} Member${selected.length !== 1 ? 's' : ''}`}
          </button>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Resources View — Bottom sheet filter
// ═══════════════════════════════════════════
function ResourcesView({ onBack }) {
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    Promise.all([getResources(), getResourceCategories()])
      .then(([res, cats]) => {
        setResources(res)
        setCategories(cats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = resources.filter((r) => {
    if (activeCategory && r.categoryId !== activeCategory) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
  })

  const activeCatName = activeCategory
    ? categories.find((c) => c.id === activeCategory)?.name
    : null

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: T.font,
          fontSize: 14,
          color: T.textLight,
          fontWeight: 600,
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Back
      </button>

      <div style={{ fontSize: 22, fontWeight: 600, color: T.text, marginBottom: 16 }}>
        Safety & Resources
      </div>

      {/* Search + filter button */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: T.card,
            flex: 1,
            borderRadius: 3,
            padding: '12px 14px',
            border: `1px solid ${T.border}`,
          }}
        >
          <Search size={18} color={T.textLight} />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search..."
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: 14,
              fontFamily: T.font,
              background: 'transparent',
              color: T.text,
            }}
          />
        </div>
        <FilterButton
          label="Filter"
          activeLabel={activeCatName}
          onClick={() => setShowFilter(true)}
        />
      </div>

      {/* Bottom sheet filter */}
      <BottomSheet
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter by Category"
      >
        <BottomSheetOption
          label="All Resources"
          count={resources.length}
          active={!activeCategory}
          onClick={() => {
            setActiveCategory(null)
            setShowFilter(false)
          }}
        />

        {categories.map((cat) => (
          <BottomSheetOption
            key={cat.id}
            label={cat.name}
            count={cat.resourceCount}
            color={cat.color}
            active={activeCategory === cat.id}
            onClick={() => {
              setActiveCategory(cat.id)
              setShowFilter(false)
            }}
          />
        ))}
      </BottomSheet>

      {/* Resource list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30 }}>
          <Loader2 size={24} color={T.textLight} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            background: T.card,
            borderRadius: 3,
            border: `1px dashed ${T.border}`,
            textAlign: 'center',
          }}
        >
          <BookOpen
            size={32}
            color={T.textLight}
            strokeWidth={1}
            style={{ margin: '0 auto 12px' }}
          />
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>
            {searchQ || activeCategory ? 'No matches' : 'No resources'}
          </div>
          <div style={{ fontSize: 13, color: T.textLight }}>
            {searchQ ? 'Try different search terms.' : "Your admin hasn't added resources yet."}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((r) => {
            const isFile = r.resourceType === 'file'
            return (
              <a
                key={r.id}
                href={isFile ? `/uploads/${r.filename}` : r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 16px',
                  background: T.card,
                  borderRadius: 3,
                  border: `1px solid ${T.border}`,
                  textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 3,
                    flexShrink: 0,
                    background: isFile ? `${T.accent}10` : `${T.blue}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isFile ? (
                    <FileText size={20} color={T.accent} />
                  ) : (
                    <ExternalLink size={20} color={T.blue} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: T.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.title}
                    </div>
                    {r.pinned && <Pin size={11} color={T.amber} />}
                  </div>
                  {r.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: T.textLight,
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    {r.categoryName && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: r.categoryColor || T.textLight,
                        }}
                      >
                        {r.categoryName}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {isFile ? (
                    <Download size={16} color={T.accent} />
                  ) : (
                    <ExternalLink size={16} color={T.blue} />
                  )}
                </div>
              </a>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
