import { httpsCallable } from 'firebase/functions'
import type {
  LeadNoteKind,
  LostReason,
  PipelineStage,
  StaffLeadDetail,
  StaffLeadNoteDto,
  StaffLeadSummary,
} from '@freshnest/shared'
import { functions } from './firebase'

function currentDatabaseId(): '(default)' | 'freshnest-dev' {
  return import.meta.env.VITE_FIRESTORE_DB_ID === 'freshnest-dev' ? 'freshnest-dev' : '(default)'
}

export async function listMyLeads(): Promise<{ leads: StaffLeadSummary[]; openCount: number }> {
  const fn = httpsCallable<{ databaseId: string }, { leads: StaffLeadSummary[]; openCount: number }>(
    functions,
    'listMyLeads',
  )
  const res = await fn({ databaseId: currentDatabaseId() })
  return res.data
}

export async function getMyLead(bookingId: string): Promise<StaffLeadDetail> {
  const fn = httpsCallable<{ databaseId: string; bookingId: string }, { lead: StaffLeadDetail }>(
    functions,
    'getMyLead',
  )
  const res = await fn({ databaseId: currentDatabaseId(), bookingId })
  return res.data.lead
}

export interface UpdateMyLeadInput {
  bookingId: string
  stage?: Exclude<PipelineStage, 'won'>
  needsSiteVisit?: boolean
  nextFollowUpDate?: string | null
  quotedPriceCents?: number | null
  lostReason?: LostReason | null
  lostNote?: string | null
}

export async function updateMyLead(input: UpdateMyLeadInput): Promise<StaffLeadSummary> {
  const fn = httpsCallable<UpdateMyLeadInput & { databaseId: string }, { success: true; lead: StaffLeadSummary }>(
    functions,
    'updateMyLead',
  )
  const res = await fn({ ...input, databaseId: currentDatabaseId() })
  return res.data.lead
}

export async function addMyLeadNote(
  bookingId: string,
  kind: LeadNoteKind,
  body: string,
): Promise<StaffLeadNoteDto> {
  const fn = httpsCallable<
    { databaseId: string; bookingId: string; kind: LeadNoteKind; body: string },
    { success: true; note: StaffLeadNoteDto }
  >(functions, 'addMyLeadNote')
  const res = await fn({ databaseId: currentDatabaseId(), bookingId, kind, body })
  return res.data.note
}
