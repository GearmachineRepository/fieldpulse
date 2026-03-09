// ═══════════════════════════════════════════
// Config barrel — re-exports everything so that
// existing `import { C, APP, cardStyle } from '@/config/index.js'`
// imports continue to work without touching every file.
//
// New code should import directly from the sub-modules:
//   import { C } from '@/config/colors.js'
//   import { APP } from '@/config/app.js'
// ═══════════════════════════════════════════

export * from './app.js'
export * from './colors.js'
export * from './styles.js'
export * from './constants.js'
