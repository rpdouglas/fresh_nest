import type { DocumentData } from 'firebase-admin/firestore'
import {
  getShiftDurationHours,
  estimateShiftPayCents,
  earningsOverageCents,
  overlapsBlockedWindow,
  resolveBufferMinutes,
  findTravelConflict,
  extractPostalPrefix,
  type TravelShift,
  type StaffConstraintsLike,
  type BufferPolicyConfig,
} from './eligibility'
import { amountCentsOf, normalizeFinancials } from '../shared/money'

// Service-area names matched in the free-text client address. Longest first so
// "Cornwall Island" (P4/P15 — Akwesasne) wins over "Cornwall".
const SERVICE_AREAS = ['Cornwall Island', 'Akwesasne', 'Snye', 'Long Sault', 'Morrisburg', 'Cornwall']

/** Keep in sync with OpenShift in packages/shared/src/types/job.ts. */
export interface OpenShiftResponse {
  id: string
  serviceType: string
  scheduledDate: string
  scheduledStartTime: string
  scheduledEndTime: string
  /** P3-E38: integer cents (ADR-020) */
  payRateCents: number
  area: {
    municipality: string | null
    postalPrefix: string | null
  }
  eligibility: {
    durationHours: number
    estimatedPayCents: number
    overageCents: number
    travelConflict: { startTime: string; endTime: string; bufferMinutes: number } | null
  }
}

/** Raw Firestore job data with its document ID. */
export interface JobRecord {
  id: string
  data: DocumentData
}

export function resolveMunicipality(address: string): string | null {
  if (!address) return null
  const lower = address.toLowerCase()
  return SERVICE_AREAS.find((area) => lower.includes(area.toLowerCase())) ?? null
}

/**
 * HOTFIX-02: Builds the Shift Board for one staff member.
 * - Drops shifts overlapping a blocked window (P9: hidden, never sent to the device)
 * - Evaluates earnings cap (P7/P13) and travel buffer (P8/P15) with the claimJob checks
 * - Whitelists output fields: no clientName, clientPhone, clientNotes, clientAddress or bookingId
 */
export function buildOpenShifts(
  openJobs: JobRecord[],
  staffData: DocumentData,
  assignedJobs: JobRecord[],
  policy?: BufferPolicyConfig,
): OpenShiftResponse[] {
  const constraints: StaffConstraintsLike = staffData.constraints || {}
  const blockedWindows = constraints.blockedWindows || []
  const bufferMinutes = resolveBufferMinutes(constraints, policy)
  const { monthlyEarningsLimitCents, currentMonthEarningsCents } = normalizeFinancials(staffData.financials)

  const assignedByDate = new Map<string, TravelShift[]>()
  for (const { data: j } of assignedJobs) {
    if (j.status === 'cancelled') continue
    const list = assignedByDate.get(j.scheduledDate) ?? []
    list.push({ startTime: j.scheduledStartTime, endTime: j.scheduledEndTime, address: j.clientAddress })
    assignedByDate.set(j.scheduledDate, list)
  }

  const createdAtMillis = (job: DocumentData): number => job.createdAt?.toMillis?.() ?? 0

  return openJobs
    .filter(({ data: job }) => job.status === 'unassigned' && job.assignedTo === null)
    .filter(({ data: job }) =>
      !overlapsBlockedWindow(job.scheduledDate, job.scheduledStartTime, job.scheduledEndTime, blockedWindows))
    .sort((a, b) => createdAtMillis(b.data) - createdAtMillis(a.data))
    .map(({ id, data: job }) => {
      const payRateCents = amountCentsOf(job.payRateSnapshot)
      const durationHours = getShiftDurationHours(job.scheduledStartTime, job.scheduledEndTime)
      const estimatedPayCents = estimateShiftPayCents(payRateCents, job.scheduledStartTime, job.scheduledEndTime)
      const conflict = findTravelConflict(
        { startTime: job.scheduledStartTime, endTime: job.scheduledEndTime, address: job.clientAddress },
        assignedByDate.get(job.scheduledDate) ?? [],
        bufferMinutes,
      )

      return {
        id,
        serviceType: job.serviceType,
        scheduledDate: job.scheduledDate,
        scheduledStartTime: job.scheduledStartTime,
        scheduledEndTime: job.scheduledEndTime,
        payRateCents,
        area: {
          municipality: resolveMunicipality(job.clientAddress),
          postalPrefix: extractPostalPrefix(job.clientAddress),
        },
        eligibility: {
          durationHours,
          estimatedPayCents,
          overageCents: earningsOverageCents(estimatedPayCents, monthlyEarningsLimitCents, currentMonthEarningsCents),
          travelConflict: conflict
            ? { startTime: conflict.startTime, endTime: conflict.endTime, bufferMinutes }
            : null,
        },
      }
    })
}
