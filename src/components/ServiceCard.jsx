import { motion } from 'motion/react'
import { ERROR_THRESHOLD } from '../services'

export default function ServiceCard({ service, stats }) {
  const failing = stats.errorRate > ERROR_THRESHOLD

  return (
    <article className={`tile service ${failing ? 'is-failing' : ''}`} aria-live="polite">
      <h3>{service.name}</h3>
      <motion.p
        key={stats.totalCalls}
        className="service-total"
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {stats.totalCalls}
      </motion.p>
      <p className="service-caption">calls through the proxy</p>
      <dl className="service-stats">
        <div>
          <dt>Success rate</dt>
          <dd>{stats.successRate}%</dd>
        </div>
        <div>
          <dt>Average time</dt>
          <dd>{stats.avgDurationMs} ms</dd>
        </div>
      </dl>
      {failing && <p className="service-alert">Error rate {stats.errorRate}% is above {ERROR_THRESHOLD}%</p>}
    </article>
  )
}
