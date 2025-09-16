import { motion, type HTMLMotionProps } from 'framer-motion'

type SlideInRightProps = HTMLMotionProps<'div'> & {
  delay?: number
  duration?: number
  offset?: number
}

export function SlideInRight({ delay = 0, duration = 0.6, offset = 24, children, className, style, ...rest }: SlideInRightProps & { style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={{ willChange: 'transform, opacity', ...style }}
      initial={{ x: offset, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration, ease: 'easeOut', delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}


