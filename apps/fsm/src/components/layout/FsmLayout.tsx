import React, { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStaffAuth } from '../../hooks/useStaffAuth'
import { LanguageSelectionOverlay } from '../auth/LanguageSelectionOverlay'
import { BackgroundCheckConsentScreen } from '../auth/BackgroundCheckConsentScreen'
import { TermsConsentOverlay } from '../auth/TermsConsentOverlay'
import { cn } from '@freshnest/shared'
import { useNotifications } from '../../hooks/useNotifications'

export const FsmLayout: React.FC = () => {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])
  const { staffProfile, logout } = useStaffAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const { notifications, unreadCount, markAllAsRead } = useNotifications()

  const handleLogout = async () => {
    try {
      await logout()
      void navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const toggleLanguage = () => {
    const languages = ['en', 'fr', 'ar']
    const currentIndex = languages.indexOf(i18n.language)
    const nextLng = languages[(currentIndex + 1) % languages.length]
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
      {/* Skip-to-content link for keyboard / screen-reader users (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-slate-brand focus:text-white focus:px-4 focus:py-3 focus:min-h-[48px] focus:inline-flex focus:items-center focus:rounded font-body text-base"
      >
        {t('fsm.skipToContent', { defaultValue: 'Skip to main content' })}
      </a>
      
      {/* Navbar Header */}
      <header className="bg-white border-b border-sand shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="min-h-[48px] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-brand rounded">
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
              aria-label={t('fsm.toggleLanguage')}
            >
              {i18n.language === 'ar' ? 'العربية' : i18n.language.toUpperCase()}
            </button>

            {/* Notifications Bell Dropdown */}
            {staffProfile && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center text-charcoal hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand rounded relative"
                  aria-label={t('fsm.notifications.bell', { defaultValue: 'Notification Center' })}
                  aria-expanded={notificationsOpen}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-sand rounded shadow-lg z-50 overflow-hidden text-left">
                    <div className="px-4 py-3 bg-cream border-b border-sand flex items-center justify-between">
                      <span className="font-semibold text-charcoal text-base">
                        {t('fsm.notifications.title', { defaultValue: 'Notifications' })}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            void markAllAsRead()
                          }}
                          className="text-sm text-slate-dark hover:text-slate-brand font-medium min-h-[48px] px-3 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-brand rounded"
                        >
                          {t('fsm.notifications.markAllRead', { defaultValue: 'Mark all as read' })}
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto divide-y divide-sand">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-text-muted text-sm font-medium">
                          {t('fsm.notifications.empty', { defaultValue: 'No notifications.' })}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotificationsOpen(false)
                              if (n.jobId) {
                                void navigate(`/jobs/${n.jobId}`)
                              } else {
                                void navigate('/shifts')
                              }
                            }}
                            className={cn(
                              "px-4 py-3 hover:bg-cream transition-colors cursor-pointer text-sm min-h-[48px] flex flex-col justify-center",
                              !n.read && "bg-slate-pale/30 border-l-4 border-slate-brand font-medium"
                            )}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="font-semibold text-charcoal text-sm">
                                {t(`fsm.notifications.types.${n.type}`, { defaultValue: n.title })}
                              </span>
                              <span className="text-text-muted text-xs whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-charcoal leading-tight text-base mt-1">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
              aria-controls="mobile-menu"
              aria-label={t('fsm.toggleMobileMenu')}
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
          <div
            id="mobile-menu"
            className="md:hidden border-t border-sand bg-white py-2 px-4 flex flex-col gap-2 shadow-inner"
          >
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
      <main id="main-content" tabIndex={-1} className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-6 mt-auto border-t border-sand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center font-body text-sm text-text-muted flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Fresh Nest Co. {t('fsm.portal')}</p>
          <a 
            href="tel:+16135551234" 
            className="min-h-[48px] px-4 flex items-center text-base text-slate-pale hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand rounded"
          >
            (613) 555-1234
          </a>
        </div>
      </footer>

      <LanguageSelectionOverlay />
      <BackgroundCheckConsentScreen />
      <TermsConsentOverlay />
    </div>
  )
}

export default FsmLayout
