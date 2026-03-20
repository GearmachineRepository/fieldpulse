// ═══════════════════════════════════════════
// PageShell — Standard page wrapper
//
// Every page uses this instead of manually
// composing PageHeader + loading/empty states.
// ═══════════════════════════════════════════

import { PageHeader, EmptyMessage } from "./PageUI.jsx"
import SkeletonRow from "./SkeletonRow.jsx"
import SkeletonCard from "./SkeletonCard.jsx"
import s from "./PageShell.module.css"

/**
 * @param {{
 *   title: string,
 *   count?: number,
 *   countLabel?: string,
 *   actions?: React.ReactNode,
 *   loading?: boolean,
 *   skeleton?: 'table' | 'cards',
 *   skeletonCount?: number,
 *   empty?: boolean,
 *   emptyIcon?: React.ComponentType,
 *   emptyTitle?: string,
 *   emptyDescription?: string,
 *   emptyCta?: string,
 *   onEmptyCta?: () => void,
 *   children: React.ReactNode,
 * }} props
 */
export default function PageShell({
  title,
  count,
  countLabel,
  actions,
  loading = false,
  skeleton = "table",
  skeletonCount = 5,
  empty = false,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  emptyCta,
  onEmptyCta,
  children,
}) {
  return (
    <div className={s.shell}>
      <div className={s.header}>
        <PageHeader title={title} count={count} countLabel={countLabel} />
        {actions && <div className={s.actions}>{actions}</div>}
      </div>

      {loading ? (
        <div className={s.skeletonWrap}>
          {skeleton === "table" ? (
            <SkeletonRow columns={4} count={skeletonCount} />
          ) : (
            <SkeletonCard count={skeletonCount} />
          )}
        </div>
      ) : empty ? (
        <div className={s.emptyWrap}>
          {EmptyIcon && (
            <div className={s.emptyIcon}>
              <EmptyIcon size={48} strokeWidth={1} />
            </div>
          )}
          {emptyTitle && <div className={s.emptyTitle}>{emptyTitle}</div>}
          {emptyDescription && <div className={s.emptyDesc}>{emptyDescription}</div>}
          {emptyCta && onEmptyCta && (
            <button className={s.emptyCta} onClick={onEmptyCta} type="button">
              {emptyCta}
            </button>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
