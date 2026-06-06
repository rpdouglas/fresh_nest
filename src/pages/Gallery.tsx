import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { GALLERY_PAIRS } from '@/lib/galleryData'
import GalleryImage from '@/components/ui/GalleryImage'
import Lightbox from '@/components/ui/Lightbox'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

export default function Gallery() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>, idx: number) => {
    triggerRef.current = e.currentTarget
    setActiveIndex(idx)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => { triggerRef.current?.focus() }, 200)
  }

  const handlePrev = () => setActiveIndex(i => Math.max(0, i - 1))
  const handleNext = () => setActiveIndex(i => Math.min(GALLERY_PAIRS.length - 1, i + 1))

  return (
    <main className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-content mx-auto">
        {/* Page heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-12"
        >
          <h1 className="font-display text-5xl text-charcoal mb-4">
            {t('gallery.pageHeading')}
          </h1>
          <p className="font-body text-base text-text-muted max-w-xl">
            {t('gallery.pageSubhead')}
          </p>
        </motion.div>

        {/* Gallery grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {GALLERY_PAIRS.map((pair, idx) => {
            const serviceTitle = t(`services.${pair.serviceKey}.title`)
            const beforeAlt = t('gallery.beforeAlt', { service: serviceTitle })
            const afterAlt = t('gallery.afterAlt', { service: serviceTitle })

            return (
              <motion.div key={pair.id} variants={fadeUp}>
                <button
                  onClick={e => handleOpen(e, idx)}
                  aria-label={t(pair.captionKey)}
                  className={cn(
                    'group block w-full text-left rounded',
                    'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                  )}
                >
                  <div className="grid grid-cols-2 aspect-[4/3] rounded overflow-hidden">
                    <div className="relative">
                      <span className="absolute top-1.5 left-1.5 z-10 bg-charcoal/70 text-white font-body text-xs px-1.5 py-0.5 rounded">
                        {t('gallery.beforeLabel')}
                      </span>
                      <GalleryImage
                        src={pair.beforeSrc}
                        alt={beforeAlt}
                        className="absolute inset-0"
                      />
                    </div>
                    <div className="relative border-l border-white/20">
                      <span className="absolute top-1.5 left-1.5 z-10 bg-charcoal/70 text-white font-body text-xs px-1.5 py-0.5 rounded">
                        {t('gallery.afterLabel')}
                      </span>
                      <GalleryImage
                        src={pair.afterSrc}
                        alt={afterAlt}
                        className="absolute inset-0"
                      />
                    </div>
                  </div>
                  <p className="font-body text-sm text-text-muted mt-3 group-hover:text-charcoal transition-colors">
                    {t(pair.captionKey)}
                  </p>
                </button>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Booking CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mt-16 text-center"
        >
          <h2 className="font-sub text-2xl text-charcoal mb-6">
            {t('gallery.ctaHeading')}
          </h2>
          <Link
            to="/booking"
            className={cn(
              'inline-flex items-center font-body font-medium text-base rounded',
              'min-h-[48px] px-6 py-3 bg-slate-brand text-white',
              'hover:bg-slate-dark transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            )}
          >
            {t('common.bookNow')} →
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {open && (
          <Lightbox
            key="lightbox"
            pairs={GALLERY_PAIRS}
            index={activeIndex}
            onClose={handleClose}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
