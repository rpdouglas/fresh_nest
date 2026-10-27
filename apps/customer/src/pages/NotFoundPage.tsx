import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import SEO from '@/components/seo/SEO'
import { BUSINESS_PHONE_HREF } from '@/lib/config'

// Catch-all for unknown URLs. Hosting rewrites every path to index.html (HTTP 200), so noindex
// keeps these "soft 404s" out of search results.
export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <>
      <SEO title={t('notFound.pageTitle')} description={t('notFound.metaDesc')} noindex />

      <section className="min-h-[60vh] flex items-center justify-center bg-warm-white px-4 py-16 md:px-6">
        <div className="max-w-xl text-center">
          <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">{t('notFound.heading')}</h1>
          <p className="font-body text-lg text-charcoal mb-8">{t('notFound.body')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-slate-brand text-white font-body font-medium text-base rounded px-8 py-3 min-h-[48px] flex items-center justify-center hover:bg-slate-dark transition-colors duration-200"
            >
              {t('notFound.ctaHome')}
            </Link>
            <Link
              to="/booking"
              className="border border-slate-brand text-slate-brand font-body font-medium text-base rounded px-8 py-3 min-h-[48px] flex items-center justify-center hover:bg-slate-pale transition-colors duration-200"
            >
              {t('notFound.ctaQuote')}
            </Link>
            <a
              href={BUSINESS_PHONE_HREF}
              className="border border-slate-brand text-slate-brand font-body font-medium text-base rounded px-8 py-3 min-h-[48px] flex items-center justify-center hover:bg-slate-pale transition-colors duration-200"
            >
              {t('phone')}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
