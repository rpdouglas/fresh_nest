// POST /api/timesheet-actions: who is signed in, the change log, and the changes to timesheets in Camelo.
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { requireOffice } from "../who.js";
import { camelo } from "../camelo.js";
import { DAY_MS, ISO_WITH_OFFSET, TZ, addDays, isId, text, torontoMidnight, validDate } from "../checks.js";
import type { ChangeEntry } from "../stores.js";

/**
 * The timesheet actions that change something in Camelo. Camelo offers no read-only
 * token, so the local dev server refuses these unless it is started to allow them
 * (see dev.ts). Everything else only reads Camelo or writes to the site's own store.
 */
export const CAMELO_WRITE_ACTIONS = ["approve", "reject", "update", "create", "comment"];

/** Whether a request would change something in Camelo. */
export const changesCamelo = (path: string | undefined, action: unknown): boolean =>
  (/\/timesheet-actions\/?$/.test(path ?? "") && typeof action === "string" && CAMELO_WRITE_ACTIONS.includes(action)) ||
  /\/clock\/?$/.test(path ?? "");

const SHEET_FIELDS = "id state from to totalDuration timezone employee { id name }";
type Sheet = {
  id: string;
  state: string;
  from: string;
  to: string | null;
  totalDuration: number | null;
  employee: { id: string; name: string | null } | null;
};
type MutationError = { attribute: string | null; fullMessage: string | null; type: string | null };

const snapshot = (s: Sheet | null) => (s ? { state: s.state, from: s.from, to: s.to, totalDuration: s.totalDuration } : null);
const sayNo = (errors: MutationError[] | null | undefined) =>
  errors?.length ? errors.map((e) => e.fullMessage || e.type || "refused").join("; ") : null;

// Camelo only approves or rejects entries that are still waiting; it has no
// way to un-approve one, and processed entries belong to a finished pay run.
const WAITING = new Set(["DRAFT", "SUBMITTED", "REJECTED"]);
const MAX_IDS = 100;

/** Changes to timesheets, by someone signed in. Every change is logged. */
export async function handleActions(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;
  const { email } = who;

  if (req.action === "whoami") return { status: 200, body: { email, editor: true } };

  if (req.action === "log") {
    if (!validDate(req.periodStart)) return { status: 400, body: { error: "periodStart must be YYYY-MM-DD" } };
    const entries = await (deps.changeLog?.list(torontoMidnight(req.periodStart), torontoMidnight(addDays(req.periodStart, 7))) ?? []);
    return { status: 200, body: { entries } };
  }

  if (req.action === "employees") {
    try {
      return { status: 200, body: { employees: await activeEmployees(deps) } };
    } catch (e) {
      console.error(e);
      return { status: 502, body: { error: "Could not load employees from Camelo" } };
    }
  }
  if (req.action === "places") {
    try {
      return { status: 200, body: await clientsAndSites(deps) };
    } catch (e) {
      console.error(e);
      return { status: 502, body: { error: "Could not load clients and job sites from Camelo" } };
    }
  }
  if (req.action === "comment") return addComment(req, deps, email);
  if (req.action === "comments") return listComments(req, deps);
  if (req.action === "update") return updateTimes(req, deps, email);
  if (req.action === "create") return createDraft(req, deps, email);
  if (req.action !== "approve" && req.action !== "reject") return { status: 400, body: { error: "Unknown action" } };
  const action = req.action;
  const ids = req.timesheetIds;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAX_IDS ||
    !ids.every((x) => typeof x === "string" && /^[\w-]{1,64}$/.test(x))
  ) {
    return { status: 400, body: { error: `timesheetIds must be a list of 1 to ${MAX_IDS} ids` } };
  }
  const unique = [...new Set(ids as string[])];
  const now = (deps.now ?? Date.now)();

  let before: (Sheet | null)[];
  try {
    before = await Promise.all(
      unique.map((id) =>
        camelo<{ timesheet: Sheet | null }>(deps, `query($id: ID!) { timesheet(id: $id) { ${SHEET_FIELDS} } }`, { id }).then(
          (d) => d.timesheet,
        ),
      ),
    );
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not read the timesheets from Camelo" } };
  }

  const results: { id: string; ok: boolean; state: string | null; message: string | null }[] = [];
  const record = async (sheet: Sheet | null, id: string, after: Sheet | null, message: string | null) => {
    const ok = message === null;
    results.push({ id, ok, state: (after ?? sheet)?.state ?? null, message });
    await deps.changeLog?.write({
      at: now,
      email,
      action,
      timesheetId: id,
      employee: sheet?.employee?.name ?? null,
      sheetFrom: sheet?.from ?? null,
      before: snapshot(sheet),
      after: ok ? snapshot(after) : null,
      ok,
      message,
    });
  };

  const todo: Sheet[] = [];
  for (const [i, id] of unique.entries()) {
    const sheet = before[i];
    if (!sheet) await record(null, id, null, "Not found in Camelo");
    else if (!WAITING.has(sheet.state))
      await record(
        sheet,
        id,
        null,
        `Already ${sheet.state.toLowerCase()}, so it cannot be ${action === "approve" ? "approved" : "rejected"}`,
      );
    else if (action === "reject" && sheet.state === "REJECTED") await record(sheet, id, null, "Already rejected");
    else todo.push(sheet);
  }

  if (action === "approve" && todo.length) {
    try {
      const data = await camelo<{ approveTimesheets: { errors: MutationError[] | null; result: Sheet[] | null } | null }>(
        deps,
        `mutation($input: ApproveTimesheetsInput!) { approveTimesheets(input: $input) { errors { attribute fullMessage type } result { ${SHEET_FIELDS} } } }`,
        { input: { timesheetIds: todo.map((s) => s.id) } },
      );
      const refused = sayNo(data.approveTimesheets?.errors);
      const after = new Map((data.approveTimesheets?.result ?? []).map((s) => [s.id, s]));
      for (const sheet of todo) {
        const done = after.get(sheet.id) ?? null;
        await record(sheet, sheet.id, done, done?.state === "APPROVED" ? null : (refused ?? "Camelo did not approve it"));
      }
    } catch (e) {
      console.error(e);
      for (const sheet of todo) await record(sheet, sheet.id, null, "Camelo could not be reached; nothing was changed");
    }
  }

  if (action === "reject") {
    for (const sheet of todo) {
      try {
        const data = await camelo<{ rejectTimesheet: { errors: MutationError[] | null; result: Sheet | null } | null }>(
          deps,
          `mutation($input: RejectTimesheetInput!) { rejectTimesheet(input: $input) { errors { attribute fullMessage type } result { ${SHEET_FIELDS} } } }`,
          { input: { timesheetId: sheet.id } },
        );
        const done = data.rejectTimesheet?.result ?? null;
        await record(
          sheet,
          sheet.id,
          done,
          done?.state === "REJECTED" ? null : (sayNo(data.rejectTimesheet?.errors) ?? "Camelo did not reject it"),
        );
      } catch (e) {
        console.error(e);
        await record(sheet, sheet.id, null, "Camelo could not be reached; nothing was changed");
      }
    }
  }

  return { status: 200, body: { email, results } };
}

/** Every node of a Camelo list, page by page. */
async function allNodes<T>(deps: Deps, list: string, fields: string): Promise<T[]> {
  type Page = Record<string, { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: T[] }>;
  const nodes: T[] = [];
  let after: string | null = null;
  for (;;) {
    const data: Page = await camelo<Page>(
      deps,
      `query($after: String) { ${list}(first: 100, after: $after) { pageInfo { hasNextPage endCursor } nodes { ${fields} } } }`,
      { after },
    );
    nodes.push(...data[list].nodes);
    if (!data[list].pageInfo.hasNextPage) break;
    after = data[list].pageInfo.endCursor;
  }
  return nodes;
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/** Everyone an entry can be added for: active Camelo users, by name. */
async function activeEmployees(deps: Deps): Promise<{ id: string; name: string }[]> {
  const users = await allNodes<{ id: string; name: string | null; state: string }>(deps, "users", "id name state");
  return users
    .filter((u) => u.state === "ACTIVE")
    .map((u) => ({ id: u.id, name: u.name || "Unnamed employee" }))
    .sort(byName);
}

/**
 * The clients and job sites an entry can be put at, by name. A site names the client
 * it belongs to (Camelo allows several; in practice a site has one, and the first is kept).
 */
async function clientsAndSites(deps: Deps) {
  const [clients, sites] = await Promise.all([
    allNodes<{ id: string; name: string | null }>(deps, "clients", "id name"),
    allNodes<{ id: string; name: string | null; clients: { id: string }[] | null }>(deps, "jobSites", "id name clients { id }"),
  ]);
  return {
    clients: clients.map((c) => ({ id: c.id, name: c.name || "Unnamed client" })).sort(byName),
    sites: sites.map((s) => ({ id: s.id, name: s.name || "Unnamed job site", clientId: s.clients?.[0]?.id ?? null })).sort(byName),
  };
}

/** Checks a start and end time; returns what is wrong with them, or null. */
function badTimes(from: unknown, to: unknown): string | null {
  if (typeof from !== "string" || typeof to !== "string" || !ISO_WITH_OFFSET.test(from) || !ISO_WITH_OFFSET.test(to)) {
    return "from and to must be date-times with a UTC offset";
  }
  const span = Date.parse(to) - Date.parse(from);
  if (Number.isNaN(span)) return "from and to must be real date-times";
  if (span < 60_000) return "The end must be at least a minute after the start";
  if (span > DAY_MS) return "An entry cannot be longer than 24 hours";
  return null;
}

async function logged(deps: Deps, entry: ChangeEntry): Promise<ApiResponse> {
  await deps.changeLog?.write(entry);
  const state = (entry.after?.state ?? entry.before?.state ?? null) as string | null;
  return { status: 200, body: { email: entry.email, results: [{ id: entry.timesheetId, ok: entry.ok, state, message: entry.message }] } };
}

/** Changes the start and end of one entry. Camelo keeps its state, so an approved entry stays approved. */
async function updateTimes(req: ApiRequest, deps: Deps, email: string): Promise<ApiResponse> {
  if (!isId(req.timesheetId)) return { status: 400, body: { error: "timesheetId is required" } };
  const wrong = badTimes(req.from, req.to);
  if (wrong) return { status: 400, body: { error: wrong } };
  const id = req.timesheetId;
  const base = { at: (deps.now ?? Date.now)(), email, action: "update", timesheetId: id };

  let sheet: Sheet | null;
  try {
    sheet = (await camelo<{ timesheet: Sheet | null }>(deps, `query($id: ID!) { timesheet(id: $id) { ${SHEET_FIELDS} } }`, { id }))
      .timesheet;
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not read the timesheet from Camelo" } };
  }
  const about = { employee: sheet?.employee?.name ?? null, sheetFrom: sheet?.from ?? null, before: snapshot(sheet) };
  const fail = (message: string) => logged(deps, { ...base, ...about, after: null, ok: false, message });
  if (!sheet) return fail("Not found in Camelo");
  if (sheet.state === "PROCESSED") return fail("Already processed in a pay run, so it cannot be changed");
  // An edit corrects a clock-in or clock-out; it should not move the entry to another day.
  if (Math.abs(Date.parse(req.from as string) - Date.parse(sheet.from)) > DAY_MS) return fail("The start can move by at most a day");

  try {
    const data = await camelo<{ updateTimesheet: { errors: MutationError[] | null; result: Sheet | null } | null }>(
      deps,
      `mutation($input: UpdateTimesheetInput!) { updateTimesheet(input: $input) { errors { attribute fullMessage type } result { ${SHEET_FIELDS} } } }`,
      { input: { timesheetId: id, from: req.from, to: req.to } },
    );
    const refused = sayNo(data.updateTimesheet?.errors);
    const done = data.updateTimesheet?.result ?? null;
    if (refused || !done) return fail(refused ?? "Camelo did not change it");
    return logged(deps, { ...base, ...about, after: snapshot(done), ok: true, message: null });
  } catch (e) {
    console.error(e);
    return fail("Camelo could not be reached; nothing was changed");
  }
}

type CameloComment = { id: string; content: string; createdAt: string; systemGenerated: boolean; author: { name: string | null } | null };

/**
 * Leaves a note on a timesheet as a Camelo comment, so it shows in Camelo too.
 * Camelo records the API token's account as the author, so the editor's own
 * address is written into the note.
 */
async function addComment(req: ApiRequest, deps: Deps, email: string): Promise<ApiResponse> {
  if (!isId(req.timesheetId)) return { status: 400, body: { error: "timesheetId is required" } };
  const note = text(req.content, 2000);
  if (!note) return { status: 400, body: { error: "Write a note (up to 2000 characters)" } };
  const id = req.timesheetId;
  const content = `${note}\n(${email}, via the reports site)`;
  const base = { at: (deps.now ?? Date.now)(), email, action: "comment", timesheetId: id, employee: null, sheetFrom: null, before: null };
  let sheet: Sheet | null = null;
  try {
    sheet = (await camelo<{ timesheet: Sheet | null }>(deps, `query($id: ID!) { timesheet(id: $id) { ${SHEET_FIELDS} } }`, { id }))
      .timesheet;
    if (!sheet) return logged(deps, { ...base, after: null, ok: false, message: "Not found in Camelo" });
    const data = await camelo<{ createComment: { errors: MutationError[] | null; result: { id: string } | null } | null }>(
      deps,
      "mutation($input: CreateCommentInput!) { createComment(input: $input) { errors { attribute fullMessage type } result { id } } }",
      { input: { commentableId: id, commentableType: "TIMESHEET", content } },
    );
    const refused = sayNo(data.createComment?.errors);
    const about = { employee: sheet.employee?.name ?? null, sheetFrom: sheet.from };
    if (refused || !data.createComment?.result)
      return logged(deps, { ...base, ...about, after: null, ok: false, message: refused ?? "Camelo did not save the note" });
    return logged(deps, { ...base, ...about, after: { state: sheet.state, note }, ok: true, message: null });
  } catch (e) {
    console.error(e);
    return logged(deps, {
      ...base,
      employee: sheet?.employee?.name ?? null,
      sheetFrom: sheet?.from ?? null,
      after: null,
      ok: false,
      message: "Camelo could not be reached; the note was not saved",
    });
  }
}

/** The notes people have left on some timesheets (Camelo's own automatic comments are left out). */
async function listComments(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const ids = req.timesheetIds;
  if (!Array.isArray(ids) || ids.length > MAX_IDS || !ids.every(isId))
    return { status: 400, body: { error: `timesheetIds must be a list of at most ${MAX_IDS} ids` } };
  try {
    const lists = await Promise.all(
      [...new Set(ids as string[])].map(async (id) => {
        const data = await camelo<{ comments: { nodes: CameloComment[] } }>(
          deps,
          "query($id: ID!) { comments(commentableId: $id, commentableType: TIMESHEET, first: 50) { nodes { id content createdAt systemGenerated author { name } } } }",
          { id },
        );
        const notes = data.comments.nodes
          .filter((c) => !c.systemGenerated)
          .map((c) => ({ id: c.id, content: c.content, createdAt: c.createdAt, author: c.author?.name ?? null }))
          .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
        return [id, notes] as const;
      }),
    );
    return { status: 200, body: { comments: Object.fromEntries(lists.filter(([, notes]) => notes.length > 0)) } };
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not load notes from Camelo" } };
  }
}

/**
 * Adds an entry as a draft, so it still has to be approved before it counts toward pay.
 * A client and job site are optional; Camelo's docs omit them but it takes and keeps
 * both (checked against real Camelo, 2026-11-12), and billing places the entry by them.
 */
async function createDraft(req: ApiRequest, deps: Deps, email: string): Promise<ApiResponse> {
  if (!isId(req.employeeId)) return { status: 400, body: { error: "employeeId is required" } };
  for (const key of ["groupId", "clientId", "jobSiteId"] as const)
    if (req[key] != null && !isId(req[key])) return { status: 400, body: { error: `${key} is not valid` } };
  const wrong = badTimes(req.from, req.to);
  if (wrong) return { status: 400, body: { error: wrong } };
  const base = { at: (deps.now ?? Date.now)(), email, action: "create", sheetFrom: req.from as string, before: null };
  const fail = (message: string) => logged(deps, { ...base, timesheetId: "", employee: null, after: null, ok: false, message });

  try {
    const input: Record<string, unknown> = { employeeId: req.employeeId, from: req.from, to: req.to, timezone: TZ };
    if (req.groupId) input.groupId = req.groupId;
    if (req.clientId) input.clientId = req.clientId;
    if (req.jobSiteId) input.jobSiteId = req.jobSiteId;
    type Placed = Sheet & { client?: { name: string | null } | null; jobSite?: { name: string | null } | null };
    const data = await camelo<{ draftTimesheet: { errors: MutationError[] | null; result: Placed | null } | null }>(
      deps,
      `mutation($input: DraftTimesheetInput!) { draftTimesheet(input: $input) { errors { attribute fullMessage type } result { ${SHEET_FIELDS} client { name } jobSite { name } } } }`,
      { input },
    );
    const refused = sayNo(data.draftTimesheet?.errors);
    const done = data.draftTimesheet?.result ?? null;
    if (refused || !done) return fail(refused ?? "Camelo did not create it");
    return logged(deps, {
      ...base,
      timesheetId: done.id,
      employee: done.employee?.name ?? null,
      sheetFrom: done.from,
      after: { ...snapshot(done), client: done.client?.name ?? null, jobSite: done.jobSite?.name ?? null },
      ok: true,
      message: null,
    });
  } catch (e) {
    console.error(e);
    return fail("Camelo could not be reached; nothing was created");
  }
}
