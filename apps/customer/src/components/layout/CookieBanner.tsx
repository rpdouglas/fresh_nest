import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { initializeAnalytics, revokeAnalytics } from '@/lib/firebase/analytics'
import { cn } from '@/lib/utils/utils'
import { AnimatePresence, motion } from 'framer-motion'

export default function CookieBanner() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('freshnest_consent') === null
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('freshnest_consent') === 'granted') {
      initializeAnalytics()
    }

    const handleOpenBanner = () => setIsVisible(true)
    window.addEventListener('open-cookie-banner', handleOpenBanner)
    return () => window.removeEventListener('open-cookie-banner', handleOpenBanner)
  }, [])

  const handleAccept = () => {
    localStorage.setItem('freshnest_consent', 'granted')
    initializeAnalytics()
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('freshnest_consent', 'denied')
    revokeAnalytics()
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-sand shadow-lg"
        >
          <div className="max-w-content mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-base text-charcoal text-center md:text-left flex-1">
              {t('cookieBanner.message')}
            </p>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleDecline}
                className={cn(
                  'flex-1 md:flex-none font-body text-base font-medium min-h-[48px] px-6 rounded border border-sand text-charcoal hover:bg-cream transition-colors focus:outline-none focus:ring-2 focus:ring-slate-pale'
                )}
              >
                {t('cookieBanner.decline')}
              </button>
              <button
                onClick={handleAccept}
                className={cn(
                  'flex-1 md:flex-none font-body text-base font-medium min-h-[48px] px-6 rounded bg-slate-brand text-white hover:bg-slate-dark transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                )}
              >
                {t('cookieBanner.accept')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
