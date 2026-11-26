import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase/firebase'
import {
  normalizeDatabaseId,
  type AddCameloClientNoteInput,
  type AddCameloClientNoteResult,
  type AllowedDatabaseId,
  type PrepareLeadForCameloResult,
  type PushLeadToCameloInput,
  type PushLeadToCameloResult,
  type UpdateCameloJobSiteNoteInput,
  type UpdateCameloJobSiteNoteResult,
} from '@freshnest/shared'

function currentDatabaseId(): AllowedDatabaseId {
  return normalizeDatabaseId(import.meta.env.VITE_FIRESTORE_DB_ID)
}

export async function prepareLeadForCamelo(params: {
  bookingId: string
  addressOverride?: string
}): Promise<PrepareLeadForCameloResult> {
  const fn = httpsCallable<
    { bookingId: string; addressOverride?: string; databaseId: AllowedDatabaseId },
    PrepareLeadForCameloResult
  >(functions, 'prepareLeadForCamelo')
  const result = await fn({ ...params, databaseId: currentDatabaseId() })
  return result.data
}

export async function pushLeadToCamelo(
  payload: PushLeadToCameloInput,
): Promise<PushLeadToCameloResult> {
  const fn = httpsCallable<
    PushLeadToCameloInput & { databaseId: AllowedDatabaseId },
    PushLeadToCameloResult
  >(functions, 'pushLeadToCamelo')
  const result = await fn({ ...payload, databaseId: currentDatabaseId() })
  return result.data
}

export async function addCameloClientNote(
  payload: AddCameloClientNoteInput,
): Promise<AddCameloClientNoteResult> {
  const fn = httpsCallable<
    AddCameloClientNoteInput & { databaseId: AllowedDatabaseId },
    AddCameloClientNoteResult
  >(functions, 'addCameloClientNote')
  const result = await fn({ ...payload, databaseId: currentDatabaseId() })
  return result.data
}

export async function updateCameloJobSiteNote(
  payload: UpdateCameloJobSiteNoteInput,
): Promise<UpdateCameloJobSiteNoteResult> {
  const fn = httpsCallable<
    UpdateCameloJobSiteNoteInput & { databaseId: AllowedDatabaseId },
    UpdateCameloJobSiteNoteResult
  >(functions, 'updateCameloJobSiteNote')
  const result = await fn({ ...payload, databaseId: currentDatabaseId() })
  return result.data
}
