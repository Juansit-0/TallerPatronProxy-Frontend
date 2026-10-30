import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { API_URL, getLogs, getSummary, simulateLoad } from './api'
import { SERVICES } from './services'
import Asterisk from './components/Asterisk'
import FlowStrip from './components/FlowStrip'
import LatencyChart from './components/LatencyChart'
import LogsTable from './components/LogsTable'
import ServiceCard from './components/ServiceCard'

const EMPTY_STATS = { totalCalls: 0, successRate: 0, errorRate: 0, avgDurationMs: 0, recent: [] }
const EMPTY_LOGS = { content: [], page: 0, totalPages: 1, totalElements: 0 }
const POLL_MS = 3000

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
})

export default function App() {
  const [summary, setSummary] = useState([])
  const [logs, setLogs] = useState(EMPTY_LOGS)
  const [filters, setFilters] = useState({ service: '', status: '', from: '', to: '' })
  const [page, setPage] = useState(0)
  const [packets, setPackets] = useState([])
  const [ticks, setTicks] = useState(0)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [failure, setFailure] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const seen = useRef(null)

  const refresh = useCallback(async () => {
    try {
      const [nextSummary, nextLogs] = await Promise.all([getSummary(), getLogs(filters, page)])
      const recent = nextSummary.flatMap((s) => s.recent.map((r) => ({ ...r, service: s.serviceId })))
      if (seen.current) {
        const fresh = recent.filter((r) => !seen.current.has(r.requestId)).slice(-14)
        if (fresh.length) {
          setPackets((current) => [...current, ...fresh.map((r, i) => ({ id: r.requestId, service: r.service, status: r.status, delay: i * 0.14 }))])
          setTicks((t) => t + 1)
        }
      }
      seen.current = new Set([...(seen.current ?? []), ...recent.map((r) => r.requestId)])
      setSummary(nextSummary)
      setLogs(nextLogs)
      setUpdatedAt(new Date())
      setFailure(null)
    } catch {
      setFailure(`Can't reach the backend at ${API_URL}. Retrying every 3 seconds.`)
    }
  }, [filters, page])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  async function runLoad() {
    setSimulating(true)
    try {
      await simulateLoad()
      await refresh()
    } catch {
      setFailure('The load simulation failed. Check that the backend is running.')
    } finally {
      setSimulating(false)
    }
  }

  const statsFor = (id) => summary.find((s) => s.serviceId === id) ?? EMPTY_STATS
  const today = new Date()
  const dateParts = [today.getDate(), today.getMonth() + 1, today.getFullYear() % 100].map((n) => String(n).padStart(2, '0'))

  return (
    <div className="poster">
      <header className="grid">
        <motion.div className="tile masthead" {...rise(0)}>
          <h1>
            <span className="masthead-word">Proxy</span>
            <span className="masthead-sub">monitor</span>
          </h1>
        </motion.div>
        <motion.div className="tile flow-tile" {...rise(0.08)}>
          <FlowStrip packets={packets} pulse={ticks} onDone={(id) => setPackets((current) => current.filter((p) => p.id !== id))} />
        </motion.div>
      </header>

      <main>
        <section className="grid" aria-labelledby="services-title">
          <motion.div className="tile intro" {...rise(0.16)}>
            <h2 id="services-title">Every call passes the proxy</h2>
            <p>
              Inventory, Orders and Payments never answer directly. A LoggingProxy wraps each one, times the call, records the
              result and keeps the error trace when something breaks.
            </p>
            <button type="button" className="button" onClick={runLoad} disabled={simulating}>
              {simulating ? 'Sending 50 calls' : 'Simulate load'}
            </button>
            <p className={`live ${failure ? 'is-down' : ''}`} role="status">
              {failure ?? (updatedAt ? `Live, polled every 3 seconds. Last update ${updatedAt.toLocaleTimeString()}` : 'Connecting to the backend')}
            </p>
          </motion.div>
          <div className="services">
            {SERVICES.map((s, i) => (
              <motion.div key={s.id} className="service-slot" {...rise(0.22 + i * 0.07)}>
                <ServiceCard service={s} stats={statsFor(s.id)} />
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid" aria-labelledby="chart-title">
          <motion.div className="tile chart-tile" {...rise(0.1)}>
            <h2 id="chart-title">Last 20 calls per service</h2>
            <p className="tile-note">Response time in milliseconds. Red squares are calls that failed inside the service.</p>
            <LatencyChart summary={summary} />
          </motion.div>
          <motion.div className="tile date-tile" {...rise(0.18)}>
            <p className="date-stack" aria-label={`Today, ${today.toLocaleDateString()}`}>
              {dateParts.map((part, i) => (
                <span key={i}>{part}</span>
              ))}
            </p>
            <Asterisk turns={ticks} className="asterisk" />
          </motion.div>
        </section>

        <section className="grid" aria-labelledby="logs-title">
          <motion.div className="tile logs-tile" {...rise(0.1)}>
            <h2 id="logs-title">Audit log</h2>
            <p className="tile-note">Click a row to see the input params and the full response or error.</p>
            <LogsTable
              logs={logs}
              filters={filters}
              onFilters={(next) => {
                setFilters(next)
                setPage(0)
              }}
              onPage={setPage}
            />
          </motion.div>
        </section>
      </main>

      <footer className="closing">
        <p className="closing-word">Logging proxy</p>
        <p className="closing-note">Taller Patron Proxy. Spring Boot backend, React frontend.</p>
      </footer>
    </div>
  )
}
