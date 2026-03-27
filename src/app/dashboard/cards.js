// ═══════════════════════════════════════════
// Dashboard Cards Registry
// Defines all available pinnable dashboard cards
// ═══════════════════════════════════════════

import {
  Users, Briefcase, ShieldCheck, Zap,
  MapPin, BookOpen, FileText, FlaskConical, Droplets,
} from "lucide-react"

export const AVAILABLE_CARDS = {
  crew_activity: {
    label: "Crew Activity",
    description: "Today's crew clock-in status and attendance",
    icon: Users,
    requiresModule: null,
    defaultEnabled: true,
  },
  active_projects: {
    label: "Active Projects",
    description: "Recent project sites and status",
    icon: Briefcase,
    requiresModule: null,
    defaultEnabled: true,
  },
  compliance_alerts: {
    label: "Compliance Alerts",
    description: "Expiring certifications and overdue training",
    icon: ShieldCheck,
    requiresModule: null,
    defaultEnabled: true,
  },
  quick_actions: {
    label: "Quick Actions",
    description: "Shortcuts to common tasks",
    icon: Zap,
    requiresModule: null,
    defaultEnabled: true,
  },
  gps_overview: {
    label: "GPS Overview",
    description: "Live crew locations on a map",
    icon: MapPin,
    requiresModule: null,
    defaultEnabled: false,
  },
  training_due: {
    label: "Training Due",
    description: "Upcoming and overdue training sessions",
    icon: BookOpen,
    requiresModule: null,
    defaultEnabled: false,
  },
  recent_forms: {
    label: "Recent Forms",
    description: "Latest submitted field reports and forms",
    icon: FileText,
    requiresModule: null,
    defaultEnabled: false,
  },
  spray_logs: {
    label: "Spray Logs",
    description: "Recent spray application records",
    icon: FlaskConical,
    requiresModule: "spray",
    defaultEnabled: false,
  },
  irrigation_requests: {
    label: "Irrigation Requests",
    description: "Open irrigation service requests",
    icon: Droplets,
    requiresModule: "irrigation",
    defaultEnabled: false,
  },
}

export const DEFAULT_PINS = [
  { card_key: "crew_activity", position: 1 },
  { card_key: "active_projects", position: 2 },
  { card_key: "compliance_alerts", position: 3 },
  { card_key: "quick_actions", position: 4 },
]
