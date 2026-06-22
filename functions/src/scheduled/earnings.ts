import { onSchedule } from 'firebase-functions/v2/scheduler'
import { rollOverAllStaffEarnings } from '../jobs'
import { logError } from '../lib/shared'

// F05: Scheduled Earnings Rollover Trigger (1st of month at 12:00 AM UTC)
export const onMonthlyEarningsRollover = onSchedule(
  {
    schedule: '0 0 1 * *',
    timeZone: 'UTC',
  },
  async () => {
    try {
      await rollOverAllStaffEarnings()
    } catch (err) {
      logError('[onMonthlyEarningsRollover] Rollover failed:', err)
    }
  },
)
