import s from './DataTable.module.css'

export default function DataTable({ headers, children, emptyMessage: _emptyMessage }) {
  return (
    <div className={s.wrap}>
      <table className={s.table}>
        {headers && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`${s.th} ${h.right ? s.thRight : ''}`}
                  style={h.width ? { width: h.width } : undefined}
                >
                  {h.label ?? h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/* Re-export cell class names for consumers */
DataTable.s = s
