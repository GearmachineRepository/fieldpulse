// Integration registry — all supported providers

export const PROVIDERS = {
  QUICKBOOKS: 'quickbooks',
  BLUEBEAM: 'bluebeam',
  SDS_MANAGER: 'sds_manager',
  ADP: 'adp',
  GUSTO: 'gusto',
}

export const PROVIDER_META = {
  [PROVIDERS.QUICKBOOKS]: {
    name: 'QuickBooks',
    description: 'Sync completed jobs and hours to invoices and payroll',
    category: 'accounting',
    logoUrl: 'https://logo.clearbit.com/quickbooks.intuit.com',
    docsUrl: 'https://developer.intuit.com/',
    status: 'coming_soon',
    scopes: ['com.intuit.quickbooks.accounting'],
  },
  [PROVIDERS.BLUEBEAM]: {
    name: 'Bluebeam',
    description: 'Sync construction documents and drawings to projects',
    category: 'documents',
    logoUrl: 'https://logo.clearbit.com/bluebeam.com',
    docsUrl: 'https://developers.bluebeam.com/',
    status: 'coming_soon',
    scopes: ['session.create', 'project.read'],
  },
  [PROVIDERS.SDS_MANAGER]: {
    name: 'SDS Manager',
    description: 'Auto-populate your SDS library from a database of millions of records',
    category: 'compliance',
    logoUrl: 'https://logo.clearbit.com/sdsmanager.com',
    docsUrl: 'https://sdsmanager.com/us/sds-parser-api/',
    status: 'available',
    scopes: [],
  },
  [PROVIDERS.ADP]: {
    name: 'ADP',
    description: 'Sync labor hours to payroll',
    category: 'payroll',
    logoUrl: 'https://logo.clearbit.com/adp.com',
    docsUrl: 'https://developers.adp.com/',
    status: 'coming_soon',
    scopes: [],
  },
  [PROVIDERS.GUSTO]: {
    name: 'Gusto',
    description: 'Sync labor hours to payroll',
    category: 'payroll',
    logoUrl: 'https://logo.clearbit.com/gusto.com',
    docsUrl: 'https://docs.gusto.com/',
    status: 'coming_soon',
    scopes: [],
  },
}

// Group providers by category for UI display
export function getProvidersByCategory() {
  const groups = {}
  for (const [key, meta] of Object.entries(PROVIDER_META)) {
    const cat = meta.category
    if (!groups[cat]) groups[cat] = []
    groups[cat].push({ key, ...meta })
  }
  return groups
}
