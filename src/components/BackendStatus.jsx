import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const COPY = {
  connecting: 'Connecting to the backend',
  waking: 'The backend on Railway is waking up. This can take up to a minute.',
  down: "Can't reach the backend. Retrying every 3 seconds.",
  ready: 'Backend connected',
}

export function Spinner() {
  return (
    <svg className="spinner" viewBox="-50 -50 100 100" aria-hidden="true">
      {[0, 60, 120].map((angle) => (
        <rect key={angle} x="-11" y="-48" width="22" height="96" rx="11" transform={`rotate(${angle})`} />
      ))}
    </svg>
  )
}

export default function BackendStatus({ phase, elapsed, onRetry }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      const hidden = phase === 'ready'
      gsap.to(ref.current, {
        height: hidden ? 0 : 'auto',
        autoAlpha: hidden ? 0 : 1,
        duration: 0.7,
        delay: hidden ? 0.6 : 0,
        ease: 'expo.inOut',
      })
    },
    { dependencies: [phase] },
  )

  return (
    <div ref={ref} className={`backend-status is-${phase}`} role="status" aria-live="polite">
      <div className="backend-status-inner">
        {phase === 'down' ? <span className="status-mark" aria-hidden="true" /> : <Spinner />}
        <p>
          {COPY[phase]}
          {phase === 'waking' && <span className="backend-elapsed"> {elapsed} s</span>}
        </p>
        {phase === 'down' && (
          <button type="button" className="button-quiet" onClick={onRetry}>
            Retry now
          </button>
        )}
      </div>
    </div>
  )
}
