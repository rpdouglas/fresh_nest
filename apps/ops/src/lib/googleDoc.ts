// Creates a Google Doc in the signed-in person's own Drive. The drive.file
// scope only lets this site touch files it created.
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GIS_SRC = 'https://accounts.google.com/gsi/client'
const DOCS = 'https://docs.googleapis.com/v1/documents'

/** An OAuth client ID is public, not a secret. Export is hidden when it is unset. */
export const googleClientId: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}
interface TokenClient {
  requestAccessToken: () => void
}
export interface Gis {
  accounts: {
    /** "Sign in with Google": proves who someone is with an ID token. */
    id: {
      initialize: (config: { client_id: string; auto_select?: boolean; callback: (r: { credential?: string }) => void }) => void
      renderButton: (parent: HTMLElement, options: { theme: string; size: string; text: string; type: string }) => void
      /** One Tap: offers (or with auto_select, completes) sign-in without a click. */
      prompt: () => void
      disableAutoSelect: () => void
    }
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (r: TokenResponse) => void
        error_callback: (e: { type?: string }) => void
      }) => TokenClient
    }
  }
}
declare global {
  interface Window {
    google?: Gis
  }
}

export class ExportError extends Error {}

let gis: Promise<Gis> | null = null
let token: { value: string; expires: number } | null = null

/**
 * Loads Google's sign-in script. Call this before the button is pressed: a
 * sign-in popup opened after waiting on a download gets blocked.
 */
export function preloadGoogle(): Promise<Gis> {
  gis ??= new Promise<Gis>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = GIS_SRC
    el.async = true
    el.onload = () => (window.google ? resolve(window.google) : reject(new ExportError('Google sign-in did not load.')))
    el.onerror = () => {
      gis = null
      reject(new ExportError('Could not reach Google sign-in. Check your connection.'))
    }
    document.head.append(el)
  })
  return gis
}

async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value
  const google = await preloadGoogle()
  return new Promise<string>((resolve, reject) => {
    google.accounts.oauth2
      .initTokenClient({
        client_id: googleClientId,
        scope: SCOPE,
        callback: (r) => {
          if (!r.access_token) {
            const denied = r.error === 'access_denied'
            return reject(new ExportError(denied ? 'Google access was not granted, so no Doc was created.' : 'Google sign-in failed.'))
          }
          token = { value: r.access_token, expires: Date.now() + (r.expires_in ?? 3600) * 1000 }
          resolve(r.access_token)
        },
        error_callback: (e) =>
          reject(
            new ExportError(
              e.type === 'popup_failed_to_open'
                ? 'The Google sign-in window was blocked. Allow pop-ups for this site and try again.'
                : 'Google sign-in was closed before it finished.',
            ),
          ),
      })
      .requestAccessToken()
  })
}

async function call(url: string, bearer: string, body: unknown): Promise<Record<string, unknown>> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ExportError('Could not reach Google Docs. Check your connection.')
  }
  const data = await res.json().catch(() => ({}))
  if (res.ok) return data
  if (res.status === 401) token = null
  const reason: string = data?.error?.message ?? ''
  if (res.status === 403 && /has not been used|is disabled/i.test(reason)) {
    throw new ExportError('The Google Docs API is not switched on for this site yet.')
  }
  throw new ExportError(`Google Docs refused the request (${res.status}). ${reason}`.trim())
}

/** Creates the Doc and returns its address. */
export async function createDoc(title: string, text: string): Promise<string> {
  const bearer = await accessToken()
  const doc = await call(DOCS, bearer, { title })
  const id = String(doc.documentId)
  // Monospace so the indented columns line up. Docs counts in UTF-16 units, as string length does.
  await call(`${DOCS}/${id}:batchUpdate`, bearer, {
    requests: [
      { insertText: { location: { index: 1 }, text } },
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: 1 + text.length },
          textStyle: { weightedFontFamily: { fontFamily: 'Roboto Mono' }, fontSize: { magnitude: 10, unit: 'PT' } },
          fields: 'weightedFontFamily,fontSize',
        },
      },
    ],
  })
  return `https://docs.google.com/document/d/${id}/edit`
}
