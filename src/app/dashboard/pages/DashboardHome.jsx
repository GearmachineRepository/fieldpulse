// ═══════════════════════════════════════════
// Dashboard Home — Command Center
//
// Pinnable card system: cards fetched from server,
// "Customize" modal to toggle + reorder.
// ═══════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  AlertTriangle,
  Clock,
  Briefcase,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  BookOpen,
  Truck,
  MapPin,
  FileText,
  Inbox,
  Settings,
} from 'lucide-react'
import useNavigation from '@/hooks/useNavigation.js'
import usePageData from '@/hooks/usePageData.js'
import useModules from '@/hooks/useModules.jsx'
import { useGlobalToast } from '@/hooks/ToastContext.jsx'
import { getCrews, getEmployees, getVehicles, getAccounts } from '@/lib/api/index.js'
import { getAttendanceToday } from '@/lib/api/rosters.js'
import { getDashboardPins, updateDashboardPins } from '@/lib/api/dashboard.js'
import { AVAILABLE_CARDS } from '../cards.js'
import AddressLink from '../components/AddressLink.jsx'
import StatCard from '../components/StatCard.jsx'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { Modal, ModalFooter } from '../components/PageUI.jsx'
import s from './DashboardHome.module.css'

const ts = DataTable.s

export default function DashboardHome() {
  const { navigate: onNavigate } = useNavigation()
  const { isEnabled } = useModules()
  const toast = useGlobalToast()

  // ── Pin state ──
  const [pins, setPins] = useState(null)
  const [customizeOpen, setCustomizeOpen] = useState(false)

  useEffect(() => {
    getDashboardPins()
      .then((data) => setPins(data))
      .catch(() => {
        // Fallback to defaults if server unavailable
        setPins([
          { card_key: 'crew_activity', position: 1 },
          { card_key: 'active_projects', position: 2 },
          { card_key: 'compliance_alerts', position: 3 },
          { card_key: 'quick_actions', position: 4 },
        ])
      })
  }, [])

  const pinnedKeys = (pins || []).sort((a, b) => a.position - b.position).map((p) => p.card_key)

  // ── Data domains via usePageData ──
  const crews = usePageData('crews', { fetchFn: getCrews })
  const employees = usePageData('employees', { fetchFn: getEmployees })
  const vehicles = usePageData('vehicles', { fetchFn: getVehicles })
  const accounts = usePageData('accounts', { fetchFn: getAccounts })

  // ── Attendance (specialized endpoint) ──
  const [attendance, setAttendance] = useState(null)
  const [loadingAttendance, setLoadingAttendance] = useState(true)

  useEffect(() => {
    getAttendanceToday()
      .then(setAttendance)
      .catch(() => {})
      .finally(() => setLoadingAttendance(false))
  }, [])

  // ── Header ──
  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
        ? 'Good afternoon'
        : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // ── Derived stats ──
  const totalWorking = attendance?.totalWorking || 0
  const totalEmployees = attendance?.totalEmployees || employees.data.length
  const rostersSubmitted = attendance?.crews?.filter((c) => c.submitted).length || 0
  const totalCrews = attendance?.crews?.length || crews.data.length

  const crewsWithAttendance =
    attendance?.crews ||
    crews.data.map((c) => ({
      crewId: c.id,
      crewName: c.name,
      submitted: false,
      memberCount: 0,
      clockInTime: null,
      members: [],
    }))

  const recentProjects = accounts.data.slice(0, 3)

  const isLoading = crews.loading || employees.loading || vehicles.loading || accounts.loading

  // ── Stat cards config ──
  const statCards = [
    {
      label: 'Crews On-Site',
      value: String(rostersSubmitted),
      sub: `${rostersSubmitted}/${totalCrews} clocked in`,
      icon: Users,
      color: 'var(--grn)',
    },
    {
      label: 'Active Projects',
      value: String(accounts.data.length),
      sub: `${accounts.data.length} project${accounts.data.length !== 1 ? 's' : ''}`,
      icon: Briefcase,
      color: 'var(--blu)',
    },
    {
      label: 'Working Today',
      value: String(totalWorking),
      sub: `of ${totalEmployees} employees`,
      icon: Clock,
      color: 'var(--amb)',
    },
    {
      label: 'Compliance',
      value: '\u2014',
      sub: 'Certs & training',
      icon: ShieldCheck,
      color: 'var(--red)',
    },
  ]

  // ── Quick actions ──
  const quickActions = [
    { icon: Briefcase, label: 'Projects', sub: 'Manage sites', page: 'projects' },
    { icon: Users, label: 'Crews', sub: "Today's crews", page: 'crews' },
    { icon: Truck, label: 'Fleet', sub: 'Inspections', page: 'vehicles' },
    { icon: ShieldCheck, label: 'Compliance', sub: 'Certs & training', page: 'training' },
    { icon: BookOpen, label: 'Resources', sub: 'SDS & docs', page: 'documents' },
  ]

  // ── Crew table ──
  const crewTableHeaders = [
    { label: 'Crew' },
    { label: 'Members' },
    { label: 'Status' },
    { label: 'Clock-In', right: true },
  ]

  // ── Save pins ──
  const savePins = useCallback(
    async (newPins) => {
      setPins(newPins)
      try {
        await updateDashboardPins(newPins)
      } catch {
        toast.show('Failed to save dashboard layout')
      }
    },
    [toast],
  )

  // ── Card content renderer ──
  function renderCard(cardKey) {
    switch (cardKey) {
      case 'crew_activity':
        return (
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardTitleWrap}>
                <Users size={18} color="var(--t2)" />
                <span className={s.cardTitle}>Crew Activity</span>
              </div>
              <button onClick={() => onNavigate?.('clock-in')} className={s.cardLink}>
                View All <ChevronRight size={14} />
              </button>
            </div>
            {loadingAttendance || crews.loading ? (
              <div className={s.skeletonRows}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={s.skeletonRow} />
                ))}
              </div>
            ) : crewsWithAttendance.length === 0 ? (
              <div className={s.emptyState}>
                <Users size={32} color="var(--t3)" strokeWidth={1.2} />
                <div className={s.emptyTitle}>No crews set up</div>
                <div className={s.emptySub}>Create crews to track daily attendance.</div>
              </div>
            ) : (
              <DataTable headers={crewTableHeaders}>
                {crewsWithAttendance.slice(0, 6).map((c, i) => (
                  <tr key={i} className={ts.tr}>
                    <td className={ts.td}>{c.crewName}</td>
                    <td className={`${ts.td} ${ts.tdMono}`}>{c.memberCount || '\u2014'}</td>
                    <td className={ts.td}>
                      <StatusBadge variant={c.submitted ? 'green' : 'gray'}>
                        {c.submitted ? 'Clocked In' : 'Pending'}
                      </StatusBadge>
                    </td>
                    <td className={`${ts.td} ${ts.tdMono} ${ts.tdRight}`}>
                      {c.clockInTime || '\u2014'}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        )

      case 'active_projects':
        return (
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardTitleWrap}>
                <MapPin size={18} color="var(--t2)" />
                <span className={s.cardTitle}>Active Projects</span>
              </div>
              <button onClick={() => onNavigate?.('projects')} className={s.cardLink}>
                View All <ChevronRight size={14} />
              </button>
            </div>
            {accounts.loading ? (
              <div className={s.skeletonRows}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={s.skeletonRow} />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className={s.emptyState}>
                <MapPin size={32} color="var(--t3)" strokeWidth={1.2} />
                <div className={s.emptyTitle}>No projects yet</div>
                <div className={s.emptySub}>Add your first project to get started.</div>
                <button className={s.emptyCta} onClick={() => onNavigate?.('projects')}>
                  Add Project
                </button>
              </div>
            ) : (
              recentProjects.map((proj) => (
                <div
                  key={proj.id}
                  className={s.projectCard}
                  onClick={() => onNavigate?.('projects')}
                >
                  <div className={s.projectName}>{proj.name}</div>
                  <div className={s.projectAddress}>
                    {proj.address ? (
                      <AddressLink address={proj.address} city={proj.city} state={proj.state} />
                    ) : (
                      'No address'
                    )}
                  </div>
                  <StatusBadge variant={proj.status === 'active' ? 'green' : 'gray'}>
                    {proj.status || 'Active'}
                  </StatusBadge>
                </div>
              ))
            )}
          </div>
        )

      case 'compliance_alerts':
        return (
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardTitleWrap}>
                <ShieldCheck size={18} color="var(--t2)" />
                <span className={s.cardTitle}>Compliance Alerts</span>
              </div>
            </div>
            <div className={s.emptyState}>
              <Inbox size={32} color="var(--t3)" strokeWidth={1.2} />
              <div className={s.emptyTitle}>No compliance alerts</div>
              <div className={s.emptySub}>Certificate and training alerts will show here.</div>
            </div>
          </div>
        )

      case 'quick_actions':
        return (
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardTitleWrap}>
                <span className={s.cardTitle}>Quick Actions</span>
              </div>
            </div>
            <div className={s.quickGrid}>
              {quickActions.map((a, i) => (
                <div key={i} onClick={() => onNavigate?.(a.page)} className={s.quickActionCard}>
                  <a.icon size={20} color="var(--t2)" strokeWidth={1.5} />
                  <div className={s.quickActionLabel}>{a.label}</div>
                  <div className={s.quickActionSub}>{a.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'gps_overview':
        return (
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardTitleWrap}>
                <MapPin size={18} color="var(--t2)" />
                <span className={s.cardTitle}>GPS Overview</span>
              </div>
            </div>
            <div className={s.emptyState}>
              <MapPin size={32} color="var(--t3)" strokeWidth={1.2} />
              <div className={s.emptyTitle}>GPS tracking coming soon</div>
              <div className={s.emptySub}>Real-time crew locations will appear here.</div>
            </div>
          </div>
        )

      case 'training_due':
        return (
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardTitleWrap}>
                <BookOpen size={18} color="var(--t2)" />
                <span className={s.cardTitle}>Training Due</span>
              </div>
            </div>
            <div className={s.emptyState}>
              <BookOpen size={32} color="var(--t3)" strokeWidth={1.2} />
              <div className={s.emptyTitle}>No training due</div>
              <div className={s.emptySub}>Upcoming training sessions will appear here.</div>
            </div>
          </div>
        )

      case 'recent_forms':
        return (
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardTitleWrap}>
                <FileText size={18} color="var(--t2)" />
                <span className={s.cardTitle}>Recent Forms</span>
              </div>
            </div>
            <div className={s.emptyState}>
              <FileText size={32} color="var(--t3)" strokeWidth={1.2} />
              <div className={s.emptyTitle}>No recent forms</div>
              <div className={s.emptySub}>Field reports and forms will appear here.</div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ── Layout: split pinned cards into rows ──
  // First 2 → twoCol, next 3 → threeCol, rest → twoCol repeating
  const topRow = pinnedKeys.slice(0, 2)
  const midRow = pinnedKeys.slice(2, 5)
  const restRows = pinnedKeys.slice(5)

  return (
    <div>
      {/* ── Header ── */}
      <div className={s.header}>
        <div>
          <div className={s.dateStr}>{dateStr}</div>
          <div className={s.greeting}>{greeting}</div>
        </div>
        <button className={s.customizeBtn} onClick={() => setCustomizeOpen(true)}>
          <Settings size={14} />
          Customize
        </button>
      </div>

      {/* ── Alert — crews not clocked in ── */}
      {!loadingAttendance && totalCrews > 0 && rostersSubmitted < totalCrews && (
        <div className={s.alert} onClick={() => onNavigate?.('clock-in')}>
          <div className={s.alertIconWrap}>
            <AlertTriangle size={18} color="var(--amb)" />
          </div>
          <div className={s.alertContent}>
            <div className={s.alertTitle}>Crews Not Clocked In</div>
            <div className={s.alertSub}>
              {totalCrews - rostersSubmitted} of {totalCrews} crew{totalCrews !== 1 ? 's' : ''}{' '}
              haven't submitted today's roster
            </div>
          </div>
          <ChevronRight size={18} color="var(--amb)" className={s.flexShrink0} />
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className={s.statsGrid}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className={s.skeletonCard} />)
          : statCards.map((card, i) => (
              <StatCard
                key={i}
                label={card.label}
                value={card.value}
                sub={card.sub}
                icon={card.icon}
                color={card.color}
              />
            ))}
      </div>

      {/* ── Pinned cards — row 1 (two-col) ── */}
      {topRow.length > 0 && (
        <div className={s.twoCol}>
          {topRow.map((key) => (
            <div key={key}>{renderCard(key)}</div>
          ))}
        </div>
      )}

      {/* ── Pinned cards — row 2 (three-col) ── */}
      {midRow.length > 0 && (
        <div className={s.threeCol}>
          {midRow.map((key) => (
            <div key={key}>{renderCard(key)}</div>
          ))}
        </div>
      )}

      {/* ── Remaining pinned cards (two-col) ── */}
      {restRows.length > 0 && (
        <div className={s.twoCol}>
          {restRows.map((key) => (
            <div key={key}>{renderCard(key)}</div>
          ))}
        </div>
      )}

      {/* ── Customize Modal ── */}
      {customizeOpen && (
        <CustomizeModal
          pins={pins}
          isEnabled={isEnabled}
          onSave={(newPins) => {
            savePins(newPins)
            setCustomizeOpen(false)
          }}
          onClose={() => setCustomizeOpen(false)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Customize Modal
// ═══════════════════════════════════════════
function CustomizeModal({ pins, isEnabled, onSave, onClose }) {
  const [draft, setDraft] = useState(() => {
    const pinned = (pins || []).sort((a, b) => a.position - b.position)
    const pinnedKeys = new Set(pinned.map((p) => p.card_key))

    // Build ordered list: pinned first, then unpinned
    const items = pinned.map((p) => ({ key: p.card_key, enabled: true }))
    for (const key of Object.keys(AVAILABLE_CARDS)) {
      if (!pinnedKeys.has(key)) {
        items.push({ key, enabled: false })
      }
    }
    return items
  })

  const toggle = (key) => {
    setDraft((prev) =>
      prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)),
    )
  }

  const moveUp = (idx) => {
    if (idx <= 0) return
    setDraft((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx) => {
    setDraft((prev) => {
      if (idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const handleSave = () => {
    const newPins = draft
      .filter((item) => item.enabled)
      .map((item, i) => ({ card_key: item.key, position: i + 1 }))
    onSave(newPins)
  }

  return (
    <Modal title="Customize Dashboard" onClose={onClose}>
      <div className={s.customizeList}>
        {draft.map((item, idx) => {
          const card = AVAILABLE_CARDS[item.key]
          if (!card) return null

          const moduleGated = card.requiresModule && !isEnabled?.(card.requiresModule)
          const Icon = card.icon

          return (
            <div
              key={item.key}
              className={`${s.customizeItem} ${moduleGated ? s.customizeItemGated : ''}`}
            >
              <label className={s.customizeToggle}>
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={() => toggle(item.key)}
                  disabled={moduleGated}
                  className={s.customizeCheckbox}
                />
                <div className={s.customizeInfo}>
                  <Icon size={16} color={item.enabled ? 'var(--amb)' : 'var(--t3)'} />
                  <div>
                    <div className={s.customizeLabel}>{card.label}</div>
                    <div className={s.customizeDesc}>{card.description}</div>
                  </div>
                </div>
              </label>
              <div className={s.customizeArrows}>
                <button className={s.arrowBtn} onClick={() => moveUp(idx)} disabled={idx === 0}>
                  <ChevronUp size={14} />
                </button>
                <button
                  className={s.arrowBtn}
                  onClick={() => moveDown(idx)}
                  disabled={idx === draft.length - 1}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} />
    </Modal>
  )
}
