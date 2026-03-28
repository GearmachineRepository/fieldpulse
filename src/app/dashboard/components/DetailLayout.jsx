// ═══════════════════════════════════════════
// DetailLayout — Split-pane list → detail
//
// 280px left panel (list) + remaining right
// panel (detail with tabs). Stacks vertically
// below 860px viewport width.
// ═══════════════════════════════════════════

import { ArrowLeft } from 'lucide-react'
import TabBar from './TabBar.jsx'
import s from './DetailLayout.module.css'

/**
 * @param {{
 *   sidebar: React.ReactNode,
 *   tabs?: Array<{ key: string, label: string }>,
 *   activeTab?: string,
 *   onTabChange?: (key: string) => void,
 *   hasSelection?: boolean,
 *   onBack?: () => void,
 *   emptyMessage?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function DetailLayout({
  sidebar,
  tabs,
  activeTab,
  onTabChange,
  hasSelection = true,
  onBack,
  emptyMessage = 'Select an item to view details.',
  children,
}) {
  return (
    <div className={s.layout}>
      {/* Left panel — list */}
      <div className={`${s.sidebar} ${hasSelection ? s.sidebarHideMobile : ''}`}>{sidebar}</div>

      {/* Right panel — detail */}
      <div className={`${s.detail} ${!hasSelection ? s.detailHideMobile : ''}`}>
        {hasSelection ? (
          <>
            {onBack && (
              <button className={s.backBtn} onClick={onBack} type="button">
                <ArrowLeft size={16} />
                <span>Back to list</span>
              </button>
            )}
            {tabs && activeTab && onTabChange && (
              <div className={s.tabWrap}>
                <TabBar tabs={tabs} active={activeTab} onChange={onTabChange} />
              </div>
            )}
            <div className={s.content}>{children}</div>
          </>
        ) : (
          <div className={s.empty}>
            <div className={s.emptyText}>{emptyMessage}</div>
          </div>
        )}
      </div>
    </div>
  )
}
