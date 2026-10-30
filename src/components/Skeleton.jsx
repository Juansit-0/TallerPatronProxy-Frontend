const BARS = [42, 58, 35, 66, 48, 72, 40, 55, 62, 38, 70, 45, 52, 64, 36, 58, 47, 68, 41, 60]

export function CardSkeleton() {
  return (
    <div className="tile service skeleton" aria-hidden="true">
      <span className="sk sk-title" />
      <span className="sk sk-number" />
      <span className="sk sk-line" />
      <span className="sk sk-row" />
      <span className="sk sk-row" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="chart-skeleton skeleton" aria-hidden="true">
      {BARS.map((height, i) => (
        <span key={i} className="sk" style={{ height: `${height}%`, animationDelay: `${i * 40}ms` }} />
      ))}
    </div>
  )
}

export function RowsSkeleton({ rows = 6, columns = 7 }) {
  return Array.from({ length: rows }, (_, row) => (
    <tr key={row} className="skeleton" aria-hidden="true">
      {Array.from({ length: columns }, (_, col) => (
        <td key={col}>
          <span className="sk sk-cell" style={{ animationDelay: `${row * 60}ms` }} />
        </td>
      ))}
    </tr>
  ))
}
