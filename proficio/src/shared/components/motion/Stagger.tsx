import { motion, type HTMLMotionProps } from 'framer-motion'

export function StaggerContainer({ delay = 0, children, ...rest }: HTMLMotionProps<'div'> & { delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.07, delayChildren: delay },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8, filter: 'blur(2px)' },
        show: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { type: 'spring', stiffness: 320, damping: 26, mass: 0.8 },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}


