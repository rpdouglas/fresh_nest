// POST /api/timesheets: a pay period's timesheets.
import { type ApiRequest, type ApiResponse, type Deps, read } from "../api.js";
import { requireOffice } from "../who.js";
import { type Timesheet, fetchAll } from "../camelo.js";
import { addDays, torontoMidnight, validDate } from "../checks.js";

// One row per clock-in/out. totalDuration is whole minutes.
const TIMESHEETS_QUERY = `
query PayPeriod($filter: TimesheetFilter, $after: String) {
  timesheets(filter: $filter, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      state
      from
      to
      totalDuration
      timezone
      approvedAt
      employee { id name }
      group { id name }
      client { id name }
      jobSite { id name address }
    }
  }
}`;

/** A pay period's timesheets: seven days from periodStart (a Friday), Toronto time. */
export async function handleTimesheets(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;

  if (!validDate(req.periodStart)) return { status: 400, body: { error: "periodStart must be YYYY-MM-DD" } };
  const periodStart = req.periodStart;
  return read(deps, `timesheets:${periodStart}`, () => loadTimesheets(periodStart, deps));
}

async function loadTimesheets(periodStart: string, deps: Deps): Promise<ApiResponse> {
  const from = torontoMidnight(periodStart);
  const to = torontoMidnight(addDays(periodStart, 7));
  let timesheets: Timesheet[];
  try {
    // toTime is inclusive, hence one second short of the next midnight
    const lastSecond = new Date(Date.parse(to) - 1000).toISOString();
    timesheets = await fetchAll<Timesheet>(TIMESHEETS_QUERY, "timesheets", deps.camelToken, from, lastSecond, deps.fetchImpl ?? fetch);
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not load timesheets from Camelo" } };
  }
  // A timesheet belongs to the period it started in.
  const lo = Date.parse(from);
  const hi = Date.parse(to);
  const byId = new Map(timesheets.map((t) => [t.id, t]));
  timesheets = [...byId.values()]
    .filter((t) => Date.parse(t.from) >= lo && Date.parse(t.from) < hi)
    .sort((a, b) => Date.parse(a.from) - Date.parse(b.from));
  return { status: 200, body: { periodStart, from, to, timesheets } };
}
