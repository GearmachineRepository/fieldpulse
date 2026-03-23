// ═══════════════════════════════════════════
// Settings Page — Two-column layout
// Company configuration, modules, integrations
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Building2, Users, Blocks, Link2, CreditCard,
  Bell, Settings, ChevronRight, ToggleLeft, ToggleRight,
  Calculator, FileText, FlaskConical, ExternalLink,
} from "lucide-react"
import useModules from "@/hooks/useModules.jsx"
import useToast from "@/hooks/useToast.js"
import { getOrganization, updateOrganization } from "@/lib/api/organization.js"
import PageShell from "../components/PageShell.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import s from "./SettingsPage.module.css"

const NAV_ITEMS = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "users", label: "Users & Roles", icon: Users },
  { key: "modules", label: "Modules", icon: Blocks },
  { key: "integrations", label: "Integrations", icon: Link2 },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
]

const INTEGRATIONS = [
  {
    key: "quickbooks",
    label: "QuickBooks",
    desc: "Sync jobs and hours to invoices and payroll",
    category: "accounting",
    icon: Calculator,
    iconColor: "#2CA01C",
    connected: false,
    docsUrl: "https://quickbooks.intuit.com",
  },
  {
    key: "bluebeam",
    label: "Bluebeam",
    desc: "Sync construction documents and drawings to projects",
    category: "documents",
    icon: FileText,
    iconColor: "#005BAC",
    connected: false,
    docsUrl: "https://www.bluebeam.com",
  },
  {
    key: "pubchem",
    label: "PubChem",
    desc: "Free chemical data from NCBI — auto-populate SDS library",
    category: "compliance",
    icon: FlaskConical,
    iconColor: "#16A34A",
    connected: false,
    free: true,
    docsUrl: "https://pubchem.ncbi.nlm.nih.gov",
  },
  {
    key: "custom-sds",
    label: "Custom SDS API",
    desc: "Connect a Safety Data Sheet database to auto-populate your SDS library",
    category: "compliance",
    icon: FlaskConical,
    iconColor: "#CA8A04",
    connected: false,
    hasPubchemOption: true,
  },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("company")

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
function UsersSection() {
  return (
    <div>
      <h3 className={s.sectionTitle}>Users & Roles</h3>
      <div className={s.sectionDesc}>Manage dashboard access and permission levels.</div>
      <div className={s.emptySection}>
        <Users size={32} strokeWidth={1} className={s.emptyIcon} />
        <div className={s.emptyTitle}>User management coming soon</div>
        <div className={s.emptyDesc}>
          Invite team members, assign roles (Owner, Admin, Manager, Viewer),
          and control page-level access permissions.
        </div>
      </div>
    </div>
  )
}

// ===================================================
// Modules Section
// ===================================================
function ModulesSection() {
  const { allModules, isEnabled, toggleModule } = useModules()

  const handleToggle = async (key, currentlyEnabled) => {
    try {
      await toggleModule(key, !currentlyEnabled)
    } catch {
      // toggleModule already reverts on failure
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
                className={s.moduleToggle}
                onClick={() => handleToggle(mod.key, enabled)}
                type="button"
              >
                {enabled ? (
                  <div className={s.toggleOn}>
                    <ToggleRight size={24} color="var(--amb)" />
                    <StatusBadge variant="green">Enabled</StatusBadge>
                  </div>
                ) : (
                  <div className={s.toggleOff}>
                    <ToggleLeft size={24} color="var(--t3)" />
                    <StatusBadge variant="gray">Disabled</StatusBadge>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===================================================
// Integrations Section
// ===================================================
function IntegrationsSection() {
  return (
    <div>
      <h3 className={s.sectionTitle}>Integrations</h3>
      <div className={s.sectionDesc}>Connect external services to sync data across your workspace.</div>
      <div className={s.intGrid}>
        {INTEGRATIONS.map(item => {
          const Icon = item.icon
          return (
            <div key={item.key} className={s.intCard}>
              <div className={s.intCardTop}>
                <div className={s.intIconBox} style={{ background: `${item.iconColor}14` }}>
                  <Icon size={20} color={item.iconColor} />
                </div>
                <div className={s.intInfo}>
                  <div className={s.intNameRow}>
                    <div className={s.intName}>{item.label}</div>
                    {item.free && <span className={s.freeBadge}>Free</span>}
                  </div>
                  <div className={s.intDesc}>{item.desc}</div>
                  <div className={s.intCategory}>{item.category}</div>
                </div>
              </div>
              <div className={s.intCardActions}>
                {item.hasPubchemOption ? (
                  <>
                    <button className={s.intConnectBtn}>Connect Custom API</button>
                    <button className={s.intConnectBtnAlt}>
                      Use PubChem
                      <span className={s.freeBadge}>Free</span>
                    </button>
                  </>
                ) : item.connected ? (
                  <StatusBadge variant="green">Connected</StatusBadge>
                ) : (
                  <button className={s.intConnectBtn}>Connect</button>
                )}
                {item.docsUrl && (
                  <a
                    href={item.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={s.intLearnMore}
                  >
                    Learn More <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
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
      <button className={s.notifToggle} onClick={() => setOn(!on)} type="button">
        {on ? (
          <ToggleRight size={24} color="var(--amb)" />
        ) : (
          <ToggleLeft size={24} color="var(--t3)" />
        )}
      </button>
    </div>
  )
}
