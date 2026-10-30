import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ERROR_THRESHOLD } from '../services'
import { prefersReducedMotion } from '../reducedMotion'

function useCountUp(value, decimals = 0) {
  const ref = useRef(null)
  const shown = useRef(0)

  useGSAP(
    () => {
      const state = { value: shown.current }
      gsap.to(state, {
        value,
        duration: prefersReducedMotion() ? 0 : 1.1,
        ease: 'power3.out',
        onUpdate: () => {
          shown.current = state.value
          ref.current.textContent = state.value.toFixed(decimals)
        },
      })
    },
    { dependencies: [value] },
  )

  return ref
}

export default function ServiceCard({ service, stats }) {
  const failing = stats.errorRate > ERROR_THRESHOLD
  const total = useCountUp(stats.totalCalls)
  const success = useCountUp(stats.successRate, 1)
  const average = useCountUp(stats.avgDurationMs, 1)

  return (
    <article className={`tile service ${failing ? 'is-failing' : ''}`}>
      <h3>{service.name}</h3>
      <p className="service-total" ref={total}>
        0
      </p>
      <p className="service-caption">calls through the proxy</p>
      <dl className="service-stats">
        <div>
          <dt>Success rate</dt>
          <dd>
            <span ref={success}>0</span>%
          </dd>
        </div>
        <div>
          <dt>Average time</dt>
          <dd>
            <span ref={average}>0</span> ms
          </dd>
        </div>
      </dl>
      {failing && (
        <p className="service-alert" role="alert">
          Error rate {stats.errorRate}% is above {ERROR_THRESHOLD}%
        </p>
      )}
    </article>
  )
}
