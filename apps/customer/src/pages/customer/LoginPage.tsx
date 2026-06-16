import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCustomerAuthContext } from '@/components/layout/CustomerAuthContext'
import SEO from '@/components/seo/SEO'
import { cn } from '@/lib/utils/utils'

export default function LoginPage() {
  const { t } = useTranslation()
  const { signInWithGoogle, sendMagicLink, user } = useCustomerAuthContext()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already logged in
  interface LocationState {
    from?: {
      pathname?: string
    }
  }
  const state = location.state as LocationState | null
  const from = state?.from?.pathname || '/account/bookings'
  if (user) {
    setTimeout(() => {
      void navigate(from, { replace: true })
    }, 0)
    return null
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !/.+@.+\..+/.test(trimmedEmail)) {
      setError(t('customerPortal.login.invalidEmail'))
      return
    }

    setLoading(true)
    try {
      await sendMagicLink(trimmedEmail)
      setEmailSent(true)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      void navigate(from, { replace: true })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO
        title={t('customerPortal.login.title')}
        description={t('customerPortal.login.subtitle')}
      />
      <main id="main-content" className="bg-cream min-h-[80vh] py-12 px-4 md:py-20 md:px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded border border-sand p-6 md:p-8 max-w-md w-full shadow-sm"
        >
          <div className="text-center mb-6">
            <h1 className="font-display text-4xl text-charcoal mb-2">
              {t('customerPortal.login.title')}
            </h1>
            <p className="font-body text-charcoal text-base">
              {t('customerPortal.login.subtitle')}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded font-body text-sm"
            >
              <p className="font-bold">{t('customerPortal.login.errorTitle')}</p>
              <p>{error}</p>
            </div>
          )}

          {emailSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-slate-pale text-slate-brand rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="font-body text-charcoal text-base mb-6">
                {t('customerPortal.login.linkSent', { email })}
              </p>
              <Link
                to="/"
                className="font-body font-medium text-slate-brand hover:text-slate-dark text-base min-h-[48px] inline-flex items-center justify-center"
              >
                {t('customerPortal.login.backToHome')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={(e) => { void handleEmailSubmit(e) }} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block font-body text-sm text-text-muted mb-1.5">
                    {t('customerPortal.login.emailLabel')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('customerPortal.login.emailPlaceholder')}
                    className="w-full font-body text-base px-4 py-2 border border-sand rounded bg-warm-white focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full bg-slate-brand text-white font-body font-medium text-base rounded',
                    'py-2.5 min-h-[48px] inline-flex items-center justify-center',
                    'hover:bg-slate-dark transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {loading ? t('customerPortal.login.sendingLink') : t('customerPortal.login.sendLinkBtn')}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-sand"></div>
                <span className="flex-shrink mx-4 text-text-muted font-body text-sm">{t('customerPortal.login.or', 'or')}</span>
                <div className="flex-grow border-t border-sand"></div>
              </div>

              <button
                type="button"
                onClick={() => { void handleGoogleLogin() }}
                disabled={loading}
                className={cn(
                  'w-full border border-sand text-charcoal font-body font-medium text-base rounded bg-white',
                  'py-2.5 min-h-[48px] inline-flex items-center justify-center gap-2',
                  'hover:bg-cream transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {/* Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.14 2.87-2.06 4.15v3.45h3.3c1.93-1.78 3.81-4.94 3.81-9.43z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.3-3.45c-.9.6-2.07.96-3.3.96-3.13 0-5.78-2.11-6.73-4.96H3.21v3.56C5.19 21.84 8.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 13.64c-.25-.74-.39-1.5-.39-2.3s.14-1.56.39-2.3V5.48H3.21C2.39 7.12 2 8.94 2 10.79s.39 3.67 1.21 5.31l2.06-2.46z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 8.36 0 5.19 2.16 3.21 5.48l2.06 2.46c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                {t('customerPortal.login.googleBtn')}
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </>
  )
}
