import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import { fadeUp } from '@/lib/utils/animations'

interface LoginPanelProps {
  handleSignIn: () => Promise<void> | void
  authError: string | null
}

export function LoginPanel({ handleSignIn, authError }: LoginPanelProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      key="login-gate"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeUp}
      className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-6 md:p-8 mx-auto"
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
          <h1 className="font-display text-5xl text-charcoal">
            {t('admin.login.heading')}
          </h1>
          <p className="font-body text-base text-text-muted">
            {t('admin.login.subhead')}
          </p>
        </div>

        {authError && (
          <div className="w-full p-3 bg-red-50 border border-red-200 text-red-700 rounded text-base font-body">
            {authError}
          </div>
        )}

        <button
          onClick={() => { void handleSignIn() }}
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
  )
}
