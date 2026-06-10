import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { calculateQuote } from '@/lib/quotePricing'
import { submitBooking, detectLeadSource } from '@/lib/firestore'
import JsonLd from '@/components/seo/JsonLd'
import { getServiceSchema } from '@/lib/seo'

// ─── Animation variant ───────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.1 },
  }),
}

// ─── Zod schema for commercial inquiry ───────────────────────────────────────
const airbnbInquirySchema = z.object({
  firstName:                 z.string().min(1, 'Required'),
  lastName:                  z.string().min(1, 'Required'),
  email:                     z.string().email('Enter a valid email address'),
  phone:                     z.string().min(10, 'Enter a valid phone number'),
  propertyName:              z.string().min(1, 'Required'),
  estimatedMonthlyTurnovers: z
    .number({ message: 'Enter a number' })
    .int()
    .min(1, 'Minimum 1')
    .max(100, 'Maximum 100'),
  preferredWindow:           z.enum(['11am-3pm', 'flexible', 'morning', 'afternoon']),
  notes:                     z.string().max(1000).optional(),
  marketingConsent:          z.boolean().optional(),
})

type AirbnbInquiryForm = z.infer<typeof airbnbInquirySchema>

// ─── Checklist items ──────────────────────────────────────────────────────────
const INCLUDED_KEYS = [
  'fullClean',
  'linen',
  'toiletries',
  'photos',
  'staging',
  'window',
] as const

// ─── How It Works steps ───────────────────────────────────────────────────────
const HOW_IT_WORKS_STEPS = [
  { titleKey: 'step1Title', descKey: 'step1Desc', number: '1' },
  { titleKey: 'step2Title', descKey: 'step2Desc', number: '2' },
  { titleKey: 'step3Title', descKey: 'step3Desc', number: '3' },
] as const

// ─── Trust signals ────────────────────────────────────────────────────────────
const TRUST_SIGNALS = [
  { statKey: 'stat1', labelKey: 'label1' },
  { statKey: 'stat2', labelKey: 'label2' },
  { statKey: 'stat3', labelKey: 'label3' },
] as const

// ─── Window options ───────────────────────────────────────────────────────────
const WINDOW_OPTIONS = [
  { value: '11am-3pm',   labelKey: 'window11am3pm'   },
  { value: 'flexible',   labelKey: 'windowFlexible'  },
  { value: 'morning',    labelKey: 'windowMorning'   },
  { value: 'afternoon',  labelKey: 'windowAfternoon' },
] as const

export default function AirbnbTurnoverPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const serviceSchema = getServiceSchema('airbnb', t)

  // Pricing teaser — use 1-2bed as reference size
  const priceResult = calculateQuote('1-2bed', 'airbnb', 'one-time')
  const priceMin = priceResult.type === 'range' ? priceResult.min : null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AirbnbInquiryForm>({
    resolver: zodResolver(airbnbInquirySchema),
    defaultValues: {
      preferredWindow: '11am-3pm',
      marketingConsent: false,
    },
  })

  const onSubmit = async (data: AirbnbInquiryForm) => {
    setSubmitError(null)
    try {
      const source = detectLeadSource(searchParams)
      const notesText = [
        `[Commercial Inquiry]`,
        `Property: ${data.propertyName}`,
        `Turnovers/month: ${data.estimatedMonthlyTurnovers}`,
        `Window: ${data.preferredWindow}`,
        data.notes ? `Notes: ${data.notes}` : '',
      ]
        .filter(Boolean)
        .join(' | ')

      // Build a BookingFormData-compatible payload
      const payload = {
        serviceType:      'airbnb'      as const,
        propertyType:     'commercial'  as const,
        bedrooms:         0,
        bathrooms:        0,
        pets:             false,
        frequency:        'one-time'    as const,
        preferredDate:    '',
        addOns:           [] as ('oven' | 'fridge' | 'windows' | 'laundry' | 'petHair' | 'basement')[],
        firstName:        data.firstName,
        lastName:         data.lastName,
        email:            data.email,
        phone:            data.phone,
        address:          '',
        preferredCleaner: null,
        notes:            notesText,
        marketingConsent: data.marketingConsent ?? false,
      }

      await submitBooking(payload, i18n.language as 'en' | 'fr', source)
      setSubmittedName(data.firstName)
      setSubmitted(true)
    } catch (err) {
      console.error('[AirbnbTurnoverPage] submitBooking error:', err)
      setSubmitError(t('common.error'))
    }
  }

  return (
    <main id="main-content">
      <JsonLd schema={serviceSchema} />
      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-hero-heading"
        className="relative bg-charcoal overflow-hidden"
      >
        {/* Hero image */}
        <div className="absolute inset-0">
          <img
            src="/images/airbnb-hero.jpg"
            alt={t('airbnbPage.hero.imgAlt')}
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
            {/* Back link */}
            <Link
              to="/services"
              className="inline-flex items-center font-body text-base text-slate-light hover:text-white transition-colors mb-6 min-h-[48px]"
              aria-label={t('airbnbPage.hero.backLink')}
            >
              {t('airbnbPage.hero.backLink')}
            </Link>

            <h1
              id="airbnb-hero-heading"
              className="font-display text-5xl text-white mb-4"
            >
              {t('airbnbPage.hero.heading')}
            </h1>
            <p className="font-body text-base text-slate-pale max-w-lg mb-8">
              {t('airbnbPage.hero.subhead')}
            </p>
            <a
              href="#inquiry-form"
              className="inline-flex items-center justify-center bg-slate-brand text-white font-body font-medium rounded px-8 py-4 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
            >
              {t('airbnbPage.hero.cta')}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 2. What's Included ───────────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-included-heading"
        className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              id="airbnb-included-heading"
              className="font-display text-4xl text-charcoal mb-8"
            >
              {t('airbnbPage.included.heading')}
            </h2>
          </motion.div>

          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {INCLUDED_KEYS.map((key, i) => (
              <motion.li
                key={key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex items-start gap-3 bg-white border border-sand rounded p-5 min-h-[48px]"
              >
                {/* Checkmark icon */}
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-slate-pale flex items-center justify-center text-slate-brand text-xs font-bold"
                >
                  ✓
                </span>
                <span className="font-body text-base text-charcoal">
                  {t(`airbnbPage.included.${key}`)}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 3. How It Works ──────────────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-how-heading"
        className="bg-cream py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              id="airbnb-how-heading"
              className="font-display text-4xl text-charcoal mb-10"
            >
              {t('airbnbPage.howItWorks.heading')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS_STEPS.map(({ titleKey, descKey, number }, i) => (
              <motion.div
                key={titleKey}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex flex-col"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-6xl text-slate-pale mb-3 leading-none select-none"
                >
                  {number}
                </span>
                <h3 className="font-sub text-2xl text-charcoal mb-2">
                  {t(`airbnbPage.howItWorks.${titleKey}`)}
                </h3>
                <p className="font-body text-base text-text-muted">
                  {t(`airbnbPage.howItWorks.${descKey}`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Why Hosts Choose Us ───────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-trust-heading"
        className="bg-slate-dark py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              id="airbnb-trust-heading"
              className="font-display text-4xl text-white mb-10 text-center"
            >
              {t('airbnbPage.trust.heading')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {TRUST_SIGNALS.map(({ statKey, labelKey }, i) => (
              <motion.div
                key={statKey}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex flex-col items-center"
              >
                <span className="font-display text-5xl text-white mb-2">
                  {t(`airbnbPage.trust.${statKey}`)}
                </span>
                <span className="font-body text-base text-slate-pale">
                  {t(`airbnbPage.trust.${labelKey}`)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Pricing Teaser ────────────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-pricing-heading"
        className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            <h2
              id="airbnb-pricing-heading"
              className="font-display text-4xl text-charcoal mb-3"
            >
              {t('airbnbPage.pricing.heading')}
            </h2>
            {priceMin !== null && (
              <p className="font-display text-3xl text-slate-brand mb-2">
                {t('airbnbPage.pricing.starting', { min: priceMin })}
              </p>
            )}
            <p className="font-body text-base text-text-muted mb-6">
              {t('airbnbPage.pricing.volume')}
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center border border-slate-brand text-slate-brand font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-pale transition-colors duration-200"
            >
              {t('airbnbPage.pricing.cta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 6. Commercial Inquiry Form ───────────────────────────────────── */}
      <section
        id="inquiry-form"
        aria-labelledby="airbnb-form-heading"
        className="bg-cream py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-2xl"
          >
            <h2
              id="airbnb-form-heading"
              className="font-display text-4xl text-charcoal mb-2"
            >
              {t('airbnbPage.form.heading')}
            </h2>
            <p className="font-body text-base text-text-muted mb-8">
              {t('airbnbPage.form.subhead')}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="max-w-2xl"
          >
            {/* Success state */}
            {submitted ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-white border border-sand rounded p-8 text-center"
              >
                <span
                  aria-hidden="true"
                  className="block text-4xl mb-4"
                >
                  ✓
                </span>
                <h3 className="font-sub text-2xl text-charcoal mb-2">
                  {t('airbnbPage.form.successHeading', { name: submittedName })}
                </h3>
                <p className="font-body text-base text-text-muted">
                  {t('airbnbPage.form.successBody')}
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                aria-label={t('airbnbPage.form.heading')}
                className="bg-white border border-sand rounded p-6 md:p-8 space-y-6"
              >
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="airbnb-firstName"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.firstName')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-firstName"
                      type="text"
                      autoComplete="given-name"
                      {...register('firstName')}
                      aria-required="true"
                      aria-describedby={errors.firstName ? 'airbnb-firstName-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.firstName && (
                      <p id="airbnb-firstName-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="airbnb-lastName"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.lastName')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-lastName"
                      type="text"
                      autoComplete="family-name"
                      {...register('lastName')}
                      aria-required="true"
                      aria-describedby={errors.lastName ? 'airbnb-lastName-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.lastName && (
                      <p id="airbnb-lastName-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email + Phone row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="airbnb-email"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.email')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      aria-required="true"
                      aria-describedby={errors.email ? 'airbnb-email-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.email && (
                      <p id="airbnb-email-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="airbnb-phone"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.phone')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-phone"
                      type="tel"
                      autoComplete="tel"
                      {...register('phone')}
                      aria-required="true"
                      aria-describedby={errors.phone ? 'airbnb-phone-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.phone && (
                      <p id="airbnb-phone-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Property Name */}
                <div>
                  <label
                    htmlFor="airbnb-propertyName"
                    className="block font-body text-base text-charcoal mb-1"
                  >
                    {t('airbnbPage.form.propertyName')}
                    <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="airbnb-propertyName"
                    type="text"
                    {...register('propertyName')}
                    aria-required="true"
                    aria-describedby={errors.propertyName ? 'airbnb-propertyName-error' : undefined}
                    className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  />
                  {errors.propertyName && (
                    <p id="airbnb-propertyName-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                      {errors.propertyName.message}
                    </p>
                  )}
                </div>

                {/* Monthly Turnovers + Preferred Window row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="airbnb-monthlyTurnovers"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.monthlyTurnovers')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-monthlyTurnovers"
                      type="number"
                      min="1"
                      max="100"
                      {...register('estimatedMonthlyTurnovers', { valueAsNumber: true })}
                      aria-required="true"
                      aria-describedby={errors.estimatedMonthlyTurnovers ? 'airbnb-turnovers-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.estimatedMonthlyTurnovers && (
                      <p id="airbnb-turnovers-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.estimatedMonthlyTurnovers.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="airbnb-preferredWindow"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.preferredWindow')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="airbnb-preferredWindow"
                      {...register('preferredWindow')}
                      aria-required="true"
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand bg-white"
                    >
                      {WINDOW_OPTIONS.map(({ value, labelKey }) => (
                        <option key={value} value={value}>
                          {t(`airbnbPage.form.${labelKey}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="airbnb-notes"
                    className="block font-body text-base text-charcoal mb-1"
                  >
                    {t('airbnbPage.form.notes')}
                    <span className="ml-1 font-body text-sm text-text-muted">
                      ({t('common.optional')})
                    </span>
                  </label>
                  <textarea
                    id="airbnb-notes"
                    rows={4}
                    {...register('notes')}
                    placeholder={t('airbnbPage.form.notesPlaceholder')}
                    className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand resize-none"
                  />
                </div>

                {/* CASL consent */}
                <div className="flex items-center gap-3 min-h-[48px]">
                  <input
                    id="airbnb-consent"
                    type="checkbox"
                    {...register('marketingConsent')}
                    className="w-5 h-5 border-sand rounded accent-slate-brand flex-shrink-0"
                  />
                  <label
                    htmlFor="airbnb-consent"
                    className="font-body text-base text-text-muted cursor-pointer"
                  >
                    {t('airbnbPage.form.consent')}
                  </label>
                </div>

                {/* Server error */}
                {submitError && (
                  <p role="alert" className="font-body text-base text-red-600">
                    {submitError}
                  </p>
                )}

                {/* Submit */}
                <button
                  id="airbnb-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-brand text-white font-body font-medium rounded px-6 py-4 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? t('airbnbPage.form.submitting')
                    : t('airbnbPage.form.submit')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  )
}
