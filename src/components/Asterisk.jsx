import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../reducedMotion'

const PETALS = [0, 60, 120, 180, 240, 300]

export default function Asterisk({ turns, className }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      if (turns && !prefersReducedMotion()) {
        gsap.to(ref.current, { rotation: '+=120', duration: 1.6, ease: 'elastic.out(1, 0.35)', transformOrigin: '50% 50%' })
      }
    },
    { dependencies: [turns] },
  )

  useGSAP((context, contextSafe) => {
    const tile = ref.current.parentElement
    const nudge = contextSafe(() => {
      if (!prefersReducedMotion()) gsap.to(ref.current, { rotation: '+=30', duration: 0.8, ease: 'back.out(3)', transformOrigin: '50% 50%' })
    })
    tile.addEventListener('mouseenter', nudge)
    return () => tile.removeEventListener('mouseenter', nudge)
  })

  return (
    <svg ref={ref} className={className} viewBox="-50 -50 100 100" aria-hidden="true">
      {PETALS.map((angle) => (
        <rect key={angle} x="-9" y="-48" width="18" height="44" rx="9" transform={`rotate(${angle})`} />
      ))}
    </svg>
  )
}
