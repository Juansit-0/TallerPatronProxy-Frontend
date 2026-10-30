import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SERVICES } from '../services'

const CLIENT = { x: 70, y: 140 }
const PROXY = { x: 330, y: 140 }
const TARGETS = { inventory: 50, orders: 140, payments: 230 }
const SERVICE_X = 590

export default function FlowStrip({ packets, onDone, pulse }) {
  const reduceMotion = useReducedMotion()

  return (
    <svg className="flow" viewBox="0 0 680 280" role="img" aria-label="Requests travel from the client through the LoggingProxy to each microservice and back">
      <g className="flow-node flow-route">
        <line x1={CLIENT.x + 50} y1={CLIENT.y} x2={PROXY.x - 80} y2={PROXY.y} />
        <rect x={CLIENT.x - 50} y={CLIENT.y - 34} width="100" height="68" />
        <text x={CLIENT.x} y={CLIENT.y + 8}>Client</text>
      </g>

      <g className="flow-proxy">
        <motion.rect
          key={pulse}
          x={PROXY.x - 86}
          y={PROXY.y - 56}
          width="172"
          height="112"
          className="flow-proxy-ring"
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.18 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: `${PROXY.x}px ${PROXY.y}px` }}
        />
        <rect x={PROXY.x - 80} y={PROXY.y - 50} width="160" height="100" />
        <text x={PROXY.x} y={PROXY.y - 4}>Logging</text>
        <text x={PROXY.x} y={PROXY.y + 30}>Proxy</text>
        <text className="flow-hint" x={PROXY.x} y={PROXY.y - 68}>
          Logs, times and audits every call
        </text>
      </g>

      {SERVICES.map((s) => (
        <g key={s.id} className="flow-node flow-route">
          <line x1={PROXY.x + 80} y1={PROXY.y} x2={SERVICE_X - 70} y2={TARGETS[s.id]} />
          <rect x={SERVICE_X - 70} y={TARGETS[s.id] - 30} width="140" height="60" />
          <text x={SERVICE_X} y={TARGETS[s.id] + 8}>{s.name}</text>
        </g>
      ))}

      <AnimatePresence>
        {!reduceMotion &&
          packets.map((p) => {
            const y = TARGETS[p.service]
            const back = p.status === 'ERROR' ? '#c8102e' : '#2e7d4f'
            return (
              <motion.circle
                key={p.id}
                r="9"
                initial={{ cx: CLIENT.x + 50, cy: CLIENT.y, fill: '#2a0b0c', opacity: 0 }}
                animate={{
                  cx: [CLIENT.x + 50, PROXY.x, SERVICE_X - 70, PROXY.x, CLIENT.x + 50],
                  cy: [CLIENT.y, PROXY.y, y, PROXY.y, CLIENT.y],
                  fill: ['#2a0b0c', '#2a0b0c', back, back, back],
                  opacity: [0, 1, 1, 1, 0],
                }}
                transition={{ duration: 2.4, delay: p.delay, times: [0, 0.3, 0.52, 0.78, 1], ease: 'easeInOut' }}
                onAnimationComplete={() => onDone(p.id)}
              />
            )
          })}
      </AnimatePresence>
    </svg>
  )
}
