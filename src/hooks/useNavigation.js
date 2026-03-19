// ═══════════════════════════════════════════
// useNavigation — Shell navigation + React Router
//
// Derives activePage from URL params.
// Provides section-aware navigation for the
// expandable rail + sidebar pattern.
// ═══════════════════════════════════════════

import { useCallback, useMemo, useRef } from 'react'
import { useNavigate as useRouterNavigate, useLocation } from 'react-router-dom'
import { SECTIONS, PAGE_TO_SECTION, isSinglePage, getSectionPages, resolvePageTitle } from '@/app/dashboard/nav-sections.js'
import { ENABLED_MODULES } from '@/app/modules.js'
import { APP } from '@/config/app.js'

export default function useNavigation() {
  const routerNavigate = useRouterNavigate()
  const location = useLocation()

  // ── Derive activePage from URL ──
  // /dashboard → "dashboard"
  // /dashboard/team → "team"
  // /dashboard/mod-spray → "mod-spray"
  const activePage = useMemo(() => {
    const path = location.pathname.replace(/\/$/, '') // strip trailing slash
    const segments = path.split('/')
    // /dashboard/team → segments = ['', 'dashboard', 'team']
    if (segments.length >= 3 && segments[1] === 'dashboard') {
      return segments.slice(2).join('/') || 'dashboard'
    }
    return 'dashboard'
  }, [location.pathname])

  // Keep a ref for selectSection to avoid stale closures
  const activePageRef = useRef(activePage)
  activePageRef.current = activePage

  // ── Derive activeSection from activePage ──
  const activeSection = useMemo(() => {
    return PAGE_TO_SECTION[activePage] || 'dashboard'
  }, [activePage])

  // ── Navigate to a page (used by sidebar items, quick actions, etc.) ──
  const navigate = useCallback((pageKey) => {
    if (pageKey === 'dashboard') {
      routerNavigate('/dashboard')
    } else {
      routerNavigate(`/dashboard/${pageKey}`)
    }
  }, [routerNavigate])

  // ── Select a section (used by Rail only) ──
  const selectSection = useCallback((sectionKey) => {
    const section = SECTIONS.find(s => s.key === sectionKey)
    if (!section) return

    // Single-page section: navigate directly
    if (isSinglePage(section)) {
      navigate(section.pages[0].key)
      return
    }

    // Multi-page section: if already in this section, stay put.
    // Otherwise navigate to the first page.
    const currentSection = PAGE_TO_SECTION[activePageRef.current]
    if (currentSection === sectionKey) return

    if (section.dynamic && ENABLED_MODULES.length > 0) {
      navigate(`mod-${ENABLED_MODULES[0].key}`)
    } else if (section.pages.length > 0) {
      navigate(section.pages[0].key)
    }
  }, [navigate])

  // ── Page title ──
  const pageTitle = useMemo(() => resolvePageTitle(activePage), [activePage])

  // ── Breadcrumb segments ──
  const breadcrumb = useMemo(() => {
    const slug = APP.name.toLowerCase().replace(/\s+/g, '-')
    const section = SECTIONS.find(s => s.key === activeSection)

    // Single-page section: 2 segments [slug, pageTitle]
    if (!section || isSinglePage(section)) {
      return [
        { label: slug, path: '/dashboard' },
        { label: pageTitle.toLowerCase(), path: null },
      ]
    }

    // Multi-page section: 3 segments [slug, sectionLabel, pageTitle]
    const sectionDefaultPage = section.dynamic && ENABLED_MODULES.length > 0
      ? `mod-${ENABLED_MODULES[0].key}`
      : section.pages[0]?.key
    const sectionPath = sectionDefaultPage === 'dashboard'
      ? '/dashboard'
      : `/dashboard/${sectionDefaultPage}`

    return [
      { label: slug, path: '/dashboard' },
      { label: section.label.toLowerCase(), path: sectionPath },
      { label: pageTitle.toLowerCase(), path: null },
    ]
  }, [activeSection, pageTitle])

  return { activePage, activeSection, navigate, selectSection, pageTitle, breadcrumb }
}
