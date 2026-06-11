import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SEO from '@/components/seo/SEO'

interface ThankYouState {
  firstName:     string
  email:         string
  serviceType:   string
  preferredDate: string
  frequency:     string
  bookingId:     string
}

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.1 },
  }),
}

const STEPS = [
  { titleKey: 'step1Title', descKey: 'step1Desc' },
  { titleKey: 'step2Title', descKey: 'step2Desc' },
  { titleKey: 'step3Title', descKey: 'step3Desc' },
] as const

export default function ThankYouPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const booking = location.state as ThankYouState | null

  return (
    <>
      <SEO
        title={t('thankYou.meta.title')}
        description={t('thankYou.meta.description')}
      />

      {/* Confirmation Banner */}
      <section className="bg-slate-brand py-16 px-4 md:py-24 md:px-6 text-center">
        <div className="max-w-content mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 rounded bg-white/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-display text-4xl md:text-5xl text-white mb-4"
          >
            {booking
              ? t('thankYou.heading', { name: booking.firstName })
              : t('thankYou.genericHeading')}
          </motion.h1>

          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-body text-base text-white/90 max-w-xl mx-auto"
          >
            {booking
              ? t('thankYou.subhead', { email: booking.email })
              : t('thankYou.genericSubhead')}
          </motion.p>
        </div>
      </section>

      {/* Booking Summary Card — only when router state is present */}
      {booking && (
        <section className="bg-cream py-10 px-4 md:py-14 md:px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded border border-sand shadow-sm p-6"
            >
              <h2 className="font-sub text-2xl text-charcoal mb-4">
                {t('thankYou.summaryHeading')}
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between items-center border-b border-sand pb-3">
                  <dt className="font-body text-base text-text-muted">{t('thankYou.referenceLabel')}</dt>
                  <dd className="font-body font-medium text-base text-charcoal">
                    #{booking.bookingId.slice(0, 8).toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between items-center border-b border-sand pb-3">
                  <dt className="font-body text-base text-text-muted">{t('thankYou.serviceLabel')}</dt>
                  <dd className="font-body font-medium text-base text-charcoal">
                    {t(`services.${booking.serviceType}.title`)}
                  </dd>
                </div>
                <div className="flex justify-between items-center border-b border-sand pb-3">
                  <dt className="font-body text-base text-text-muted">{t('thankYou.dateLabel')}</dt>
                  <dd className="font-body font-medium text-base text-charcoal">
                    {booking.preferredDate}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="font-body text-base text-text-muted">{t('thankYou.frequencyLabel')}</dt>
                  <dd className="font-body font-medium text-base text-charcoal">
                    {t(`quote.frequency.${booking.frequency}`)}
                  </dd>
                </div>
              </dl>
            </motion.div>
          </div>
        </section>
      )}

      {/* What Happens Next */}
      <section className={`py-12 px-4 md:py-20 md:px-6 ${booking ? 'bg-warm-white' : 'bg-cream'}`}>
        <div className="max-w-content mx-auto">
          <motion.h2
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-display text-4xl text-charcoal mb-10 text-center"
          >
            {t('thankYou.nextHeading')}
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                custom={i + 1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="bg-white rounded border border-sand shadow-sm p-6 text-center"
              >
                <div className="w-10 h-10 rounded bg-slate-pale flex items-center justify-center mx-auto mb-4">
                  <span className="font-body font-medium text-base text-slate-brand">{i + 1}</span>
                </div>
                <h3 className="font-sub text-xl text-charcoal mb-2">{t(`thankYou.${titleKey}`)}</h3>
                <p className="font-body text-base text-text-muted">{t(`thankYou.${descKey}`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Row */}
      <section className="bg-cream py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/services"
            className="bg-slate-brand text-white font-body font-medium rounded px-8 py-3 min-h-[48px] flex items-center justify-center hover:bg-slate-dark transition-colors duration-200"
          >
            {t('thankYou.ctaServices')}
          </Link>
          <Link
            to="/"
            className="border border-slate-brand text-slate-brand font-body font-medium rounded px-8 py-3 min-h-[48px] flex items-center justify-center hover:bg-slate-pale transition-colors duration-200"
          >
            {t('thankYou.ctaHome')}
          </Link>
        </div>
      </section>
    </>
  )
}
