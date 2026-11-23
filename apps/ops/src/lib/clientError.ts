// Faults in the site, sent to the server's log so that somebody hears about them
// (POST /api/client-error; the error alert in docs/operations.md picks them up).
import { ApiError } from '../api'

export type ErrorSource = 'render' | 'window' | 'promise'

export interface ErrorReport {
  message: string
  stack: string | null
  componentStack: string | null
  /** The report that was open. Not the page address or the search box, which can hold a client's name. */
  view: string | null
  source: ErrorSource
}

/** The server keeps this much of each field; cut here too, so a long stack cannot make the send too big to go. */
const MAX_MESSAGE = 500
const MAX_STACK = 4000

/** At most this many reports from one page load: a fault that repeats must not fill the log. */
const MAX_REPORTS = 5

type Send = (report: ErrorReport, token: string) => void

/** A reporter with its own count and memory of what it has sent; the site uses the one below. */
export function createReporter(send: Send) {
  let token: string | null = null
  let view: string | null = null
  const seen = new Set<string>()

  return {
    /** Who is signed in, and which report is open. Nothing is sent while nobody is signed in: the route needs a sign-in. */
    setContext(nextToken: string | null, nextView: string | null) {
      token = nextToken
      view = nextView
    },
    /** Sends one fault, unless it is not ours, was sent already, or the limit is reached. Never throws. */
    report(error: unknown, at: { source: ErrorSource; componentStack?: string | null }) {
      try {
        if (!token || seen.size >= MAX_REPORTS || !isOurs(error)) return
        const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
        const stack = error instanceof Error ? (error.stack ?? null) : null
        const key = `${message}\n${stack?.split('\n')[1] ?? ''}`
        if (seen.has(key)) return
        seen.add(key)
        send({ message: message.slice(0, MAX_MESSAGE), stack: stack?.slice(0, MAX_STACK) ?? null, componentStack: at.componentStack?.slice(0, MAX_STACK) ?? null, view, source: at.source }, token)
      } catch {
        // reporting a fault must never cause another one
      }
    },
  }
}

/**
 * A report's code could not be fetched: the connection dropped, or the site was redeployed and
 * this tab had not fetched that report yet. Each browser words it its own way.
 */
export const isCodeLoadError = (error: unknown): boolean =>
  /dynamically imported module|Importing a module script failed/i.test(error instanceof Error ? error.message : String(error))

/** Not a fault in this app: a request that was cancelled or refused (shown on screen already), code that could not be fetched (the person is told to reload), or another site's script. */
function isOurs(error: unknown): boolean {
  if (error instanceof ApiError || isCodeLoadError(error)) return false
  if (error instanceof Error && error.name === 'AbortError') return false
  const text = error instanceof Error ? error.message : String(error)
  // what a browser says about an error in a script from another origin (Google's sign-in), with no detail
  return text !== 'Script error.' && text !== ''
}

const post: Send = (report, token) => {
  void fetch('/api/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Editor-Token': token },
    body: JSON.stringify(report),
    keepalive: true,
  }).catch(() => {
    // dropped: no retry, no second error
  })
}

const reporter = createReporter(post)
export const setErrorReporter = reporter.setContext
export const reportError = reporter.report
