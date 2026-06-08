import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import QuoteCalculator from '@/components/home/QuoteCalculator'
import { calculateQuote, type QuoteServiceType } from '@/lib/quotePricing'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
}

const SERVICE_CARDS: Array<{
  key: string
  titleKey: string
  descKey: string
  type: QuoteServiceType | null
}> = [
  { key: 'standard',         titleKey: 'services.standard.title',         descKey: 'services.standard.description',         type: 'standard'         },
  { key: 'deep',             titleKey: 'services.deep.title',             descKey: 'services.deep.description',             type: 'deep'             },
  { key: 'moveout',          titleKey: 'services.moveout.title',          descKey: 'services.moveout.description',          type: 'moveout'          },
  { key: 'postconstruction', titleKey: 'services.postconstruction.title', descKey: 'services.postconstruction.description', type: 'postconstruction' },
  { key: 'airbnb',           titleKey: 'services.airbnb.title',           descKey: 'services.airbnb.description',           type: 'airbnb'           },
  { key: 'commercial',       titleKey: 'services.commercial.title',       descKey: 'services.commercial.description',       type: null               },
]

const FREQUENCY_ITEMS: Array<{
  key: string
  labelKey: string
  saveKey: string
  taglineKey: string
  popular?: boolean
}> = [
  { key: 'weekly',   labelKey: 'quote.frequency.weekly',   saveKey: 'booking.fields.frequency.discounts.weekly',   taglineKey: 'recurring.tagline.weekly'                },
  { key: 'biweekly', labelKey: 'quote.frequency.biweekly', saveKey: 'booking.fields.frequency.discounts.biweekly', taglineKey: 'recurring.tagline.biweekly', popular: true },
  { key: 'monthly',  labelKey: 'quote.frequency.monthly',  saveKey: 'booking.fields.frequency.discounts.monthly',  taglineKey: 'recurring.tagline.monthly'                },
]

export default function PricingPage() {
  const { t } = useTranslation()

  return (
    <main id="main-content">
      {/* Hero */}
      <section className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="font-display text-5xl text-charcoal mb-4">
              {t('pricing.hero.title')}
            </h1>
            <p className="font-body text-base text-text-muted max-w-xl">
              {t('pricing.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Service pricing cards */}
      <section
        aria-labelledby="pricing-services-heading"
        className="bg-cream py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <h2
            id="pricing-services-heading"
            className="font-display text-4xl text-charcoal mb-2"
          >
            {t('pricing.services.heading')}
          </h2>
          <p className="font-body text-base text-text-muted mb-8">
            {t('pricing.services.reference')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_CARDS.map(({ key, titleKey, descKey, type }, i) => {
              const quote = type ? calculateQuote('1-2bed', type, 'one-time') : null
              const priceDisplay =
                quote && quote.type === 'range'
                  ? t('pricing.price.range', { min: quote.min, max: quote.max })
                  : t('pricing.services.commercial')

              return (
                <motion.div
                  key={key}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i + 1}
                  className="bg-white rounded border border-sand p-6 flex flex-col"
                >
                  <h3 className="font-sub text-2xl text-charcoal mb-1">
                    {t(titleKey)}
                  </h3>
                  <p className="font-display text-3xl text-slate-brand mb-3">
                    {priceDisplay}
                  </p>
                  <p className="font-body text-base text-text-muted flex-1 mb-4">
                    {t(descKey)}
                  </p>
                  <Link
                    to={type ? `/booking?service=${type}` : '/booking?commercial=1'}
                    className="inline-flex items-center justify-center bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
                  >
                    {t('common.bookNow')}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Frequency savings */}
      <section
        aria-labelledby="pricing-frequency-heading"
        className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <h2
            id="pricing-frequency-heading"
            className="font-display text-4xl text-charcoal mb-2"
          >
            {t('pricing.frequency.heading')}
          </h2>
          <p className="font-body text-base text-text-muted mb-8">
            {t('pricing.frequency.cta')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FREQUENCY_ITEMS.map(({ key, labelKey, saveKey, taglineKey, popular }, i) => (
              <motion.div
                key={key}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 1}
                className="relative bg-white rounded border border-sand p-6"
              >
                {popular && (
                  <span className="absolute top-4 right-4 bg-slate-brand text-white font-body text-sm font-medium rounded px-2 py-0.5">
                    {t('recurring.mostPopular')}
                  </span>
                )}
                <p className="font-sub text-xl text-charcoal mb-1">{t(labelKey)}</p>
                <p className="font-display text-3xl text-slate-brand mb-3">{t(saveKey)}</p>
                <p className="font-body text-base text-text-muted">{t(taglineKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Embedded calculator */}
      <QuoteCalculator />

      {/* CTA strip */}
      <section className="bg-slate-brand py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto text-center">
          <h2 className="font-display text-4xl text-white mb-6">
            {t('pricing.cta.heading')}
          </h2>
          <Link
            to="/booking"
            className="inline-flex items-center bg-white text-slate-brand font-body font-medium rounded px-8 py-4 min-h-[48px] hover:bg-slate-pale transition-colors duration-200"
          >
            {t('pricing.cta.button')}
          </Link>
        </div>
      </section>
    </main>
  )
}
