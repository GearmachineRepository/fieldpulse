// ═══════════════════════════════════════════
// Dashboard Sidebar — Section-conditional navigation
//
// Shows only the pages for the active section.
// Reads user/org data from useAuth() directly.
// ═══════════════════════════════════════════

import { useCallback, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { SECTIONS, getSectionPages, isSinglePage } from "@/app/dashboard/nav-sections.js"
import useModules from "@/hooks/useModules.jsx"
import useAuth from "@/hooks/useAuth.jsx"
import { APP } from "@/config/app.js"
import s from "./DashboardSidebar.module.css"

export default function DashboardSidebar({ activePage, activeSection, onNavigate, onSelectSection, open, onClose }) {
  const { admin } = useAuth()
  const { isEnabled, enabledModules } = useModules()

  const section = useMemo(
    () => SECTIONS.find(sec => sec.key === activeSection),
    [activeSection]
  )

  const pages = useMemo(
    () => getSectionPages(activeSection)
      .filter(page => !page.module || isEnabled(page.module)),
    [activeSection, isEnabled]
  )

  // For mobile: all sections with their pages
  const allSections = useMemo(
    () => SECTIONS.filter(sec => !(sec.dynamic && enabledModules.length === 0)),
    [enabledModules]
  )

  const handleNav = useCallback((key) => {
    onNavigate(key)
    if (onClose) onClose()
  }, [onNavigate, onClose])

  const handleSectionNav = useCallback((sectionKey) => {
    if (onSelectSection) onSelectSection(sectionKey)
    if (onClose) onClose()
  }, [onSelectSection, onClose])

  const initials = admin?.name
    ? admin.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  // Desktop: don't render sidebar for single-page sections (Dashboard, Reports, Settings)
  // Mobile: always render (rail is hidden, sidebar is the only nav)
  const singlePage = section && isSinglePage(section)
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768
  if (singlePage && !open && !isMobile) return null

  return (
    <>
      {/* Backdrop (mobile overlay) */}
      <div
        className={`${s.backdrop} ${open ? s.backdropOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <nav className={`${s.sidebar} ${open ? s.open : ""}`} aria-label="Main navigation">
        {/* Company / workspace switcher */}
        <div className={s.wsTop}>
          <div>
            <div className={s.wsName}>{admin?.company || "My Workspace"}</div>
            <div className={s.wsRole}>{admin?.role || "member"}</div>
          </div>
          <ChevronDown size={12} className={s.wsChev} />
        </div>

        {/* Desktop: section header + pages for active section */}
        <div className={s.desktopNav}>
          {section && (
            <div className={s.sectionHeader}>{section.label.toUpperCase()}</div>
          )}

          <div className={s.nav}>
            {pages.map(page => {
              const active = activePage === page.key
              if (page.comingSoon) {
                return (
                  <div key={page.key} className={`${s.navItem} ${s.navItemDisabled}`}>
                    {page.icon && <page.icon size={14} className={s.navIcon} />}
                    {page.label}
                    <span className={s.soonBadge}>Soon</span>
                  </div>
                )
              }
              return (
                <button
                  key={page.key}
                  onClick={() => handleNav(page.key)}
                  className={`${s.navItem} ${active ? s.active : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {page.icon && <page.icon size={14} className={s.navIcon} />}
                  {page.label}
                  {page.badge && (
                    <span className={`${s.count} ${s.countWarn}`}>2</span>
                  )}
                  {page.modBadge && (
                    <span className={s.modBadge}>MOD</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile: all sections grouped with pages */}
        <div className={s.mobileNav}>
          {allSections.map(sec => {
            const secPages = getSectionPages(sec.key)
              .filter(page => !page.module || isEnabled(page.module))
            const isSingle = isSinglePage(sec)
            return (
              <div key={sec.key} className={s.group}>
                {isSingle ? (
                  <button
                    className={`${s.navItem} ${activeSection === sec.key ? s.active : ""}`}
                    onClick={() => handleSectionNav(sec.key)}
                  >
                    <sec.icon size={14} className={s.navIcon} />
                    {sec.label}
                  </button>
                ) : (
                  <>
                    <div className={s.groupLabel}>{sec.label.toUpperCase()}</div>
                    {secPages.map(page => {
                      const active = activePage === page.key
                      return (
                        <button
                          key={page.key}
                          onClick={() => handleNav(page.key)}
                          className={`${s.navItem} ${active ? s.active : ""}`}
                          aria-current={active ? "page" : undefined}
                        >
                          {page.icon && <page.icon size={14} className={s.navIcon} />}
                          {page.label}
                          {page.modBadge && <span className={s.modBadge}>MOD</span>}
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* User footer */}
        <div className={s.userFooter}>
          <div className={s.userBtn}>
            <div className={s.userAvatar}>{initials}</div>
            <div>
              <div className={s.userName}>{admin?.name || "User"}</div>
              <div className={s.userRole}>{(admin?.role || "MEMBER").toUpperCase()}</div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
