import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { FEATURED_PAIRS } from '@/lib/galleryData'
import GalleryImage from '@/components/ui/GalleryImage'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

export default function GalleryPreview() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('gallery.ariaLabel')}
      className="bg-cream py-12 px-4 md:py-20 md:px-6"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-10"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">
            {t('gallery.previewHeading')}
          </h2>
          <p className="font-body text-base text-text-muted">
            {t('gallery.previewSubhead')}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {FEATURED_PAIRS.map(pair => {
            const serviceTitle = t(`services.${pair.serviceKey}.title`)
            const beforeAlt = t('gallery.beforeAlt', { service: serviceTitle })
            const afterAlt = t('gallery.afterAlt', { service: serviceTitle })

            return (
              <motion.div key={pair.id} variants={fadeUp}>
                <Link
                  to="/gallery"
                  aria-label={t(pair.captionKey)}
                  className={cn(
                    'group block rounded',
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
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mt-10"
        >
          <Link
            to="/gallery"
            className={cn(
              'inline-flex items-center font-body font-medium text-base rounded',
              'min-h-[48px] px-6 py-3 bg-slate-brand text-white',
              'hover:bg-slate-dark transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            )}
          >
            {t('gallery.viewAll')} →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
