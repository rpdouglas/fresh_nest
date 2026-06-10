import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ALL_LOCATIONS } from '@/lib/locationData'
import SEO from '@/components/seo/SEO'

export default function LocationsOverview() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={t('locations.overview.pageTitle')}
        description={t('locations.overview.metaDesc')}
      />

      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-10"
          >
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
              {t('locations.overview.heading')}
            </h1>
            <p className="font-body text-base text-text-muted">
              {t('locations.overview.subhead')}
            </p>
          </motion.div>

          <motion.ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {ALL_LOCATIONS.map(loc => (
              <li key={loc.slug}>
                <Link
                  to={`/locations/${loc.slug}`}
                  className="block bg-white border border-sand rounded shadow-sm p-6
                             hover:border-slate-brand hover:shadow-md
                             transition-all focus:outline-none focus:ring-2
                             focus:ring-slate-brand min-h-[48px]"
                >
                  <h2 className="font-sub text-xl text-charcoal mb-2">
                    {t(loc.headingKey)}
                  </h2>
                  <p className="font-body text-base text-text-muted mb-4">
                    {t(loc.subheadKey)}
                  </p>
                  <span
                    className="font-body text-base text-slate-brand underline underline-offset-2"
                    aria-hidden="true"
                  >
                    {t('locations.overview.viewLocation')}
                  </span>
                </Link>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>
    </>
  )
}
