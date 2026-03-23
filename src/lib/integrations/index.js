// Integration registry — all supported providers
export const PROVIDERS = {
  QUICKBOOKS: 'quickbooks',
  BLUEBEAM: 'bluebeam',
  SDS_API: 'sds_api',
  CHEMTREC: 'chemtrec',
  PUBCHEM: 'pubchem',
  ADP: 'adp',
  GUSTO: 'gusto',
};

export const PROVIDER_META = {
  [PROVIDERS.QUICKBOOKS]: {
    name: 'QuickBooks',
    description: 'Sync jobs and hours to invoices and payroll',
    category: 'accounting',
    docsUrl: 'https://developer.intuit.com/',
    scopes: ['com.intuit.quickbooks.accounting'],
  },
  [PROVIDERS.BLUEBEAM]: {
    name: 'Bluebeam',
    description: 'Sync construction documents and drawings to projects',
    category: 'documents',
    docsUrl: 'https://developers.bluebeam.com/',
    scopes: ['session.create', 'project.read'],
  },
  [PROVIDERS.SDS_API]: {
    name: 'Custom SDS API',
    description: 'Connect a Safety Data Sheet database to auto-populate your SDS library',
    category: 'compliance',
    docsUrl: null,
    scopes: [],
  },
  [PROVIDERS.PUBCHEM]: {
    name: 'PubChem',
    description: 'Free chemical data from NCBI — auto-populate SDS library',
    category: 'compliance',
    docsUrl: 'https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest',
    scopes: [],
    free: true,
  },
};
