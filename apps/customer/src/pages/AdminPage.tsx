import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { PayRatesManager } from '@/components/admin/PayRatesManager'
import { OperationsDashboard } from '@/components/admin/OperationsDashboard'
import { AuditLogsTable } from '@/components/admin/AuditLogsTable'
import { ReviewsModerationTab } from '@/components/admin/ReviewsModerationTab'
import { DispatchBoard } from '@/components/admin/DispatchBoard'
import { GalleryManagerTab } from '@/components/admin/GalleryManagerTab'
import { AdminSectionNav } from '@/components/admin/AdminSectionNav'
import { TeamRolesTab } from '@/components/admin/TeamRolesTab'
import { parseAdminTab, type AdminTab } from '@/components/admin/adminTabs'

export default function AdminPage() {
  const { t } = useTranslation()
  const { user, loading, isAuthorized, isOwner, authError, handleSignIn, handleSignOut } = useAdminAuth()
  const bookingsState = useBookings(isAuthorized)
  const analyticsState = useAdminAnalytics()

  // P3-E33: the active section lives in the URL (?tab=) so refresh and Back keep it.
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseAdminTab(searchParams.get('tab'), isOwner)
  const setActiveTab = (tab: AdminTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    })
  }
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'marketing' | 'operations'>('marketing')

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-warm-white">
        <SEO title={t('admin.meta.title')} description={t('admin.meta.description')} noindex />
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] bg-warm-white py-12 px-4 md:py-20 md:px-6 max-md:py-4">
      <SEO title={t('admin.meta.title')} description={t('admin.meta.description')} noindex />

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
              className="w-full flex flex-col gap-8 max-md:gap-4"
            >
              {/* Header and User profile */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-sand pb-6 max-md:gap-3 max-md:pb-4">
                <div>
                  <h1 className="font-display text-5xl text-charcoal max-md:text-3xl">
                    {t('admin.dashboard.title')}
                  </h1>
                  <p className="font-body text-base text-text-muted mt-1 max-md:hidden">
                    {t('admin.dashboard.welcome', { name: user.displayName || user.email })}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white border border-sand rounded p-3 self-start md:self-auto max-md:self-stretch max-md:gap-3 max-md:p-2">
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

                  <div className="text-left max-md:flex-1 max-md:min-w-0">
                    <p className="font-body text-base font-medium text-charcoal leading-none">
                      {user.displayName || t('admin.dashboard.fallbackName')}
                    </p>
                    <p className="font-body text-sm text-text-muted mt-1 max-md:hidden">
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

              {/* Section navigation: tab strip at md+, section select on phones (P3-E33) */}
              <AdminSectionNav active={activeTab} onChange={setActiveTab} isOwner={isOwner} />

              <AnimatePresence mode="wait">
                {activeTab === 'bookings' && (
                  <motion.div
                    key="tab-bookings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BookingsTable {...bookingsState} adminEmail={user.email ?? ''} />
                  </motion.div>
                )}
                {activeTab === 'dispatch' && (
                  <motion.div
                    key="tab-dispatch"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DispatchBoard isAuthorized={isAuthorized} />
                  </motion.div>
                )}
                 {activeTab === 'analytics' && (
                  <motion.div
                    key="tab-analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Sub-tab Selector */}
                    <div className="flex border-b border-sand gap-2 self-start mb-2">
                      <button
                        onClick={() => setAnalyticsSubTab('marketing')}
                        className={cn(
                          'min-h-[48px] py-2 px-4 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                          analyticsSubTab === 'marketing'
                            ? 'border-slate-brand text-slate-brand'
                            : 'border-transparent text-text-muted hover:text-charcoal'
                        )}
                      >
                        {t('admin.dashboard.analytics.subtabs.marketing')}
                      </button>
                      <button
                        onClick={() => setAnalyticsSubTab('operations')}
                        className={cn(
                          'min-h-[48px] py-2 px-4 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                          analyticsSubTab === 'operations'
                            ? 'border-slate-brand text-slate-brand'
                            : 'border-transparent text-text-muted hover:text-charcoal'
                        )}
                      >
                        {t('admin.dashboard.analytics.subtabs.operations')}
                      </button>
                    </div>

                    {analyticsSubTab === 'marketing' ? (
                      <AnalyticsDashboard {...analyticsState} />
                    ) : (
                      <OperationsDashboard isAuthorized={isAuthorized} />
                    )}
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
                {activeTab === 'payRates' && (
                  <motion.div
                    key="tab-payRates"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PayRatesManager isAuthorized={isAuthorized} />
                  </motion.div>
                )}
                {activeTab === 'auditLogs' && (
                  <motion.div
                    key="tab-auditLogs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AuditLogsTable isAuthorized={isAuthorized} />
                  </motion.div>
                )}
                {activeTab === 'reviews' && (
                  <motion.div
                    key="tab-reviews"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ReviewsModerationTab isAuthorized={isAuthorized} />
                  </motion.div>
                )}
                {activeTab === 'gallery' && (
                  <motion.div
                    key="tab-gallery"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GalleryManagerTab isAuthorized={isAuthorized} adminUid={user.uid} />
                  </motion.div>
                )}
                {activeTab === 'team' && isOwner && (
                  <motion.div
                    key="tab-team"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TeamRolesTab currentEmail={user.email ?? ''} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
