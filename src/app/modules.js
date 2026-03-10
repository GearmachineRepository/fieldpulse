// ═══════════════════════════════════════════
// Module Registry
//
// Defines all available modules. In production
// this would come from the backend per-tenant.
// For now, toggle `enabled` to see UI adapt.
//
// Import as:
//   import { ALL_MODULES, ENABLED_MODULES } from '@/app/modules.js'
// ═══════════════════════════════════════════

import {
  Droplets, Waves, Bug, Hammer, Trees, Sprout,
  Ruler, Thermometer, Wrench, Paintbrush,
} from "lucide-react"

export const ALL_MODULES = [
  { key: "spray", label: "Spray Tracking", icon: Droplets, color: "#7C3AED", desc: "Chemical application & PUR compliance", enabled: true, category: "Landscape" },
  { key: "irrigation", label: "Irrigation", icon: Waves, color: "#0891B2", desc: "Flow tracking & system inspections", enabled: true, category: "Landscape" },
  { key: "pest", label: "Pest Control", icon: Bug, color: "#DC2626", desc: "Pest management & treatment logs", enabled: true, category: "Pest" },
  { key: "hardscape", label: "Hardscape", icon: Hammer, color: "#92400E", desc: "Construction & install tracking", enabled: false, category: "Construction" },
  { key: "tree-care", label: "Tree Care", icon: Trees, color: "#16A34A", desc: "Arborist reports & pruning logs", enabled: true, category: "Landscape" },
  { key: "planting", label: "Planting", icon: Sprout, color: "#65A30D", desc: "Plant installation & warranty tracking", enabled: false, category: "Landscape" },
  { key: "surveying", label: "Site Survey", icon: Ruler, color: "#6366F1", desc: "Property measurements & proposals", enabled: true, category: "General" },
  { key: "hvac", label: "HVAC Service", icon: Thermometer, color: "#EA580C", desc: "Heating & cooling service logs", enabled: false, category: "Mechanical" },
  { key: "maintenance", label: "Maintenance", icon: Wrench, color: "#475569", desc: "General repair & maintenance logs", enabled: true, category: "General" },
  { key: "painting", label: "Painting", icon: Paintbrush, color: "#DB2777", desc: "Paint & coating documentation", enabled: false, category: "Construction" },
]

export const ENABLED_MODULES = ALL_MODULES.filter(m => m.enabled)
