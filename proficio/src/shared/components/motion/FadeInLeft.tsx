import { motion, type HTMLMotionProps } from 'framer-motion'

type FadeInLeftProps = HTMLMotionProps<'div'> & {
  delay?: number
  duration?: number
}

export function FadeInLeft({ delay = 0, duration = 0.6, children, className, style, ...rest }: FadeInLeftProps & { style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={{ 
        WebkitFontSmoothing: 'antialiased',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        ...style 
      }}
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration, ease: 'easeOut', delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}


