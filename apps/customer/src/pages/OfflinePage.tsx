import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '@/components/seo/SEO'
import { fadeUp } from '@/lib/utils/animations'

export default function OfflinePage() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={t('offline.meta.title')}
        description={t('offline.meta.description')}
      />

      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 md:py-20 bg-warm-white">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-md w-full bg-white border border-sand rounded p-6 md:p-8 shadow-sm text-center"
        >
          {/* Disconnected Icon */}
          <div className="flex justify-center mb-6 text-slate-brand" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-16 h-16"
            >
              <path d="M1 1l22 22" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5" />
              <path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84" />
              <path d="M7.34 16.7a5.95 5.95 0 0 1 4.54-1.7" />
              <path d="M12 20h.01" />
            </svg>
          </div>

          <h1 className="font-display text-4xl text-charcoal mb-3 font-semibold">
            {t('offline.heading')}
          </h1>

          <p className="font-body text-base text-charcoal font-medium mb-4">
            {t('offline.subhead')}
          </p>

          <p className="font-body text-base text-text-muted mb-8 leading-relaxed">
            {t('offline.message')}
          </p>

          {/* Phone CTA block (P3 Margaret target: min-h-48, text-base/lg) */}
          <div className="mb-8 flex justify-center">
            <a
              href="tel:+16139353555"
              className="flex items-center justify-center gap-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded px-6 py-3 min-h-[48px] w-full text-base md:text-lg transition-colors duration-200 shadow-sm"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 shrink-0"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>
                {t('offline.callCta')}: {t('offline.phoneNumber')}
              </span>
            </a>
          </div>

          {/* Cached section navigation links */}
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="flex items-center justify-center border border-slate-brand text-slate-brand font-body font-medium rounded px-6 py-3 min-h-[48px] text-base hover:bg-slate-pale transition-colors duration-200"
            >
              {t('offline.homeLink')}
            </Link>
            <Link
              to="/account/bookings"
              className="flex items-center justify-center border border-slate-brand text-slate-brand font-body font-medium rounded px-6 py-3 min-h-[48px] text-base hover:bg-slate-pale transition-colors duration-200"
            >
              {t('offline.bookingsLink')}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  )
}
