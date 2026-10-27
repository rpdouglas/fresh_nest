/**
 * HOTFIX-10: Role claim resolution with server self-healing (`syncRole`) and
 * new-account retry backoff (`schedule`).
 *
 * Why both:
 * 1. When a brand-new user signs in for the first time, `onUserCreated` is an async
 *    background trigger that may take several seconds to call `setCustomUserClaims`.
 * 2. When an existing user was pre-approved in `admins/{email}` (or `staff`) after
 *    their Auth account already existed (or if `onUserCreated` timed out earlier),
 *    calling `syncRole` reconciles their custom claim on the server immediately so
 *    the next token refresh carries the qualifying role.
 */

export const DEFAULT_NEW_ACCOUNT_WINDOW_MS = 5 * 60 * 1000
export const DEFAULT_RETRY_SCHEDULE_MS: readonly number[] = [1000, 2000, 3000, 4000, 5000, 5000]

export function isNewAccount(
  creationTime?: string | null,
  now: number = Date.now(),
  windowMs: number = DEFAULT_NEW_ACCOUNT_WINDOW_MS,
): boolean {
  if (!creationTime) return false
  const createdMs = Date.parse(creationTime)
  if (Number.isNaN(createdMs)) return false
  return now - createdMs < windowMs
}

function sleep(ms: number, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) return Promise.resolve(false)
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve(true)
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      resolve(false)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export interface WaitForRoleClaimOptions {
  /** Optional already-fetched initial role claim so the caller does not double-fetch on the first pass. */
  initialRole?: unknown
  /** Force-refreshes the ID token and returns the raw `claims.role` value. */
  getRole: () => Promise<unknown>
  /** True when the role qualifies for the current app (e.g. `officeRoleOf(r) !== null` or `isStaffAppRole(r)`). */
  accepts: (role: unknown) => boolean
  /** Optional server-side self-heal callable (`syncMyRole`) that reconciles `admins/{email}` / `staff` into Auth claims. */
  syncRole?: () => Promise<{ role?: unknown; updated?: boolean } | void>
  /** Whether the user's Auth account was created within the last few minutes (enables backoff polling for `onUserCreated`). */
  isNewAccount: boolean
  /** Optional AbortSignal cancelled on sign-out, auth-state change, or unmount. */
  signal?: AbortSignal
  /** Delay schedule in ms between token refreshes for brand-new accounts. */
  schedule?: readonly number[]
}

export async function waitForRoleClaim(options: WaitForRoleClaimOptions): Promise<unknown> {
  const {
    getRole,
    accepts,
    syncRole,
    isNewAccount: newAccount,
    signal,
    schedule = DEFAULT_RETRY_SCHEDULE_MS,
  } = options

  const hasInitialRole = 'initialRole' in options
  let currentRole = hasInitialRole ? options.initialRole : await getRole()
  if (signal?.aborted || accepts(currentRole)) {
    return currentRole
  }

  // Self-heal via server callable (`syncMyRole`) if provided — covers both pre-approved
  // existing accounts (like Lauren's) and brand-new accounts before `onUserCreated` finishes.
  if (syncRole) {
    try {
      const synced = await syncRole()
      if (signal?.aborted) return currentRole
      if (synced && (synced.updated || accepts(synced.role))) {
        currentRole = await getRole()
        if (signal?.aborted || accepts(currentRole)) {
          return currentRole
        }
      }
    } catch {
      // Ignore callable errors (e.g. offline or unit-test environments without functions)
    }
  }

  if (!newAccount) {
    return currentRole
  }

  for (const delayMs of schedule) {
    const ok = await sleep(delayMs, signal)
    if (!ok || signal?.aborted) return currentRole
    currentRole = await getRole()
    if (signal?.aborted || accepts(currentRole)) {
      return currentRole
    }
  }

  return currentRole
}
