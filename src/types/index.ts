// ═══════════════════════════════════════════
// Domain Types — Shared interfaces for the
// entire frontend application
// ═══════════════════════════════════════════

import type { ComponentType } from 'react'

// ── Identifiers ──

export type Id = string | number

// ── API Error ──

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ── Auth ──

export interface AdminUser {
  id: Id
  name: string
  email: string
  role: 'owner' | 'manager' | 'viewer'
  company?: string
  permissions?: Record<string, boolean>
  token?: string
}

export interface EmployeeUser {
  id: Id
  firstName: string
  lastName: string
  license?: string
  certNumber?: string
  isCrewLead: boolean
}

export interface CrewMember {
  id: Id
  name: string
}

export interface AuthState {
  admin: AdminUser | null
  employee: EmployeeUser | null
  crew: CrewMember | null
  vehicle: Vehicle | null
  restoring: boolean
  isAdmin: boolean
  isField: boolean
  isAuthenticated: boolean
}

export interface AuthContextValue extends AuthState {
  signupAdmin: (name: string, email: string, password: string) => Promise<AdminUser>
  loginAdmin: (email: string, password: string) => Promise<AdminUser>
  loginCrew: (
    employeeId: Id,
    pin: string,
  ) => Promise<{ employee: EmployeeUser; crew: CrewMember; vehicle?: Vehicle }>
  logout: () => void
  getCrewLoginTiles: () => Promise<CrewLoginTile[]>
}

// ── Organization ──

export interface Organization {
  id: Id
  name: string
  slug: string
  plan: string
  trialEndsAt?: string
  ownerId?: Id
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  logo?: string
}

// ── Crews & Employees ──

export interface Crew {
  id: Id
  name: string
  active: boolean
  orgId?: Id
}

export interface Employee {
  id: Id
  firstName: string
  lastName: string
  licenseNumber?: string
  certNumber?: string
  isCrewLead: boolean
  defaultCrewId?: Id
  active: boolean
  photoUrl?: string
  orgId?: Id
}

export interface CrewLoginTile {
  id: Id
  name: string
  employees: { id: Id; firstName: string; lastName: string; isCrewLead: boolean }[]
  vehicles: { id: Id; name: string }[]
}

// ── Vehicles ──

export interface Vehicle {
  id: Id
  name: string
  crewName?: string
  status?: string
  categoryId?: Id
  active: boolean
  orgId?: Id
}

// ── Equipment ──

export interface Equipment {
  id: Id
  name: string
  type?: string
  status?: string
  categoryId?: Id
  serialNumber?: string
  notes?: string
  orgId?: Id
}

// ── Accounts / Properties ──

export interface Account {
  id: Id
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  lat?: number
  lng?: number
  phone?: string
  email?: string
  notes?: string
  estimatedMinutes?: number
  groupId?: Id
  orgId?: Id
}

export interface AccountGroup {
  id: Id
  name: string
  orgId?: Id
}

// ── Projects / Routes ──

export interface Route {
  id: Id
  name: string
  dayOfWeek?: number
  crewId?: Id
  stops?: RouteStop[]
  orgId?: Id
}

export interface RouteStop {
  id: Id
  routeId: Id
  accountId: Id
  position: number
  account?: Account
}

export interface RouteCompletion {
  id: Id
  routeStopId?: Id
  status: string
  completedAt?: string
  notes?: string
  photos?: Photo[]
}

export interface Visit {
  date: string
  routeId?: Id
  planId?: Id
  accountId?: Id
  status?: string
  account?: Account
}

// ── Schedule Events ──

export interface ScheduleEvent {
  id: Id
  title: string
  date: string
  startTime?: string
  endTime?: string
  crewId?: Id
  accountId?: Id
  notes?: string
  orgId?: Id
}

// ── Service Plans ──

export interface ServicePlan {
  id: Id
  name: string
  accountId: Id
  frequency: string
  startDate: string
  endDate?: string
  status: string
  crewId?: Id
  notes?: string
  orgId?: Id
}

export interface ServiceException {
  id: Id
  type: 'skip' | 'pause'
  dateStart: string
  dateEnd?: string
  reason?: string
}

// ── Chemicals / SDS ──

export interface Chemical {
  id: Id
  name: string
  epaNumber?: string
  activeIngredient?: string
  manufacturer?: string
  signalWord?: string
  ghsPictograms?: string[]
  orgId?: Id
}

export interface SdsEntry {
  id: Id
  chemicalId?: Id
  productName: string
  manufacturer?: string
  location?: string
  notes?: string
  url?: string
  orgId?: Id
}

// ── Spray Logs ──

export interface SprayLog {
  id: Id
  chemicalId?: Id
  chemicalName?: string
  amount: string
  targetPest?: string
  applicationMethod?: string
  windSpeed?: string
  windDirection?: string
  temperature?: string
  humidity?: string
  accountId?: Id
  crewName?: string
  vehicleName?: string
  applicatorName?: string
  licenseNumber?: string
  notes?: string
  photos?: Photo[]
  createdAt?: string
  orgId?: Id
}

// ── Field Docs ──

export interface FieldDoc {
  id: Id
  type: 'general_note' | 'inspection' | 'incident_report' | 'spray_log'
  title?: string
  content?: string
  status?: string
  crewName?: string
  employeeName?: string
  assetType?: string
  assetId?: Id
  photos?: Photo[]
  createdAt?: string
  orgId?: Id
}

// ── Incidents ──

export interface Incident {
  id: Id
  title: string
  incidentDate: string
  severity?: string
  status: string
  description?: string
  location?: string
  employeeIds?: Id[]
  locked: boolean
  photos?: Photo[]
  createdAt?: string
  orgId?: Id
}

// ── Certifications ──

export interface Certification {
  id: Id
  employeeId: Id
  typeId?: Id
  typeName?: string
  certNumber?: string
  issuedDate?: string
  expiryDate?: string
  status?: string
  orgId?: Id
}

export interface CertificationType {
  id: Id
  name: string
  orgId?: Id
}

// ── Training ──

export interface TrainingSession {
  id: Id
  title: string
  date: string
  instructor?: string
  description?: string
  categoryId?: Id
  signoffs?: TrainingSignoff[]
  orgId?: Id
}

export interface TrainingSignoff {
  id: Id
  sessionId: Id
  employeeId: Id
  employeeName?: string
  signedAt?: string
}

// ── Resources ──

export interface Resource {
  id: Id
  title: string
  description?: string
  fileUrl?: string
  fileType?: string
  fileSize?: number
  categoryId?: Id
  pinned?: boolean
  tags?: string[]
  orgId?: Id
}

export interface ResourceCategory {
  id: Id
  name: string
  orgId?: Id
}

// ── Photos ──

export interface Photo {
  id: Id
  url: string
  caption?: string
  createdAt?: string
}

// ── Categories ──

export interface Category {
  id: Id
  name: string
  color?: string
  scope?: string
  position?: number
  orgId?: Id
}

// ── Rosters ──

export interface Roster {
  id: Id
  crewId: Id
  workDate: string
  members?: RosterMember[]
}

export interface RosterMember {
  id: Id
  rosterId: Id
  employeeId: Id
  present: boolean
  employeeName?: string
}

// ── Dashboard ──

export interface DashboardPin {
  card_key: string
  position: number
}

export interface DashboardCard {
  label: string
  description: string
  icon: ComponentType
  requiresModule: string | null
  defaultEnabled: boolean
}

// ── Modules ──

export interface ModuleConfig {
  key: string
  label: string
  icon: ComponentType
  color: string
  desc: string
  enabled: boolean
  category: string
}

export interface ModulesContextValue {
  isEnabled: (key: string) => boolean
  enabledModules: ModuleConfig[]
  allModules: ModuleConfig[]
  toggleModule: (key: string, enabled: boolean) => Promise<void>
  loaded: boolean
}

// ── Navigation ──

export interface NavPage {
  key: string
  label: string
  icon?: ComponentType
  module?: string
  comingSoon?: boolean
  modBadge?: boolean
}

export interface NavSection {
  key: string
  label: string
  icon: ComponentType
  pages: NavPage[]
  dynamic?: boolean
}

export interface BreadcrumbSegment {
  label: string
  path: string | null
}

// ── Shell ──

export interface ShellState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  openSidebar: () => void
  closeSidebar: () => void
  qrModalOpen: boolean
  setQrModalOpen: (open: boolean) => void
  openQrModal: () => void
  closeQrModal: () => void
  avatarMenuOpen: boolean
  setAvatarMenuOpen: (open: boolean) => void
}

// ── Toast ──

export interface ToastState {
  message: string | null
  show: (msg: string) => void
  dismiss: () => void
}

// ── Theme ──

export type ThemeMode = 'light' | 'dark'

export interface ThemeState {
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
}

// ── Page Data (generic) ──

export interface PageDataConfig<T> {
  fetchFn: () => Promise<T[]>
  createFn?: (data: unknown) => Promise<T>
  updateFn?: (id: Id, data: unknown) => Promise<T>
  deleteFn?: (id: Id) => Promise<void>
}

export interface PageDataReturn<T> {
  data: T[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<T[]>
  create?: (payload: unknown) => Promise<T>
  update?: (id: Id, payload: unknown) => Promise<T>
  remove?: (id: Id) => Promise<void>
  set: (data: T[]) => void
}

// ── Role ──

export type UserRole = 'owner' | 'manager' | 'viewer'

export interface RoleState {
  role: UserRole
  isOwner: boolean
  isManager: boolean
  hasAccess: (requiredRole: string) => boolean
  hasPageAccess: (pageKey: string) => boolean
}

// ── Invitations ──

export interface Invitation {
  id: Id
  email: string
  role: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  createdAt?: string
  expiresAt?: string
  orgId?: Id
}

export interface OrgMember {
  id: Id
  name: string
  email: string
  role: string
}

// ── Device Registration ──

export interface DeviceRegistration {
  name: string
  code: string
}

export interface RegistrationCode {
  id: Id
  code: string
  label?: string
  active: boolean
  expiresAt?: string
  createdAt?: string
}

// ── Integrations ──

export interface IntegrationConnection {
  id: Id
  provider: string
  apiKey?: string
  status: string
  lastSyncAt?: string
}

// ── Reports ──

export interface PurReport {
  rows: SprayLog[]
  byProduct: Record<string, { count: number; totalAmount: number; unit: string }>
}

export interface RosterReport {
  rows: Roster[]
}

export interface CompletionReport {
  rows: RouteCompletion[]
}

// ── App Config ──

export interface AppConfig {
  name: string
  tagline: string
  version: string
}
