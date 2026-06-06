import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { GalleryPair } from '@/lib/galleryData'
import GalleryImage from '@/components/ui/GalleryImage'

interface LightboxProps {
  pairs: GalleryPair[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function Lightbox({ pairs, index, onClose, onPrev, onNext }: LightboxProps) {
  const { t } = useTranslation()
  const pair = pairs[index]
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  const serviceTitle = t(`services.${pair.serviceKey}.title`)
  const beforeAlt = t('gallery.beforeAlt', { service: serviceTitle })
  const afterAlt = t('gallery.afterAlt', { service: serviceTitle })

  return createPortal(
    <motion.div
      key="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        aria-label={t(pair.captionKey)}
        className="relative w-full max-w-4xl bg-white rounded overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label={t('gallery.closeLabel')}
          className={cn(
            'absolute top-3 right-3 z-10',
            'min-h-[48px] min-w-[48px] flex items-center justify-center',
            'bg-charcoal/60 text-white rounded hover:bg-charcoal transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1',
          )}
        >
          ✕
        </button>

        {/* Before / After */}
        <div className="grid grid-cols-2 aspect-video">
          <div className="relative">
            <span className="absolute top-2 left-2 z-10 bg-charcoal/70 text-white font-body text-xs px-2 py-1 rounded">
              {t('gallery.beforeLabel')}
            </span>
            <GalleryImage
              src={pair.beforeSrc}
              alt={beforeAlt}
              className="absolute inset-0"
            />
          </div>
          <div className="relative border-l border-white/20">
            <span className="absolute top-2 left-2 z-10 bg-charcoal/70 text-white font-body text-xs px-2 py-1 rounded">
              {t('gallery.afterLabel')}
            </span>
            <GalleryImage
              src={pair.afterSrc}
              alt={afterAlt}
              className="absolute inset-0"
            />
          </div>
        </div>

        {/* Caption + navigation */}
        <div className="flex items-center justify-between px-4 py-3 bg-warm-white border-t border-sand">
          <button
            onClick={onPrev}
            disabled={index === 0}
            aria-label={t('gallery.prevLabel')}
            className={cn(
              'min-h-[48px] min-w-[48px] flex items-center justify-center rounded',
              'font-body text-base text-charcoal hover:bg-sand transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
          >
            ←
          </button>

          <p className="font-body text-sm text-text-muted text-center px-4">
            {t(pair.captionKey)}
          </p>

          <button
            onClick={onNext}
            disabled={index === pairs.length - 1}
            aria-label={t('gallery.nextLabel')}
            className={cn(
              'min-h-[48px] min-w-[48px] flex items-center justify-center rounded',
              'font-body text-base text-charcoal hover:bg-sand transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
          >
            →
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
