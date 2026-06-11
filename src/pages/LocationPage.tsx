import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { LocationConfig } from '@/lib/locationData'
import SEO from '@/components/seo/SEO'

export default function LocationPage({ config }: { config: LocationConfig }) {
  const { t } = useTranslation()
  const locationName = t(config.headingKey)

  return (
    <>
      <SEO
        title={t(config.pageTitleKey)}
        description={t(config.metaDescKey)}
      />

      {/* Page hero */}
      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
              {t(config.headingKey)}
            </h1>
            <p className="font-body text-lg text-text-muted font-semibold mb-4">{t(config.subheadKey)}</p>
            <p className="font-body text-lg text-charcoal font-semibold max-w-2xl leading-relaxed">
              {t(config.descriptionKey)}
            </p>
          </motion.div>

          {/* Optional callout — Akwesasne island note, Snye QC border note */}
          {config.calloutKey != null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="mt-8 flex items-start gap-4 bg-slate-pale border border-sand rounded p-5"
            >
              <div className="shrink-0 mt-0.5" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-slate-brand"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p className="font-body text-lg text-charcoal font-semibold">{t(config.calloutKey)}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Services available */}
      <section className="bg-cream py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto">
          <h2 className="font-sub text-2xl text-charcoal mb-6">
            {t('locations.servicesHeading')}
          </h2>
          <ul className="flex flex-wrap gap-3" role="list">
            {config.services.map(service => (
              <li key={service}>
                <Link
                  to={`/booking?serviceType=${service}`}
                  className="inline-flex items-center font-body text-base text-slate-brand
                             border border-slate-brand rounded px-4 min-h-[48px]
                             hover:bg-slate-brand hover:text-white
                             transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
                >
                  {t(`services.${service}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Map + booking CTA */}
      <section className="bg-warm-white py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto">
          <div className="rounded overflow-hidden border border-sand mb-10">
            <iframe
              title={t('locations.mapLabel', { location: locationName })}
              src={`https://maps.google.com/maps?q=${config.mapQuery}&output=embed`}
              className="w-full h-64 md:h-96 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="text-center">
            <Link
              to="/booking"
              aria-label={t('locations.bookAriaLabel', { location: locationName })}
              className="inline-flex items-center justify-center font-body font-medium text-base
                         bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px]
                         transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand
                         focus:ring-offset-2"
            >
              {t('locations.bookCta', { location: locationName })}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
