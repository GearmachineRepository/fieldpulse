/**
 * Bluebeam Integration
 *
 * Primary use case: sync construction documents from Bluebeam Studio Projects
 * to CruPoint project resource tabs
 *
 * Auth: OAuth 2.0 via Bluebeam Developer Portal
 * API: https://api.bluebeam.com/publicapi/v1
 * Docs: https://support.bluebeam.com/integrations/develop-integrations.html
 */

// STUB — list Studio Projects for connected account
export async function listStudioProjects(accessToken) {
  throw new Error('Bluebeam project list not yet implemented');
}

// STUB — sync documents from a Studio Project to a CruPoint project
export async function syncProjectDocuments(bluebeamProjectId, cruPointProjectId) {
  throw new Error('Bluebeam document sync not yet implemented');
}

// STUB — webhook handler for document updates
export async function handleWebhook(payload) {
  throw new Error('Bluebeam webhook handler not yet implemented');
}
