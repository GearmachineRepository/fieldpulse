// ═══════════════════════════════════════════
// Validation Utilities (client-side)
// ═══════════════════════════════════════════

/**
 * Validates the spray log form state.
 * Returns an errors object; empty object means valid.
 *
 * @param {{ crewLead, license, property, selectedEquip, totalMixVol, products, locMode, gps, manualAddr }} fields
 * @returns {Record<string, string>}
 */
export function validateSprayLog({ crewLead, license, property, selectedEquip, totalMixVol, products, locMode, gps, manualAddr }) {
  const errors = {}

  if (!crewLead?.trim())    errors.crewLead   = 'Required'
  if (!license?.trim())     errors.license    = 'Required'
  if (!property?.trim())    errors.property   = 'Required'
  if (!selectedEquip)       errors.equipment  = 'Required'
  if (!totalMixVol?.trim()) errors.totalMixVol = 'Required'

  if (products.length === 0) {
    errors.products = 'Add at least one product'
  } else {
    products.forEach((p, i) => {
      if (!p.ozConcentrate?.trim()) errors[`oz-${i}`] = 'Required'
    })
  }

  const hasGps    = locMode === 'gps' && gps
  const hasManual = locMode === 'manual' && manualAddr?.trim()
  if (!hasGps && !hasManual) errors.location = 'Required'

  return errors
}
