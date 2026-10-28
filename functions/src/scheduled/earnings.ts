import { onSchedule } from 'firebase-functions/v2/scheduler'
import { rollOverAllStaffEarnings } from '../jobs'
import { logError } from '../lib/shared'
import { BUSINESS_TZ } from '../shared/time'

// F05: Scheduled Earnings Rollover Trigger — midnight on the 1st, Toronto time (P3-E38). At midnight
// UTC it ran on the last evening of the month, so that evening's shifts counted toward the next month.
export const onMonthlyEarningsRollover = onSchedule(
  {
    schedule: '0 0 1 * *',
    timeZone: BUSINESS_TZ,
  },
  async () => {
    try {
      await rollOverAllStaffEarnings()
    } catch (err) {
      logError('[onMonthlyEarningsRollover] Rollover failed:', err)
    }
  },
)
