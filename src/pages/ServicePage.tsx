import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ServiceConfig } from '@/lib/serviceData'
import { calculateQuote } from '@/lib/quotePricing'
import JsonLd from '@/components/seo/JsonLd'
import { getServiceSchema } from '@/lib/seo'
import SEO from '@/components/seo/SEO'

// ─── Animation variant ────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.1 },
  }),
}

// ─── Static data ──────────────────────────────────────────────────────────────
const HOW_IT_WORKS_STEPS = [
  { titleKey: 'step1Title', descKey: 'step1Desc', number: '1' },
  { titleKey: 'step2Title', descKey: 'step2Desc', number: '2' },
  { titleKey: 'step3Title', descKey: 'step3Desc', number: '3' },
] as const

const TRUST_SIGNALS = [
  { statKey: 'trust1Stat', labelKey: 'trust1Label' },
  { statKey: 'trust2Stat', labelKey: 'trust2Label' },
  { statKey: 'trust3Stat', labelKey: 'trust3Label' },
] as const

interface Props {
  config: ServiceConfig
}

export default function ServicePage({ config }: Props) {
  const { t } = useTranslation()
  const k = `servicePage.${config.key}`

  const priceResult = config.pricingKey
    ? calculateQuote('1-2bed', config.pricingKey, 'one-time')
    : null
  const priceMin =
    priceResult && priceResult.type === 'range' ? priceResult.min : null

  const pageTitle = t(`${k}.hero.heading`)
  const serviceSchema = getServiceSchema(config.key, t)

  return (
    <>
      <SEO
        title={`${pageTitle} — Fresh Nest Co.`}
        description={t(`${k}.hero.subhead`)}
      />
      <main id="main-content">
        <JsonLd schema={serviceSchema} />

      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section
        aria-labelledby={`${config.key}-hero-heading`}
        className="relative bg-charcoal overflow-hidden"
      >
        {/* Hero image */}
        <div className="absolute inset-0">
          <img
            src={`/images/${config.key}-hero.jpg`}
            alt={t(`${k}.hero.imgAlt`)}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-charcoal/30" />
        </div>

        <div className="relative max-w-content mx-auto py-20 px-4 md:py-32 md:px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            <Link
              to="/services"
              className="inline-flex items-center font-body text-base text-slate-light hover:text-white transition-colors mb-6 min-h-[48px]"
            >
              {t('servicePage.backLink')}
            </Link>
            <h1
              id={`${config.key}-hero-heading`}
              className="font-display text-5xl text-white mb-4"
            >
              {pageTitle}
            </h1>
            <p className="font-body text-lg text-slate-pale font-semibold max-w-lg mb-8">
              {t(`${k}.hero.subhead`)}
            </p>
            <Link
              to={`/booking?serviceType=${config.key}`}
              className="inline-flex items-center justify-center font-body font-medium text-base bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-charcoal"
            >
              {t('servicePage.bookCta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 2. What's Included ────────────────────────────────────────────── */}
      <section className="bg-warm-white py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="font-display text-4xl text-charcoal mb-8"
          >
            {t('servicePage.common.includedHeading')}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.includedItems.map((item, i) => (
              <motion.div
                key={item}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex items-start gap-3 bg-white border border-sand rounded p-6"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-slate-brand shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-body text-lg text-charcoal font-semibold">
                  {t(`${k}.included.${item}`)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ───────────────────────────────────────────────── */}
      <section className="bg-cream py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="font-display text-4xl text-charcoal mb-8"
          >
            {t('servicePage.common.howItWorksHeading')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="bg-white border border-sand rounded p-6"
              >
                <span className="font-display text-5xl text-slate-brand block mb-3">
                  {step.number}
                </span>
                <h3 className="font-display text-xl text-charcoal mb-2">
                  {t(`servicePage.common.${step.titleKey}`)}
                </h3>
                <p className="font-body text-lg text-text-muted font-semibold leading-relaxed">
                  {t(`servicePage.common.${step.descKey}`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Trust Signals ──────────────────────────────────────────────── */}
      <section className="bg-slate-dark py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="font-display text-4xl text-white mb-8"
          >
            {t('servicePage.common.trustHeading')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRUST_SIGNALS.map((signal, i) => (
              <motion.div
                key={signal.statKey}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="bg-charcoal rounded p-6"
              >
                <span className="font-display text-5xl text-slate-pale block mb-2">
                  {t(`servicePage.common.${signal.statKey}`)}
                </span>
                <p className="font-body text-lg text-slate-light font-semibold leading-relaxed">
                  {t(`servicePage.common.${signal.labelKey}`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Pricing Teaser / Custom Pricing ────────────────────────────── */}
      {priceMin !== null ? (
        <section className="bg-warm-white py-12 md:py-20 px-4 md:px-6">
          <div className="max-w-content mx-auto text-center">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="font-display text-4xl text-charcoal mb-4"
            >
              {t('servicePage.pricingHeading')}
            </motion.h2>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="font-body text-xl font-semibold text-charcoal mb-8"
            >
              {t('servicePage.pricingStarting', { min: priceMin })}
            </motion.p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center font-body font-medium text-base border-2 border-slate-brand text-slate-brand hover:bg-slate-brand hover:text-white rounded px-8 min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
              >
                {t('servicePage.pricingCta')}
              </Link>
            </motion.div>
          </div>
        </section>
      ) : (
        <section className="bg-warm-white py-12 md:py-20 px-4 md:px-6">
          <div className="max-w-content mx-auto text-center">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="font-display text-4xl text-charcoal mb-4"
            >
              {t('servicePage.customPricingHeading')}
            </motion.h2>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="font-body text-lg text-text-muted font-semibold mb-8 max-w-xl mx-auto"
            >
              {t('servicePage.customPricingBody')}
            </motion.p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <Link
                to={`/booking?serviceType=${config.key}&commercial=1`}
                className="inline-flex items-center justify-center font-body font-medium text-base bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
              >
                {t('servicePage.customPricingCta')}
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── 6. Book CTA Banner ────────────────────────────────────────────── */}
      <section className="bg-slate-brand py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-content mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="font-display text-3xl text-white text-center md:text-left"
          >
            {t('servicePage.bookBanner', { service: pageTitle })}
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="shrink-0"
          >
            <Link
              to={`/booking?serviceType=${config.key}`}
              className="inline-flex items-center justify-center font-body font-medium text-base bg-white text-slate-brand hover:bg-slate-pale rounded px-8 min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-brand"
            >
              {t('servicePage.bookBannerCta')}
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
    </>
  )
}
