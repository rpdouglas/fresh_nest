import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { logPhoneClicked } from '@/lib/analytics'
import logoFooter from '@/assets/logo-footer-dark-120px.png'

const PHONE_NUMBER = '(613) 935-3555'
const PHONE_HREF = 'tel:+16139353555'
const EMAIL = 'hello@freshnestco.ca'
const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  const { t } = useTranslation()

  const serviceLinks = [
    { to: '/services/standard-cleaning', label: t('footer.standardCleaning') },
    { to: '/services/deep-cleaning', label: t('footer.deepCleaning') },
    { to: '/services/move-out-cleaning', label: t('footer.moveOutCleaning') },
    { to: '/services/airbnb-turnover', label: t('footer.airbnbTurnover') },
    { to: '/services/post-construction', label: t('footer.postConstruction') },
    { to: '/services/commercial-cleaning', label: t('footer.commercialCleaning') },
  ]

  const locationLinks = [
    { to: '/locations/cornwall', label: t('footer.cornwallON') },
    { to: '/locations/akwesasne', label: t('footer.akwesasne') },
    { to: '/locations/snye-qc', label: t('footer.snyeQC') },
    { to: '/locations/long-sault', label: t('footer.longSault') },
    { to: '/locations/morrisburg', label: t('footer.morrisburg') },
  ]

  const companyLinks = [
    { to: '/about', label: t('footer.aboutUs') },
    { to: '/gallery', label: t('footer.gallery') },
    { to: '/reviews', label: t('footer.reviews') },
    { to: '/careers', label: t('footer.careers') },
    { to: '/privacy', label: t('footer.privacy') },
  ]

  return (
    <footer
      role="contentinfo"
      className="bg-charcoal text-warm-white"
    >
      {/* ── Main grid ── */}
      <div className="max-w-content mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">

          {/* ── Col 1: Brand ── */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              aria-label={t('a11y.homeLink')}
              className="inline-block mb-4 focus:outline-none focus:ring-2 focus:ring-slate-pale rounded"
            >
              <img
                src={logoFooter}
                alt="Fresh Nest Co."
                width={120}
                height={60}
                className="h-12 w-auto"
              />
            </Link>
            <p className="font-body text-base text-text-muted leading-relaxed mb-4 max-w-xs">
              {t('footer.tagline')}
            </p>
            {/* Trust badges */}
            <p className="font-body text-base text-text-muted">{t('footer.insured')}</p>
            <p className="font-body text-base text-text-muted">{t('footer.bilingual')}</p>
          </div>

          {/* ── Col 2: Services ── */}
          <nav aria-label={t('a11y.footerServices')}>
            <h3 className="font-sub text-base font-medium text-warm-white mb-4 uppercase tracking-wide">
              {t('footer.services')}
            </h3>
            <ul className="list-none m-0 p-0 space-y-2" role="list">
              {serviceLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      'font-body text-base text-text-muted',
                      'hover:text-slate-pale transition-colors duration-200',
                      'min-h-[48px]  flex md:inline-flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Col 3: Locations ── */}
          <nav aria-label={t('a11y.footerLocations')}>
            <h3 className="font-sub text-base font-medium text-warm-white mb-4 uppercase tracking-wide">
              {t('footer.locations')}
            </h3>
            <ul className="list-none m-0 p-0 space-y-2" role="list">
              {locationLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      'font-body text-base text-text-muted',
                      'hover:text-slate-pale transition-colors duration-200',
                      'min-h-[48px]  flex md:inline-flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Col 4: Company + Contact ── */}
          <div>
            <nav aria-label={t('a11y.footerCompany')}>
              <h3 className="font-sub text-base font-medium text-warm-white mb-4 uppercase tracking-wide">
                {t('footer.company')}
              </h3>
              <ul className="list-none m-0 p-0 space-y-2 mb-6" role="list">
                {companyLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className={cn(
                        'font-body text-base text-text-muted',
                        'hover:text-slate-pale transition-colors duration-200',
                        'min-h-[48px]  flex md:inline-flex items-center',
                        'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h3 className="font-sub text-base font-medium text-warm-white mb-4 uppercase tracking-wide">
                {t('footer.contact')}
              </h3>
              <ul className="list-none m-0 p-0 space-y-2" role="list">
                {/* Phone — Margaret P3 requirement: tappable tel: link in footer */}
                <li>
                  <a
                    href={PHONE_HREF}
                    onClick={() => logPhoneClicked('footer')}
                    aria-label={t('a11y.callUs', { phone: PHONE_NUMBER })}
                    className={cn(
                      'font-body text-base text-text-muted',
                      'hover:text-slate-pale transition-colors duration-200',
                      'min-h-[48px]  flex md:inline-flex items-center gap-2',
                      'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                    )}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {PHONE_NUMBER}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className={cn(
                      'font-body text-base text-text-muted',
                      'hover:text-slate-pale transition-colors duration-200',
                      'min-h-[48px]  flex md:inline-flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                    )}
                  >
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <p className="font-body text-base text-text-muted">
                    <span className="font-medium text-warm-white">{t('footer.hours')}</span>
                    <br />
                    {t('footer.hoursValue')}
                  </p>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-charcoal/50 bg-charcoal/80">
        <div className="max-w-content mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="font-body text-base text-text-muted text-center md:text-left">
            {t('footer.copyright', { year: CURRENT_YEAR })}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-banner'))}
              className={cn(
                'font-body text-base text-text-muted hover:text-slate-pale',
                'transition-colors duration-200 min-h-[48px] inline-flex items-center',
                'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
              )}
            >
              {t('cookieBanner.preferences')}
            </button>
            <span className="text-text-muted/30" aria-hidden="true">|</span>
            <Link
              to="/privacy"
              className={cn(
                'font-body text-base text-text-muted hover:text-slate-pale',
                'transition-colors duration-200 min-h-[48px] inline-flex items-center',
                'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
              )}
            >
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
