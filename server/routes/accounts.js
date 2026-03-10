// ═══════════════════════════════════════════
// Account Routes — Property / Customer CRUD
// Auto-geocodes using US Census Geocoder (primary)
// with Nominatim as fallback. Census has near-complete
// US address coverage from TIGER/Line postal data.
// ═══════════════════════════════════════════

import { Router } from 'express'
import https from 'https'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'

const router = Router()

// ── Generic HTTPS GET helper ──
function httpsGet(url, label) {
  return new Promise((resolve) => {
    console.log(`  [geocode] [${label}] Requesting...`)

    const req = https.get(url, {
      headers: { 'User-Agent': 'FieldPulse/1.0' },
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.log(`  [geocode] [${label}] HTTP ${res.statusCode}`)
          resolve(null)
          return
        }
        resolve(data)
      })
    })

    req.on('error', (e) => {
      console.error(`  [geocode] [${label}] Network error:`, e.message)
      resolve(null)
    })

    req.setTimeout(15000, () => {
      console.error(`  [geocode] [${label}] Timeout`)
      req.destroy()
      resolve(null)
    })
  })
}

// ── US Census Geocoder (primary — best US coverage) ──
// Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.pdf
async function censusGeocode({ address, city, state, zip }) {
  // Try structured first
  if (address && (city || zip)) {
    const params = new URLSearchParams({
      street: address,
      benchmark: 'Public_AR_Current',
      format: 'json',
    })
    if (city) params.set('city', city)
    if (state) params.set('state', state)
    if (zip) params.set('zip', zip)

    const url = `https://geocoding.geo.census.gov/geocoder/locations/address?${params.toString()}`
    const raw = await httpsGet(url, 'census-structured')

    if (raw) {
      try {
        const data = JSON.parse(raw)
        const matches = data?.result?.addressMatches
        if (matches && matches.length > 0) {
          const coords = matches[0].coordinates
          console.log(`  [geocode] [census-structured] ✓ Found: ${coords.y}, ${coords.x}`)
          return { latitude: coords.y, longitude: coords.x }
        }
        console.log(`  [geocode] [census-structured] No matches`)
      } catch (e) {
        console.log(`  [geocode] [census-structured] Parse error:`, e.message)
      }
    }
  }

  // Try one-line address
  const oneline = [address, city, state, zip].filter(Boolean).join(', ')
  if (oneline) {
    const params = new URLSearchParams({
      address: oneline,
      benchmark: 'Public_AR_Current',
      format: 'json',
    })

    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${params.toString()}`
    const raw = await httpsGet(url, 'census-oneline')

    if (raw) {
      try {
        const data = JSON.parse(raw)
        const matches = data?.result?.addressMatches
        if (matches && matches.length > 0) {
          const coords = matches[0].coordinates
          console.log(`  [geocode] [census-oneline] ✓ Found: ${coords.y}, ${coords.x}`)
          return { latitude: coords.y, longitude: coords.x }
        }
        console.log(`  [geocode] [census-oneline] No matches`)
      } catch (e) {
        console.log(`  [geocode] [census-oneline] Parse error:`, e.message)
      }
    }
  }

  return null
}

// ── Nominatim fallback (for non-US or Census misses) ──
async function nominatimGeocode({ address, city, state, zip }) {
  const params = new URLSearchParams({ format: 'json', limit: '1' })

  // Structured query
  if (address) params.set('street', address)
  if (city) params.set('city', city)
  if (state) params.set('state', state)
  if (zip) params.set('postalcode', zip)

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
  const raw = await httpsGet(url, 'nominatim')

  if (raw) {
    try {
      const results = JSON.parse(raw)
      if (results.length > 0) {
        console.log(`  [geocode] [nominatim] ✓ Found: ${results[0].lat}, ${results[0].lon}`)
        return { latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) }
      }
      console.log(`  [geocode] [nominatim] No matches`)
    } catch (e) {
      console.log(`  [geocode] [nominatim] Parse error:`, e.message)
    }
  }

  return null
}

// ── Main geocode function — Census first, Nominatim fallback ──
async function geocode({ address, city, state, zip }) {
  console.log(`\n  [geocode] Looking up: "${address}", ${city || '?'}, ${state || '?'} ${zip || '?'}`)

  // 1. US Census Geocoder
  const censusResult = await censusGeocode({ address, city, state, zip })
  if (censusResult) return censusResult

  // 2. Nominatim fallback
  const nominatimResult = await nominatimGeocode({ address, city, state, zip })
  if (nominatimResult) return nominatimResult

  console.log(`  [geocode] ✗ All geocoders failed\n`)
  return { latitude: null, longitude: null }
}

// ═══════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════

// ── List all active accounts ──
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, type, city, limit = 200 } = req.query
    const where = ['a.active = true']
    const params = []

    if (search) {
      params.push(`%${search}%`)
      where.push(`(a.name ILIKE $${params.length} OR a.address ILIKE $${params.length} OR a.contact_name ILIKE $${params.length})`)
    }
    if (type) {
      params.push(type)
      where.push(`a.account_type = $${params.length}`)
    }
    if (city) {
      params.push(city)
      where.push(`a.city = $${params.length}`)
    }

    params.push(limit)
    const result = await db.query(`
      SELECT a.* FROM accounts a
      WHERE ${where.join(' AND ')}
      ORDER BY a.name ASC
      LIMIT $${params.length}
    `, params)

    res.json(result.rows.map(formatAccount))
  } catch (e) {
    console.error('GET /accounts error:', e)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Get single account ──
router.get('/:id', requireAuth, validateIdParam, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM accounts WHERE id = $1 AND active = true', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' })
    res.json(formatAccount(result.rows[0]))
  } catch (e) {
    console.error('GET /accounts/:id error:', e)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Create account (auto-geocodes) ──
router.post('/',
  requireAuth,
  validateBody({
    name: { required: true, type: 'string', maxLength: 200 },
    address: { required: true, type: 'string', maxLength: 300 },
  }),
  async (req, res) => {
    try {
      const { name, address, city, state, zip, contactName, contactPhone, contactEmail, accountType, notes } = req.body
      let { latitude, longitude } = req.body

      if (!latitude || !longitude) {
        const coords = await geocode({ address, city, state, zip })
        latitude = coords.latitude
        longitude = coords.longitude
      }

      const result = await db.query(
        `INSERT INTO accounts (name, address, city, state, zip, latitude, longitude, contact_name, contact_phone, contact_email, account_type, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [name, address, city || null, state || 'CA', zip || null,
         latitude || null, longitude || null,
         contactName || null, contactPhone || null, contactEmail || null,
         accountType || 'residential', notes || null]
      )
      res.json(formatAccount(result.rows[0]))
    } catch (e) {
      console.error('POST /accounts error:', e)
      res.status(500).json({ error: 'Failed to create account' })
    }
  }
)

// ── Update account (auto-geocodes) ──
router.put('/:id', requireAuth, validateIdParam, async (req, res) => {
  try {
    const { name, address, city, state, zip, contactName, contactPhone, contactEmail, accountType, notes } = req.body
    let { latitude, longitude } = req.body

    if (!latitude || !longitude) {
      const coords = await geocode({ address, city, state, zip })
      latitude = coords.latitude
      longitude = coords.longitude
    }

    await db.query(
      `UPDATE accounts SET name=$1, address=$2, city=$3, state=$4, zip=$5,
       latitude=$6, longitude=$7, contact_name=$8, contact_phone=$9, contact_email=$10,
       account_type=$11, notes=$12 WHERE id=$13`,
      [name, address, city || null, state || 'CA', zip || null,
       latitude || null, longitude || null,
       contactName || null, contactPhone || null, contactEmail || null,
       accountType || 'residential', notes || null,
       req.params.id]
    )

    const updated = await db.query('SELECT * FROM accounts WHERE id = $1', [req.params.id])
    res.json(formatAccount(updated.rows[0]))
  } catch (e) {
    console.error('PUT /accounts/:id error:', e)
    res.status(500).json({ error: 'Failed to update' })
  }
})

// ── Delete (soft) account ──
router.delete('/:id', requireAuth, validateIdParam, async (req, res) => {
  try {
    await db.query('UPDATE accounts SET active = false WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (e) {
    console.error('DELETE /accounts/:id error:', e)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

// ── Manual geocode endpoint (for Re-Geocode button) ──
router.post('/geocode',
  requireAuth,
  validateBody({ address: { required: true, type: 'string' } }),
  async (req, res) => {
    const result = await geocode({ address: req.body.address, city: null, state: null, zip: null })
    res.json({ ...result, display: req.body.address })
  }
)

// ── Format DB row → API response ──
function formatAccount(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    latitude: row.latitude,
    longitude: row.longitude,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    accountType: row.account_type,
    notes: row.notes,
    createdAt: row.created_at,
    group_id: row.group_id,
  }
}

export default router