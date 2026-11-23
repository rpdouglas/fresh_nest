// POST /api/shifts: a week of shifts.
import { type ApiRequest, type ApiResponse, type Deps, read } from "../api.js";
import { withPartners } from "../partners.js";
import { requireOffice } from "../who.js";
import { type Shift, fetchAll } from "../camelo.js";
import { addDays, torontoMidnight, validDate } from "../checks.js";

// Introspection is disabled on Camelo's server; ShiftFilter's date fields are
// fromTime/toTime (ISO8601DateTime).
const SHIFTS_QUERY = `
query WeekByClient($filter: ShiftFilter, $after: String) {
  shifts(filter: $filter, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      title
      state
      startTime
      endTime
      timezone
      breakDuration
      note
      systemNote
      client { id name clientNumber phoneNumber email }
      assignee { id name phoneNumber }
      jobSite { name address note }
      schedule { id name }
      group { name }
      checklistAssignments { completionPercentage checklist { name } }
    }
  }
}`;

const fetchShifts = (token: string, from: string, to: string, fetchImpl: typeof fetch) =>
  fetchAll<Shift>(SHIFTS_QUERY, "shifts", token, from, to, fetchImpl);

export async function handleShifts(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;

  if (!validDate(req.weekStart)) return { status: 400, body: { error: "weekStart must be YYYY-MM-DD" } };
  const weekStart = req.weekStart;
  return read(deps, `shifts:${weekStart}`, () => loadShifts(weekStart, deps));
}

async function loadShifts(weekStart: string, deps: Deps): Promise<ApiResponse> {
  const from = torontoMidnight(weekStart);
  const to = torontoMidnight(addDays(weekStart, 7));

  // Camelo takes 12s+ for a whole week in one query but answers single days
  // quickly, so ask for the seven days at once. toTime is inclusive, hence the
  // one second short of the next midnight.
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = torontoMidnight(addDays(weekStart, i));
    const next = torontoMidnight(addDays(weekStart, i + 1));
    return [start, new Date(Date.parse(next) - 1000).toISOString()] as const;
  });
  let shifts: Shift[];
  try {
    const perDay = await Promise.all(days.map(([start, end]) => fetchShifts(deps.camelToken, start, end, deps.fetchImpl ?? fetch)));
    // partners from the schedule, not Camelo's slow shiftPartners field (functions/src/partners.ts)
    const byId = new Map(withPartners(perDay.flat()).map((s) => [s.id, s]));
    shifts = [...byId.values()].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not load shifts from Camelo" } };
  }
  // Camelo's toTime includes the whole end day, so trim to the week here.
  const lo = Date.parse(from);
  const hi = Date.parse(to);
  shifts = shifts.filter((s) => {
    const t = Date.parse(s.startTime);
    return t >= lo && t < hi;
  });
  return { status: 200, body: { weekStart, from, to, shifts } };
}
