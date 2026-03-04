// ═══════════════════════════════════════════
// Report Routes — PUR and Roster summaries
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// ── PUR Report ──
router.get('/pur', requireAuth, async (req, res) => {
  try {
    const { month, year, start: startParam, end: endParam } = req.query
    let start, end

    if (startParam && endParam) {
      start = startParam
      end = endParam
    } else {
      if (!month || !year) return res.status(400).json({ error: 'month and year (or start and end) required' })
      start = `${year}-${String(month).padStart(2, '0')}-01`
      end = new Date(year, month, 1).toISOString().split('T')[0]
    }

    const result = await db.query(
      `SELECT slp.chemical_name, slp.epa, slp.amount, sl.created_at, sl.crew_name, sl.property
       FROM spray_log_products slp
       JOIN spray_logs sl ON sl.id = slp.spray_log_id
       WHERE sl.created_at >= $1 AND sl.created_at < $2
       ORDER BY slp.chemical_name`,
      [start, end]
    )

    const byProduct = {}
    for (const row of result.rows) {
      const key = `${row.chemical_name}|${row.epa}`
      if (!byProduct[key]) {
        byProduct[key] = { name: row.chemical_name, epa: row.epa, totalAmount: 0, unit: '', appCount: 0, applications: [] }
      }
      const match = row.amount.match(/^([\d.]+)\s*(.*)$/)
      if (match) {
        byProduct[key].totalAmount += parseFloat(match[1])
        byProduct[key].unit = match[2] || 'oz'
      }
      byProduct[key].appCount++
      byProduct[key].applications.push({
        date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        crew: row.crew_name, property: row.property, amount: row.amount,
      })
    }

    res.json({
      month: parseInt(month), year: parseInt(year),
      products: Object.values(byProduct),
      totalApplications: result.rows.length,
    })
  } catch (e) {
    console.error('GET /reports/pur error:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

// ── Roster Report ──
router.get('/rosters', requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query
    if (!start || !end) return res.status(400).json({ error: 'start and end required' })

    const result = await db.query(`
      SELECT r.id, r.crew_name, r.submitted_by_name, r.work_date, r.notes,
        COALESCE((SELECT json_agg(json_build_object('employeeId',m.employee_id,'name',m.employee_name,'present',m.present))
          FROM daily_roster_members m WHERE m.roster_id = r.id), '[]') AS members
      FROM daily_crew_rosters r
      WHERE r.work_date >= $1 AND r.work_date < $2
      ORDER BY r.work_date DESC, r.crew_name`, [start, end])

    const byCrewDate = {}
    for (const row of result.rows) {
      const key = row.crew_name
      if (!byCrewDate[key]) {
        byCrewDate[key] = { crewName: key, daysWorked: 0, totalMembers: new Set(), totalAbsences: 0, rosters: [] }
      }
      byCrewDate[key].daysWorked++
      const members = (row.members || []).filter(m => m.employeeId !== null)
      const presentMembers = members.filter(m => m.present !== false)
      const absentMembers = members.filter(m => m.present === false)
      presentMembers.forEach(m => byCrewDate[key].totalMembers.add(m.name))
      byCrewDate[key].totalAbsences += absentMembers.length
      byCrewDate[key].rosters.push({
        date: new Date(row.work_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lead: row.submitted_by_name,
        memberCount: presentMembers.length,
        absentCount: absentMembers.length,
        members: presentMembers.map(m => m.name),
        absent: absentMembers.map(m => m.name),
      })
    }

    const crews = Object.values(byCrewDate).map(c => ({
      ...c, totalMembers: c.totalMembers.size,
    }))

    res.json({ start, end, totalRosters: result.rows.length, crews })
  } catch (e) {
    console.error('GET /reports/rosters error:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

export default router