// ═══════════════════════════════════════════
// fix-imports.mjs — v4 (Step 2)
// Run from project root: node fix-imports.mjs
// ═══════════════════════════════════════════

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const RULES = [
  // ── config ──
  [/from ['"]\.\.\/\.\.\/\.\.\/config\.js['"]/g,        `from '@/config/index.js'`],
  [/from ['"]\.\.\/\.\.\/config\.js['"]/g,              `from '@/config/index.js'`],
  [/from ['"]\.\.\/config\.js['"]/g,                    `from '@/config/index.js'`],
  [/from ['"]\.\.\/\.\.\/\.\.\/config\/index\.js['"]/g, `from '@/config/index.js'`],
  [/from ['"]\.\.\/\.\.\/config\/index\.js['"]/g,       `from '@/config/index.js'`],
  [/from ['"]\.\.\/config\/index\.js['"]/g,             `from '@/config/index.js'`],
  // config sub-modules (e.g. ../../config/colors.js)
  [/from ['"]\.\.\/\.\.\/\.\.\/config\/([^'"]+)['"]/g,  `from '@/config/$1'`],
  [/from ['"]\.\.\/\.\.\/config\/([^'"]+)['"]/g,        `from '@/config/$1'`],
  [/from ['"]\.\.\/config\/([^'"]+)['"]/g,              `from '@/config/$1'`],

  // ── lib/api single-file ──
  [/from ['"]\.\.\/\.\.\/\.\.\/lib\/api\.js['"]/g,      `from '@/lib/api/index.js'`],
  [/from ['"]\.\.\/\.\.\/lib\/api\.js['"]/g,            `from '@/lib/api/index.js'`],
  [/from ['"]\.\.\/lib\/api\.js['"]/g,                  `from '@/lib/api/index.js'`],

  // ── lib/api/* sub-modules (specific — before generic lib catch-all) ──
  [/from ['"]\.\.\/\.\.\/\.\.\/lib\/api\//g,            `from '@/lib/api/`],
  [/from ['"]\.\.\/\.\.\/lib\/api\//g,                  `from '@/lib/api/`],
  [/from ['"]\.\.\/lib\/api\//g,                        `from '@/lib/api/`],

  // ── lib/* generic catch-all ──
  [/from ['"]\.\.\/\.\.\/\.\.\/lib\/([^'"]+)['"]/g,     `from '@/lib/$1'`],
  [/from ['"]\.\.\/\.\.\/lib\/([^'"]+)['"]/g,           `from '@/lib/$1'`],
  [/from ['"]\.\.\/lib\/([^'"]+)['"]/g,                 `from '@/lib/$1'`],

  // ── utils/* generic catch-all ──
  [/from ['"]\.\.\/\.\.\/\.\.\/utils\/([^'"]+)['"]/g,   `from '@/utils/$1'`],
  [/from ['"]\.\.\/\.\.\/utils\/([^'"]+)['"]/g,         `from '@/utils/$1'`],
  [/from ['"]\.\.\/utils\/([^'"]+)['"]/g,               `from '@/utils/$1'`],

  // ── context ──
  [/from ['"]\.\.\/\.\.\/\.\.\/context\//g,             `from '@/context/`],
  [/from ['"]\.\.\/\.\.\/context\//g,                   `from '@/context/`],
  [/from ['"]\.\.\/context\//g,                         `from '@/context/`],

  // ── Field-only components (Step 2 moves) ──
  // Sidebar and WindCompass moved to src/field/components/
  [/from ['"]\.\.\/\.\.\/\.\.\/components\/Sidebar\.jsx['"]/g,     `from '@/field/components/Sidebar.jsx'`],
  [/from ['"]\.\.\/\.\.\/components\/Sidebar\.jsx['"]/g,           `from '@/field/components/Sidebar.jsx'`],
  [/from ['"]\.\.\/components\/Sidebar\.jsx['"]/g,                 `from '@/field/components/Sidebar.jsx'`],
  [/from ['"]@\/components\/Sidebar\.jsx['"]/g,                    `from '@/field/components/Sidebar.jsx'`],

  [/from ['"]\.\.\/\.\.\/\.\.\/components\/WindCompass\.jsx['"]/g, `from '@/field/components/WindCompass.jsx'`],
  [/from ['"]\.\.\/\.\.\/components\/WindCompass\.jsx['"]/g,       `from '@/field/components/WindCompass.jsx'`],
  [/from ['"]\.\.\/components\/WindCompass\.jsx['"]/g,             `from '@/field/components/WindCompass.jsx'`],
  [/from ['"]@\/components\/WindCompass\.jsx['"]/g,                `from '@/field/components/WindCompass.jsx'`],

  // ── Admin-only components (Step 2 moves) ──
  // AccountMap moved to src/admin/components/
  [/from ['"]\.\.\/\.\.\/\.\.\/components\/AccountMap\.jsx['"]/g,  `from '@/admin/components/AccountMap.jsx'`],
  [/from ['"]\.\.\/\.\.\/components\/AccountMap\.jsx['"]/g,        `from '@/admin/components/AccountMap.jsx'`],
  [/from ['"]\.\.\/components\/AccountMap\.jsx['"]/g,              `from '@/admin/components/AccountMap.jsx'`],
  [/from ['"]@\/components\/AccountMap\.jsx['"]/g,                 `from '@/admin/components/AccountMap.jsx'`],

  // ── SharedAdmin — already in admin/components ──
  [/from ['"]\.\.\/\.\.\/\.\.\/components\/admin\/SharedAdmin\.jsx['"]/g, `from '@/admin/components/SharedAdmin.jsx'`],
  [/from ['"]\.\.\/\.\.\/components\/admin\/SharedAdmin\.jsx['"]/g,       `from '@/admin/components/SharedAdmin.jsx'`],
  [/from ['"]\.\.\/components\/admin\/SharedAdmin\.jsx['"]/g,             `from '@/admin/components/SharedAdmin.jsx'`],

  // ── AdminSidebar — already in admin/components ──
  [/from ['"]\.\.\/\.\.\/\.\.\/components\/admin\/AdminSidebar\.jsx['"]/g, `from '@/admin/components/AdminSidebar.jsx'`],
  [/from ['"]\.\.\/\.\.\/components\/admin\/AdminSidebar\.jsx['"]/g,       `from '@/admin/components/AdminSidebar.jsx'`],
  [/from ['"]\.\.\/components\/admin\/AdminSidebar\.jsx['"]/g,             `from '@/admin/components/AdminSidebar.jsx'`],

  // ── General shared components/* ──
  [/from ['"]\.\.\/\.\.\/\.\.\/components\//g,          `from '@/components/`],
  [/from ['"]\.\.\/\.\.\/components\//g,                `from '@/components/`],
  [/from ['"]\.\.\/components\//g,                      `from '@/components/`],

  // ── Admin sub-pages (AdminDashboard imports) ──
  [/from ['"]\.\/admin\/AdminHome\.jsx['"]/g,            `from '@/admin/pages/admin/AdminHome.jsx'`],
  [/from ['"]\.\/admin\/SprayLogsSection\.jsx['"]/g,     `from '@/admin/pages/admin/SprayLogsSection.jsx'`],
  [/from ['"]\.\/admin\/CrewRostersSection\.jsx['"]/g,   `from '@/admin/pages/admin/CrewRostersSection.jsx'`],
  [/from ['"]\.\/admin\/VehiclesSection\.jsx['"]/g,      `from '@/admin/pages/admin/VehiclesSection.jsx'`],
  [/from ['"]\.\/admin\/TeamSection\.jsx['"]/g,          `from '@/admin/pages/admin/TeamSection.jsx'`],
  [/from ['"]\.\/admin\/InventorySection\.jsx['"]/g,     `from '@/admin/pages/admin/InventorySection.jsx'`],
  [/from ['"]\.\/admin\/AccountsSection\.jsx['"]/g,      `from '@/admin/pages/admin/AccountsSection.jsx'`],
  [/from ['"]\.\/admin\/RoutesSection\.jsx['"]/g,        `from '@/admin/pages/admin/RoutesSection.jsx'`],

  // ── Spray sub-pages ──
  [/from ['"]\.\.\/\.\.\/pages\/spray\//g,               `from '@/field/pages/spray/`],
  [/from ['"]\.\.\/pages\/spray\//g,                     `from '@/field/pages/spray/`],
]

function walk(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...walk(full))
    } else if (['.jsx', '.js'].includes(extname(full))) {
      results.push(full)
    }
  }
  return results
}

const files = walk('./src')
let changed = 0

for (const file of files) {
  let src = readFileSync(file, 'utf8')
  let out = src
  for (const [pattern, replacement] of RULES) {
    out = out.replace(pattern, replacement)
  }
  if (out !== src) {
    writeFileSync(file, out, 'utf8')
    console.log('  fixed →', file.replace(/\\/g, '/'))
    changed++
  }
}

console.log(`\nDone. ${changed} file${changed !== 1 ? 's' : ''} updated.`)
