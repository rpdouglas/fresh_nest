import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const viewsKey = 'freshnest_install_page_views'
  const dismissedKey = 'freshnest_install_prompt_dismissed'

  useEffect(() => {
    // 1. Increment and track page views
    const views = parseInt(localStorage.getItem(viewsKey) || '0', 10)
    const newViews = views + 1
    localStorage.setItem(viewsKey, newViews.toString())

    // 2. Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)

      const isDismissed = localStorage.getItem(dismissedKey) === 'true'

      // Check if it's the second page view (or greater) and not dismissed
      if (newViews >= 2 && !isDismissed) {
        const timer = setTimeout(() => {
          setIsVisible(true)
        }, 5000) // 5 second delay

        return () => clearTimeout(timer)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 3. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = () => {
    if (!deferredPrompt) return

    void (async () => {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('User accepted the PWA install prompt')
      } else {
        console.log('User dismissed the PWA install prompt')
      }
      setDeferredPrompt(null)
      setIsVisible(false)
    })()
  }

  const handleDismiss = () => {
    localStorage.setItem(dismissedKey, 'true')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && deferredPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-45 p-5 bg-white border border-sand rounded shadow-lg"
          role="dialog"
          aria-labelledby="install-prompt-title"
          aria-describedby="install-prompt-body"
        >
          <div className="flex flex-col gap-4">
            <div>
              <h3 id="install-prompt-title" className="font-sub text-xl text-charcoal mb-1">
                {t('installPrompt.title')}
              </h3>
              <p id="install-prompt-body" className="font-body text-base text-text-muted leading-relaxed">
                {t('installPrompt.body')}
              </p>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleDismiss}
                className={cn(
                  'font-body text-base font-medium min-h-[48px] px-5 rounded border border-sand text-charcoal hover:bg-cream transition-colors focus:outline-none focus:ring-2 focus:ring-slate-pale'
                )}
              >
                {t('installPrompt.dismissBtn')}
              </button>
              <button
                onClick={handleInstall}
                className={cn(
                  'font-body text-base font-medium min-h-[48px] px-5 rounded bg-slate-brand text-white hover:bg-slate-dark transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                )}
              >
                {t('installPrompt.installBtn')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
