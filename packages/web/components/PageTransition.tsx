import { motion, MotionConfig } from 'framer-motion'
import { ease } from '@/web/utils/const'
import useIsMobile from '@/web/hooks/useIsMobile'
import scrollPositions from '@/web/states/scrollPositions'
import { useLayoutEffect } from 'react'

const PageTransition = ({
  children,
  disableEnterAnimation,
}: {
  children: React.ReactNode
  disableEnterAnimation?: boolean
}) => {
  const isMobile = useIsMobile()

  // To restore scroll position
  useLayoutEffect(() => {
    const main = document.querySelector('main')
    if (main) {
      main.scrollTop = scrollPositions.get(window.location.pathname) ?? 0
    }
  }, [])

  if (isMobile) {
    return <>{children}</>
  }

  return (
    <MotionConfig transition={{ ease }}>
      <motion.div
        initial={{ opacity: disableEnterAnimation ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}

export default PageTransition
