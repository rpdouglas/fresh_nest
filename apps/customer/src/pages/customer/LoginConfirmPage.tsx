import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCustomerAuthContext } from '@/components/layout/CustomerAuthContext'
import SEO from '@/components/seo/SEO'
import { cn } from '@/lib/utils/utils'

export default function LoginConfirmPage() {
  const { t } = useTranslation()
  const { confirmMagicLink } = useCustomerAuthContext()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const confirmAttempted = useRef(false)

  useEffect(() => {
    if (confirmAttempted.current) return
    confirmAttempted.current = true

    const verifyLink = async () => {
      try {
        await confirmMagicLink()
        setStatus('success')
        setTimeout(() => {
          void navigate('/account/bookings', { replace: true })
        }, 1500)
      } catch (err) {
        console.error('Magic link confirmation error:', err)
        setStatus('error')
        const errMsg = err instanceof Error ? err.message : t('customerPortal.confirm.error')
        setErrorMsg(errMsg)
      }
    }

    void verifyLink()
  }, [confirmMagicLink, navigate, t])

  return (
    <>
      <SEO
        title={t('customerPortal.confirm.title')}
        description={t('customerPortal.confirm.status')}
      />
      <main id="main-content" className="bg-cream min-h-[80vh] py-12 px-4 md:py-20 md:px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded border border-sand p-6 md:p-8 max-w-md w-full shadow-sm text-center"
        >
          <h1 className="font-sub text-2xl text-charcoal mb-4">
            {t('customerPortal.confirm.title')}
          </h1>

          {status === 'pending' && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-slate-brand border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-body text-charcoal text-base">
                {t('customerPortal.confirm.status')}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-pale text-slate-brand rounded-full flex items-center justify-center mb-4">
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
              <p className="font-body text-slate-brand text-base font-bold">
                {t('customerPortal.confirm.success')}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div role="alert" className="mb-6">
                <p className="font-body text-red-700 text-sm font-bold mb-1">
                  {t('customerPortal.login.errorTitle')}
                </p>
                <p className="font-body text-charcoal text-base">
                  {errorMsg}
                </p>
              </div>
              <Link
                to="/login"
                className={cn(
                  'w-full bg-slate-brand text-white font-body font-medium text-base rounded',
                  'py-2.5 min-h-[48px] inline-flex items-center justify-center',
                  'hover:bg-slate-dark transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                )}
              >
                {t('customerPortal.confirm.tryAgain', 'Try Again')}
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </>
  )
}
