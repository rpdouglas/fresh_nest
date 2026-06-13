import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { User } from 'firebase/auth'
import { cn } from '@/lib/utils/utils'
import { fadeUp } from '@/lib/utils/animations'

interface AccessDeniedPanelProps {
  user: User
  handleSignOut: () => Promise<void> | void
  authError: string | null
}

export function AccessDeniedPanel({ user, handleSignOut, authError }: AccessDeniedPanelProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      key="access-denied"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeUp}
      className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-6 md:p-8 mx-auto"
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
          <h1 className="font-display text-5xl text-charcoal">
            {t('admin.login.errorTitle')}
          </h1>
          <p className="font-body text-base text-text-muted">
            {authError || t('admin.login.errorMessage', { email: user.email })}
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => { void handleSignOut() }}
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
  )
}
