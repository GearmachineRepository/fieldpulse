// ═══════════════════════════════════════════
// DataTable — UI Kit Primitive
// Sortable, paginated data table
// ═══════════════════════════════════════════

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import s from "./DataTable.module.css"

/**
 * @param {{ key: string, label: string, sortable?: boolean, render?: (value, row) => React.ReactNode }[]} columns
 * @param {Object[]} data — Array of row objects
 * @param {(row) => void} [onRowClick] — Click handler per row
 * @param {number} [pageSize=0] — Rows per page (0 = no pagination)
 * @param {string} [emptyText='No data'] — Shown when data is empty
 * @param {string} [className] — Extra class on wrapper
 */
export default function DataTable({
  columns,
  data,
  onRowClick,
  pageSize = 0,
  emptyText = "No data",
  className = "",
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState("asc")
  const [page, setPage] = useState(0)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(0)
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const paginated = pageSize > 0 ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted
  const totalPages = pageSize > 0 ? Math.ceil(sorted.length / pageSize) : 1

  return (
    <div className={`${s.wrapper} ${className}`}>
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`${s.th} ${col.sortable !== false ? s.thSortable : ""}`}
                onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
              >
                <span className={s.thContent}>
                  {col.label}
                  {col.sortable !== false && (
                    sortKey === col.key
                      ? (sortDir === "asc"
                          ? <ChevronUp size={14} className={s.sortIconActive} />
                          : <ChevronDown size={14} className={s.sortIconActive} />)
                      : <ChevronDown size={14} className={s.sortIcon} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={s.empty}>{emptyText}</td>
            </tr>
          ) : (
            paginated.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={`${s.tr} ${onRowClick ? s.trClickable : ""}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <td key={col.key} className={s.td}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pageSize > 0 && totalPages > 1 && (
        <div className={s.pagination}>
          <span className={s.pageInfo}>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className={s.pageButtons}>
            <button className={s.pageBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Prev
            </button>
            <button className={s.pageBtn} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
