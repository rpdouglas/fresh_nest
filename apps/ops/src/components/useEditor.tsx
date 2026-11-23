// Sign-in state: someone from the office (Google sign-in, sees every report and can change timesheets) or a
// cleaner (Google sign-in or a 6-digit Camelo email code, sees My week only; decisions 0037 and 0045).
// The role kept here only chooses the page; the server decides what is sent.
import { useCallback, useEffect, useState } from 'react'

export interface Editor {
  token: string
  email: string
  role: 'office' | 'cleaner'
  /** A cleaner's name, from Camelo. */
  name?: string
}

const KEY = 'schedule.signin'
const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'
const MAX_TIMEOUT_MS = 2_147_483_647

/** Seconds since 1970 when a Google ID token or cleaner session token stops being accepted, or null if unreadable. */
export function tokenExpiry(token: string): number | null {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const exp = JSON.parse(atob(part)).exp
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

/** The sign-in kept for this tab (or in localStorage for a 30-day cleaner code session), unless it has run out. */
function readStored(now = Date.now()): Editor | null {
  try {
    const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY) ?? 'null'
    const e = JSON.parse(raw) as Editor | null
    if (!e?.token || !e.email) return null
    // a sign-in kept from before there were roles is the office's
    if (e.role !== 'cleaner') e.role = 'office'
    const exp = tokenExpiry(e.token)
    return exp === null || exp * 1000 > now + 60_000 ? e : null
  } catch {
    return null
  }
}

function store(e: Editor | null) {
  try {
    sessionStorage.removeItem(KEY)
    localStorage.removeItem(KEY)
    if (!e) return
    // Cleaner code sessions (c1.) last 30 days across phone app restarts; Google/dev tokens stay per-tab.
    if (e.token.startsWith('c1.')) localStorage.setItem(KEY, JSON.stringify(e))
    else sessionStorage.setItem(KEY, JSON.stringify(e))
  } catch {
    // storage unavailable: the sign-in just won't survive a reload
  }
}

/** Who is signed in, and the ways that ends. Any 401 or 403 from the server should call `expire`. */
export function useEditor() {
  const [editor, setEditor] = useState<Editor | null>(readStored)
  const [note, setNote] = useState<string | null>(null)

  const signIn = useCallback((e: Editor) => {
    store(e)
    setEditor(e)
    setNote(null)
  }, [])

  /** Call when a request comes back refused because the sign-in is missing, expired or not allowed. */
  const expire = useCallback((message: string) => {
    store(null)
    setEditor(null)
    setNote(message)
  }, [])

  const signOut = useCallback(() => {
    store(null)
    setEditor(null)
    setNote(null)
    // otherwise Google signs the same person straight back in
    window.google?.accounts.id.disableAutoSelect()
  }, [])

  // An ID token lasts an hour (or 30 days for a cleaner code session): ask again just before it runs out.
  useEffect(() => {
    const exp = editor && tokenExpiry(editor.token)
    if (!exp) return
    const delay = Math.min(MAX_TIMEOUT_MS, Math.max(0, exp * 1000 - Date.now() - 60_000))
    const t = setTimeout(() => expire(EXPIRED), delay)
    return () => clearTimeout(t)
  }, [editor, expire])

  return { editor, note, signIn, expire, signOut }
}
