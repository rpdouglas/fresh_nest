import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStaffAuth } from '../../hooks/useStaffAuth'
import { cn } from '@freshnest/shared'

export const FsmLayout: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { staffProfile, logout } = useStaffAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      void navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'fr' ? 'en' : 'fr'
    void i18n.changeLanguage(nextLng)
  }

  const navLinks = [
    { to: '/', labelKey: 'fsm.dashboard' },
    { to: '/shifts', labelKey: 'fsm.shifts' },
    { to: '/jobs', labelKey: 'fsm.myJobs' },
    { to: '/profile', labelKey: 'fsm.profile.title', defaultValue: 'Profile' },
  ]

  return (
    <div className="min-h-screen bg-warm-white flex flex-col font-body">
      
      {/* Navbar Header */}
      <header className="bg-white border-b border-sand shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold text-charcoal">
              Fresh Nest
            </span>
            <span className="hidden sm:inline px-2 py-0.5 rounded bg-slate-pale text-slate-brand font-medium text-sm">
              {t('fsm.portal')}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'min-h-[48px] px-3 flex items-center font-medium text-base transition-colors border-b-2',
                    isActive
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )
                }
              >
                {t(link.labelKey, { defaultValue: link.defaultValue })}
              </NavLink>
            ))}
          </nav>

          {/* User Control Panel */}
          <div className="flex items-center gap-4">
            
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={cn(
                'min-h-[48px] px-3 font-medium text-base text-charcoal hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand rounded'
              )}
              aria-label="Toggle language"
            >
              {i18n.language === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Profile Avatar & Info (Desktop) */}
            {staffProfile && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-slate-pale text-slate-brand font-medium flex items-center justify-center border border-sand">
                  {staffProfile.firstName.charAt(0)}{staffProfile.lastName.charAt(0)}
                </div>
                <div className="text-left leading-none">
                  <span className="block text-base font-semibold text-charcoal">
                    {staffProfile.firstName}
                  </span>
                  <span className="text-sm text-text-muted capitalize">
                    {t(`fsm.profile.roles.${staffProfile.role}`)}
                  </span>
                </div>
              </div>
            )}

            {/* Sign Out (Desktop) */}
            <button
              onClick={() => { void handleLogout() }}
              className={cn(
                'hidden md:inline-flex items-center justify-center min-h-[48px] px-4 py-2 border border-sand hover:bg-cream',
                'rounded text-charcoal font-medium text-base transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand'
              )}
            >
              {t('fsm.logout')}
            </button>

            {/* Hamburger Button (Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'md:hidden flex items-center justify-center w-12 h-12 rounded border border-sand text-charcoal',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand'
              )}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-sand bg-white py-2 px-4 flex flex-col gap-2 shadow-inner">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'min-h-[48px] px-4 flex items-center rounded text-base font-medium transition-colors',
                    isActive
                      ? 'bg-slate-pale text-slate-brand font-semibold'
                      : 'text-text-muted hover:text-charcoal hover:bg-cream'
                  )
                }
              >
                {t(link.labelKey, { defaultValue: link.defaultValue })}
              </NavLink>
            ))}

            <hr className="border-sand my-1" />

            {/* Mobile Logged In User details */}
            {staffProfile && (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 rounded bg-slate-pale text-slate-brand font-medium flex items-center justify-center border border-sand">
                  {staffProfile.firstName.charAt(0)}{staffProfile.lastName.charAt(0)}
                </div>
                <div className="text-left leading-none">
                  <span className="block text-base font-semibold text-charcoal">
                    {staffProfile.firstName} {staffProfile.lastName}
                  </span>
                  <span className="text-sm text-text-muted capitalize">
                    {t(`fsm.profile.roles.${staffProfile.role}`)}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Sign Out */}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                void handleLogout()
              }}
              className={cn(
                'w-full min-h-[48px] px-4 flex items-center justify-center border border-sand hover:bg-cream rounded',
                'font-medium text-base text-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand'
              )}
            >
              {t('fsm.logout')}
            </button>
          </div>
        )}

      </header>

      {/* Page Content Outlet */}
      <div className="flex-grow">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-6 mt-auto border-t border-sand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center font-body text-sm text-text-muted flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Fresh Nest Co. {t('fsm.portal')}</p>
          <a 
            href="tel:+16135551234" 
            className="min-h-[48px] px-4 flex items-center text-base text-slate-light hover:text-white transition-colors"
          >
            (613) 555-1234
          </a>
        </div>
      </footer>

    </div>
  )
}

export default FsmLayout
