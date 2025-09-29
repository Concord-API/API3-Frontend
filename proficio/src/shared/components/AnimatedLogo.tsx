import { motion, useAnimationControls } from 'framer-motion'
import { useEffect } from 'react'

type AnimatedLogoProps = {
  src: string
  className?: string
}

export function AnimatedLogo({ src, className }: AnimatedLogoProps) {
  const controls = useAnimationControls()

  useEffect(() => {
    controls.start({
      x: 0,
      opacity: 1,
      rotate: [0, 360],
      transition: { duration: 0.6, ease: 'easeOut' },
    })
  }, [controls])

  return (
    <motion.img
      src={src}
      alt="Proficio"
      className={className}
      initial={{ x: -40, opacity: 0, rotate: 0 }}
      animate={controls}
    />
  )
}


