import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import { fadeUp } from '@/lib/utils/animations'
import SEO from '@/components/seo/SEO'
import { useAdminAuth } from '@/components/admin/hooks/useAdminAuth'
import { useBookings } from '@/components/admin/hooks/useBookings'
import { useAdminAnalytics } from '@/components/admin/hooks/useAdminAnalytics'
import { LoginPanel } from '@/components/admin/LoginPanel'
import { AccessDeniedPanel } from '@/components/admin/AccessDeniedPanel'
import { BookingsTable } from '@/components/admin/BookingsTable'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'
import { StaffTable } from '@/components/admin/StaffTable'
import { ChecklistTemplateManager } from '@/components/admin/ChecklistTemplateManager'

export default function AdminPage() {
  const { t } = useTranslation()
  const { user, loading, isAuthorized, authError, handleSignIn, handleSignOut } = useAdminAuth()
  const bookingsState = useBookings(isAuthorized)
  const analyticsState = useAdminAnalytics(bookingsState.bookings)

  const [activeTab, setActiveTab] = useState<'bookings' | 'analytics' | 'staff' | 'templates'>('bookings')

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-warm-white">
        <SEO title={t('admin.meta.title')} description={t('admin.meta.description')} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[80vh] bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO title={t('admin.meta.title')} description={t('admin.meta.description')} />

      <div className="max-w-content mx-auto">
        <AnimatePresence mode="wait">
          {/* Access Denied View */}
          {user && !isAuthorized && (
            <AccessDeniedPanel
              user={user}
              handleSignOut={handleSignOut}
              authError={authError}
            />
          )}

          {/* Login Gate View */}
          {!user && (
            <LoginPanel
              handleSignIn={handleSignIn}
              authError={authError}
            />
          )}

          {/* Authenticated Bookings Dashboard */}
          {user && isAuthorized && (
            <motion.div
              key="admin-dashboard"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeUp}
              className="w-full flex flex-col gap-8"
            >
              {/* Header and User profile */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-sand pb-6">
                <div>
                  <h1 className="font-display text-5xl text-charcoal">
                    {t('admin.dashboard.title')}
                  </h1>
                  <p className="font-body text-base text-text-muted mt-1">
                    {t('admin.dashboard.welcome', { name: user.displayName || user.email })}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white border border-sand rounded p-3 self-start md:self-auto">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || t('admin.dashboard.avatarAlt')}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-sand"
                      width={40}
                      height={40}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-pale text-slate-brand font-body font-medium flex items-center justify-center shrink-0">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'A'}
                    </div>
                  )}

                  <div className="text-left">
                    <p className="font-body text-base font-medium text-charcoal leading-none">
                      {user.displayName || t('admin.dashboard.fallbackName')}
                    </p>
                    <p className="font-body text-sm text-text-muted mt-1">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => { void handleSignOut() }}
                    className={cn(
                      'ml-2 border border-sand text-charcoal font-body font-medium rounded',
                      'min-h-[48px] px-4 py-2 text-base hover:bg-cream transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand'
                    )}
                  >
                    {t('admin.dashboard.signOut')}
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-sand gap-2">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={cn(
                    'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    activeTab === 'bookings'
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )}
                >
                  {t('admin.dashboard.tabs.bookings')}
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={cn(
                    'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    activeTab === 'analytics'
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )}
                >
                  {t('admin.dashboard.tabs.analytics')}
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={cn(
                    'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    activeTab === 'staff'
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )}
                >
                  {t('admin.dashboard.tabs.staff')}
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={cn(
                    'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    activeTab === 'templates'
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )}
                >
                  {t('admin.dashboard.tabs.templates')}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'bookings' && (
                  <motion.div
                    key="tab-bookings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BookingsTable {...bookingsState} />
                  </motion.div>
                )}
                {activeTab === 'analytics' && (
                  <motion.div
                    key="tab-analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnalyticsDashboard {...analyticsState} />
                  </motion.div>
                )}
                {activeTab === 'staff' && (
                  <motion.div
                    key="tab-staff"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StaffTable isAuthorized={isAuthorized} />
                  </motion.div>
                )}
                {activeTab === 'templates' && (
                  <motion.div
                    key="tab-templates"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChecklistTemplateManager isAuthorized={isAuthorized} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
