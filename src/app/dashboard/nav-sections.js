// ===============================================
// Navigation Sections — Single source of truth
//
// Defines the relationship between rail sections
// and their child pages. Used by useNavigation,
// DashboardRail, and DashboardSidebar.
// ===============================================

import {
  LayoutDashboard, Calendar, Briefcase, Clock, Users,
  UserCheck, UsersRound, Truck, Wrench, ShieldCheck,
  GraduationCap, Award, AlertTriangle, BookOpen, FileText,
  FlaskConical, BarChart3, TrendingUp, ClipboardCheck,
  Settings, Blocks,
} from "lucide-react"
import { ENABLED_MODULES } from "@/app/modules.js"

export const SECTIONS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    pages: [{ key: "dashboard", label: "Dashboard" }],
  },
  {
    key: "operations",
    label: "Operations",
    icon: Calendar,
    pages: [
      { key: "schedule", label: "Schedule",  icon: Calendar },
      { key: "jobs",     label: "Jobs",      icon: Briefcase },
      { key: "clock-in", label: "Clock-In",  icon: Clock },
    ],
  },
  {
    key: "people",
    label: "People",
    icon: Users,
    pages: [
      { key: "employees", label: "Employees", icon: UserCheck },
      { key: "crews",     label: "Crews",     icon: UsersRound },
    ],
  },
  {
    key: "fleet",
    label: "Fleet",
    icon: Truck,
    pages: [
      { key: "vehicles",  label: "Vehicles",  icon: Truck },
      { key: "equipment", label: "Equipment", icon: Wrench },
    ],
  },
  {
    key: "compliance",
    label: "Compliance",
    icon: ShieldCheck,
    pages: [
      { key: "training",       label: "Training",       icon: GraduationCap },
      { key: "certifications", label: "Certifications", icon: Award },
      { key: "incidents",      label: "Incidents",      icon: AlertTriangle },
    ],
  },
  {
    key: "resources",
    label: "Resources",
    icon: BookOpen,
    pages: [
      { key: "documents", label: "Documents",   icon: FileText },
      { key: "sds",       label: "SDS Library", icon: FlaskConical },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    pages: [
      { key: "reports",           label: "Overview",         icon: BarChart3 },
      { key: "crew-performance",  label: "Crew Performance", icon: TrendingUp },
      { key: "compliance-report", label: "Compliance",       icon: ClipboardCheck },
    ],
  },
  {
    key: "modules",
    label: "Modules",
    icon: Blocks,
    pages: [],
    dynamic: true,
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    pages: [{ key: "settings", label: "Settings", icon: Settings }],
  },
]

// -- Reverse lookup: pageKey -> sectionKey --
export const PAGE_TO_SECTION = {}
for (const section of SECTIONS) {
  for (const page of section.pages) {
    PAGE_TO_SECTION[page.key] = section.key
  }
}
// Add module pages dynamically
ENABLED_MODULES.forEach(m => {
  PAGE_TO_SECTION[`mod-${m.key}`] = "modules"
})

// -- Helper: is this a single-page section? --
export function isSinglePage(section) {
  return section.pages.length === 1 && section.pages[0].key === section.key
}

// -- Get the pages for a section (handles dynamic modules) --
export function getSectionPages(sectionKey) {
  const section = SECTIONS.find(s => s.key === sectionKey)
  if (!section) return []
  if (section.dynamic) {
    return ENABLED_MODULES.map(m => ({
      key: `mod-${m.key}`,
      label: m.label,
      icon: m.icon,
      modBadge: true,
    }))
  }
  return section.pages
}

// -- Resolve page title from any page key --
export function resolvePageTitle(pageKey) {
  if (pageKey === "dashboard") return "Dashboard"
  if (pageKey?.startsWith("mod-")) {
    const mod = ENABLED_MODULES.find(m => `mod-${m.key}` === pageKey)
    return mod?.label || "Module"
  }
  for (const section of SECTIONS) {
    const page = section.pages.find(p => p.key === pageKey)
    if (page) return page.label
  }
  return pageKey || "Dashboard"
}
