import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  calculateQuote,
  FREQUENCY_DISCOUNT,
  type QuoteFrequency,
  type QuotePropertySize,
  type QuoteServiceType,
} from '@/lib/quotePricing'
import { logQuoteCalculated } from '@/lib/analytics'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const SIZE_OPTIONS: { value: QuotePropertySize; labelKey: string }[] = [
  { value: 'apartment',  labelKey: 'quote.size.apartment' },
  { value: '1-2bed',     labelKey: 'quote.size.1-2bed' },
  { value: '3-4bed',     labelKey: 'quote.size.3-4bed' },
  { value: '5plus',      labelKey: 'quote.size.5plus' },
  { value: 'commercial', labelKey: 'quote.size.commercial' },
]

const SERVICE_OPTIONS: { value: QuoteServiceType; labelKey: string }[] = [
  { value: 'standard',         labelKey: 'quote.service.standard' },
  { value: 'deep',             labelKey: 'quote.service.deep' },
  { value: 'moveout',          labelKey: 'quote.service.moveout' },
  { value: 'postconstruction', labelKey: 'quote.service.postconstruction' },
  { value: 'airbnb',           labelKey: 'quote.service.airbnb' },
]

const FREQUENCY_OPTIONS: { value: QuoteFrequency; labelKey: string }[] = [
  { value: 'one-time',  labelKey: 'quote.frequency.one-time' },
  { value: 'weekly',    labelKey: 'quote.frequency.weekly' },
  { value: 'biweekly',  labelKey: 'quote.frequency.biweekly' },
  { value: 'monthly',   labelKey: 'quote.frequency.monthly' },
]

function btnClass(isActive: boolean) {
  return cn(
    'font-body text-base font-medium rounded min-h-[48px] px-4 py-2',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-1',
    isActive
      ? 'bg-slate-brand text-white'
      : 'bg-white border border-sand text-charcoal hover:bg-slate-pale',
  )
}

export default function QuoteCalculator() {
  const { t } = useTranslation()

  const [size, setSize]           = useState<QuotePropertySize>('3-4bed')
  const [service, setService]     = useState<QuoteServiceType>('standard')
  const [frequency, setFrequency] = useState<QuoteFrequency>('biweekly')

  const quote = calculateQuote(size, service, frequency)

  const bookingHref = useMemo(() => {
    if (size === 'commercial') return '/booking?commercial=1'
    const params = new URLSearchParams({ size, service, freq: frequency })
    return `/booking?${params.toString()}`
  }, [size, service, frequency])

  return (
    <section aria-label={t('quote.ariaLabel')} className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="max-w-2xl mx-auto"
        >
          <h2 className="font-display text-4xl text-charcoal mb-3">
            {t('quote.sectionHeading')}
          </h2>
          <p className="font-body text-lg text-text-muted font-semibold mb-8">
            {t('quote.sectionSubhead')}
          </p>

          <div className="space-y-6">
            {/* Property Size */}
            <div className="relative overflow-hidden bg-white border border-sand rounded p-6">
              {/* Background Image decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src="/images/quote-size.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.25 }}
                />
              </div>
              <div className="relative z-10">
                <p id="size-label" className="font-body text-base font-medium text-charcoal mb-2">
                  {t('quote.sizeLabel')}
                </p>
                <div role="group" aria-labelledby="size-label" className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={size === value}
                      onClick={() => setSize(value)}
                      className={btnClass(size === value)}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div className="relative overflow-hidden bg-cream border border-sand rounded p-6">
              {/* Background Image decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src="/images/quote-service.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.25 }}
                />
              </div>
              <div className="relative z-10">
                <p id="service-label" className="font-body text-base font-medium text-charcoal mb-2">
                  {t('quote.serviceLabel')}
                </p>
                <div role="group" aria-labelledby="service-label" className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={service === value}
                      onClick={() => setService(value)}
                      className={btnClass(service === value)}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Frequency */}
            <div className="relative overflow-hidden bg-slate-pale border border-sand rounded p-6">
              {/* Background Image decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src="/images/quote-frequency.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.25 }}
                />
              </div>
              <div className="relative z-10">
                <p id="freq-label" className="font-body text-base font-medium text-charcoal mb-2">
                  {t('quote.frequencyLabel')}
                </p>
                <div role="group" aria-labelledby="freq-label" className="flex flex-wrap gap-2">
                  {FREQUENCY_OPTIONS.map(({ value, labelKey }) => {
                    const discount = FREQUENCY_DISCOUNT[value]
                    const isActive = frequency === value
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setFrequency(value)}
                        className={btnClass(isActive)}
                      >
                        {t(labelKey)}
                        {discount > 0 && (
                          <span className="font-body text-sm ml-1.5 opacity-75">
                            {t('quote.discountBadge', { pct: Math.round(discount * 100) })}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Result panel */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-8 p-6 bg-white rounded border border-sand text-center"
          >
            {quote.type === 'commercial' ? (
              <div className="space-y-3">
                <p className="font-sub text-2xl text-charcoal">
                  {t('quote.commercialTitle')}
                </p>
                <p className="font-body text-base text-text-muted">
                  {t('quote.commercialBody')}
                </p>
                <Link
                  to="/booking?commercial=1"
                  className="inline-flex items-center border border-slate-brand text-slate-brand font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-pale transition-colors duration-200"
                >
                  {t('quote.commercialCta')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-display text-4xl text-charcoal">
                  {t('quote.startingAt', { price: quote.min })}
                </p>
                <p className="font-body text-base text-text-muted">
                  {t('quote.typicallyRange', { min: quote.min, max: quote.max })}
                </p>
                <Link
                  to={bookingHref}
                  onClick={() => logQuoteCalculated(service, quote.min)}
                  className="inline-flex items-center bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
                >
                  {t('quote.bookNowCta')}
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
