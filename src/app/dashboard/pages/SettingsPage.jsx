// ═══════════════════════════════════════════
// Settings Page — Two-column layout
// Company configuration, modules, integrations
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Building2, Users, Blocks, Link2, CreditCard,
  Bell, ChevronRight, ExternalLink, Search,
  FlaskConical, Eye, EyeOff, LogOut, Plus, X,
  Copy, UserPlus, Mail, Shield, Loader2, QrCode, Smartphone,
} from "lucide-react"
import { useNavigate as useRouterNavigate } from "react-router-dom"
import useAuth from "@/hooks/useAuth.jsx"
import useModules from "@/hooks/useModules.jsx"
import useToast from "@/hooks/useToast.js"
import useNavigation from "@/hooks/useNavigation.js"
import CompanyQRModal from "../components/CompanyQRModal.jsx"
import { getOrganization, updateOrganization } from "@/lib/api/organization.js"
import { getInvitations, createInvitation, revokeInvitation, getOrgMembers } from "@/lib/api/invitations.js"
import { getSDSManagerConnection, saveSDSManagerKey, syncSDSManagerLibrary } from "@/lib/api/integrations.js"
import { PROVIDER_META, getProvidersByCategory } from "@/lib/integrations/index.js"
import PageShell from "../components/PageShell.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import IntegrationLogo from "../components/IntegrationLogo.jsx"
import { ConfirmModal } from "../components/PageUI.jsx"
import s from "./SettingsPage.module.css"

const NAV_ITEMS = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "users", label: "Users & Roles", icon: Users },
  { key: "modules", label: "Modules", icon: Blocks },
  { key: "integrations", label: "Integrations", icon: Link2 },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
]

const CATEGORY_ORDER = ["accounting", "compliance", "documents", "payroll"]
const CATEGORY_LABELS = {
  accounting: "ACCOUNTING",
  compliance: "COMPLIANCE",
  documents: "DOCUMENTS",
  payroll: "PAYROLL",
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("company")
  const { logout } = useAuth()
  const routerNavigate = useRouterNavigate()

  const handleSignOut = () => {
    logout()
    routerNavigate("/login", { replace: true })
  }

  return (
    <PageShell title="Settings">
      <div className={s.layout}>
        {/* Left Nav */}
        <div className={s.nav}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.key
            return (
              <button
                key={item.key}
                className={`${s.navItem} ${isActive ? s.navItemActive : ""}`}
                onClick={() => setActiveSection(item.key)}
              >
                {isActive && <div className={s.navAccent} />}
                <Icon size={16} />
                <span>{item.label}</span>
                <ChevronRight size={14} className={s.navChevron} />
              </button>
            )
          })}

          {/* Sign Out button */}
          <div className={s.navDivider} />
          <button className={`${s.navItem} ${s.navItemSignOut}`} onClick={handleSignOut}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Right Content */}
        <div className={s.content}>
          {activeSection === "company" && <CompanySection />}
          {activeSection === "users" && <UsersSection />}
          {activeSection === "modules" && <ModulesSection />}
          {activeSection === "integrations" && <IntegrationsSection />}
          {activeSection === "billing" && <BillingSection />}
          {activeSection === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </PageShell>
  )
}


// ===================================================
// Company Section
// ===================================================
function CompanySection() {
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", state: "", zip: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const toast = useToast()

  useEffect(() => {
    getOrganization()
      .then(data => {
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
        })
      })
      .catch(() => toast.show("Failed to load company details"))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.show("Company name is required"); return }
    setSaving(true)
    try {
      await updateOrganization(form)
      toast.show("Company details saved")
    } catch {
      toast.show("Failed to save company details")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className={s.sectionTitle}>Company Settings</h3>
      <div className={s.sectionDesc}>Manage your company profile and preferences.</div>
      <form onSubmit={handleSave}>
        <div className={s.formCard}>
          <div className={s.fieldRow}>
            <label className={s.fieldLabel}>Company Name</label>
            <input type="text" className={s.fieldInput} placeholder="Your company name"
              value={form.name} onChange={handleChange("name")} disabled={loading} />
          </div>
          <div className={s.fieldRow}>
            <label className={s.fieldLabel}>Phone</label>
            <input type="tel" className={s.fieldInput} placeholder="(555) 000-0000"
              value={form.phone} onChange={handleChange("phone")} disabled={loading} />
          </div>
          <div className={s.fieldRow}>
            <label className={s.fieldLabel}>Address</label>
            <input type="text" className={s.fieldInput} placeholder="Street address"
              value={form.address} onChange={handleChange("address")} disabled={loading} />
          </div>
          <div className={s.fieldRowGrid}>
            <div>
              <label className={s.fieldLabel}>City</label>
              <input type="text" className={s.fieldInput} placeholder="City"
                value={form.city} onChange={handleChange("city")} disabled={loading} />
            </div>
            <div>
              <label className={s.fieldLabel}>State</label>
              <input type="text" className={s.fieldInput} placeholder="CA"
                value={form.state} onChange={handleChange("state")} disabled={loading} />
            </div>
            <div>
              <label className={s.fieldLabel}>ZIP</label>
              <input type="text" className={s.fieldInput} placeholder="00000"
                value={form.zip} onChange={handleChange("zip")} disabled={loading} />
            </div>
          </div>
        </div>
        <div className={s.formActions}>
          <button type="submit" className={s.saveBtn} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Device Registration / QR Code */}
      <h3 className={s.sectionTitle} style={{ marginTop: 32 }}>Field Device Registration</h3>
      <div className={s.sectionDesc}>Share a QR code or company code with your crews to register their field devices.</div>
      <div className={s.formCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "4px 0" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 3, background: "var(--amb-dim)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Smartphone size={22} style={{ color: "var(--amb)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--t1)" }}>
              Device QR Code
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--t3)", marginTop: 2 }}>
              Crews scan this to connect their phones to your workspace
            </div>
          </div>
          <button onClick={() => setShowQR(true)} className={s.saveBtn} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <QrCode size={16} /> Manage Codes
          </button>
        </div>
      </div>

      <CompanyQRModal open={showQR} onClose={() => setShowQR(false)} />

      {toast.message && (
        <div className={s.toast} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  )
}

// ===================================================
// Users & Roles Section
// ===================================================

const ALL_PAGE_KEYS = [
  { key: "employees", label: "Employees" },
  { key: "crews", label: "Crews" },
  { key: "vehicles", label: "Vehicles" },
  { key: "equipment", label: "Equipment" },
  { key: "training", label: "Training" },
  { key: "certifications", label: "Certifications" },
  { key: "incidents", label: "Incidents" },
  { key: "sds", label: "SDS Library" },
  { key: "documents", label: "Documents" },
  { key: "reports", label: "Reports" },
  { key: "projects", label: "Projects" },
  { key: "schedule", label: "Schedule" },
]

function UsersSection() {
  const toast = useToast()
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)

  // Invite form state
  const [invEmail, setInvEmail] = useState("")
  const [invRole, setInvRole] = useState("manager")
  const [invPerms, setInvPerms] = useState({})
  const [inviting, setInviting] = useState(false)

  const loadData = async () => {
    try {
      const [m, i] = await Promise.all([getOrgMembers(), getInvitations()])
      setMembers(m)
      setInvitations(i)
    } catch {
      toast.show("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!invEmail.trim()) { toast.show("Email is required"); return }
    setInviting(true)
    try {
      const permissions = invRole !== "owner" && Object.keys(invPerms).length > 0
        ? { pages: invPerms } : {}
      await createInvitation({ email: invEmail.trim(), role: invRole, permissions })
      toast.show("Invitation created")
      setInvEmail("")
      setInvRole("manager")
      setInvPerms({})
      setShowInviteForm(false)
      loadData()
    } catch (err) {
      toast.show(err.message || "Failed to create invitation")
    } finally {
      setInviting(false)
    }
  }

  const handleRevoke = async (id) => {
    try {
      await revokeInvitation(id)
      toast.show("Invitation revoked")
      loadData()
    } catch {
      toast.show("Failed to revoke invitation")
    }
  }

  const copyInviteLink = (token) => {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    toast.show("Invite link copied to clipboard")
  }

  const togglePerm = (key) => {
    setInvPerms(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const roleBadgeClass = (role) => {
    if (role === "owner") return s.roleBadgeOwner
    if (role === "manager") return s.roleBadgeManager
    return s.roleBadgeViewer
  }

  if (loading) {
    return (
      <div>
        <h3 className={s.sectionTitle}>Users & Roles</h3>
        <div className={s.sectionDesc}>Manage dashboard access and permission levels.</div>
        <div className={s.loadingState}><Loader2 size={20} className={s.spinnerIcon} /> Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <h3 className={s.sectionTitle}>Users & Roles</h3>
      <div className={s.sectionDesc}>Manage dashboard access and permission levels.</div>

      {/* Members list */}
      <div className={s.usersSubHeader}>
        <div className={s.usersSubLabel}>Members ({members.length})</div>
        <button className={s.inviteBtn} onClick={() => setShowInviteForm(v => !v)}>
          <UserPlus size={14} /> Invite User
        </button>
      </div>

      <div className={s.membersList}>
        {members.map(m => (
          <div key={m.id} className={s.memberRow}>
            <div className={s.memberAvatar}>
              {m.name ? m.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
            </div>
            <div className={s.memberInfo}>
              <div className={s.memberName}>{m.name}</div>
              <div className={s.memberEmail}>{m.email}</div>
            </div>
            <span className={`${s.roleBadge} ${roleBadgeClass(m.role)}`}>
              {(m.role || "member").toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <div className={s.inviteForm}>
          <div className={s.inviteFormHeader}>
            <Mail size={16} /> <span>New Invitation</span>
            <button className={s.inviteFormClose} onClick={() => setShowInviteForm(false)}><X size={14} /></button>
          </div>
          <form onSubmit={handleInvite}>
            <div className={s.inviteFormGrid}>
              <div className={s.formField}>
                <label className={s.formLabel}>Email</label>
                <input
                  className={s.formInput}
                  type="email"
                  value={invEmail}
                  onChange={e => setInvEmail(e.target.value)}
                  placeholder="user@company.com"
                />
              </div>
              <div className={s.formField}>
                <label className={s.formLabel}>Role</label>
                <select className={s.formInput} value={invRole} onChange={e => setInvRole(e.target.value)}>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            {invRole !== "owner" && (
              <div className={s.formField}>
                <label className={s.formLabel}>Page Access</label>
                <div className={s.permGrid}>
                  {ALL_PAGE_KEYS.map(p => (
                    <label key={p.key} className={s.permCheck}>
                      <input
                        type="checkbox"
                        checked={invPerms[p.key] !== false}
                        onChange={() => togglePerm(p.key)}
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
                <div className={s.permHint}>Uncheck pages to restrict access. All checked by default.</div>
              </div>
            )}

            <div className={s.inviteFormActions}>
              <button type="button" className={s.cancelBtn} onClick={() => setShowInviteForm(false)}>Cancel</button>
              <button type="submit" className={s.submitInviteBtn} disabled={inviting}>
                {inviting ? "Sending..." : "Create Invitation"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending invitations */}
      {invitations.filter(i => i.status === "pending").length > 0 && (
        <>
          <div className={s.usersSubHeader} style={{ marginTop: 24 }}>
            <div className={s.usersSubLabel}>Pending Invitations</div>
          </div>
          <div className={s.membersList}>
            {invitations.filter(i => i.status === "pending").map(inv => (
              <div key={inv.id} className={s.memberRow}>
                <div className={s.memberAvatar} style={{ opacity: 0.5 }}>
                  <Mail size={14} />
                </div>
                <div className={s.memberInfo}>
                  <div className={s.memberName}>{inv.email}</div>
                  <div className={s.memberEmail}>
                    Invited as {inv.role} · Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <div className={s.inviteActions}>
                  <button className={s.copyLinkBtn} onClick={() => copyInviteLink(inv.token)} title="Copy invite link">
                    <Copy size={13} />
                  </button>
                  <button className={s.revokeBtn} onClick={() => handleRevoke(inv.id)} title="Revoke">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ===================================================
// Modules Section — Real toggle switches with toast
// ===================================================
function ModulesSection() {
  const { allModules, isEnabled, toggleModule } = useModules()
  const toast = useToast()
  const [confirmDisable, setConfirmDisable] = useState(null)

  const handleToggle = async (mod, currentlyEnabled) => {
    if (currentlyEnabled) {
      setConfirmDisable(mod)
      return
    }
    try {
      await toggleModule(mod.key, true)
      toast.show(`${mod.label} enabled`)
    } catch {
      toast.show(`Failed to enable ${mod.label}`)
    }
  }

  const confirmDisableModule = async () => {
    if (!confirmDisable) return
    try {
      await toggleModule(confirmDisable.key, false)
      toast.show(`${confirmDisable.label} disabled`)
    } catch {
      toast.show(`Failed to disable ${confirmDisable.label}`)
    } finally {
      setConfirmDisable(null)
    }
  }

  return (
    <div>
      <h3 className={s.sectionTitle}>Modules</h3>
      <div className={s.sectionDesc}>
        Enable or disable industry-specific modules. Disabled modules disappear from navigation but data is preserved.
      </div>
      <div className={s.moduleGrid}>
        {allModules.map(mod => {
          const enabled = isEnabled(mod.key)
          return (
            <div key={mod.key} className={s.moduleCard}>
              <div className={s.moduleTop}>
                <div className={s.moduleIconBox} style={{ background: `${mod.color}12` }}>
                  <Blocks size={18} color={mod.color} />
                </div>
                <div className={s.moduleInfo}>
                  <div className={s.moduleName}>{mod.label}</div>
                  <div className={s.moduleDesc}>{mod.desc}</div>
                </div>
              </div>
              <button
                className={s.toggleSwitch}
                onClick={() => handleToggle(mod, enabled)}
                role="switch"
                aria-checked={enabled}
                aria-label={`Toggle ${mod.label}`}
                type="button"
              >
                <span className={`${s.toggleTrack} ${enabled ? s.toggleTrackOn : ""}`}>
                  <span className={`${s.toggleThumb} ${enabled ? s.toggleThumbOn : ""}`} />
                </span>
                <StatusBadge variant={enabled ? "green" : "gray"}>
                  {enabled ? "Enabled" : "Disabled"}
                </StatusBadge>
              </button>
            </div>
          )
        })}
      </div>

      {confirmDisable && (
        <ConfirmModal
          title={`Disable ${confirmDisable.label}?`}
          message={`Disabling ${confirmDisable.label} will hide it from navigation. Your data will be preserved and can be re-enabled at any time.`}
          confirmLabel="Disable Module"
          onConfirm={confirmDisableModule}
          onCancel={() => setConfirmDisable(null)}
        />
      )}

      {toast.message && (
        <div className={s.toast} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  )
}

// ===================================================
// Integrations Section — Category groups + logos
// ===================================================
function IntegrationsSection() {
  const { navigate } = useNavigation()
  const toast = useToast()
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [sdsConnection, setSdsConnection] = useState(null)
  const [savingKey, setSavingKey] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    getSDSManagerConnection()
      .then(data => setSdsConnection(data))
      .catch(() => {})
  }, [])

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim() || apiKeyInput.length < 8) {
      toast.show("API key must be at least 8 characters")
      return
    }
    setSavingKey(true)
    try {
      await saveSDSManagerKey(apiKeyInput)
      setSdsConnection({ connected: true, maskedKey: apiKeyInput.slice(0, 4) + "••••" + apiKeyInput.slice(-4) })
      setApiKeyInput("")
      toast.show("SDS Manager API key saved")
    } catch (err) {
      toast.show(err.message || "Failed to save API key")
    } finally {
      setSavingKey(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const data = await syncSDSManagerLibrary()
      toast.show(data.message || "Sync complete")
    } catch (err) {
      toast.show(err.message || "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const providersByCategory = getProvidersByCategory()

  return (
    <div>
      <h3 className={s.sectionTitle}>Integrations</h3>
      <div className={s.sectionDesc}>Connect external services to sync data across your workspace.</div>

      {CATEGORY_ORDER.map(cat => {
        const providers = providersByCategory[cat]
        if (!providers || providers.length === 0) return null
        return (
          <div key={cat} className={s.intSection}>
            <div className={s.intSectionLabel}>{CATEGORY_LABELS[cat]}</div>
            <div className={s.intGrid}>
              {providers.map(provider => {
                const isComingSoon = provider.status === "coming_soon"
                const isSdsManager = provider.key === "sds_manager"

                return (
                  <div
                    key={provider.key}
                    className={`${s.intCard} ${isComingSoon ? s.intCardComingSoon : ""}`}
                  >
                    <div className={s.intCardTop}>
                      <IntegrationLogo provider={provider.key} size={40} />
                      <div className={s.intInfo}>
                        <div className={s.intNameRow}>
                          <div className={s.intName}>{provider.name}</div>
                          {isComingSoon ? (
                            <StatusBadge variant="gray">Coming Soon</StatusBadge>
                          ) : provider.status === "available" ? (
                            <StatusBadge variant="amber">Available</StatusBadge>
                          ) : (
                            <StatusBadge variant="green">Connected</StatusBadge>
                          )}
                        </div>
                        <div className={s.intDesc}>{provider.description}</div>
                      </div>
                    </div>

                    {/* SDS Manager gets special card content */}
                    {isSdsManager && (
                      <div className={s.sdsManagerExtra}>
                        <div className={s.sdsApiKeyRow}>
                          <div className={s.sdsApiKeyField}>
                            <label className={s.fieldLabel}>API Key</label>
                            <div className={s.sdsApiKeyInput}>
                              <input
                                type={showApiKey ? "text" : "password"}
                                className={s.fieldInput}
                                placeholder={sdsConnection?.maskedKey || "Enter your SDS Manager API key"}
                                value={apiKeyInput}
                                onChange={e => setApiKeyInput(e.target.value)}
                              />
                              <button
                                className={s.sdsApiKeyToggle}
                                onClick={() => setShowApiKey(!showApiKey)}
                                type="button"
                                title={showApiKey ? "Hide" : "Show"}
                              >
                                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              {apiKeyInput && (
                                <button
                                  className={s.intConnectBtn}
                                  onClick={handleSaveApiKey}
                                  disabled={savingKey}
                                  style={{ marginLeft: "var(--space-2)", whiteSpace: "nowrap" }}
                                >
                                  {savingKey ? "Saving..." : "Save Key"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={s.sdsManagerActions}>
                          <button
                            className={s.intConnectBtn}
                            onClick={() => navigate?.("sds")}
                          >
                            <Search size={14} /> Search & Import
                          </button>
                          <button
                            className={s.intSecondaryBtn}
                            onClick={handleSync}
                            disabled={syncing || !sdsConnection?.connected}
                          >
                            {syncing ? "Syncing..." : "Sync All"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Standard card actions */}
                    {!isSdsManager && (
                      <div className={s.intCardActions}>
                        {isComingSoon ? (
                          <span className={s.intComingSoonText}>
                            Notify me when available
                          </span>
                        ) : (
                          <button className={s.intConnectBtn}>Connect</button>
                        )}
                        {provider.docsUrl && (
                          <a
                            href={provider.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={s.intLearnMore}
                          >
                            Learn More <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className={s.intBillingNote}>
        Integration connections are included in your subscription. API usage limits may apply for high-volume sync operations.
      </div>

      {toast.message && (
        <div className={s.toast} role="status" aria-live="polite">{toast.message}</div>
      )}
    </div>
  )
}

// ===================================================
// Billing Section
// ===================================================
function BillingSection() {
  return (
    <div>
      <h3 className={s.sectionTitle}>Billing</h3>
      <div className={s.sectionDesc}>Manage your subscription and payment method.</div>
      <div className={s.emptySection}>
        <CreditCard size={32} strokeWidth={1} className={s.emptyIcon} />
        <div className={s.emptyTitle}>Billing management coming soon</div>
        <div className={s.emptyDesc}>
          View your plan, manage payment methods, and download invoices.
          Flat rate per company — unlimited crew members.
        </div>
      </div>
    </div>
  )
}

// ===================================================
// Notifications Section
// ===================================================
function NotificationsSection() {
  return (
    <div>
      <h3 className={s.sectionTitle}>Notifications</h3>
      <div className={s.sectionDesc}>Configure alert preferences.</div>
      <div className={s.formCard}>
        <NotifToggle label="Training due date alerts" sub="60, 30, 7, and 1 day before expiry" defaultOn />
        <NotifToggle label="Certification expiry alerts" sub="Notify when employee certifications approach expiration" defaultOn />
        <NotifToggle label="Incident report submitted" sub="Alert when a new incident report is filed" defaultOn />
        <NotifToggle label="Vehicle inspection flags" sub="Alert when a vehicle inspection creates a work order" defaultOn />
        <NotifToggle label="Clock-in reminders" sub="Notify employees who haven't clocked in by scheduled time" />
      </div>
    </div>
  )
}

function NotifToggle({ label, sub, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className={s.notifRow}>
      <div className={s.notifInfo}>
        <div className={s.notifLabel}>{label}</div>
        {sub && <div className={s.notifSub}>{sub}</div>}
      </div>
      <button
        className={s.toggleSwitch}
        onClick={() => setOn(!on)}
        role="switch"
        aria-checked={on}
        type="button"
      >
        <span className={`${s.toggleTrack} ${on ? s.toggleTrackOn : ""}`}>
          <span className={`${s.toggleThumb} ${on ? s.toggleThumbOn : ""}`} />
        </span>
      </button>
    </div>
  )
}
