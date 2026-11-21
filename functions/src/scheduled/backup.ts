import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import { applicationDefault } from 'firebase-admin/app'
import { logError } from '../lib/shared'
import { BUSINESS_TZ, todayInZone } from '../shared/time'

export const DEFAULT_BACKUP_BUCKET = 'freshnest-aa51e-firestore-backups'
export const DEFAULT_PROJECT_ID = 'freshnest-aa51e'
export const DEFAULT_DATABASE_ID = '(default)'

export function buildBackupOutputUri(bucket: string, dateStr: string): string {
  const cleanBucket = bucket.replace(/^gs:\/\//, '').replace(/\/+$/, '')
  return `gs://${cleanBucket}/daily/${dateStr}`
}

export interface TriggerFirestoreExportParams {
  projectId: string
  databaseId: string
  outputUriPrefix: string
  getAccessToken: () => Promise<string>
  fetchImpl?: typeof fetch
}

export interface ExportOperationResult {
  name: string
  outputUriPrefix: string
}

/**
 * Starts an asynchronous Firestore managed export of all collections to Cloud Storage.
 * Pure enough to unit-test with injected `getAccessToken` and `fetchImpl`.
 */
export async function triggerFirestoreExport(
  params: TriggerFirestoreExportParams,
): Promise<ExportOperationResult> {
  const {
    projectId,
    databaseId,
    outputUriPrefix,
    getAccessToken,
    fetchImpl = fetch,
  } = params

  const token = await getAccessToken()
  const encodedDb = encodeURIComponent(databaseId)
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodedDb}:exportDocuments`

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ outputUriPrefix }),
  })

  const rawBody = await response.text()
  if (!response.ok) {
    throw new Error(`Firestore export failed (HTTP ${response.status}): ${rawBody}`)
  }

  let parsed: { name?: string } = {}
  try {
    parsed = JSON.parse(rawBody) as { name?: string }
  } catch {
    // Non-JSON response should not happen on 200, keep name fallback
  }

  return {
    name: parsed.name || 'unknown-operation',
    outputUriPrefix,
  }
}

/**
 * W0-5 (MP-S6.P4): Daily scheduled Firestore export of the `(default)` production database
 * to the dedicated `US` GCS backup bucket (`gs://freshnest-aa51e-firestore-backups/daily/YYYY-MM-DD`).
 * Runs at 03:00 America/Toronto (ADR-020) alongside Google-managed native backup schedules.
 */
export const onDailyFirestoreExport = onSchedule(
  {
    schedule: '0 3 * * *', // 3:00 AM Toronto time daily
    timeZone: BUSINESS_TZ,
  },
  async () => {
    const projectId = process.env['GCLOUD_PROJECT'] || process.env['GCP_PROJECT'] || DEFAULT_PROJECT_ID
    const bucket = process.env['BACKUP_BUCKET'] || DEFAULT_BACKUP_BUCKET
    const dateStr = todayInZone()
    const outputUriPrefix = buildBackupOutputUri(bucket, dateStr)

    try {
      const result = await triggerFirestoreExport({
        projectId,
        databaseId: DEFAULT_DATABASE_ID,
        outputUriPrefix,
        getAccessToken: async () => {
          const tokenObj = await applicationDefault().getAccessToken()
          return tokenObj.access_token
        },
      })
      logger.info(
        `[onDailyFirestoreExport] Started export ${result.name} -> ${result.outputUriPrefix}`,
      )
    } catch (err) {
      logError(`[onDailyFirestoreExport] Failed to export to ${outputUriPrefix}:`, err)
      throw err
    }
  },
)
