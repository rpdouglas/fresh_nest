import { describe, it, expect, vi } from 'vitest'
import {
  buildBackupOutputUri,
  triggerFirestoreExport,
  DEFAULT_BACKUP_BUCKET,
} from '../src/scheduled/backup'

describe('W0-5 scheduled Firestore export (backup.ts)', () => {
  it('builds a clean gs:// daily output URI', () => {
    expect(buildBackupOutputUri(DEFAULT_BACKUP_BUCKET, '2026-11-21')).toBe(
      'gs://freshnest-aa51e-firestore-backups/daily/2026-11-21',
    )
    expect(buildBackupOutputUri('gs://my-bucket/', '2026-11-21')).toBe(
      'gs://my-bucket/daily/2026-11-21',
    )
  })

  it('calls the Firestore exportDocuments REST API with Bearer token and returns operation name', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          name: 'projects/freshnest-aa51e/databases/(default)/operations/op-123',
        }),
    })

    const res = await triggerFirestoreExport({
      projectId: 'freshnest-aa51e',
      databaseId: '(default)',
      outputUriPrefix: 'gs://freshnest-aa51e-firestore-backups/daily/2026-11-21',
      getAccessToken: async () => 'fake-token',
      fetchImpl: fetchMock as unknown as typeof fetch,
    })

    expect(res).toEqual({
      name: 'projects/freshnest-aa51e/databases/(default)/operations/op-123',
      outputUriPrefix: 'gs://freshnest-aa51e-firestore-backups/daily/2026-11-21',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(
      'https://firestore.googleapis.com/v1/projects/freshnest-aa51e/databases/(default):exportDocuments',
    )
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer fake-token')
    expect(JSON.parse(String(init.body))).toEqual({
      outputUriPrefix: 'gs://freshnest-aa51e-firestore-backups/daily/2026-11-21',
    })
  })

  it('throws a descriptive error when Firestore returns a non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Permission denied',
    })

    await expect(
      triggerFirestoreExport({
        projectId: 'freshnest-aa51e',
        databaseId: '(default)',
        outputUriPrefix: 'gs://freshnest-aa51e-firestore-backups/daily/2026-11-21',
        getAccessToken: async () => 'fake-token',
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/HTTP 403/)
  })
})
