// POST /api/timesheet-review: a pay period's timesheets and shifts, for Unapproved timesheets and the dashboard.
import { type ApiRequest, type ApiResponse, type Deps, read } from "../api.js";
import { withPartners } from "../partners.js";
import { requireOffice } from "../who.js";
import { type Shift, type Timesheet, camelo, fetchAll } from "../camelo.js";
import { addDays, torontoMidnight, validDate } from "../checks.js";

// For the unapproved-timesheets review: each timesheet with the id of the shift
// it was clocked against. The shift itself comes from REVIEW_SHIFTS_QUERY, because
// asking for it nested here makes Camelo ten times slower.
const REVIEW_TIMESHEETS_QUERY = `
query ReviewTimesheets($filter: TimesheetFilter, $after: String) {
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
      comments
      employee { id name }
      group { id name }
      client { id name }
      jobSite { id name address }
      referenceObject { __typename ... on TimeCard { shiftId note } }
    }
  }
}`;

const REVIEW_SHIFT_FIELDS = `
  id
  state
  startTime
  endTime
  timezone
  breakDuration
  client { id name }
  assignee { id name }
  jobSite { id name address }
  group { id name }
  checklistAssignments {
    completionPercentage
    checklist { name }
  }`;

const REVIEW_SHIFTS_QUERY = `
query ReviewShifts($filter: ShiftFilter, $after: String) {
  shifts(filter: $filter, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {${REVIEW_SHIFT_FIELDS}
    }
  }
}`;

/**
 * Everything the unapproved-timesheets review needs for a pay period: all its
 * timesheets (with the id of the shift each was clocked against) and all its
 * shifts, plus any shift outside the period that an unapproved timesheet points to.
 */
export async function handleReview(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;
  if (!validDate(req.periodStart)) return { status: 400, body: { error: "periodStart must be YYYY-MM-DD" } };
  const start = req.periodStart;
  return read(deps, `review:${start}`, () => loadReview(start, deps));
}

async function loadReview(start: string, deps: Deps): Promise<ApiResponse> {
  const from = torontoMidnight(start);
  const to = torontoMidnight(addDays(start, 7));
  const [lo, hi] = [Date.parse(from), Date.parse(to)];
  const fetchImpl = deps.fetchImpl ?? fetch;
  // toTime is inclusive, hence one second short of each next midnight
  const lastSecond = (next: string) => new Date(Date.parse(next) - 1000).toISOString();
  type Sheet = Timesheet & { state: string; referenceObject: { shiftId?: string | null } | null };

  try {
    const days = Array.from(
      { length: 7 },
      (_, i) => [torontoMidnight(addDays(start, i)), lastSecond(torontoMidnight(addDays(start, i + 1)))] as const,
    );
    const [sheets, perDay] = await Promise.all([
      fetchAll<Sheet>(REVIEW_TIMESHEETS_QUERY, "timesheets", deps.camelToken, from, lastSecond(to), fetchImpl),
      Promise.all(days.map(([a, b]) => fetchAll<Shift>(REVIEW_SHIFTS_QUERY, "shifts", deps.camelToken, a, b, fetchImpl))),
    ]);
    const timesheets = [...new Map(sheets.map((t) => [t.id, t])).values()]
      .filter((t) => Date.parse(t.from) >= lo && Date.parse(t.from) < hi)
      .sort((a, b) => Date.parse(a.from) - Date.parse(b.from));
    const shifts = new Map(
      withPartners(perDay.flat())
        .filter((s) => Date.parse(s.startTime) >= lo && Date.parse(s.startTime) < hi)
        .map((s) => [s.id, s]),
    );

    // A timesheet near the edge of the period can belong to a shift just outside it.
    const stray = [
      ...new Set(
        timesheets
          .filter((t) => t.state !== "APPROVED")
          .map((t) => t.referenceObject?.shiftId)
          .filter((id): id is string => !!id && !shifts.has(id)),
      ),
    ];
    const extra = await Promise.all(
      stray.slice(0, 50).map((id) =>
        camelo<{ shift: Shift | null }>(deps, `query($id: ID!) { shift(id: $id) {${REVIEW_SHIFT_FIELDS}\n} }`, { id })
          .then((d) => d.shift)
          .catch(() => null),
      ),
    );
    const outside = extra.filter((s): s is Shift => !!s);
    const inPeriod = [...shifts.values()].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
    return { status: 200, body: { periodStart: start, from, to, timesheets, shifts: inPeriod, otherShifts: outside } };
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not load timesheets and shifts from Camelo" } };
  }
}
