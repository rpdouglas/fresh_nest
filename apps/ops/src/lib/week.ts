// Weeks run Monday-Sunday in the business's timezone and are passed around as
// the Monday's YYYY-MM-DD date.
export const TZ = 'America/Toronto'

const utc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function isValidDate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s
}

export function addDays(date: string, days: number): string {
  const d = utc(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function mondayOf(date: string): string {
  const weekday = (utc(date).getUTCDay() + 6) % 7
  return addDays(date, -weekday)
}

export function todayIn(tz: string, now = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now)
}

export function weekLabel(weekStart: string): string {
  const fmt = (date: string, withYear: boolean) =>
    utc(date).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: withYear ? 'numeric' : undefined,
    })
  return `${fmt(weekStart, false)} – ${fmt(addDays(weekStart, 6), true)}`
}
