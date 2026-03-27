/**
 * SDS Library Integration — SDS Manager API
 * https://sdsmanager.com/us/sds-parser-api/
 *
 * Single integration point for SDS data. Companies connect once via
 * Settings → Integrations → SDS Library. Once connected, the SDS Library
 * page can search and import SDS records directly from the API.
 *
 * The API key is stored in integration_connections table, encrypted,
 * per company. Never expose the API key to the client.
 */

export const SDS_MANAGER_BASE = 'https://api.sdsmanager.com/v1';

export const SDSEntry = {
  id: null,
  product_name: '',
  manufacturer: '',
  cas_number: '',
  hazard_classes: [],
  ghs_pictograms: [],   // GHS pictogram codes: 'GHS01'–'GHS09'
  category: '',          // 'herbicide' | 'pesticide' | 'fertilizer' | 'solvent' | 'other'
  pdf_url: '',
  sds_revision_date: null,
  source: 'manual',      // 'manual' | 'sds_manager'
  external_id: '',
  last_synced_at: null,
};

// STUB — Search SDS Manager database
// Called from SDS Library page when user searches in "Search SDS Manager" mode
// API key retrieved server-side from integration_connections — never client-side
export async function searchSDSManager(query, apiKey) {
  // GET {SDS_MANAGER_BASE}/search?q={query}
  // Headers: Authorization: Bearer {apiKey}
  // Returns array of SDSEntry shape
  throw new Error('SDS Manager search not yet implemented');
}

// STUB — Import a specific SDS record into company library
// Saves to sds_entries table in Supabase
export async function importSDSRecord(externalId, companyId, apiKey) {
  throw new Error('SDS Manager import not yet implemented');
}

// STUB — Sync all previously imported records (check for updates)
export async function syncSDSLibrary(companyId, apiKey) {
  throw new Error('SDS Manager sync not yet implemented');
}

// Map SDS Manager response to our SDSEntry shape
export function mapSDSManagerResponse(raw) {
  return {
    product_name: raw.productName || '',
    manufacturer: raw.manufacturer || '',
    cas_number: raw.casNumber || '',
    hazard_classes: raw.hazardClasses || [],
    ghs_pictograms: raw.ghsPictograms || [],
    category: inferCategory(raw),
    pdf_url: raw.pdfUrl || '',
    sds_revision_date: raw.revisionDate || null,
    source: 'sds_manager',
    external_id: raw.id || '',
  };
}

function inferCategory(raw) {
  const name = (raw.productName || '').toLowerCase();
  if (name.includes('herbicide') || name.includes('weed')) return 'herbicide';
  if (name.includes('pesticide') || name.includes('insecticide')) return 'pesticide';
  if (name.includes('fertilizer') || name.includes('nutrient')) return 'fertilizer';
  if (name.includes('solvent') || name.includes('cleaner')) return 'solvent';
  return 'other';
}
