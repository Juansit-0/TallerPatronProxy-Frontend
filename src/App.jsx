import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { API_URL, getLogs, getSummary, simulateLoad } from './api'
import { SERVICES } from './services'
import Asterisk from './components/Asterisk'
import FlowStrip from './components/FlowStrip'
import LogsTable from './components/LogsTable'
import ServiceCard from './components/ServiceCard'
import BackendStatus, { Spinner } from './components/BackendStatus'
import { CardSkeleton, ChartSkeleton } from './components/Skeleton'

const EMPTY_STATS = { totalCalls: 0, successRate: 0, errorRate: 0, avgDurationMs: 0, recent: [] }
const EMPTY_LOGS = { content: [], page: 0, totalPages: 1, totalElements: 0 }
const POLL_MS = 3000
const WAKE_AFTER_MS = 4000
const GIVE_UP_MS = 60000

gsap.registerPlugin(useGSAP, ScrollTrigger)

const LatencyChart = lazy(() => import('./components/LatencyChart'))

const letters = (text) =>
  text.split(' ').map((word, w) => (
    <span key={w} className="word">
      {word.split('').map((char, i) => (
        <span key={i} className="char">
          {char}
        </span>
      ))}
    </span>
  ))

export default function App() {
  const [summary, setSummary] = useState([])
  const [logs, setLogs] = useState(EMPTY_LOGS)
  const [filters, setFilters] = useState({ service: '', status: '', from: '', to: '' })
  const [page, setPage] = useState(0)
  const [packets, setPackets] = useState([])
  const [ticks, setTicks] = useState(0)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [phase, setPhase] = useState('connecting')
  const [elapsed, setElapsed] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const seen = useRef(null)
  const inFlight = useRef(false)
  const startedAt = useRef(Date.now())
  const root = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .from('.masthead-word .char', { yPercent: 105, duration: 1.2, stagger: 0.07 })
          .from('.masthead-sub', { x: -40, autoAlpha: 0, duration: 0.9 }, 0.35)
          .from('.masthead-figure', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'power4.inOut' }, 0.1)
          .from('.masthead-script', { autoAlpha: 0, y: 40, rotation: -24, duration: 1.2 }, 0.9)
          .from('.stamp', { autoAlpha: 0, scale: 2, rotation: -20, duration: 0.7, ease: 'back.out(2.5)' }, 1.1)
          .from('.marginalia li', { autoAlpha: 0, x: 20, duration: 0.6, stagger: 0.08 }, 1.2)
          .from('.flow-tile', { autoAlpha: 0, y: 32, duration: 1 }, 0.2)
          .from('.flow-node, .flow-proxy', { autoAlpha: 0, scale: 0.8, transformOrigin: '50% 50%', duration: 0.6, stagger: 0.08 }, 0.6)

        gsap.to('.masthead-figure', { y: -12, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 })

        gsap.utils.toArray('[data-reveal]').forEach((tile) => {
          gsap
            .timeline({ scrollTrigger: { trigger: tile, start: 'top 88%', once: true }, defaults: { ease: 'expo.out' } })
            .from(tile, { autoAlpha: 0, y: 36, duration: 0.9 })
            .from(tile.children, { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.07 }, 0.12)
        })

        gsap.from('.service-slot', {
          autoAlpha: 0,
          y: 48,
          duration: 1,
          stagger: 0.09,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.services', start: 'top 88%', once: true },
        })

        gsap.from('.closing-word .char', {
          yPercent: 105,
          duration: 1.1,
          stagger: 0.04,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.closing', start: 'top 92%', once: true },
        })
      })
    },
    { scope: root },
  )

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
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
      setLoaded(true)
      setPhase('ready')
    } catch {
      setPhase((current) => (current !== 'ready' && Date.now() - startedAt.current < GIVE_UP_MS ? 'waking' : 'down'))
    } finally {
      inFlight.current = false
    }
  }, [filters, page])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    ScrollTrigger.refresh()
  }, [loaded])

  useEffect(() => {
    if (phase === 'ready') return
    const timer = setInterval(() => {
      const ms = Date.now() - startedAt.current
      setElapsed(Math.round(ms / 1000))
      if (ms >= WAKE_AFTER_MS) setPhase((current) => (current === 'connecting' ? 'waking' : current))
    }, 1000)
    return () => clearInterval(timer)
  }, [phase])

  async function runLoad() {
    setSimulating(true)
    setLoadError(null)
    try {
      await simulateLoad()
      await refresh()
    } catch {
      setLoadError('The load simulation failed. Check that the backend is running and try again.')
    } finally {
      setSimulating(false)
    }
  }

  const statsFor = (id) => summary.find((s) => s.serviceId === id) ?? EMPTY_STATS
  const today = new Date()
  const dateParts = [today.getDate(), today.getMonth() + 1, today.getFullYear() % 100].map((n) => String(n).padStart(2, '0'))

  return (
    <MotionConfig reducedMotion="user">
      <div className="poster" ref={root}>
        <BackendStatus phase={phase} elapsed={elapsed} onRetry={refresh} />
        <header className="grid">
          <div className="tile masthead">
            <p className="stamp">Audited</p>
            <ul className="marginalia" aria-hidden="true">
              <li>Intercepts every call</li>
              <li>Times each response</li>
              <li>Keeps the error trace</li>
            </ul>
            <img className="masthead-figure" src="/img/mercury.webp" alt="Bronze statue of Mercury, messenger of the gods, by Giambologna" />
            <p className="masthead-script" aria-hidden="true">the messenger</p>
            <h1>
              <span className="sr-only">Proxy monitor</span>
              <span className="masthead-word" aria-hidden="true">
                {letters('Proxy')}
              </span>
              <span className="masthead-sub" aria-hidden="true">
                monitor
              </span>
            </h1>
          </div>
          <div className="tile flow-tile">
            <FlowStrip packets={packets} pulse={ticks} onDone={(id) => setPackets((current) => current.filter((p) => p.id !== id))} />
          </div>
        </header>

        <main>
          <section className="grid" aria-labelledby="services-title">
            <div className="tile intro" data-reveal>
              <h2 id="services-title">Every call passes the proxy</h2>
              <p>
                Inventory, Orders and Payments never answer directly. A LoggingProxy wraps each one, times the call, records the
                result and keeps the error trace when something breaks.
              </p>
              <button type="button" className="button" onClick={runLoad} disabled={simulating || !loaded}>
                {simulating && <Spinner />}
                {simulating ? 'Sending 50 calls' : 'Simulate load'}
              </button>
              <p className={`live ${loadError || phase === 'down' ? 'is-down' : ''} ${phase === 'ready' ? '' : 'is-waiting'}`} role="status">
                {loadError ??
                  (phase === 'ready' && updatedAt
                    ? `Live, polled every 3 seconds. Last update ${updatedAt.toLocaleTimeString()}`
                    : `Waiting for the backend at ${API_URL}`)}
              </p>
            </div>
            <div className="services">
              {SERVICES.map((s) => (
                <div key={s.id} className="service-slot">
                  {loaded ? <ServiceCard service={s} stats={statsFor(s.id)} /> : <CardSkeleton />}
                </div>
              ))}
            </div>
          </section>

          <section className="grid" aria-labelledby="chart-title">
            <div className="tile chart-tile" data-reveal>
              <h2 id="chart-title">Last 20 calls per service</h2>
              <p className="tile-note">Response time in milliseconds. Red squares are calls that failed inside the service.</p>
              <Suspense fallback={<ChartSkeleton />}>{loaded ? <LatencyChart summary={summary} /> : <ChartSkeleton />}</Suspense>
            </div>
            <div className="tile date-tile" data-reveal>
              <p className="date-stack" aria-label={`Today, ${today.toLocaleDateString()}`}>
                {dateParts.map((part, i) => (
                  <span key={i}>{part}</span>
                ))}
              </p>
              <Asterisk turns={ticks} className="asterisk" />
            </div>
          </section>

          <section className="grid" aria-labelledby="logs-title">
            <div className="tile logs-tile" data-reveal>
              <h2 id="logs-title">Audit log</h2>
              <p className="tile-note">Click a row to see the input params and the full response or error.</p>
              <LogsTable
                logs={logs}
                loaded={loaded}
                filters={filters}
                onFilters={(next) => {
                  setFilters(next)
                  setPage(0)
                }}
                onPage={setPage}
              />
            </div>
          </section>
        </main>

        <footer className="closing">
          <p className="closing-word">
            <span className="sr-only">Logging proxy</span>
            <span aria-hidden="true">{letters('Logging proxy')}</span>
          </p>
          <p className="closing-note">Taller Patron Proxy. Spring Boot backend, React frontend.</p>
          <p className="closing-note">
            Like Mercury, the proxy carries every message and answers for it. Image: "Mercury" by Giambologna, public domain (CC0),{' '}
            <a href="https://www.metmuseum.org/art/collection/search/205648">The Metropolitan Museum of Art</a>.
          </p>
        </footer>
      </div>
    </MotionConfig>
  )
}
