import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import SEO from '@/components/seo/SEO'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function AdminPage() {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Validate against client-side allowlist environment variable
        const allowedEmails = (
          import.meta.env.VITE_ADMIN_EMAILS || 'lauren@freshnest.co,dev@freshnest.co'
        )
          .split(',')
          .map((email: string) => email.trim().toLowerCase())

        const userEmail = currentUser.email?.trim().toLowerCase()
        const authorized = userEmail ? allowedEmails.includes(userEmail) : false
        setIsAuthorized(authorized)

        if (!authorized) {
          setAuthError(t('admin.login.errorMessage', { email: currentUser.email }))
        } else {
          setAuthError(null)
        }
      } else {
        setIsAuthorized(false)
        setAuthError(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [t])

  const handleSignIn = async () => {
    setLoading(true)
    setAuthError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Sign-in error:', err)
      setAuthError(t('admin.login.authFailed'))
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
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

      <div className="max-w-content mx-auto flex items-center justify-center min-h-[50vh]">
        <AnimatePresence mode="wait">
          {/* Access Denied View */}
          {user && !isAuthorized && (
            <motion.div
              key="access-denied"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeUp}
              className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-6 md:p-8"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-3xl text-charcoal">
                    {t('admin.login.errorTitle')}
                  </h1>
                  <p className="font-body text-base text-text-muted">
                    {authError || t('admin.login.errorMessage', { email: user.email })}
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={handleSignOut}
                    className={cn(
                      'w-full bg-slate-brand text-white font-body font-medium rounded',
                      'min-h-[48px] py-3 px-6 hover:bg-slate-dark transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                    )}
                  >
                    {t('admin.login.tryAnother')}
                  </button>
                  <Link
                    to="/"
                    className={cn(
                      'w-full border border-sand text-charcoal font-body font-medium rounded',
                      'min-h-[48px] inline-flex items-center justify-center py-3 px-6',
                      'hover:bg-cream transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                    )}
                  >
                    {t('admin.login.backToHome')}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Login Gate View */}
          {!user && (
            <motion.div
              key="login-gate"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeUp}
              className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-6 md:p-8"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-slate-pale text-slate-brand rounded-full flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-4xl text-charcoal">
                    {t('admin.login.heading')}
                  </h1>
                  <p className="font-body text-base text-text-muted">
                    {t('admin.login.subhead')}
                  </p>
                </div>

                {authError && (
                  <div className="w-full p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm font-body">
                    {authError}
                  </div>
                )}

                <button
                  onClick={handleSignIn}
                  className={cn(
                    'w-full bg-slate-brand text-white font-body font-medium rounded',
                    'min-h-[48px] py-3 px-6 hover:bg-slate-dark transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    'inline-flex items-center justify-center gap-3'
                  )}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.706 0 3.277.614 4.5 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1 6.583 1 2 5.583 2 11.24s4.583 10.24 10.24 10.24c5.795 0 10.24-4.11 10.24-10.24 0-.568-.057-1.125-.17-1.67H12.24z" />
                  </svg>
                  {t('admin.login.button')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Authenticated Dashboard View */}
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
                  <h1 className="font-display text-4xl text-charcoal">
                    {t('admin.dashboard.title')}
                  </h1>
                  <p className="font-body text-base text-text-muted mt-1">
                    {t('admin.dashboard.welcome', { name: user.displayName || user.email })}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white border border-sand rounded p-3">
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
                    <p className="font-body text-sm font-medium text-charcoal leading-none">
                      {user.displayName || t('admin.dashboard.fallbackName')}
                    </p>
                    <p className="font-body text-sm text-text-muted mt-1">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={handleSignOut}
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

              {/* Main Content Area placeholder */}
              <div className="bg-white border border-sand rounded shadow-sm p-6 md:p-8 text-center max-w-2xl mx-auto my-6">
                <div className="w-16 h-16 bg-slate-pale text-slate-brand rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>

                <h2 className="font-sub text-2xl text-charcoal mb-4">
                  {t('admin.dashboard.placeholderTitle')}
                </h2>
                <p className="font-body text-base text-text-muted leading-relaxed max-w-lg mx-auto">
                  {t('admin.dashboard.placeholderText')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
