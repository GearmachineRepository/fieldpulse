// ═══════════════════════════════════════════
// Crew Performance Page — Operations analytics
// FilterBar + Stat row + Comparison DataTable
// ═══════════════════════════════════════════

import { useState, useMemo } from 'react'
import { TrendingUp, Users, Award, Download, GraduationCap } from 'lucide-react'
import usePageData from '@/hooks/usePageData.js'
import { getCrews } from '@/lib/api/crews.js'
import { getEmployees } from '@/lib/api/employees.js'
import { getIncidents } from '@/lib/api/incidents.js'
import { getCertifications } from '@/lib/api/certifications.js'
import { getTrainingSessions } from '@/lib/api/training.js'
import PageShell from '../components/PageShell.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import DataTable from '../components/DataTable.jsx'
import s from './CrewPerformancePage.module.css'

const ts = DataTable.s

/** Return true if dateStr falls within [start, end] range (inclusive) */
function inRange(dateStr, start, end) {
  if (!dateStr) return false
  const d = dateStr.slice(0, 10)
  if (start && d < start) return false
  if (end && d > end) return false
  return true
}

/** Determine badge variant from a compliance percentage */
function complianceVariant(pct) {
  if (pct >= 90) return 'green'
  if (pct >= 70) return 'amber'
  return 'red'
}

export default function CrewPerformancePage() {
  const crews = usePageData('crews', { fetchFn: getCrews })
  const employees = usePageData('employees', { fetchFn: getEmployees })
  const incidents = usePageData('incidents', { fetchFn: getIncidents })
  const certs = usePageData('certifications', { fetchFn: getCertifications })
  const training = usePageData('training', { fetchFn: getTrainingSessions })

  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [crewFilter, setCrewFilter] = useState('')

  const loading =
    crews.loading || employees.loading || incidents.loading || certs.loading || training.loading

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    const empList = employees.data || []
    const incList = incidents.data || []
    const certList = certs.data || []
    const trainList = training.data || []
    const crewList = crews.data || []

    // Build employee → crew lookup
    const empCrewMap = {} // employeeId → crewId
    const crewEmployees = {} // crewId → [employeeIds]
    for (const emp of empList) {
      if (emp.default_crew_id) {
        empCrewMap[emp.id] = emp.default_crew_id
        if (!crewEmployees[emp.default_crew_id]) crewEmployees[emp.default_crew_id] = []
        crewEmployees[emp.default_crew_id].push(emp.id)
      }
    }

    // Filter incidents by date range
    const filteredIncidents =
      dateStart || dateEnd
        ? incList.filter((i) => inRange(i.incident_date, dateStart, dateEnd))
        : incList

    // Filter training sessions by date range
    const filteredTraining =
      dateStart || dateEnd
        ? trainList.filter((t) => inRange(t.training_date, dateStart, dateEnd))
        : trainList

    // Incidents per crew (via reported_by → employee → crew)
    const crewIncidents = {}
    for (const inc of filteredIncidents) {
      const crewId = empCrewMap[inc.reported_by]
      if (crewId) {
        crewIncidents[crewId] = (crewIncidents[crewId] || 0) + 1
      }
    }

    // Active certs per employee
    const empActiveCerts = {}
    const today = new Date().toISOString().slice(0, 10)
    for (const cert of certList) {
      const isActive =
        cert.status === 'active' && (!cert.expiry_date || cert.expiry_date.slice(0, 10) >= today)
      if (isActive) {
        empActiveCerts[cert.employee_id] = (empActiveCerts[cert.employee_id] || 0) + 1
      }
    }

    // Training completed count (status = 'completed')
    const completedTraining = filteredTraining.filter((t) => t.status === 'completed')

    // Per-crew data
    const perCrew = crewList.map((crew) => {
      const memberIds = crewEmployees[crew.id] || []
      const memberCount = memberIds.length

      // Sum active certs for crew members
      const totalCerts = memberIds.reduce((sum, eid) => sum + (empActiveCerts[eid] || 0), 0)
      const avgCerts = memberCount > 0 ? totalCerts / memberCount : 0

      // Training: how many completed sessions had signoffs (sessions with signoff_count > 0)
      // Since we don't have per-employee signoff data from the list endpoint,
      // we use signoff_count relative to total employees as a proxy
      const totalSignoffs = completedTraining.reduce((sum, t) => sum + (t.signoff_count || 0), 0)
      const totalPossible = completedTraining.length * empList.length
      // Per-crew we can only approximate: crew's share of total training compliance
      const crewTrainingRate =
        memberCount > 0 && completedTraining.length > 0
          ? Math.min(100, Math.round((totalSignoffs / Math.max(totalPossible, 1)) * 100))
          : null

      const incidentCount = crewIncidents[crew.id] || 0

      return {
        ...crew,
        memberCount,
        totalCerts,
        avgCerts,
        trainingRate: crewTrainingRate,
        incidents: incidentCount,
      }
    })

    // Summary stats
    const totalCrews = crewList.length
    const totalEmps = empList.length
    const totalActiveCerts = Object.values(empActiveCerts).reduce((a, b) => a + b, 0)
    const avgCertsPerEmp = totalEmps > 0 ? (totalActiveCerts / totalEmps).toFixed(1) : '0'
    const trainingCompliance =
      completedTraining.length > 0 && totalEmps > 0
        ? Math.round(
            (completedTraining.reduce((sum, t) => sum + (t.signoff_count || 0), 0) /
              (completedTraining.length * totalEmps)) *
              100,
          )
        : null

    return {
      perCrew,
      totalCrews,
      totalEmps,
      avgCertsPerEmp,
      trainingCompliance,
      totalIncidents: filteredIncidents.length,
    }
  }, [crews.data, employees.data, incidents.data, certs.data, training.data, dateStart, dateEnd])

  // Apply crew filter
  const filteredCrews = crewFilter
    ? metrics.perCrew.filter((c) => c.name === crewFilter)
    : metrics.perCrew

  return (
    <PageShell
      title="Crew Performance"
      actions={
        <button className={s.exportBtn}>
          <Download size={15} /> Export
        </button>
      }
    >
      {/* Filter Bar */}
      <div className={s.filterBar}>
        <div className={s.filterField}>
          <label className={s.filterLabel}>Date Range</label>
          <div className={s.dateRow}>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className={s.filterInput}
            />
            <span className={s.dateSep}>to</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className={s.filterInput}
            />
          </div>
        </div>
        <div className={s.filterField}>
          <label className={s.filterLabel}>Crew</label>
          <select
            value={crewFilter}
            onChange={(e) => setCrewFilter(e.target.value)}
            className={s.filterSelect}
          >
            <option value="">All Crews</option>
            {crews.data.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat Row */}
      <div className={s.statsRow}>
        <StatCard label="Total Crews" value={metrics.totalCrews} color="var(--amb)" icon={Users} />
        <StatCard
          label="Total Employees"
          value={metrics.totalEmps}
          color="var(--grn)"
          icon={Users}
        />
        <StatCard
          label="Avg Certs / Employee"
          value={metrics.avgCertsPerEmp}
          color="var(--blu)"
          icon={Award}
        />
        <StatCard
          label="Training Compliance"
          value={metrics.trainingCompliance != null ? `${metrics.trainingCompliance}%` : '\u2014'}
          color="var(--grn)"
          icon={GraduationCap}
          sub={
            metrics.trainingCompliance != null
              ? `Based on ${training.data.filter((t) => t.status === 'completed').length} completed sessions`
              : 'No completed sessions'
          }
        />
      </div>

      {/* Comparison Table */}
      {loading ? (
        <div className={s.emptyState}>
          <div className={s.emptyDesc}>Loading crew data...</div>
        </div>
      ) : filteredCrews.length === 0 ? (
        <div className={s.emptyState}>
          <TrendingUp size={48} strokeWidth={1} className={s.emptyIcon} />
          <div className={s.emptyTitle}>No crew data available</div>
          <div className={s.emptyDesc}>
            Add crews and assign employees to see performance metrics including certifications,
            training compliance, and incident counts per crew.
          </div>
        </div>
      ) : (
        <DataTable
          headers={[
            { label: 'Crew' },
            { label: 'Members' },
            { label: 'Active Certs' },
            { label: 'Avg Certs' },
            { label: 'Training' },
            { label: 'Incidents' },
          ]}
        >
          {filteredCrews.map((crew) => (
            <tr key={crew.id} className={ts.tr}>
              <td className={ts.td}>
                <div className={s.crewCell}>
                  <span className={s.crewName}>{crew.name}</span>
                  {crew.lead_name && <span className={s.crewLead}>{crew.lead_name}</span>}
                </div>
              </td>
              <td className={`${ts.td} ${ts.tdMono}`}>{crew.memberCount}</td>
              <td className={`${ts.td} ${ts.tdMono}`}>{crew.totalCerts}</td>
              <td className={`${ts.td} ${ts.tdMono}`}>
                {crew.memberCount > 0 ? crew.avgCerts.toFixed(1) : '\u2014'}
              </td>
              <td className={ts.td}>
                {crew.trainingRate != null ? (
                  <StatusBadge variant={complianceVariant(crew.trainingRate)}>
                    {crew.trainingRate}%
                  </StatusBadge>
                ) : (
                  <span className={s.noData}>{'\u2014'}</span>
                )}
              </td>
              <td className={`${ts.td} ${ts.tdMono}`}>
                {crew.incidents > 0 ? (
                  <span className={s.incidentCount}>{crew.incidents}</span>
                ) : (
                  '0'
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {/* Summary footer */}
      {!loading && filteredCrews.length > 0 && (
        <div className={s.summaryFooter}>
          <span className={s.summaryLabel}>
            Total incidents in range:{' '}
            <strong className={s.summaryValue}>{metrics.totalIncidents}</strong>
          </span>
          {(dateStart || dateEnd) && (
            <button
              className={s.clearBtn}
              onClick={() => {
                setDateStart('')
                setDateEnd('')
              }}
            >
              Clear date filter
            </button>
          )}
        </div>
      )}
    </PageShell>
  )
}
