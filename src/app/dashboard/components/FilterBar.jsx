// ═══════════════════════════════════════════
// FilterBar — Composable filter row
//
// Renders a search bar + dropdowns + optional
// date range in a consistent horizontal layout.
// ═══════════════════════════════════════════

import { Search } from 'lucide-react'
import s from './FilterBar.module.css'

/**
 * @param {{
 *   search?: { value: string, onChange: (v: string) => void, placeholder?: string },
 *   filters?: Array<{
 *     key: string,
 *     label: string,
 *     value: string,
 *     options: Array<{ value: string, label: string }>,
 *     onChange: (v: string) => void,
 *   }>,
 *   dateRange?: {
 *     start: string,
 *     end: string,
 *     onStartChange: (v: string) => void,
 *     onEndChange: (v: string) => void,
 *   },
 *   actions?: React.ReactNode,
 * }} props
 */
export default function FilterBar({ search, filters, dateRange, actions }) {
  return (
    <div className={s.bar}>
      <div className={s.left}>
        {search && (
          <div className={s.searchWrap}>
            <Search size={15} className={s.searchIcon} />
            <input
              type="text"
              className={s.searchInput}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder || 'Search...'}
            />
          </div>
        )}

        {filters?.map((filter) => (
          <select
            key={filter.key}
            className={s.select}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {dateRange && (
          <div className={s.dateRange}>
            <input
              type="date"
              className={s.dateInput}
              value={dateRange.start}
              onChange={(e) => dateRange.onStartChange(e.target.value)}
            />
            <span className={s.dateSep}>to</span>
            <input
              type="date"
              className={s.dateInput}
              value={dateRange.end}
              onChange={(e) => dateRange.onEndChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {actions && <div className={s.right}>{actions}</div>}
    </div>
  )
}
