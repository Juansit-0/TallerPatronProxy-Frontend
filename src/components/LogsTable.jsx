import { Fragment, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SERVICES } from '../services'
import { RowsSkeleton } from './Skeleton'

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const json = (value) => JSON.stringify(value, null, 2)

export default function LogsTable({ logs, loaded, filters, onFilters, onPage }) {
  const [open, setOpen] = useState(null)
  const set = (key) => (e) => onFilters({ ...filters, [key]: e.target.value })
  const toggle = (id) => setOpen(open === id ? null : id)

  return (
    <>
      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Service
          <select value={filters.service} onChange={set('service')}>
            <option value="">All services</option>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={filters.status} onChange={set('status')}>
            <option value="">Any status</option>
            <option value="SUCCESS">Success</option>
            <option value="ERROR">Error</option>
          </select>
        </label>
        <label>
          From
          <input type="datetime-local" step="1" value={filters.from} onChange={set('from')} />
        </label>
        <label>
          To
          <input type="datetime-local" step="1" value={filters.to} onChange={set('to')} />
        </label>
        <button type="button" className="button-quiet" onClick={() => onFilters({ service: '', status: '', from: '', to: '' })}>
          Clear filters
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Request ID</th>
              <th scope="col">Service</th>
              <th scope="col">Operation</th>
              <th scope="col" className="num">Duration</th>
              <th scope="col">Status</th>
              <th scope="col">Time</th>
            </tr>
          </thead>
          <tbody>
            {!loaded && <RowsSkeleton columns={6} />}
            {loaded && logs.content.length === 0 && (
              <tr>
                <td colSpan="6" className="empty">No calls match. Press Simulate load to send 50 requests through the proxy.</td>
              </tr>
            )}
            <AnimatePresence initial={false}>
              {logs.content.map((log) => (
                <Fragment key={log.requestId}>
                  <motion.tr
                    className={`log-row ${open === log.requestId ? 'is-open' : ''}`}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    tabIndex={0}
                    aria-expanded={open === log.requestId}
                    onClick={() => toggle(log.requestId)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(log.requestId))}
                  >
                    <td title={log.requestId}>{log.requestId.slice(0, 8)}</td>
                    <td>{log.serviceId}</td>
                    <td>{log.operation}</td>
                    <td className="num">{log.durationMs} ms</td>
                    <td>
                      <span className={`status status-${log.status.toLowerCase()}`}>{log.status}</span>
                    </td>
                    <td>{time(log.timestamp)}</td>
                  </motion.tr>
                  {open === log.requestId && (
                    <tr className="log-detail">
                      <td colSpan="6">
                        <motion.div
                          className="detail-grid"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <section>
                            <h4>Request ID</h4>
                            <p>{log.requestId}</p>
                            <h4>Input params</h4>
                            <pre>{json(log.params)}</pre>
                          </section>
                          <section>
                            <h4>{log.status === 'ERROR' ? 'Error' : 'Full response'}</h4>
                            <pre>{log.status === 'ERROR' ? [log.error, ...log.stackTrace.map((l) => `  at ${l}`)].join('\n') : json(log.response)}</pre>
                          </section>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <nav className="pager" aria-label="Log pages">
        <button type="button" className="button-quiet" disabled={logs.page === 0} onClick={() => onPage(logs.page - 1)}>
          Previous
        </button>
        <span>
          Page {logs.page + 1} of {logs.totalPages}, {logs.totalElements} logs
        </span>
        <button type="button" className="button-quiet" disabled={logs.page + 1 >= logs.totalPages} onClick={() => onPage(logs.page + 1)}>
          Next
        </button>
      </nav>
    </>
  )
}
