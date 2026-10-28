import { describe, it, expect } from 'vitest'
import { preparePolicyUpdate } from '../src/callable/settings'
import {
  DEFAULT_POLICY_SETTINGS,
  normalizePolicySettings,
  validatePolicySettingsInput,
  computePolicyDiff,
} from '../src/shared/policy'
import { resolveBufferMinutes } from '../src/lib/eligibility'
import { buildOpenShifts, type JobRecord } from '../src/lib/openShifts'

describe('P3-E36 (W0-2) — Operational Settings & Policy Record', () => {
  it('returns DEFAULT_POLICY_SETTINGS when Firestore doc is missing or partial', () => {
    expect(normalizePolicySettings(undefined)).toEqual(DEFAULT_POLICY_SETTINGS)
    expect(normalizePolicySettings({ defaultOdspMonthlyLimitCents: 90000, lateCancellationFeeCents: 2550 })).toMatchObject({
      defaultOdspMonthlyLimitCents: 90000,
      lateCancellationFeeCents: 2550,
    })
    expect(normalizePolicySettings({ defaultVehicleBufferMinutes: 45 })).toEqual({
      ...DEFAULT_POLICY_SETTINGS,
      defaultVehicleBufferMinutes: 45,
    })
  })

  it('validates numeric bounds and required emergencyPrimaryPhone', () => {
    const valid = validatePolicySettingsInput({
      ...DEFAULT_POLICY_SETTINGS,
      defaultVehicleBufferMinutes: 45,
      reason: 'Winter road conditions',
    })
    expect(valid.ok).toBe(true)
    if (valid.ok) {
      expect(valid.values.defaultVehicleBufferMinutes).toBe(45)
      expect(valid.reason).toBe('Winter road conditions')
    }

    const outOfRange = validatePolicySettingsInput({
      ...DEFAULT_POLICY_SETTINGS,
      defaultVehicleBufferMinutes: 500,
    })
    expect(outOfRange.ok).toBe(false)

    // P3-E38: money settings are whole cents
    expect(validatePolicySettingsInput({ ...DEFAULT_POLICY_SETTINGS, lockoutFeeCents: 2550 }).ok).toBe(true)
    expect(validatePolicySettingsInput({ ...DEFAULT_POLICY_SETTINGS, lockoutFeeCents: 25.5 }).ok).toBe(false)

    const emptyPhone = validatePolicySettingsInput({
      ...DEFAULT_POLICY_SETTINGS,
      emergencyPrimaryPhone: '   ',
    })
    expect(emptyPhone.ok).toBe(false)
  })

  it('computes field-level diffs accurately', () => {
    const next = {
      ...DEFAULT_POLICY_SETTINGS,
      defaultVehicleBufferMinutes: 45,
      defaultTransitBufferMinutes: 75,
    }
    const diffs = computePolicyDiff(DEFAULT_POLICY_SETTINGS, next)
    expect(diffs).toEqual([
      { field: 'defaultVehicleBufferMinutes', oldValue: 30, newValue: 45 },
      { field: 'defaultTransitBufferMinutes', oldValue: 60, newValue: 75 },
    ])
  })

  it('increments version, builds history snapshot, and records auditEntry in preparePolicyUpdate', () => {
    const now = new Date('2026-10-27T17:30:00.000Z')
    const first = preparePolicyUpdate({
      currentDoc: undefined,
      input: {
        ...DEFAULT_POLICY_SETTINGS,
        defaultVehicleBufferMinutes: 45,
        reason: 'Increase default vehicle buffer for winter',
      },
      changedBy: 'freshnestcompany2023@gmail.com',
      now,
    })

    expect(first.version).toBe(1)
    expect(first.changes).toEqual([
      { field: 'defaultVehicleBufferMinutes', oldValue: 30, newValue: 45 },
    ])
    expect(first.nextDoc.version).toBe(1)
    expect(first.nextDoc.updatedBy).toBe('freshnestcompany2023@gmail.com')
    expect(first.nextDoc.lastChangeReason).toBe('Increase default vehicle buffer for winter')
    expect(first.historyEntry).toEqual({
      version: 1,
      changedAt: now,
      changedBy: 'freshnestcompany2023@gmail.com',
      reason: 'Increase default vehicle buffer for winter',
      changes: [{ field: 'defaultVehicleBufferMinutes', oldValue: 30, newValue: 45 }],
      snapshot: {
        ...DEFAULT_POLICY_SETTINGS,
        defaultVehicleBufferMinutes: 45,
      },
    })
    expect(first.auditEntry).toMatchObject({
      collection: 'settings',
      documentId: 'policy',
      field: 'defaultVehicleBufferMinutes',
      oldValue: 30,
      newValue: 45,
      changedBy: 'freshnestcompany2023@gmail.com',
      overrideType: 'policy_change',
    })

    const second = preparePolicyUpdate({
      currentDoc: first.nextDoc,
      input: {
        ...first.nextDoc,
        defaultOdspMonthlyLimitCents: 110000,
        earningsCautionThresholdCents: 12000,
      },
      changedBy: 'freshnestcompany2023@gmail.com',
      now,
    })

    expect(second.version).toBe(2)
    expect(second.changes).toEqual([
      { field: 'defaultOdspMonthlyLimitCents', oldValue: 100000, newValue: 110000 },
      { field: 'earningsCautionThresholdCents', oldValue: 10000, newValue: 12000 },
    ])
  })

  it('changes live scheduling behaviour when defaultVehicleBufferMinutes or defaultTransitBufferMinutes changes', () => {
    // Default policy: personal_vehicle = 30m, transit = 60m
    expect(resolveBufferMinutes({ transportMode: 'personal_vehicle' }, DEFAULT_POLICY_SETTINGS)).toBe(30)
    expect(resolveBufferMinutes({ transportMode: 'transit' }, DEFAULT_POLICY_SETTINGS)).toBe(60)

    // Updated policy: personal_vehicle = 45m, transit = 75m
    const customPolicy = {
      ...DEFAULT_POLICY_SETTINGS,
      defaultVehicleBufferMinutes: 45,
      defaultTransitBufferMinutes: 75,
    }
    expect(resolveBufferMinutes({ transportMode: 'personal_vehicle' }, customPolicy)).toBe(45)
    expect(resolveBufferMinutes({ transportMode: 'transit' }, customPolicy)).toBe(75)

    // Staff explicit per-person override still wins over global policy default
    expect(
      resolveBufferMinutes(
        { transportMode: 'personal_vehicle', transitBufferMinutes: 20 },
        customPolicy,
      ),
    ).toBe(20)

    // Verify buildOpenShifts uses the policy buffer dynamically
    const assignedShift: JobRecord = {
      id: 'assigned-1',
      data: {
        status: 'assigned',
        assignedTo: 'staff-1',
        scheduledDate: '2026-10-28',
        scheduledStartTime: '09:00',
        scheduledEndTime: '11:00',
        clientAddress: '100 Pitt St, Cornwall ON K6J 3P2',
      },
    }
    const candidateOpenShift: JobRecord = {
      id: 'open-1',
      data: {
        status: 'unassigned',
        assignedTo: null,
        serviceType: 'standard',
        scheduledDate: '2026-10-28',
        scheduledStartTime: '11:35', // 35 min gap: allowed under 30m default, blocked under 45m policy!
        scheduledEndTime: '13:35',
        clientAddress: '9 Main St, Long Sault ON K0C 1P0',
        payRateSnapshot: { rateId: 'r1', amountCents: 2500, currency: 'CAD' },
        createdAt: { toMillis: () => 100 },
      },
    }
    const staffProfile = {
      constraints: { transportMode: 'personal_vehicle' },
    }

    const withDefaultPolicy = buildOpenShifts(
      [candidateOpenShift],
      staffProfile,
      [assignedShift],
      DEFAULT_POLICY_SETTINGS,
    )
    expect(withDefaultPolicy[0].eligibility.travelConflict).toBeNull()

    const withWinterPolicy = buildOpenShifts(
      [candidateOpenShift],
      staffProfile,
      [assignedShift],
      customPolicy,
    )
    expect(withWinterPolicy[0].eligibility.travelConflict).toEqual({
      startTime: '09:00',
      endTime: '11:00',
      bufferMinutes: 45,
    })
  })
})
