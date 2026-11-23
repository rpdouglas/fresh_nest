import { describe, it, expect } from 'vitest'
import {
  businessMinutesBetween,
  computeLeadSlaStatus,
  computePipelineKpis,
  defaultNeedsSiteVisit,
  extractLeadArea,
  inferPipelineStageFromBooking,
  isRecurringRenewalBooking,
  sortLeadsByPriority,
  bookingStatusForPipelineStage,
} from './pipeline'
import { zonedWallTimeToInstant } from './time'

describe('pipeline domain (P3-E40)', () => {
  it('identifies site-visit defaults and recurring renewals', () => {
    expect(defaultNeedsSiteVisit('commercial')).toBe(true)
    expect(defaultNeedsSiteVisit('postconstruction')).toBe(true)
    expect(defaultNeedsSiteVisit('standard')).toBe(false)
    expect(defaultNeedsSiteVisit('airbnb')).toBe(false)

    expect(isRecurringRenewalBooking({ createdBy: 'system:recurring-renewal' })).toBe(true)
    expect(isRecurringRenewalBooking({ createdBy: 'lauren@freshnest.ca' })).toBe(false)
    expect(isRecurringRenewalBooking({})).toBe(false)
  })

  it('maps pipeline stages to booking status and infers legacy stages', () => {
    expect(bookingStatusForPipelineStage('won')).toBe('confirmed')
    expect(bookingStatusForPipelineStage('lost')).toBe('cancelled')
    expect(bookingStatusForPipelineStage('quoted')).toBeNull()

    expect(inferPipelineStageFromBooking({ status: 'pending' })).toBe('new')
    expect(inferPipelineStageFromBooking({ status: 'confirmed' })).toBe('won')
    expect(inferPipelineStageFromBooking({ status: 'completed' })).toBe('won')
    expect(inferPipelineStageFromBooking({ status: 'cancelled' })).toBe('lost')
    expect(inferPipelineStageFromBooking({ status: 'pending', pipeline: { stage: 'quoted' } })).toBe('quoted')
  })

  it('counts business minutes accurately across evenings, weekends, and Saturday hours (Toronto)', () => {
    // Friday 2026-11-20 17:30 -> Saturday 2026-11-21 10:00
    // Friday: 30 min (17:30-18:00), Saturday: 60 min (09:00-10:00) = 90 min
    const friEvening = zonedWallTimeToInstant('2026-11-20', '17:30')
    const satMorning = zonedWallTimeToInstant('2026-11-21', '10:00')
    expect(businessMinutesBetween(friEvening, satMorning)).toBe(90)

    // Friday 22:00 (after close) -> Monday 08:30
    // Friday: 0, Saturday: 09:00-15:00 = 360 min, Sunday: 0, Monday: 30 min = 390 min
    const friNight = zonedWallTimeToInstant('2026-11-20', '22:00')
    const monMorning = zonedWallTimeToInstant('2026-11-23', '08:30')
    expect(businessMinutesBetween(friNight, monMorning)).toBe(390)

    // Saturday 15:30 (after close) -> Sunday 23:00 = 0 business minutes
    const satAfter = zonedWallTimeToInstant('2026-11-21', '15:30')
    const sunNight = zonedWallTimeToInstant('2026-11-22', '23:00')
    expect(businessMinutesBetween(satAfter, sunNight)).toBe(0)
  })

  it('flags overdue at 2h for standard leads and 1h for site-visit leads during business hours', () => {
    const start = zonedWallTimeToInstant('2026-11-23', '09:00') // Monday
    const after65Min = zonedWallTimeToInstant('2026-11-23', '10:05')
    const after125Min = zonedWallTimeToInstant('2026-11-23', '11:05')

    const standardAt65 = computeLeadSlaStatus({
      stage: 'new',
      createdAt: start,
      needsSiteVisit: false,
      now: after65Min,
    })
    expect(standardAt65.isOverdue).toBe(false)

    const siteVisitAt65 = computeLeadSlaStatus({
      stage: 'new',
      createdAt: start,
      needsSiteVisit: true,
      now: after65Min,
    })
    expect(siteVisitAt65.isOverdue).toBe(true)
    expect(siteVisitAt65.overdueReason).toBe('first_contact')

    const standardAt125 = computeLeadSlaStatus({
      stage: 'new',
      createdAt: start,
      needsSiteVisit: false,
      now: after125Min,
    })
    expect(standardAt125.isOverdue).toBe(true)
    expect(standardAt125.overdueReason).toBe('first_contact')

    // Overnight lead submitted at 22:00 Monday checked at 08:30 Tuesday is NOT overdue (30 biz min)
    const lateMon = zonedWallTimeToInstant('2026-11-23', '22:00')
    const earlyTue = zonedWallTimeToInstant('2026-11-24', '08:30')
    const overnight = computeLeadSlaStatus({
      stage: 'new',
      createdAt: lateMon,
      needsSiteVisit: true,
      now: earlyTue,
    })
    expect(overnight.isOverdue).toBe(false)
    expect(overnight.elapsedBusinessMinutes).toBe(30)
  })

  it('flags follow-up overdue and due-today for contacted leads', () => {
    const now = zonedWallTimeToInstant('2026-11-23', '11:00')
    const overdueFollowUp = computeLeadSlaStatus({
      stage: 'quoted',
      createdAt: zonedWallTimeToInstant('2026-11-20', '10:00'),
      firstContactAt: zonedWallTimeToInstant('2026-11-20', '10:20'),
      nextFollowUpDate: '2026-11-22',
      now,
    })
    expect(overdueFollowUp.isOverdue).toBe(true)
    expect(overdueFollowUp.overdueReason).toBe('follow_up')

    const dueToday = computeLeadSlaStatus({
      stage: 'contacted',
      createdAt: zonedWallTimeToInstant('2026-11-20', '10:00'),
      firstContactAt: zonedWallTimeToInstant('2026-11-20', '10:20'),
      nextFollowUpDate: '2026-11-23',
      now,
    })
    expect(dueToday.isOverdue).toBe(false)
    expect(dueToday.isDueToday).toBe(true)
  })

  it('extracts minimized area without leaking street address', () => {
    expect(extractLeadArea('123 Pitt St, Cornwall, ON K6J 3P5')).toBe('Cornwall, ON K6J')
    expect(extractLeadArea('456 Water St, Long Sault, ON')).toBe('Long Sault, ON')
    expect(extractLeadArea('Cornwall Island')).toBe('Cornwall Island')
    expect(extractLeadArea('123 Main Street')).toBe('Local service area')
  })

  it('sorts leads by priority: overdue -> due today -> new -> open -> closed', () => {
    const now = zonedWallTimeToInstant('2026-11-23', '12:00')
    const items = [
      { id: 'won', createdAt: zonedWallTimeToInstant('2026-11-23', '11:30'), pipeline: { stage: 'won' as const } },
      { id: 'future', createdAt: zonedWallTimeToInstant('2026-11-20', '09:00'), pipeline: { stage: 'quoted' as const, nextFollowUpDate: '2026-11-28', firstContactAt: zonedWallTimeToInstant('2026-11-20', '09:15') } },
      { id: 'fresh-new', createdAt: zonedWallTimeToInstant('2026-11-23', '11:30'), pipeline: { stage: 'new' as const } },
      { id: 'due-today', createdAt: zonedWallTimeToInstant('2026-11-20', '09:00'), pipeline: { stage: 'contacted' as const, nextFollowUpDate: '2026-11-23', firstContactAt: zonedWallTimeToInstant('2026-11-20', '09:10') } },
      { id: 'overdue', createdAt: zonedWallTimeToInstant('2026-11-23', '09:00'), pipeline: { stage: 'new' as const } },
    ]
    const sorted = sortLeadsByPriority(items, { now })
    expect(sorted.map((x) => x.id)).toEqual(['overdue', 'due-today', 'fresh-new', 'future', 'won'])
  })

  it('computes pipeline KPIs excluding recurring renewals', () => {
    const now = zonedWallTimeToInstant('2026-11-23', '14:00')
    const kpis = computePipelineKpis(
      [
        {
          createdBy: 'system:recurring-renewal',
          createdAt: zonedWallTimeToInstant('2026-11-23', '08:00'),
          status: 'pending',
          leadSource: 'organic',
        },
        {
          createdAt: zonedWallTimeToInstant('2026-11-23', '09:00'),
          status: 'confirmed',
          leadSource: 'google',
          pipeline: {
            stage: 'won',
            ownerEmail: 'ryan@freshnest.ca',
            firstContactAt: zonedWallTimeToInstant('2026-11-23', '09:30'),
            quotedPriceCents: 22500,
          },
        },
        {
          createdAt: zonedWallTimeToInstant('2026-11-23', '09:00'),
          status: 'cancelled',
          leadSource: 'google',
          pipeline: {
            stage: 'lost',
            ownerEmail: 'lauren@freshnest.ca',
            firstContactAt: zonedWallTimeToInstant('2026-11-23', '10:00'),
            lostReason: 'price',
          },
        },
        {
          createdAt: zonedWallTimeToInstant('2026-11-23', '09:00'),
          status: 'pending',
          leadSource: 'referral',
          pipeline: {
            stage: 'new',
            ownerEmail: 'lauren@freshnest.ca',
          },
        },
      ],
      { now },
    )

    expect(kpis.openTotal).toBe(1)
    expect(kpis.openByStage.new).toBe(1)
    expect(kpis.wonCount).toBe(1)
    expect(kpis.lostCount).toBe(1)
    expect(kpis.overdueCount).toBe(1)
    expect(kpis.wonQuotedValueCents).toBe(22500)
    expect(kpis.medianFirstContactBusinessMinutes).toBe(45) // median of [30, 60]
    expect(kpis.lostReasons).toEqual([{ reason: 'price', count: 1 }])
    expect(kpis.conversionBySource.find((s) => s.source === 'google')?.conversionRate).toBe(50)
  })
})
