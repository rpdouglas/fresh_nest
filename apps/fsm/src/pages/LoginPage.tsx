import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { 
    staffProfile, 
    loading, 
    error, 
    setError, 
    signInWithPassword, 
    sendMagicLink, 
    completeMagicLinkSignIn 
  } = useStaffAuth()

  const navigate = useNavigate()

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Complete magic link sign in if landing
  useEffect(() => {
    const completeSignIn = async () => {
      if (window.location.href.includes('apiKey')) {
        setActionLoading(true)
        try {
          await completeMagicLinkSignIn()
        } catch {
          // Error handled in state
        } finally {
          setActionLoading(false)
        }
      }
    }
    void completeSignIn()
  }, [completeMagicLinkSignIn])

  // Redirect if already logged in
  useEffect(() => {
    if (staffProfile) {
      void navigate('/')
    }
  }, [staffProfile, navigate])

  const handlePasswordSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setActionLoading(true)
    setSuccessMessage(null)
    const runSignIn = async () => {
      try {
        await signInWithPassword(email, password)
      } catch {
        // Error is handled in context/state
      } finally {
        setActionLoading(false)
      }
    }
    void runSignIn()
  }

  const handleMagicLinkRequest = () => {
    if (!email) {
      setError('fsm.login.emailRequired')
      return
    }
    setActionLoading(true)
    setError(null)
    setSuccessMessage(null)
    const runMagicLink = async () => {
      try {
        await sendMagicLink(email)
        setSuccessMessage(t('fsm.login.magicLinkSent'))
      } catch {
        // Error is handled in context/state
      } finally {
        setActionLoading(false)
      }
    }
    void runMagicLink()
  }

  const handleLanguageChange = (lang: string) => {
    void i18n.changeLanguage(lang)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-white p-4">
      <div className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-8 space-y-6">
        
        {/* Language Toggle */}
        <div className="flex justify-end gap-2">
          {['en', 'fr', 'ar'].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              className={`min-h-[48px] px-3 py-1 font-body text-base rounded border transition-colors ${
                i18n.language === lang
                  ? 'bg-slate-brand text-white border-slate-brand'
                  : 'bg-white text-charcoal border-sand hover:bg-cream'
              }`}
            >
              {lang === 'ar' ? 'العربية' : lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-charcoal">
            {t('fsm.login.title')}
          </h1>
          <p className="mt-2 font-body text-base text-text-muted">
            {t('fsm.login.subtitle')}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded p-4 font-body text-base text-red-700">
            {t(error)}
          </div>
        )}

        {successMessage && (
          <div role="alert" className="bg-green-50 border border-green-200 rounded p-4 font-body text-base text-green-700">
            {successMessage}
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <div>
            <label className="block font-body text-base text-charcoal mb-1" htmlFor="email">
              {t('fsm.login.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('fsm.login.emailPlaceholder')}
              required
              className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
            />
          </div>

          <div>
            <label className="block font-body text-base text-charcoal mb-1" htmlFor="password">
              {t('fsm.login.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('fsm.login.passwordPlaceholder')}
              className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || actionLoading}
              className="w-full bg-slate-brand text-white font-body text-base font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 disabled:opacity-60"
            >
              {actionLoading && !successMessage ? t('fsm.login.authenticating') : t('fsm.login.signInBtn')}
            </button>
          </div>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-sand"></div>
          <span className="flex-shrink mx-4 font-body text-base text-text-muted uppercase">
            {t('fsm.login.orDivider')}
          </span>
          <div className="flex-grow border-t border-sand"></div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleMagicLinkRequest}
            disabled={loading || actionLoading || !email}
            className="w-full border border-slate-brand text-slate-brand font-body text-base font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-pale transition-colors duration-200 disabled:opacity-60"
          >
            {actionLoading && successMessage === null && email ? t('fsm.login.sendingLink') : t('fsm.login.sendMagicLinkBtn')}
          </button>
        </div>

      </div>
    </div>
  )
}
