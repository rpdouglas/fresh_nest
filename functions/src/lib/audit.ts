import { FieldValue } from 'firebase-admin/firestore'
import type { LastChange } from '../shared/audit'

// P3-E37: the `lastChange` stamp for writes made by server code. Use the caller's email when a
// callable acts for a person (e.g. claimJob), otherwise `system:<function>`.
export function serverStamp(
  by: string,
  extra: { source?: LastChange['source']; reason?: string | null; overrideType?: string | null } = {},
): LastChange {
  return {
    by: by.includes('@') ? by.trim().toLowerCase() : by.startsWith('system:') ? by : `system:${by}`,
    at: FieldValue.serverTimestamp(),
    source: extra.source ?? (by.includes('@') ? 'staff_app' : 'system'),
    reason: extra.reason ?? null,
    overrideType: extra.overrideType ?? null,
  }
}
