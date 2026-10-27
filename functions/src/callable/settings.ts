import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { db, logError } from '../lib/shared'
import { resolveOfficeRole } from '../lib/roles'
import {
  normalizePolicySettings,
  validatePolicySettingsInput,
  computePolicyDiff,
  type PolicySettingsValues,
  type PolicyFieldDiff,
} from '../shared/policy'

export interface PreparedPolicyUpdate {
  version: number
  changes: PolicyFieldDiff[]
  nextDoc: PolicySettingsValues & {
    version: number
    updatedAt: Date
    updatedBy: string
    lastChangeReason: string | null
  }
  historyEntry: {
    version: number
    changedAt: Date
    changedBy: string
    reason: string | null
    changes: PolicyFieldDiff[]
    snapshot: PolicySettingsValues
  }
  auditEntry: {
    collection: 'settings'
    documentId: 'policy'
    field: string
    oldValue: unknown
    newValue: unknown
    changedBy: string
    changedAt: Date
    reason: string | null
    overrideType: 'policy_change'
  }
}

/**
 * Pure helper for P3-E36 (W0-2) `updatePolicySettings`.
 * Validates incoming policy settings, computes field-level diffs against the previous
 * snapshot (or DEFAULT_POLICY_SETTINGS if first save), increments version, and builds
 * the `settings/policy` document, `settings/policy/history/{version}` entry, and `auditLog` entry.
 */
export function preparePolicyUpdate(params: {
  currentDoc: Record<string, unknown> | undefined
  input: unknown
  changedBy: string
  now?: Date
}): PreparedPolicyUpdate {
  const { currentDoc, input, changedBy, now = new Date() } = params
  const validation = validatePolicySettingsInput(input)
  if (!validation.ok) {
    throw new HttpsError('invalid-argument', validation.error)
  }

  const previousValues = normalizePolicySettings(currentDoc)
  const changes = computePolicyDiff(previousValues, validation.values)
  const currentVersion =
    typeof currentDoc?.version === 'number' && Number.isFinite(currentDoc.version) && currentDoc.version >= 0
      ? Math.floor(currentDoc.version)
      : 0
  const nextVersion = currentVersion + 1

  const nextDoc = {
    ...validation.values,
    version: nextVersion,
    updatedAt: now,
    updatedBy: changedBy,
    lastChangeReason: validation.reason,
  }

  const historyEntry = {
    version: nextVersion,
    changedAt: now,
    changedBy,
    reason: validation.reason,
    changes,
    snapshot: validation.values,
  }

  const changedFieldsSummary =
    changes.length === 0
      ? 'snapshot'
      : changes.length === 1
        ? changes[0].field
        : changes.map((c) => c.field).join(', ')

  const oldValueSummary =
    changes.length === 1
      ? changes[0].oldValue
      : Object.fromEntries(changes.map((c) => [c.field, c.oldValue]))
  const newValueSummary =
    changes.length === 1
      ? changes[0].newValue
      : Object.fromEntries(changes.map((c) => [c.field, c.newValue]))

  const auditEntry = {
    collection: 'settings' as const,
    documentId: 'policy' as const,
    field: changedFieldsSummary,
    oldValue: oldValueSummary,
    newValue: newValueSummary,
    changedBy,
    changedAt: now,
    reason: validation.reason,
    overrideType: 'policy_change' as const,
  }

  return {
    version: nextVersion,
    changes,
    nextDoc,
    historyEntry,
    auditEntry,
  }
}

/**
 * P3-E36 (W0-2): Callable Cloud Function allowing an Owner to update operational policy settings
 * (`settings/policy`) with an append-only version snapshot (`settings/policy/history/{version}`)
 * and an `auditLog` entry.
 */
export const updatePolicySettings = onCall(async (request) => {
  const caller = request.auth
  if (!caller) {
    throw new HttpsError('unauthenticated', 'User must be logged in.')
  }

  const role = await resolveOfficeRole(caller, db)
  if (role !== 'owner') {
    throw new HttpsError('permission-denied', 'Only an Owner can update operational settings.')
  }

  const changedBy = caller.token.email?.trim().toLowerCase() || caller.uid

  try {
    const policyRef = db.collection('settings').doc('policy')
    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(policyRef)
      const currentDoc = snap.exists ? (snap.data() as Record<string, unknown>) : undefined
      const prepared = preparePolicyUpdate({
        currentDoc,
        input: request.data,
        changedBy,
      })

      const historyRef = policyRef.collection('history').doc(String(prepared.version))
      const auditRef = db.collection('auditLog').doc()

      transaction.set(policyRef, prepared.nextDoc)
      transaction.set(historyRef, prepared.historyEntry)
      transaction.set(auditRef, prepared.auditEntry)

      return {
        version: prepared.version,
        changesCount: prepared.changes.length,
      }
    })

    logger.info(
      `[updatePolicySettings] Saved settings/policy v${result.version} by ${changedBy} (${result.changesCount} field changes)`,
    )
    return {
      success: true,
      version: result.version,
      changesCount: result.changesCount,
    }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    logError('[updatePolicySettings] Failed to update policy settings:', err)
    throw new HttpsError('internal', 'Failed to update operational policy settings.')
  }
})
