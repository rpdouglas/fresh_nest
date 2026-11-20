import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateAgreementToken,
  hashAgreementToken,
  hashAgreementDocument,
  isValidTokenFormat,
  hashesEqual,
} from '../src/lib/agreementToken'
import { buildSignedAgreementPdf, sanitizeWinAnsi } from '../src/lib/agreementPdf'
import {
  agreementInviteSubject,
  agreementInviteHtml,
  agreementSignedClientSubject,
  agreementSignedClientHtml,
  agreementSignedOfficeSubject,
  agreementSignedOfficeText,
} from '../src/agreementEmailTemplates'
import {
  buildAgreementTermsFromPolicy,
  buildCanonicalAgreementText,
  interpolateAgreementBody,
  MAX_SIGN_FAILED_ATTEMPTS,
} from '../src/shared/agreements'
import { buildAuditEntry } from '../src/shared/audit'

// ── Mocks for callable tests ─────────────────────────────────────────────────

const { store, storageFiles, sendMocks, requestedDbIds, makeFakeDb } = vi.hoisted(() => {
  const store = new Map<string, Record<string, unknown>>()
  const storageFiles = new Map<string, { data: Buffer; options: unknown }>()
  const sendMocks = {
    invite: vi.fn().mockResolvedValue(undefined),
    client: vi.fn().mockResolvedValue(undefined),
    office: vi.fn().mockResolvedValue(undefined),
  }
  const requestedDbIds: string[] = []
  let autoIdCounter = 0

  function makeDocRef(path: string): any {
    return {
      id: path.split('/').pop()!,
      path,
      collection: (sub: string) => makeCollectionRef(`${path}/${sub}`),
      get: async () => ({
        id: path.split('/').pop()!,
        exists: store.has(path),
        data: () => (store.has(path) ? structuredClone(store.get(path)) : undefined),
        ref: makeDocRef(path),
      }),
      set: async (data: Record<string, unknown>) => {
        store.set(path, structuredClone(data))
      },
      update: async (patch: Record<string, unknown>) => {
        const prev = store.get(path) ?? {}
        const next = { ...prev }
        for (const [k, v] of Object.entries(patch)) {
          if (v && typeof v === 'object' && '__inc' in (v as Record<string, unknown>)) {
            next[k] = Number(prev[k] ?? 0) + Number((v as { __inc: number }).__inc)
          } else {
            next[k] = v
          }
        }
        store.set(path, next)
      },
    }
  }

  function makeCollectionRef(prefix: string): any {
    return {
      doc: (id?: string) => makeDocRef(`${prefix}/${id ?? `auto-${++autoIdCounter}`}`),
      where: (field: string, _op: string, value: unknown) => ({
        limit: () => ({
          get: async () => {
            const docs = Array.from(store.entries())
              .filter(([key, val]) => {
                const parts = key.split('/')
                const parent = parts.slice(0, -1).join('/')
                return parent === prefix && val[field] === value
              })
              .map(([key, val]) => ({
                id: key.split('/').pop()!,
                exists: true,
                data: () => structuredClone(val),
                ref: makeDocRef(key),
              }))
            return { empty: docs.length === 0, docs }
          },
        }),
      }),
    }
  }

  function makeFakeDb(dbId: string) {
    requestedDbIds.push(dbId)
    return {
      collection: (name: string) => makeCollectionRef(`${dbId}::${name}`),
      runTransaction: async (fn: (tx: any) => Promise<any>) => {
        const tx = {
          get: (ref: any) => ref.get(),
          set: (ref: any, data: Record<string, unknown>) => ref.set(data),
          update: (ref: any, data: Record<string, unknown>) => ref.update(data),
        }
        return fn(tx)
      },
    }
  }

  return { store, storageFiles, sendMocks, requestedDbIds, makeFakeDb }
})

vi.mock('firebase-admin/app', () => ({ initializeApp: vi.fn() }))
vi.mock('firebase-admin/auth', () => ({ getAuth: vi.fn(() => ({})) }))
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn((dbId?: string) => makeFakeDb(dbId ?? '(default)')),
  FieldValue: {
    serverTimestamp: () => new Date('2026-11-20T22:00:00.000Z'),
    increment: (n: number) => ({ __inc: n }),
  },
  Timestamp: {
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
  },
}))
vi.mock('firebase-admin/storage', () => ({
  getStorage: () => ({
    bucket: () => ({
      file: (filePath: string) => ({
        save: async (data: Buffer, options: unknown) => {
          storageFiles.set(filePath, { data, options })
        },
      }),
    }),
  }),
}))
vi.mock('../src/sendEmail', async () => {
  const actual = await vi.importActual<typeof import('../src/sendEmail')>('../src/sendEmail')
  return {
    ...actual,
    sendAgreementInviteEmail: (...args: unknown[]) => sendMocks.invite(...args),
    sendAgreementSignedClientEmail: (...args: unknown[]) => sendMocks.client(...args),
    sendAgreementSignedOfficeEmail: (...args: unknown[]) => sendMocks.office(...args),
  }
})

// Import callables after mocks
import {
  createAgreement,
  reissueAgreementLink,
  expireAgreement,
  redactAgreementClientData,
  getAgreementForSigning,
  signAgreement,
  resolveSigningOrigin,
  INVALID_LINK_MESSAGE,
} from '../src/callable/agreements'

function seedTemplates(dbId = '(default)') {
  store.set(`${dbId}::agreementTemplates/client-residential`, {
    family: 'client',
    type: 'residential',
    nameEn: 'Residential Service Agreement',
    nameFr: 'Contrat de services résidentiels',
    currentVersionId: 'v1',
  })
  store.set(`${dbId}::agreementTemplates/client-residential/versions/v1`, {
    version: 'v1',
    status: 'published',
    bodyEn: '# Terms\nClient: {{clientName}}\nRate: {{rate}} ({{taxNote}})',
    bodyFr: '# Conditions\nClient : {{clientName}}\nTarif : {{rate}} ({{taxNote}})',
    bodyHashEn: 'h-en',
    bodyHashFr: 'h-fr',
    publishedAt: new Date('2026-11-20T00:00:00Z'),
    publishedBy: 'system',
  })
}

const ownerAuth = { uid: 'owner-1', token: { role: 'owner', email: 'lauren@freshnest.ca' } }
const managerAuth = { uid: 'mgr-1', token: { role: 'manager', email: 'manager@freshnest.ca' } }
const staffAuth = { uid: 'staff-1', token: { role: 'staff', email: 'brenda@freshnest.ca' } }

describe('P3-E39 token & crypto utilities', () => {
  it('generates 32-byte base64url tokens and deterministic SHA-256 hashes', () => {
    const t1 = generateAgreementToken()
    const t2 = generateAgreementToken()
    expect(t1).not.toBe(t2)
    expect(isValidTokenFormat(t1)).toBe(true)
    expect(isValidTokenFormat('short')).toBe(false)
    expect(isValidTokenFormat('bad/char+not+base64url'.repeat(3))).toBe(false)

    const h1 = hashAgreementToken(t1)
    expect(h1).toMatch(/^[a-f0-9]{64}$/)
    expect(hashesEqual(h1, hashAgreementToken(t1))).toBe(true)
    expect(hashesEqual(h1, hashAgreementToken(t2))).toBe(false)
    expect(hashAgreementDocument('hello')).toMatch(/^[a-f0-9]{64}$/)
  })

  it('validates allowed signing link origins safely', () => {
    expect(resolveSigningOrigin('https://www.freshnestco.ca/', '(default)')).toBe('https://www.freshnestco.ca')
    expect(resolveSigningOrigin('https://evil.example.com', '(default)')).toBe('https://www.freshnestco.ca')
    expect(resolveSigningOrigin('http://localhost:5173', '(default)')).toBe('https://www.freshnestco.ca')
    expect(resolveSigningOrigin('http://localhost:5173', 'freshnest-dev')).toBe('http://localhost:5173')
  })
})

describe('P3-E39 PDF & email generation (EN/FR, zero access codes)', () => {
  it('builds a valid French PDF with accented characters & fr-CA currency without WinAnsi crash and without access codes', async () => {
    const terms = buildAgreementTermsFromPolicy({
      type: 'residential',
      serviceType: 'standard',
      frequency: 'biweekly',
      startDate: '2026-12-01',
      rateType: 'flat',
      rateCents: 123450, // triggers thousands separator (\u202F in fr-CA)
    })
    const party = {
      name: 'Sophie Tremblay-Gagnon',
      email: 'sophie@snye.qc.ca',
      phone: '613-555-0199',
      address: '42 chemin Tsi Snaihne, Snye QC',
    }
    const body = '# Entretien ménager résidentiel\n\n## Modalités\n- Produits écologiques\n- Qualité garantie à 100 %'
    const mergedBody = interpolateAgreementBody({ body, language: 'fr', party, terms })
    const canonical = buildCanonicalAgreementText({
      type: 'residential',
      language: 'fr',
      versionLabel: 'v1',
      party,
      terms,
      body,
    })

    // Ensure sanitizeWinAnsi strips narrow non-breaking space from Intl fr-CA
    expect(sanitizeWinAnsi('1\u202f234,50\u00a0$')).toBe('1 234,50 $')

    const pdf = await buildSignedAgreementPdf({
      agreementId: 'agr-fr-1',
      type: 'residential',
      language: 'fr',
      versionId: 'v1',
      versionLabel: 'v1',
      party,
      terms,
      mergedBody,
      answers: {
        phone: '613-555-0199',
        email: 'sophie@snye.qc.ca',
        entryMethod: 'door_code',
        pets: '1 chat',
        hasAlarm: true,
        specialInstructions: 'Sonner deux fois',
        valuables: 'Vase familial',
      },
      evidence: {
        signedName: 'Sophie Tremblay-Gagnon',
        signedAtIso: '2026-11-20T22:15:00.000Z',
        ip: '203.0.113.10',
        userAgent: 'Mozilla/5.0',
        documentHash: hashAgreementDocument(canonical),
        signatureId: 'sig-1',
      },
    })

    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-')
    expect(pdf.byteLength).toBeGreaterThan(1500)
    // Confirm a hypothetical secret access code is never present anywhere in the PDF buffer
    const pdfLatin = pdf.toString('latin1')
    expect(pdfLatin).not.toContain('987654')
  })

  it('produces EN and FR email payloads without any access codes', () => {
    const terms = buildAgreementTermsFromPolicy({
      type: 'residential',
      serviceType: 'standard',
      frequency: 'weekly',
      startDate: '2026-12-01',
      rateType: 'hourly',
      rateCents: 4500,
    })
    expect(agreementInviteSubject('en')).toContain('Fresh Nest Co.')
    expect(agreementInviteSubject('fr')).toContain('contrat')
    expect(agreementInviteHtml({
      clientName: 'Diane Lafleur',
      type: 'residential',
      language: 'fr',
      signingUrl: 'https://www.freshnestco.ca/agreement/abc',
      expiresDateText: '20 décembre 2026',
    })).toContain('Consulter et signer mon contrat')

    const signedData = {
      agreementId: 'agr-1',
      clientName: 'Margaret Storey',
      clientEmail: 'margaret@example.com',
      clientAddress: '100 Second St, Cornwall ON',
      type: 'residential' as const,
      language: 'en' as const,
      terms,
      signedName: 'Margaret Storey',
      signedAtIso: '2026-11-20T22:00:00.000Z',
      versionLabel: 'v1',
      documentHash: 'abc123',
    }
    expect(agreementSignedClientSubject('en')).toContain('Signed Service Agreement')
    expect(agreementSignedClientHtml(signedData)).toContain('door and alarm codes are never included')
    expect(agreementSignedOfficeSubject(signedData)).toContain('Margaret Storey')
    expect(agreementSignedOfficeText(signedData)).toContain('SHA-256:      abc123')
  })

  it('audits agreement lifecycle changes without leaking tokenHash', () => {
    const entry = buildAuditEntry({
      collection: 'agreements',
      documentId: 'agr-1',
      before: { status: 'sent', tokenHash: 'secret-hash', party: { name: 'Margaret Storey' }, type: 'residential' },
      after: {
        status: 'signed',
        tokenHash: null,
        signedAt: new Date('2026-11-20T22:00:00Z'),
        party: { name: 'Margaret Storey' },
        type: 'residential',
        lastChange: { by: 'client:margaret@example.com', at: new Date('2026-11-20T22:00:00Z'), source: 'public_form' },
      },
      nowMs: Date.now(),
    })
    expect(entry).not.toBeNull()
    expect(entry!.field).toContain('status')
    expect(entry!.field).not.toContain('tokenHash')
    expect(entry!.recordLabel).toBe('Margaret Storey · residential')
  })
})

describe('P3-E39 callables end-to-end behavior', () => {
  beforeEach(() => {
    store.clear()
    storageFiles.clear()
    requestedDbIds.length = 0
    sendMocks.invite.mockClear()
    sendMocks.client.mockClear()
    sendMocks.office.mockClear()
    process.env['RESEND_API_KEY'] = 're_live_unit_test'
    process.env['OWNER_EMAIL'] = 'owner@freshnest.ca'
    seedTemplates('(default)')
    seedTemplates('freshnest-dev')
  })

  const createSampleAgreement = async (opts: { databaseId?: '(default)' | 'freshnest-dev'; language?: 'en' | 'fr'; sendEmail?: boolean } = {}) => {
    const res = await (createAgreement as any).run({
      auth: ownerAuth,
      data: {
        databaseId: opts.databaseId,
        type: 'residential',
        language: opts.language ?? 'en',
        party: {
          kind: 'booking',
          bookingId: 'bk-1',
          name: 'Margaret Storey',
          email: 'margaret@example.com',
          phone: '613-555-0144',
          address: '45 Pitt St, Cornwall ON',
        },
        terms: {
          serviceType: 'standard',
          frequency: 'biweekly',
          startDate: '2026-12-01',
          rateType: 'flat',
          rateCents: 18000,
          taxExempt: false,
        },
        linkValidityDays: 30,
        sendEmail: opts.sendEmail ?? false,
      },
    })
    const token = String(res.signingUrl).split('/agreement/')[1]
    return { ...res, token }
  }

  it('rejects non-office roles on createAgreement', async () => {
    await expect(
      (createAgreement as any).run({
        auth: staffAuth,
        data: { type: 'residential', language: 'en' },
      }),
    ).rejects.toThrow(/Owner or Manager/)
  })

  it('stores only SHA-256 tokenHash (never raw token), routes dev DB separately, and sends optional invite email', async () => {
    const created = await createSampleAgreement({ databaseId: 'freshnest-dev', language: 'fr', sendEmail: true })
    expect(created.emailSent).toBe(true)
    expect(sendMocks.invite).toHaveBeenCalledTimes(1)

    const stored = store.get(`freshnest-dev::agreements/${created.agreementId}`)!
    expect(stored).toBeDefined()
    expect(stored.tokenHash).toBe(hashAgreementToken(created.token))
    expect(JSON.stringify(stored)).not.toContain(created.token)
    expect(store.has(`(default)::agreements/${created.agreementId}`)).toBe(false)
  })

  it('supports view -> sign -> double-submit replay -> post-sign uniform refusal, keeping access codes out of responses and PDFs', async () => {
    const { agreementId, token } = await createSampleAgreement()

    // 1. Wrong or malformed tokens get uniform refusal
    await expect(
      (getAgreementForSigning as any).run({ data: { token: 'not-valid' } }),
    ).rejects.toThrow(INVALID_LINK_MESSAGE)
    await expect(
      (getAgreementForSigning as any).run({ data: { token: generateAgreementToken() } }),
    ).rejects.toThrow(INVALID_LINK_MESSAGE)

    // 2. Valid open returns minimal view and sets viewedAt
    const view = await (getAgreementForSigning as any).run({ data: { token } })
    expect(view.agreementId).toBe(agreementId)
    expect(view.party.name).toBe('Margaret Storey')
    expect((view as Record<string, unknown>).tokenHash).toBeUndefined()
    expect((view as Record<string, unknown>).failedAttempts).toBeUndefined()
    expect(store.get(`(default)::agreements/${agreementId}`)!.viewedAt).not.toBeNull()

    // 3. Honeypot rejects bot submission & increments failedAttempts
    await expect(
      (signAgreement as any).run({
        data: {
          token,
          website: 'https://spam.bot',
          answers: { phone: '613-555-0144', email: 'margaret@example.com', entryMethod: 'door_code', pets: '', hasAlarm: true, specialInstructions: '', valuables: '' },
          access: { doorCode: '4321#', alarmCode: '9999', keyLocation: 'under mat', accessNotes: '' },
          consentESign: true,
          consentTerms: true,
          signedName: 'Margaret Storey',
        },
        rawRequest: { headers: { 'x-forwarded-for': '198.51.100.7, 10.0.0.1', 'user-agent': 'TestBrowser/1.0' } },
      }),
    ).rejects.toThrow(/rejected/i)
    expect(store.get(`(default)::agreements/${agreementId}`)!.failedAttempts).toBe(1)

    // 4. Real sign commits transaction, stores evidence + restricted access, clears tokenHash, uploads PDF, sends 2 emails
    const signPayload = {
      token,
      answers: {
        phone: '613-555-0144',
        email: 'margaret@example.com',
        entryMethod: 'door_code',
        pets: 'Small dog',
        hasAlarm: true,
        specialInstructions: 'Please wipe counters with eco spray',
        valuables: 'China cabinet',
      },
      access: {
        doorCode: 'SECRET-DOOR-4321',
        alarmCode: 'SECRET-ALARM-9999',
        keyLocation: 'Blue pot by porch',
        accessNotes: 'Press # after code',
      },
      consentESign: true,
      consentTerms: true,
      signedName: 'Margaret Storey',
      website: '',
    }

    const signed = await (signAgreement as any).run({
      data: signPayload,
      rawRequest: { headers: { 'x-forwarded-for': '198.51.100.7, 10.0.0.1', 'user-agent': 'TestBrowser/1.0' } },
    })

    expect(signed.ok).toBe(true)
    expect(signed.alreadySigned).toBe(false)
    expect(JSON.stringify(signed)).not.toContain('SECRET-DOOR-4321')
    expect(JSON.stringify(signed)).not.toContain('SECRET-ALARM-9999')

    const updated = store.get(`(default)::agreements/${agreementId}`)!
    expect(updated.status).toBe('signed')
    expect(updated.tokenHash).toBeNull()
    expect(typeof updated.currentSignatureId).toBe('string')
    expect(updated.pdfPath).toBe(`agreements/${agreementId}/signed.pdf`)
    expect(JSON.stringify(updated)).not.toContain('SECRET-DOOR-4321')

    // Restricted access record stored separately
    const accessDoc = store.get(`(default)::agreements/${agreementId}/private/access`)!
    expect(accessDoc.doorCode).toBe('SECRET-DOOR-4321')
    expect(accessDoc.alarmCode).toBe('SECRET-ALARM-9999')

    // Append-only signature evidence captured IP (first hop), UA, documentHash, and NO access codes
    const sigDoc = store.get(`(default)::agreements/${agreementId}/signatures/${updated.currentSignatureId}`)!
    expect(sigDoc.ip).toBe('198.51.100.7')
    expect(sigDoc.userAgent).toBe('TestBrowser/1.0')
    expect(sigDoc.documentHash).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(sigDoc)).not.toContain('SECRET-DOOR-4321')

    // PDF uploaded to Storage and contains NO access codes
    const uploadedPdf = storageFiles.get(`agreements/${agreementId}/signed.pdf`)!
    expect(uploadedPdf).toBeDefined()
    expect(uploadedPdf.data.toString('latin1')).not.toContain('SECRET-DOOR-4321')
    expect(uploadedPdf.data.toString('latin1')).not.toContain('SECRET-ALARM-9999')

    // Both emails sent
    expect(sendMocks.client).toHaveBeenCalledTimes(1)
    expect(sendMocks.office).toHaveBeenCalledTimes(1)

    // 5. Double-submit / replay returns idempotent ok without second signature or extra emails
    const replayed = await (signAgreement as any).run({ data: signPayload })
    expect(replayed.ok).toBe(true)
    expect(replayed.alreadySigned).toBe(true)
    expect(sendMocks.client).toHaveBeenCalledTimes(1)

    // 6. Re-opening the signed token via getAgreementForSigning returns uniform refusal (no PII leak)
    await expect(
      (getAgreementForSigning as any).run({ data: { token } }),
    ).rejects.toThrow(INVALID_LINK_MESSAGE)
  })

  it('reissue invalidates the old link and expire disables the link', async () => {
    const { agreementId, token: oldToken } = await createSampleAgreement()

    const reissued = await (reissueAgreementLink as any).run({
      auth: managerAuth,
      data: { agreementId, linkValidityDays: 14, sendEmail: false },
    })
    const newToken = String(reissued.signingUrl).split('/agreement/')[1]
    expect(newToken).not.toBe(oldToken)

    // Old token fails; new token succeeds
    await expect((getAgreementForSigning as any).run({ data: { token: oldToken } })).rejects.toThrow(INVALID_LINK_MESSAGE)
    const view = await (getAgreementForSigning as any).run({ data: { token: newToken } })
    expect(view.agreementId).toBe(agreementId)

    // Expire kills the new token
    await (expireAgreement as any).run({ auth: managerAuth, data: { agreementId, reason: 'Client cancelled' } })
    await expect((getAgreementForSigning as any).run({ data: { token: newToken } })).rejects.toThrow(INVALID_LINK_MESSAGE)
  })

  it('locks link after 10 bad attempts', async () => {
    const { agreementId, token } = await createSampleAgreement()
    const doc = store.get(`(default)::agreements/${agreementId}`)!
    doc.failedAttempts = MAX_SIGN_FAILED_ATTEMPTS
    store.set(`(default)::agreements/${agreementId}`, doc)

    await expect((getAgreementForSigning as any).run({ data: { token } })).rejects.toThrow(INVALID_LINK_MESSAGE)
  })

  it('allows only Owner (not Manager) to redact access codes & answers while preserving signed evidence', async () => {
    const { agreementId, token } = await createSampleAgreement()
    await (signAgreement as any).run({
      data: {
        token,
        answers: { phone: '613-555-0144', email: 'margaret@example.com', entryMethod: 'key', pets: 'Cat', hasAlarm: true, specialInstructions: 'Note', valuables: 'Ring' },
        access: { doorCode: '1111', alarmCode: '2222', keyLocation: 'Porch', accessNotes: 'Hi' },
        consentESign: true,
        consentTerms: true,
        signedName: 'Margaret Storey',
      },
    })

    // Manager denied
    await expect(
      (redactAgreementClientData as any).run({
        auth: managerAuth,
        data: { agreementId, reason: 'Client Law 25 deletion request' },
      }),
    ).rejects.toThrow(/Only an Owner/)

    // Owner succeeds
    const res = await (redactAgreementClientData as any).run({
      auth: ownerAuth,
      data: { agreementId, reason: 'Client Law 25 deletion request' },
    })
    expect(res.success).toBe(true)

    const access = store.get(`(default)::agreements/${agreementId}/private/access`)!
    expect(access.doorCode).toBe('')
    expect(access.alarmCode).toBe('')
    expect(access.keyLocation).toBe('')
    expect(access.redactedBy).toBe('lauren@freshnest.ca')

    const agreement = store.get(`(default)::agreements/${agreementId}`)!
    expect(agreement.status).toBe('signed') // legal contract preserved!
    expect(agreement.documentHash).toMatch(/^[a-f0-9]{64}$/)
    const sig = store.get(`(default)::agreements/${agreementId}/signatures/${agreement.currentSignatureId}`)!
    expect(sig.signedName).toBe('Margaret Storey') // legal evidence preserved!
    expect((sig.answers as Record<string, unknown>).pets).toBe('')
    expect((sig.answers as Record<string, unknown>).valuables).toBe('')
  })
})
