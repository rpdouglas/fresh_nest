import { useState, useCallback } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import { logLanguageToggled, logPhoneClicked } from '@/lib/firebase/analytics'
import { useScrolled } from '@/hooks/useScrolled'
import logoNavbar from '@/assets/logo-navbar-80px.png'
import logoNavbar2x from '@/assets/logo-navbar-160px@2x.png'

const PHONE_NUMBER = '(613) 935-3555'
const PHONE_HREF = 'tel:+16139353555'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const scrolled = useScrolled(20)
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleLanguage = useCallback(() => {
    const next = i18n.language.startsWith('fr') ? 'en' : 'fr'
    void i18n.changeLanguage(next)
    logLanguageToggled(next)
    // Persist in localStorage — i18next LanguageDetector picks this up on reload
    localStorage.setItem('i18nextLng', next)
  }, [i18n])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const navLinks = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/services', label: t('nav.services'), end: false },
    { to: '/locations', label: t('nav.locations'), end: false },
    { to: '/pricing', label: t('nav.pricing'), end: true },
    { to: '/faq', label: t('nav.faq'), end: true },
    { to: '/blog', label: t('nav.blog'), end: false },
  ]

  return (
    <>
      {/* Skip-to-content link for keyboard / screen-reader users (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-slate-brand focus:text-white focus:px-4 focus:py-2 focus:rounded font-body text-base"
      >
        {t('nav.skipToContent')}
      </a>

      <header
        role="banner"
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-shadow duration-300',
          'bg-white/95 backdrop-blur-sm',
          scrolled ? 'shadow-md' : 'shadow-none',
        )}
      >
        <nav
          aria-label={t('a11y.navMain')}
          className="max-w-content mx-auto flex items-center justify-between px-4 md:px-6 h-16 md:h-20"
        >
          {/* ── Logo ── */}
          <Link
            to="/"
            aria-label={t('a11y.homeLink')}
            className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-brand rounded"
          >
            <img
              src={logoNavbar}
              srcSet={`${logoNavbar} 1x, ${logoNavbar2x} 2x`}
              alt="Fresh Nest Co."
              width={80}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* ── Desktop nav links ── */}
          <ul
            className="hidden md:flex items-center gap-1 list-none m-0 p-0"
            role="list"
          >
            {navLinks.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'font-body text-base px-3 py-2 rounded transition-colors duration-200',
                      'min-h-[48px] inline-flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand',
                      isActive
                        ? 'text-slate-dark font-medium border-b-2 border-slate-brand'
                        : 'text-charcoal hover:text-slate-brand',
                    )
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* ── Desktop right side: phone + lang toggle + CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Phone — Margaret P3 requirement: always visible, always a tel: link */}
            <a
              href={PHONE_HREF}
              onClick={() => logPhoneClicked('navbar')}
              aria-label={t('a11y.callUs', { phone: PHONE_NUMBER })}
              className={cn(
                'font-body text-base text-slate-brand hover:text-slate-dark',
                'transition-colors duration-200 min-h-[48px] inline-flex items-center',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand rounded',
              )}
            >
              {PHONE_NUMBER}
            </a>

            {/* Language toggle — Diane P1 requirement */}
            <button
              id="lang-toggle-desktop"
              type="button"
              onClick={toggleLanguage}
              aria-label={t('lang.switchTo')}
              className={cn(
                'font-body text-base font-medium text-charcoal',
                'border border-sand rounded px-3 min-h-[48px] inline-flex items-center',
                'hover:border-slate-brand hover:text-slate-brand transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              )}
            >
              {t('lang.toggle')}
            </button>

            {/* Book Now CTA — Travis P2 requirement: always visible */}
            <Link
              to="/booking"
              id="cta-book-now-nav"
              className={cn(
                'bg-slate-brand text-white font-body font-medium text-base rounded',
                'px-5 min-h-[48px] inline-flex items-center',
                'hover:bg-slate-dark transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
              )}
            >
              {t('nav.booking')}
            </Link>
          </div>

          {/* ── Mobile right: lang toggle + hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="lang-toggle-mobile"
              type="button"
              onClick={toggleLanguage}
              aria-label={t('lang.switchTo')}
              className={cn(
                'font-body text-base font-medium text-charcoal',
                'border border-sand rounded px-2.5 min-h-[48px] inline-flex items-center',
                'hover:border-slate-brand hover:text-slate-brand transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              )}
            >
              {t('lang.toggle')}
            </button>

            <button
              id="hamburger-btn"
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              className={cn(
                'p-2 min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded',
                'text-charcoal hover:text-slate-brand transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              )}
            >
              {/* Animated hamburger → X icon */}
              <span className="sr-only">
                {menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* ── Mobile menu (Framer Motion slide-down) ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label={t('a11y.navMobile')}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden bg-white border-t border-sand"
            >
              <ul className="flex flex-col list-none m-0 p-0 px-4 py-4 gap-1" role="list">
                {navLinks.map(({ to, label, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        cn(
                          'font-body text-base w-full px-3 min-h-[48px] flex items-center rounded',
                          'transition-colors duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-slate-brand',
                          isActive
                            ? 'bg-slate-pale text-slate-dark font-medium'
                            : 'text-charcoal hover:bg-cream hover:text-slate-brand',
                        )
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}

                {/* Phone in mobile menu — Margaret P3 requirement */}
                <li className="border-t border-sand pt-3 mt-2">
                  <a
                    href={PHONE_HREF}
                    aria-label={t('a11y.callUs', { phone: PHONE_NUMBER })}
                    onClick={() => {
                      logPhoneClicked('navbar')
                      closeMenu()
                    }}
                    className={cn(
                      'font-body text-base text-slate-brand hover:text-slate-dark',
                      'w-full px-3 min-h-[48px] flex items-center gap-2 rounded',
                      'transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand',
                    )}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
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

                {/* Book Now CTA in mobile menu */}
                <li className="pt-2">
                  <Link
                    to="/booking"
                    id="cta-book-now-mobile"
                    onClick={closeMenu}
                    className={cn(
                      'bg-slate-brand text-white font-body font-medium text-base rounded',
                      'w-full min-h-[48px] flex items-center justify-center',
                      'hover:bg-slate-dark transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    )}
                  >
                    {t('nav.booking')}
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer so page content starts below the fixed nav */}
      <div className="h-16 md:h-20" aria-hidden="true" />
    </>
  )
}
