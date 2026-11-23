// The page shown until someone signs in: Google sign-in for the office or cleaners, or a 6-digit emailed
// Camelo code for an active cleaner who has not linked a Google account (decisions 0037 and 0045).
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { clockAction, whoami } from '../api'
import { googleClientId, preloadGoogle } from '../lib/googleDoc'
import Sparkle from './Sparkle'
import Spinner from './Spinner'
import type { Editor } from './useEditor'

export default function SignInGate({ note, onSignedIn }: { note: string | null; onSignedIn: (e: Editor) => void }) {
  const slot = useRef<HTMLDivElement>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devEmail, setDevEmail] = useState('dev@example.com')
  const [codeOpen, setCodeOpen] = useState(false)
  const [codeEmail, setCodeEmail] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')

  // The server checks the token and the list; only then is the person let in.
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

  useEffect(() => {
    if (!googleClientId || !slot.current) return
    let live = true
    const el = slot.current
    preloadGoogle()
      .then((google) => {
        if (!live) return
        google.accounts.id.initialize({
          client_id: googleClientId,
          // someone who signed in before is let straight back in
          auto_select: true,
          callback: ({ credential }) => credential && check(credential),
        })
        google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', text: 'signin_with', type: 'standard' })
        google.accounts.id.prompt()
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Google sign-in did not load.'))
    return () => {
      live = false
    }
  }, [check])

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
        <p className="mt-1 text-sm text-ink-muted">Sign in with the Google account you were given access with.</p>
        <div className="mt-4 flex min-h-11 items-center gap-3">
          {googleClientId ? <div ref={slot} /> : <p className="text-sm">Google sign-in is not set up: VITE_GOOGLE_CLIENT_ID is empty.</p>}
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
