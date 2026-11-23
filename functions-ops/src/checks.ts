// Dates, and the small checks on what a request sends that more than one route uses.

export const TZ = "America/Toronto";

/** Local midnight in Toronto for a YYYY-MM-DD date, as ISO8601 with offset. */
export function torontoMidnight(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  // 05:00 UTC is midnight or 1am in Toronto, i.e. before any 2am DST switch.
  const probe = new Date(Date.UTC(y, m - 1, d, 5));
  const part = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(probe)
    .find((p) => p.type === "timeZoneName");
  const offset = (part?.value ?? "GMT-05:00").replace("GMT", "") || "+00:00";
  return `${date}T00:00:00${offset}`;
}

/** Today's date in Toronto, YYYY-MM-DD. */
export const torontoToday = (now: number): string => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(now));

/** The Friday that starts the pay period a date falls in. */
export function fridayOf(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return addDays(date, -((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 2) % 7));
}

/** Whether a position is On Call, however Camelo spells it ("On Call", "on-call", "ON_CALL"). The same test as the site's. */
export const isOnCall = (position: string | null | undefined): boolean =>
  (position ?? "").replace(/[\s_-]+/g, "").toLowerCase() === "oncall";

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function validDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return addDays(s, 0) === s;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
export const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
export const isId = (x: unknown): x is string => typeof x === "string" && /^[\w-]{1,64}$/.test(x);
/** The text trimmed, or null when it is not text or is longer than `max`. */
export const text = (x: unknown, max: number): string | null => (typeof x === "string" && x.trim().length <= max ? x.trim() : null);
