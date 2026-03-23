/**
 * SDS Library Integration
 *
 * Supports two modes:
 * 1. PubChem (free, no auth) — search by chemical name or CAS number
 * 2. Custom SDS API — company provides their own API endpoint + key
 *
 * Both return the same SDSEntry shape so the UI doesn't need to know
 * which source populated the data.
 */

export const SDSEntry = {
  id: null,
  product_name: '',
  manufacturer: '',
  cas_number: '',
  hazard_classes: [],
  category: '',
  pdf_url: '',
  source: '',
  external_id: '',
};

// STUB — implement with PubChem REST API
export async function searchPubChem(query) {
  // GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{query}/JSON
  // Map response to SDSEntry shape
  throw new Error('PubChem integration not yet implemented');
}

// STUB — implement with company-provided API
export async function searchCustomAPI(endpoint, apiKey, query) {
  throw new Error('Custom SDS API integration not yet implemented');
}

// STUB — sync a batch of SDS entries from external source
export async function syncSDSLibrary(companyId, provider) {
  throw new Error('SDS sync not yet implemented');
}
