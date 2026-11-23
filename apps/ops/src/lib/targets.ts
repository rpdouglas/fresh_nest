// The owner's targets for the dashboard (agreed 2026-10-12). Change them here.
export const TARGETS = {
  /** Shared company grace period (in minutes) for live board and punctuality. */
  graceMinutes: 15,
  /** Share of clocked visits on time (within the punctuality grace). */
  onTimeRate: 0.95,
  /** Visits with no timesheet. */
  noShows: 0,
  /** Actual hours within this share of scheduled hours, either way. */
  hoursBand: 0.05,
  /** Complaints per 100 visits, below this. */
  complaintsPer100: 2,
  /** Approved time should be invoiced within this many days. */
  invoiceDays: 7,
  /** Timesheets waiting for approval more than 3 days. */
  waitingLong: 0,
  /** Schedule check: a cleaner's scheduled working time in a day (shifts added up, not first start to last finish), at most this many hours. */
  longDayHours: 10,
  /** Schedule check: scheduled hours in a pay period, at most this many (Ontario overtime starts after 44). */
  overtimeHours: 44,
  /**
   * Schedule check: minutes to spare between two visits, on top of the drive. 0: a gap is
   * flagged only when the estimated drive is longer than it (owner, 2026-10-13).
   */
  gapSpareMinutes: 0,
  /**
   * Drive time is estimated from the straight-line distance: roads are about this much
   * longer; the first townKm go at townKmh and the rest at highwayKmh, plus parkMinutes.
   */
  roadFactor: 1.35,
  townKm: 10,
  townKmh: 35,
  highwayKmh: 70,
  parkMinutes: 3,
}

/**
 * The first day whose figures are the record: the pay period of Friday 2026-10-09 is the first in which every
 * timesheet and all the billing go through this system (owner, 2026-10-13; docs/decisions/0036). Nothing dated
 * before it is "approved, not yet invoiced". This is the one place the date is written.
 */
export const RECORD_START = '2026-10-09'

/**
 * How many pay periods, this one included, the dashboard will read to find approved time not yet invoiced. It
 * steps back one at a time and stops at the first with nothing left to invoice, so it rarely reads this many.
 */
export const INVOICE_LOOK_BACK = 13

/** Client patterns and routes: every team leaves from and comes back to the office (owner, 2026-10-16). */
export const OFFICE_ADDRESS = '367 Eleventh St E, Cornwall, ON K6H 2Y8'

/** Client patterns and routes: a client whose address cannot be placed on the map is put here instead (owner, 2026-10-16). */
export const FALLBACK_ADDRESS = 'Snye, QC'
