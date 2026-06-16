import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCustomerAuthContext } from './CustomerAuthContext'
import { cn } from '@/lib/utils/utils'

export default function CustomerPortalLayout() {
  const { t } = useTranslation()
  const { user, signOutUser } = useCustomerAuthContext()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOutUser()
    void navigate('/')
  }

  const tabs = [
    { to: '/account/bookings', label: t('customerPortal.nav.bookings') },
    { to: '/account/upcoming', label: t('customerPortal.nav.upcoming') },
    { to: '/account/profile', label: t('customerPortal.nav.profile') },
  ]

  return (
    <div className="bg-cream min-h-[85vh] py-12 px-4 md:px-6">
      <div className="max-w-content mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-sand pb-6 mb-8 gap-4">
          <div>
            <h1 className="font-display text-5xl text-charcoal mb-1">
              {t('welcome')}
            </h1>
            <p className="font-body text-charcoal text-base">
              {t('customerPortal.login.loggedInAs', 'Logged in as:')} <span className="font-semibold text-slate-brand">{user?.email}</span>
            </p>
          </div>
          <button
            onClick={() => { void handleSignOut() }}
            className={cn(
              'border border-sand text-charcoal hover:border-red-500 hover:text-red-600 bg-white font-body font-medium text-base rounded',
              'px-4 py-2 min-h-[48px] inline-flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand'
            )}
          >
            {t('customerPortal.nav.logout')}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-sand pb-4 mb-6">
          {tabs.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'font-body text-base px-4 py-2.5 rounded font-medium transition-all duration-150 min-h-[48px] inline-flex items-center focus:outline-none focus:ring-2 focus:ring-slate-brand',
                  isActive
                    ? 'bg-slate-brand text-white'
                    : 'bg-white border border-sand text-charcoal hover:bg-slate-pale hover:text-slate-brand'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Content Outlet */}
        <div className="bg-white rounded border border-sand p-6 shadow-sm min-h-[40vh]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
