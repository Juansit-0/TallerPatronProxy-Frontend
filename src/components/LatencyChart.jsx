import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SERVICES } from '../services'

function toRows(summary) {
  return Array.from({ length: 20 }, (_, i) => {
    const row = { call: i + 1 }
    for (const s of summary) {
      const recent = s.recent ?? []
      const entry = recent[i - (20 - recent.length)]
      if (entry) {
        row[s.serviceId] = entry.durationMs
        row[`${s.serviceId}Status`] = entry.status
      }
    }
    return row
  })
}

function StatusDot({ cx, cy, payload, dataKey, stroke }) {
  if (cx == null || cy == null || payload[dataKey] == null) return null
  if (payload[`${dataKey}Status`] === 'ERROR') {
    return <rect x={cx - 6} y={cy - 6} width="12" height="12" fill="#c8102e" />
  }
  return <circle cx={cx} cy={cy} r="3.5" fill={stroke} />
}

export default function LatencyChart({ summary }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={toRows(summary)} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#d8d1c9" vertical={false} />
          <XAxis dataKey="call" tick={{ fill: '#5a2a2b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis unit=" ms" tick={{ fill: '#5a2a2b', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
          <Tooltip
            contentStyle={{ background: '#2a0b0c', border: 'none', borderRadius: 0, color: '#ece8e2' }}
            labelFormatter={(call) => `Call ${call}`}
            formatter={(value, name) => [`${value} ms`, name]}
          />
          <Legend iconType="square" wrapperStyle={{ fontSize: 14, paddingTop: 8 }} />
          {SERVICES.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              dot={<StatusDot />}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
