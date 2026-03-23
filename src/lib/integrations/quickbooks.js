/**
 * QuickBooks Integration
 *
 * Primary use case: completed jobs in CruPoint → draft invoices in QuickBooks
 * Secondary: labor hours from clock-in → QB payroll
 * Irrigation module: repair logs → billable line items
 *
 * Auth: OAuth 2.0 via Intuit Identity
 * Sandbox: https://sandbox.api.intuit.com
 * Production: https://api.intuit.com
 */

// STUB — OAuth flow initiation
export async function initiateOAuth(companyId) {
  throw new Error('QuickBooks OAuth not yet implemented');
}

// STUB — push a completed job as a draft invoice
export async function createDraftInvoice(jobId, lineItems) {
  throw new Error('QuickBooks invoice sync not yet implemented');
}

// STUB — sync labor hours to QB time tracking
export async function syncLaborHours(companyId, dateRange) {
  throw new Error('QuickBooks labor sync not yet implemented');
}
