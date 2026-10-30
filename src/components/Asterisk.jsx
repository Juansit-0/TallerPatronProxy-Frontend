import { motion } from 'motion/react'

const PETALS = [0, 60, 120, 180, 240, 300]

export default function Asterisk({ turns, className }) {
  return (
    <motion.svg
      className={className}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      animate={{ rotate: turns * 60 }}
      transition={{ type: 'spring', stiffness: 60, damping: 14 }}
    >
      {PETALS.map((angle) => (
        <rect key={angle} x="-9" y="-48" width="18" height="44" rx="9" transform={`rotate(${angle})`} />
      ))}
    </motion.svg>
  )
}
