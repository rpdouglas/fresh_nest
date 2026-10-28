import { serverTimestamp } from 'firebase/firestore'
import type { AuditSource, LastChange } from '../domain/audit'

/**
 * P3-E37: the `lastChange` stamp every app save on an audited record carries. The audit trigger
 * credits the change to `by`; firestore.rules checks `by` is the signed-in email and `at` is the
 * request time. Pass the signed-in user's email (`auth.currentUser?.email`); the public quote form
 * has none and is stamped `public`.
 */
export function changeStamp(
  email: string | null | undefined,
  source: AuditSource,
  extra: { reason?: string | null; overrideType?: string | null } = {},
): LastChange {
  const by = email?.trim().toLowerCase() || 'public'
  return {
    by,
    at: serverTimestamp(),
    source,
    reason: extra.reason?.trim() ? extra.reason.trim().slice(0, 500) : null,
    overrideType: extra.overrideType ?? null,
  }
}
