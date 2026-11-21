import { httpsCallable } from 'firebase/functions'
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import { db, functions } from '@/lib/firebase/firebase'
import { storage } from '@/lib/firebase/storage'
import {
  normalizeDatabaseId,
  type AgreementAccessRecord,
  type AgreementAnswers,
  type AgreementLanguage,
  type AgreementLinkValidityDays,
  type AgreementParty,
  type AgreementRecord,
  type AgreementSignature,
  type AgreementTerms,
  type AgreementType,
  type AllowedDatabaseId,
  type PublicAgreementView,
} from '@freshnest/shared'

function currentDatabaseId(): AllowedDatabaseId {
  return normalizeDatabaseId(import.meta.env.VITE_FIRESTORE_DB_ID)
}

export interface CreateAgreementPayload {
  type: AgreementType
  language: AgreementLanguage
  party: AgreementParty
  terms: Partial<AgreementTerms> & {
    serviceType: AgreementTerms['serviceType']
    frequency: AgreementTerms['frequency']
    startDate: string
    rateType: AgreementTerms['rateType']
    rateCents: number
    taxExempt: boolean
  }
  linkValidityDays: AgreementLinkValidityDays
  sendEmail: boolean
}

export interface CreateAgreementResult {
  agreementId: string
  signingUrl: string
  expiresAtIso: string
  emailSent: boolean
}

export interface SignAgreementPayload {
  token: string
  language?: AgreementLanguage
  answers: AgreementAnswers
  access: {
    doorCode: string
    alarmCode: string
    keyLocation: string
    accessNotes: string
  }
  consentESign: true
  consentTerms: true
  signedName: string
  website?: string
}

export interface SignAgreementResult {
  ok: true
  alreadySigned: boolean
  agreementId: string
  signedAtIso: string
}

export async function fetchAgreementForSigning(token: string): Promise<PublicAgreementView> {
  const fn = httpsCallable<{ token: string; databaseId: AllowedDatabaseId }, PublicAgreementView>(
    functions,
    'getAgreementForSigning',
  )
  const result = await fn({ token, databaseId: currentDatabaseId() })
  return result.data
}

export async function submitSignedAgreement(payload: SignAgreementPayload): Promise<SignAgreementResult> {
  const fn = httpsCallable<SignAgreementPayload & { databaseId: AllowedDatabaseId }, SignAgreementResult>(
    functions,
    'signAgreement',
  )
  const result = await fn({ ...payload, databaseId: currentDatabaseId() })
  return result.data
}

export async function createClientAgreement(payload: CreateAgreementPayload): Promise<CreateAgreementResult> {
  const fn = httpsCallable<
    CreateAgreementPayload & { databaseId: AllowedDatabaseId; origin: string },
    CreateAgreementResult
  >(functions, 'createAgreement')
  const result = await fn({
    ...payload,
    databaseId: currentDatabaseId(),
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  })
  return result.data
}

export async function reissueClientAgreementLink(params: {
  agreementId: string
  linkValidityDays: AgreementLinkValidityDays
  sendEmail: boolean
}): Promise<CreateAgreementResult> {
  const fn = httpsCallable<
    {
      agreementId: string
      linkValidityDays: AgreementLinkValidityDays
      sendEmail: boolean
      databaseId: AllowedDatabaseId
      origin: string
    },
    CreateAgreementResult
  >(functions, 'reissueAgreementLink')
  const result = await fn({
    ...params,
    databaseId: currentDatabaseId(),
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  })
  return result.data
}

export async function expireClientAgreement(params: {
  agreementId: string
  reason?: string
}): Promise<{ success: boolean; agreementId: string }> {
  const fn = httpsCallable<
    { agreementId: string; reason?: string; databaseId: AllowedDatabaseId },
    { success: boolean; agreementId: string }
  >(functions, 'expireAgreement')
  const result = await fn({ ...params, databaseId: currentDatabaseId() })
  return result.data
}

export async function redactClientAgreementData(params: {
  agreementId: string
  reason: string
}): Promise<{ success: boolean; agreementId: string }> {
  const fn = httpsCallable<
    { agreementId: string; reason: string; databaseId: AllowedDatabaseId },
    { success: boolean; agreementId: string }
  >(functions, 'redactAgreementClientData')
  const result = await fn({ ...params, databaseId: currentDatabaseId() })
  return result.data
}

/** Office-only read of all client agreements, newest first (enforced by firestore.rules). */
export async function listAgreements(): Promise<Array<AgreementRecord & { id: string }>> {
  const q = query(collection(db, 'agreements'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AgreementRecord) }))
}

/** Office-only read of append-only signatures for an agreement. */
export async function getAgreementSignatures(agreementId: string): Promise<Array<AgreementSignature & { id: string }>> {
  const q = query(collection(db, 'agreements', agreementId, 'signatures'), orderBy('signedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AgreementSignature) }))
}

/** Office-only read of restricted access record (`private/access`). */
export async function getAgreementAccessRecord(agreementId: string): Promise<AgreementAccessRecord | null> {
  const snap = await getDoc(doc(db, 'agreements', agreementId, 'private', 'access'))
  return snap.exists() ? (snap.data() as AgreementAccessRecord) : null
}

/** Office-only signed PDF download URL (enforced by storage.rules). */
export async function getAgreementPdfDownloadUrl(pdfPath: string): Promise<string> {
  return getDownloadURL(ref(storage, pdfPath))
}
