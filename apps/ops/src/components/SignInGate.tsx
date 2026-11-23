// The page shown until someone signs in: Fresh Nest Firebase Auth Google sign-in for office
// (Owner / Manager, ADR-022 / P3-E41 Strategy 2) or active cleaners with Google, or a 6-digit
// emailed Camelo code for cleaners (decisions 0037 and 0045).
import { type FormEvent, useCallback, useState } from 'react'
import { clockAction, whoami } from '../api'
import { isFirebaseConfigured, signInWithFirebaseGoogle } from '../lib/firebase'
import Sparkle from './Sparkle'
import Spinner from './Spinner'
import type { Editor } from './useEditor'

export default function SignInGate({ note, onSignedIn }: { note: string | null; onSignedIn: (e: Editor) => void }) {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devEmail, setDevEmail] = useState('dev@example.com')
  const [codeOpen, setCodeOpen] = useState(false)
  const [codeEmail, setCodeEmail] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')

  // The server checks the Firebase ID token and `admins/{email}` (or Camelo cleaner list); only then is the person let in.
  const check = useCallback(
    (token: string) => {
      setChecking(true)
      setError(null)
      whoami(token)
        .then((who) => onSignedIn({ token, email: who.email, role: who.role === 'cleaner' ? 'cleaner' : 'office', name: who.name }))
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Sign-in could not be checked.'))
        .finally(() => setChecking(false))
    },
    [onSignedIn],
  )

  const handleGoogleSignIn = () => {
    if (checking) return
    setChecking(true)
    setError(null)
    signInWithFirebaseGoogle()
      .then((idToken) => check(idToken))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Google sign-in could not be completed.')
        setChecking(false)
      })
  }

  const devSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (devEmail.trim()) check(`dev:${devEmail.trim()}`)
  }

  const requestCode = (e: FormEvent) => {
    e.preventDefault()
    const email = codeEmail.trim()
    if (!email || checking) return
    setChecking(true)
    setError(null)
    clockAction<{ sessionToken: string }>({ action: 'signInRequestCode', email }, '')
      .then((r) => {
        setSessionToken(r.sessionToken)
        setOtpCode('')
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not send a sign-in code.'))
      .finally(() => setChecking(false))
  }

  const verifyCode = (e: FormEvent) => {
    e.preventDefault()
    const email = codeEmail.trim()
    const cleanCode = otpCode.replace(/\s+/g, '')
    if (!email || !sessionToken || !cleanCode || checking) return
    setChecking(true)
    setError(null)
    clockAction<{ ok: boolean; token: string; email: string; role: 'cleaner'; name: string }>(
      { action: 'signInVerifyCode', email, sessionToken, code: cleanCode },
      '',
    )
      .then((r) => onSignedIn({ token: r.token, email: r.email, role: 'cleaner', name: r.name }))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not check the code.'))
      .finally(() => setChecking(false))
  }

  const message = error ?? note
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-hairline bg-surface-raised p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink">FNC Landing</h1>
            <Sparkle size={18} className="text-clay" />
          </div>
          <img src="/favicon.png" alt="" aria-hidden="true" className="size-10 rounded-full" />
        </div>
        <p className="mt-1 text-sm text-ink-muted">Sign in with your Fresh Nest Owner or Manager Google account.</p>
        <div className="mt-4 flex min-h-12 items-center gap-3">
          {isFirebaseConfigured ? (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={checking}
              className="flex min-h-12 flex-1 items-center justify-center gap-2.5 rounded-lg border border-outline bg-surface-raised px-4 py-2.5 text-base font-semibold text-ink transition hover:border-accent disabled:opacity-60"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              Sign in with Google
            </button>
          ) : (
            <p className="text-sm text-ink-muted">Firebase Google sign-in is not configured in this local build.</p>
          )}
          {checking && <Spinner className="size-5" />}
        </div>
        <div className="mt-4 border-t border-hairline pt-4 text-sm">
          {!codeOpen ? (
            <button
              type="button"
              onClick={() => {
                setCodeOpen(true)
                setError(null)
              }}
              className="hover:bg-surface-muted rounded-lg border border-outline px-3 py-1.5 font-medium text-ink transition"
            >
              Email me a sign-in code
            </button>
          ) : !sessionToken ? (
            <form onSubmit={requestCode} className="space-y-2.5">
              <p className="text-xs text-ink-muted">Cleaners: enter your Camelo work email to get a 6-digit sign-in code.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  aria-label="Work email"
                  placeholder="Work email"
                  value={codeEmail}
                  onChange={(e) => setCodeEmail(e.target.value)}
                  disabled={checking}
                  className="min-w-0 flex-1 rounded-lg border border-outline bg-transparent px-2.5 py-1.5"
                />
                <button
                  type="submit"
                  disabled={checking || !codeEmail.trim()}
                  className="bg-brand hover:bg-brand-hover rounded-lg px-3 py-1.5 font-semibold text-white transition disabled:opacity-60"
                >
                  Send code
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-2.5">
              <p className="text-xs text-ink-muted">Enter the 6-digit code Camelo emailed to {codeEmail.trim()}.</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  aria-label="One-time code"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={checking}
                  className="w-28 rounded-lg border border-outline bg-transparent px-2.5 py-1.5 font-mono text-sm tracking-widest"
                />
                <button
                  type="submit"
                  disabled={checking || !/^\d{4,8}$/.test(otpCode.replace(/\s+/g, ''))}
                  className="bg-brand hover:bg-brand-hover rounded-lg px-3 py-1.5 font-semibold text-white transition disabled:opacity-60"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  disabled={checking}
                  onClick={requestCode}
                  className="hover:bg-surface-muted rounded-lg border border-outline px-2.5 py-1.5 text-xs font-medium text-ink transition disabled:opacity-60"
                >
                  Send a new code
                </button>
              </div>
            </form>
          )}
        </div>
        {import.meta.env.DEV && (
          // The dev server accepts "dev:<email>" for anyone in its SCHEDULE_EDITORS (default dev@example.com).
          <form onSubmit={devSubmit} className="mt-4 flex gap-2 border-t border-hairline pt-4 text-sm">
            <input
              aria-label="Dev sign-in email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-outline bg-transparent px-2.5 py-1.5"
            />
            <button type="submit" className="rounded-lg border border-outline px-2.5 py-1.5">
              Dev sign-in
            </button>
          </form>
        )}
        {message && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
