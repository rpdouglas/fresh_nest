// POST /api/live: today's shifts and timesheets for the live board.
import { type ApiRequest, type ApiResponse, type Deps, read } from "../api.js";
import { withPartners } from "../partners.js";
import { requireOffice } from "../who.js";
import { type Shift, type Timesheet, fetchAll } from "../camelo.js";
import { addDays, torontoMidnight, torontoToday } from "../checks.js";

const LIVE_TIMESHEETS_QUERY = `
query LiveTimesheets($filter: TimesheetFilter, $after: String) {
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

const LIVE_SHIFTS_QUERY = `
query LiveShifts($filter: ShiftFilter, $after: String) {
  shifts(filter: $filter, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
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
      }
    }
  }
}`;

let lastRefreshAt = 0;

export async function handleLive(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;

  const now = deps.now ? deps.now() : Date.now();
  const today = torontoToday(now);

  const isRefresh = req.refresh === true;
  if (isRefresh && now - lastRefreshAt >= 20_000) {
    lastRefreshAt = now;
    deps.readCache?.clear();
  }

  return read(deps, `live:${today}`, () => loadLive(today, now, deps));
}

async function loadLive(today: string, now: number, deps: Deps): Promise<ApiResponse> {
  const from = torontoMidnight(today);
  const toMidnight = torontoMidnight(addDays(today, 1));
  const to = new Date(Date.parse(toMidnight) - 1000).toISOString();
  const fetchImpl = deps.fetchImpl ?? fetch;

  try {
    const [raw, timesheets] = await Promise.all([
      fetchAll<Shift>(LIVE_SHIFTS_QUERY, "shifts", deps.camelToken, from, to, fetchImpl),
      fetchAll<Timesheet>(LIVE_TIMESHEETS_QUERY, "timesheets", deps.camelToken, from, to, fetchImpl),
    ]);
    // partners from the schedule, not Camelo's slow shiftPartners field (functions/src/partners.ts)
    const shifts = withPartners(raw);
    return {
      status: 200,
      body: {
        today,
        now,
        shifts,
        timesheets,
      },
    };
  } catch (e) {
    return { status: 502, body: { error: e instanceof Error ? e.message : "Could not reach Camelo" } };
  }
}
