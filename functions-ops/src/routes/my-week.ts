// POST /api/my-week: one person's own visits and hours, for the My week page (decision 0037).
// This is the one route a cleaner can read data from, so the rule is strict: everything in the answer
// belongs to the person asking, and it is put together here, field by field. Nothing is passed through
// from Camelo whole, and nothing is left for the page to hide.
import { z } from "zod";
import { type ApiRequest, type ApiResponse, type Deps, read } from "../api.js";
import { fetchAll } from "../camelo.js";
import { addDays, fridayOf, isOnCall, torontoMidnight, torontoToday } from "../checks.js";
import { id, parse } from "../validate.js";
import { requireStaff } from "../who.js";
import { hasValidCleanerToken } from "./clock.js";

const MY_SHIFTS_QUERY = `
query MyShifts($filter: ShiftFilter, $after: String) {
  shifts(filter: $filter, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      state
      startTime
      endTime
      timezone
      note
      client { name }
      jobSite { name address note }
      group { name }
      assignee { id }
      shiftPartners { id assignee { name } }
      timeCard {
        id
        state
        punches {
          punchType
          atTime
          attachment { photo }
        }
      }
    }
  }
}`;

const MY_TIMESHEETS_QUERY = `
query MyTimesheets($filter: TimesheetFilter, $after: String) {
  timesheets(filter: $filter, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      state
      from
      to
      totalDuration
      timezone
      employee { id name }
      group { name }
      client { name }
      jobSite { name }
    }
  }
}`;

type Named = { name: string | null } | null;
type CameloPunch = {
  punchType: string;
  atTime: string;
  attachment: { photo: string | null } | null;
};
type CameloShift = {
  id: string;
  state: string;
  startTime: string;
  endTime: string | null;
  timezone: string | null;
  note: string | null;
  client: Named;
  jobSite: { name: string | null; address: string | null; note: string | null } | null;
  group: Named;
  assignee: { id: string } | null;
  shiftPartners: { id: string; assignee: Named }[] | null;
  timeCard?: {
    id: string;
    state: string;
    punches: CameloPunch[] | null;
  } | null;
};
type CameloSheet = {
  id: string;
  state: string;
  from: string;
  to: string | null;
  totalDuration: number | null;
  timezone: string | null;
  employee: { id: string; name: string | null } | null;
  group: Named;
  client: Named;
  jobSite: Named;
};

/**
 * Shifts a cleaner is not shown: ones the office has not released (Camelo's own app does not show them
 * either), open ones nobody holds, and ones they turned down. A list of what to hide, not of what to show,
 * on purpose: a state this does not know is still the person's own shift, and hiding a real visit from the
 * person who has to turn up for it is the worse mistake.
 */
const NOT_THEIRS_YET = new Set(["DRAFT", "READY", "OPENING", "REJECTED"]);
/** The pay period under way and the seven days after it. */
const DAYS = 14;

const text = (s: string | null | undefined) => (s ?? "").trim() || null;
/** The day a moment falls on in Toronto, YYYY-MM-DD. */
const dayOf = (iso: string) => torontoToday(Date.parse(iso));

function clockOf(tc: CameloShift["timeCard"]) {
  if (!tc) return undefined;
  const punches = tc.punches ?? [];
  const inPunch = punches.find((p) => p.punchType === "CLOCK_IN");
  const outPunch = punches.find((p) => p.punchType === "CLOCK_OUT");
  return {
    state: tc.state,
    inAt: inPunch?.atTime ?? null,
    inPhoto: Boolean(inPunch?.attachment?.photo),
    outAt: outPunch?.atTime ?? null,
    outPhoto: Boolean(outPunch?.attachment?.photo),
  };
}

// The office may look at one person's week, to see what they see; a cleaner's request carries nothing.
const Asked = z.object({ employeeId: id.optional() });

export async function handleMyWeek(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireStaff(req, deps);
  if ("status" in who) return who;
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;

  let employeeId: string;
  if (who.role === "cleaner") {
    // Whose week it is comes from who signed in, and from nothing the request says.
    employeeId = who.employeeId;
  } else {
    const asked = parse(Asked, p, { employeeId: "employeeId is not valid" });
    if ("error" in asked) return { status: 400, body: { error: asked.error } };
    if (!asked.data.employeeId) return { status: 400, body: { error: "Choose whose week to look at" } };
    employeeId = asked.data.employeeId;
  }

  const now = (deps.now ?? Date.now)();
  const start = fridayOf(torontoToday(now));
  const [week, storedToken] = await Promise.all([
    read(deps, `my-week:${employeeId}:${start}`, () => loadMyWeek(employeeId, start, deps)),
    who.role === "cleaner" && deps.cleanerTokens ? deps.cleanerTokens.get(who.employeeId) : Promise.resolve(null),
  ]);
  const cameloConnected = hasValidCleanerToken(storedToken, deps.camelToken, now);
  // The name is the signed-in cleaner's own, from Camelo's list of people; the office already knows whose week it asked for.
  return week.status === 200
    ? { status: 200, body: { name: who.role === "cleaner" ? who.name : null, cameloConnected, ...(week.body as object) } }
    : week;
}

async function loadMyWeek(employeeId: string, start: string, deps: Deps): Promise<ApiResponse> {
  const from = torontoMidnight(start);
  const periodEnd = torontoMidnight(addDays(start, 7));
  const to = torontoMidnight(addDays(start, DAYS));
  // toTime is inclusive, hence one second short of the next midnight
  const lastSecond = (next: string) => new Date(Date.parse(next) - 1000).toISOString();
  const fetchImpl = deps.fetchImpl ?? fetch;

  let shifts: CameloShift[];
  let sheets: CameloSheet[];
  try {
    [shifts, sheets] = await Promise.all([
      fetchAll<CameloShift>(MY_SHIFTS_QUERY, "shifts", deps.camelToken, from, lastSecond(to), fetchImpl, { userIds: [employeeId] }),
      fetchAll<CameloSheet>(MY_TIMESHEETS_QUERY, "timesheets", deps.camelToken, from, lastSecond(periodEnd), fetchImpl, {
        employeeIds: [employeeId],
      }),
    ]);
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not load your week from Camelo" } };
  }

  // Camelo was asked for this person's only. It is checked again here all the same: a filter that was
  // ignored, or changed its meaning, must not put someone else's visit or hours in the answer.
  const [lo, hi, periodHi] = [Date.parse(from), Date.parse(to), Date.parse(periodEnd)];
  const mine = [...new Map(shifts.map((s) => [s.id, s])).values()]
    .filter((s) => s.assignee?.id === employeeId && !NOT_THEIRS_YET.has(String(s.state).toUpperCase()))
    .filter((s) => Date.parse(s.startTime) >= lo && Date.parse(s.startTime) < hi)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));

  // On Call only says who is on call that day: the day is named, and nothing else about it.
  const onCall = [...new Set(mine.filter((s) => isOnCall(s.group?.name)).map((s) => dayOf(s.startTime)))].sort();
  const visits = mine
    .filter((s) => !isOnCall(s.group?.name))
    .map((s) => {
      const clock = clockOf(s.timeCard);
      return {
        id: s.id,
        start: s.startTime,
        end: s.endTime,
        timezone: s.timezone,
        state: s.state,
        position: text(s.group?.name),
        client: text(s.client?.name),
        site: text(s.jobSite?.name),
        address: text(s.jobSite?.address),
        note: text(s.note),
        siteNote: text(s.jobSite?.note),
        // who they are working with: names only
        with: (s.shiftPartners ?? []).map((x) => text(x.assignee?.name)).filter((n): n is string => !!n),
        // their partners' own shift ids on this visit, so each sees the other's photos of the home (decision 0044)
        partnerShiftIds: (s.shiftPartners ?? []).map((x) => x.id).filter((x): x is string => typeof x === "string" && !!x),
        ...(clock ? { clock } : {}),
      };
    });

  // Their own clock-ins for the pay period, in the shape Payroll hours adds up, so the page can use the
  // same sums. A timesheet logged as On Call is dropped, as everywhere else.
  const timesheets = [...new Map(sheets.map((t) => [t.id, t])).values()]
    .filter((t) => t.employee?.id === employeeId && !isOnCall(t.group?.name))
    .filter((t) => Date.parse(t.from) >= lo && Date.parse(t.from) < periodHi)
    .sort((a, b) => Date.parse(a.from) - Date.parse(b.from))
    .map((t) => ({
      id: t.id,
      state: t.state,
      from: t.from,
      to: t.to,
      totalDuration: t.totalDuration,
      timezone: t.timezone,
      employee: { id: employeeId, name: t.employee?.name ?? null },
      group: { name: text(t.group?.name) },
      client: t.client ? { name: text(t.client.name) } : null,
      jobSite: t.jobSite ? { name: text(t.jobSite.name) } : null,
    }));

  return { status: 200, body: { periodStart: start, from, periodEnd, to, visits, onCall, timesheets } };
}
