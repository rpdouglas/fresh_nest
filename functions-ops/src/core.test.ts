import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MemoryCleanerTokens,
  MemoryFeedback,
  MemoryClientRates,
  MemoryInvoices,
  MemoryLiveHandledStore,
  MemoryPhotoFiles,
  MemoryVisitPhotos,
  MemoryLog,
  MemoryPlaces,
  MemorySettingsStore,
  MemorySnapshots,
  MemorySoloOk,
  addDays,
  changesCamelo,
  decryptToken,
  encryptToken,
  handleInvoices,
  invoiceId,
  cameloRetry,
  handleApi,
  handleShifts,
  signCleanerSession,
  torontoMidnight,
  verifyCleanerSession,
} from "./core.js";
import type { BrowserError, Feedback } from "./core.js";
import { PeopleCache, ROUTES, ReadCache } from "./core.js";
import { readFileSync } from "node:fs";

// Retry without waiting, so outage tests stay fast.
cameloRetry.delaysMs = [0, 0];

const shift = (startTime: string) => ({ id: startTime, startTime });

type Node = { id: string; startTime: string };
const calls: { fromTime: string; toTime: string; after: string | null }[] = [];

/** Serves `pages` for the day whose range starts on `day`, and nothing for other days. */
function fakeFetch(pages: Node[][], day = "2026-10-05"): typeof fetch {
  return (async (_url: unknown, init: { body: string }) => {
    const { filter, after } = JSON.parse(init.body).variables;
    calls.push({ ...filter, after });
    const mine = filter.fromTime.startsWith(day) ? pages : [[]];
    const i = after ? Number(after) : 0;
    return new Response(
      JSON.stringify({
        data: { shifts: { pageInfo: { hasNextPage: i + 1 < mine.length, endCursor: String(i + 1) }, nodes: mine[i] } },
      }),
    );
  }) as unknown as typeof fetch;
}

// A pretend Google: "good:<email>" is a valid sign-in as that address.
const verifyGoogle = async (t: string) => (t.startsWith("good:") ? t.slice(5) : null);
const signedIn = "good:boss@example.com";
const base = { method: "POST", googleToken: signedIn, weekStart: "2026-10-05" };
const deps = (over = {}) => ({ camelToken: "t", verifyGoogle, editors: ["boss@example.com"], fetchImpl: fakeFetch([[]]), ...over });

test("torontoMidnight follows DST", () => {
  assert.equal(torontoMidnight("2026-10-05"), "2026-10-05T00:00:00-04:00");
  assert.equal(torontoMidnight("2026-11-02"), "2026-11-02T00:00:00-05:00");
  assert.equal(torontoMidnight("2026-11-01"), "2026-11-01T00:00:00-04:00");
  assert.equal(addDays("2026-12-28", 7), "2027-01-04");
});

test("paginates, sorts and trims to the week", async () => {
  const r = await handleShifts(
    base,
    deps({
      fetchImpl: fakeFetch([
        [shift("2026-10-11T23:30:00.000-04:00"), shift("2026-10-04T23:00:00.000-04:00")],
        [shift("2026-10-05T07:00:00.000-04:00"), shift("2026-10-12T08:00:00.000-04:00")],
      ]),
    }),
  );
  assert.equal(r.status, 200);
  const ids = (r.body as { shifts: { id: string }[] }).shifts.map((s) => s.id);
  assert.deepEqual(ids, ["2026-10-05T07:00:00.000-04:00", "2026-10-11T23:30:00.000-04:00"]);
});

test("asks for each day separately and drops a shift returned by two days", async () => {
  calls.length = 0;
  const same = shift("2026-10-06T09:00:00.000-04:00");
  const everyDay = (async (_u: unknown, init: { body: string }) => {
    calls.push(JSON.parse(init.body).variables.filter);
    return new Response(JSON.stringify({ data: { shifts: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [same] } } }));
  }) as unknown as typeof fetch;
  const r = await handleShifts(base, deps({ fetchImpl: everyDay }));
  assert.equal((r.body as { shifts: unknown[] }).shifts.length, 1);
  assert.deepEqual(
    calls.map((c) => c.fromTime.slice(0, 10)),
    ["05", "06", "07", "08", "09", "10", "11"].map((d) => `2026-10-${d}`),
  );
  assert.deepEqual([calls[0].fromTime, calls[0].toTime], ["2026-10-05T00:00:00-04:00", "2026-10-06T03:59:59.000Z"]);
});

test("day ranges follow the clock change", async () => {
  calls.length = 0;
  await handleShifts({ ...base, weekStart: "2026-10-26" }, deps());
  const sunday = calls.find((c) => c.fromTime.startsWith("2026-11-01"))!;
  // 25-hour day: midnight EDT to one second before midnight EST
  assert.deepEqual([sunday.fromTime, sunday.toTime], ["2026-11-01T00:00:00-04:00", "2026-11-02T04:59:59.000Z"]);
});

test("refuses no sign-in, someone not on the list, a bad date and non-POST", async () => {
  for (const googleToken of [undefined, "", "forged"]) {
    const r = await handleShifts({ ...base, googleToken }, deps());
    assert.deepEqual([r.status, (r.body as { reason: string }).reason], [401, "not_signed_in"], String(googleToken));
  }
  const stranger = await handleShifts({ ...base, googleToken: "good:stranger@example.com" }, deps());
  assert.deepEqual([stranger.status, (stranger.body as { reason: string }).reason], [403, "not_editor"]);
  // nobody listed means nobody gets in
  assert.equal((await handleShifts(base, deps({ editors: [] }))).status, 403);
  assert.equal((await handleShifts({ ...base, weekStart: "2026-02-31" }, deps())).status, 400);
  assert.equal((await handleShifts({ ...base, method: "GET" }, deps())).status, 405);
});

test("reports Camelo failures as 502 without leaking detail", async () => {
  const r = await handleShifts(base, deps({ fetchImpl: (async () => new Response("nope", { status: 500 })) as typeof fetch }));
  assert.equal(r.status, 502);
  assert.deepEqual(r.body, { error: "Could not load shifts from Camelo" });
});

test("retries a read after a 5xx or 429 and gives up after three tries", async () => {
  let n = 0;
  const flaky = (status: number, failures: number) =>
    (async (url: unknown, init: { body: string }) =>
      ++n <= failures ? new Response("busy", { status }) : fakeFetch([[]])(url as string, init as RequestInit)) as unknown as typeof fetch;
  assert.equal((await handleShifts(base, deps({ fetchImpl: flaky(503, 1) }))).status, 200);
  n = 0;
  assert.equal((await handleShifts({ ...base, weekStart: "2026-10-12" }, deps({ fetchImpl: flaky(429, 2) }))).status, 200);
  let tries = 0;
  const down = (async () => (tries++, new Response("x", { status: 500 }))) as typeof fetch;
  assert.equal((await handleApi({ ...base, path: "/api/timesheets", periodStart: "2026-10-02" }, deps({ fetchImpl: down }))).status, 502);
  assert.equal(tries, 3);
});

test("waits as long as Camelo asks after a 429 or 503, up to a cap", async () => {
  const saved = cameloRetry.maxWaitMs;
  cameloRetry.maxWaitMs = 60;
  try {
    for (const [status, after, least, weekStart] of [
      [429, "0.03", 25, "2026-09-07"],
      [503, "3600", 55, "2026-09-14"],
    ] as const) {
      let n = 0;
      const busy = (async (url: unknown, init: { body: string }) =>
        ++n === 1
          ? new Response("busy", { status, headers: { "Retry-After": after } })
          : fakeFetch([[]])(url as string, init as RequestInit)) as unknown as typeof fetch;
      const t0 = Date.now();
      assert.equal((await handleShifts({ ...base, weekStart }, deps({ fetchImpl: busy }))).status, 200);
      const took = Date.now() - t0;
      assert.ok(took >= least && took < 1000, `${status} waited ${took} ms`);
    }
  } finally {
    cameloRetry.maxWaitMs = saved;
  }
});

test("does not retry a 4xx", async () => {
  let tries = 0;
  const bad = (async () => (tries++, new Response("x", { status: 400 }))) as typeof fetch;
  assert.equal((await handleApi({ ...base, path: "/api/timesheets", periodStart: "2026-10-02" }, deps({ fetchImpl: bad }))).status, 502);
  assert.equal(tries, 1);
});

test("a Camelo request that hangs times out and is retried", async () => {
  const saved = cameloRetry.timeoutMs;
  cameloRetry.timeoutMs = 20;
  try {
    let tries = 0;
    const hang = ((_url: unknown, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        tries++;
        // AbortSignal.timeout's timer does not hold the event loop open; a live server does.
        const keepAlive = setTimeout(() => {}, 1000);
        init.signal!.addEventListener("abort", () => (clearTimeout(keepAlive), reject(init.signal!.reason)));
      })) as typeof fetch;
    const r = await handleApi({ ...base, path: "/api/timesheets", periodStart: "2026-10-02" }, deps({ fetchImpl: hang }));
    assert.equal(r.status, 502);
    assert.equal(tries, 3);
  } finally {
    cameloRetry.timeoutMs = saved;
  }
});

const sheet = (id: string, from: string) => ({ id, from });

function timesheetFetch(pages: { id: string; from: string }[][]): typeof fetch {
  return (async (_url: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    calls.push({ ...variables.filter, after: variables.after });
    assert.match(query, /timesheets\(/);
    const i = variables.after ? Number(variables.after) : 0;
    return new Response(
      JSON.stringify({
        data: { timesheets: { pageInfo: { hasNextPage: i + 1 < pages.length, endCursor: String(i + 1) }, nodes: pages[i] } },
      }),
    );
  }) as unknown as typeof fetch;
}

const payReq = { method: "POST", googleToken: signedIn, path: "/api/timesheets", periodStart: "2026-10-02" };

test("timesheets: one Friday-to-Thursday request, paginated, trimmed to the period and sorted", async () => {
  calls.length = 0;
  const r = await handleApi(
    payReq,
    deps({
      fetchImpl: timesheetFetch([
        [sheet("thu-late", "2026-10-08T23:50:00.000-04:00"), sheet("before", "2026-10-01T23:59:00.000-04:00")],
        [
          sheet("fri-first", "2026-10-02T00:00:00.000-04:00"),
          sheet("next-fri", "2026-10-09T00:00:00.000-04:00"),
          sheet("thu-late", "2026-10-08T23:50:00.000-04:00"),
        ],
      ]),
    }),
  );
  assert.equal(r.status, 200);
  const body = r.body as { from: string; to: string; timesheets: { id: string }[] };
  assert.deepEqual(
    body.timesheets.map((t) => t.id),
    ["fri-first", "thu-late"],
  );
  assert.deepEqual([body.from, body.to], ["2026-10-02T00:00:00-04:00", "2026-10-09T00:00:00-04:00"]);
  assert.deepEqual(
    calls.map((c) => [c.fromTime, c.toTime, c.after]),
    [
      ["2026-10-02T00:00:00-04:00", "2026-10-09T03:59:59.000Z", null],
      ["2026-10-02T00:00:00-04:00", "2026-10-09T03:59:59.000Z", "1"],
    ],
  );
});

test("timesheets: the period spanning the clock change is 169 hours long", async () => {
  const r = await handleApi({ ...payReq, periodStart: "2026-10-30" }, deps({ fetchImpl: timesheetFetch([[]]) }));
  const body = r.body as { from: string; to: string };
  assert.deepEqual([body.from, body.to], ["2026-10-30T00:00:00-04:00", "2026-11-06T00:00:00-05:00"]);
  assert.equal((Date.parse(body.to) - Date.parse(body.from)) / 3_600_000, 169);
});

test("timesheets: same sign-in check and validation as shifts", async () => {
  const d = deps({ fetchImpl: timesheetFetch([[]]) });
  assert.equal((await handleApi({ ...payReq, googleToken: undefined }, d)).status, 401);
  assert.equal((await handleApi({ ...payReq, googleToken: "good:stranger@example.com" }, d)).status, 403);
  assert.equal((await handleApi({ ...payReq, method: "GET" }, d)).status, 405);
  assert.equal((await handleApi({ ...payReq, periodStart: "nope" }, d)).status, 400);
  const down = await handleApi(payReq, deps({ fetchImpl: (async () => new Response("x", { status: 500 })) as typeof fetch }));
  assert.deepEqual([down.status, down.body], [502, { error: "Could not load timesheets from Camelo" }]);
});

test("health names the build when there is one, with ok first for the uptime check", async () => {
  const r = await handleApi({ method: "GET", path: "/api/health" }, deps({ build: "abc1234" }));
  assert.deepEqual([r.status, r.body], [200, { ok: true, build: "abc1234" }]);
  // the uptime check looks for this text in the answer
  assert.ok(JSON.stringify(r.body).includes('"ok":true'));
});

test("health answers without a sign-in or a Camelo call", async () => {
  let fetched = 0;
  const r = await handleApi(
    { method: "GET", path: "/api/health" },
    deps({ fetchImpl: (async () => (fetched++, new Response("{}"))) as typeof fetch }),
  );
  assert.deepEqual([r.status, r.body, fetched], [200, { ok: true }, 0]);
});

test("routes by path: anything else is the shifts handler", async () => {
  const r = await handleApi({ ...base, path: "/api/shifts" }, deps());
  assert.equal(r.status, 200);
  assert.ok("shifts" in (r.body as object));
  assert.ok("shifts" in ((await handleApi({ ...base, path: "/" }, deps())).body as object));
});

// ---- changes to timesheets -------------------------------------------------

type FakeSheet = { id: string; state: string; from: string; to: string; totalDuration: number; employee: { id: string; name: string } };
const fake = (id: string, state: string, day = "2026-10-06"): FakeSheet => ({
  id,
  state,
  from: `${day}T09:00:00.000-04:00`,
  to: `${day}T10:00:00.000-04:00`,
  totalDuration: 60,
  employee: { id: "e1", name: "Alex" },
});

/** A pretend Camelo holding some timesheets; records every mutation it is sent. */
function cameloWith(sheets: FakeSheet[], opts: { refuse?: string; down?: boolean } = {}) {
  const db = new Map(sheets.map((s) => [s.id, s]));
  const mutations: { name: string; input: Record<string, unknown> }[] = [];
  const fetchImpl = (async (_url: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    const reply = (data: unknown) => new Response(JSON.stringify({ data }));
    if (query.includes("timesheet(id:")) return reply({ timesheet: db.get(variables.id) ?? null });
    const name = /(approveTimesheets|rejectTimesheet|updateTimesheet|draftTimesheet)\(/.exec(query)![1];
    mutations.push({ name, input: variables.input });
    if (opts.down) return new Response("x", { status: 503 });
    if (opts.refuse) return reply({ [name]: { errors: [{ attribute: null, fullMessage: opts.refuse, type: "invalid" }], result: null } });
    if (name === "updateTimesheet") {
      const done = { ...db.get(variables.input.timesheetId)!, from: variables.input.from, to: variables.input.to, totalDuration: 999 };
      db.set(done.id, done);
      return reply({ updateTimesheet: { errors: [], result: done } });
    }
    if (name === "draftTimesheet") {
      const done = {
        id: "new1",
        state: "DRAFT",
        from: variables.input.from,
        to: variables.input.to,
        totalDuration: 30,
        employee: { id: variables.input.employeeId, name: "Bo" },
        client: variables.input.clientId ? { name: "Maple Court" } : null,
        jobSite: variables.input.jobSiteId ? { name: "Maple Court, back unit" } : null,
      };
      db.set(done.id, done);
      return reply({ draftTimesheet: { errors: [], result: done } });
    }
    if (name === "approveTimesheets") {
      const done = (variables.input.timesheetIds as string[]).map((id) => ({ ...db.get(id)!, state: "APPROVED" }));
      for (const d of done) db.set(d.id, d);
      return reply({ approveTimesheets: { errors: [], result: done } });
    }
    const done = { ...db.get(variables.input.timesheetId)!, state: "REJECTED" };
    db.set(done.id, done);
    return reply({ rejectTimesheet: { errors: [], result: done } });
  }) as unknown as typeof fetch;
  return { fetchImpl, mutations, db };
}

const act = { method: "POST", path: "/api/timesheet-actions", googleToken: "good:Boss@Example.com" };
const editorDeps = (c: ReturnType<typeof cameloWith>, over = {}) => {
  const changeLog = new MemoryLog();
  return {
    d: deps({ fetchImpl: c.fetchImpl, verifyGoogle, editors: [" boss@example.com ", "other@example.com"], changeLog, ...over }),
    changeLog,
  };
};

test("changes need a Google sign-in by someone on the list", async () => {
  const c = cameloWith([fake("a", "SUBMITTED")]);
  const { d, changeLog } = editorDeps(c);
  const body = { action: "approve", timesheetIds: ["a"] };
  for (const googleToken of [undefined, "", "bad-token"]) {
    assert.equal((await handleApi({ ...act, ...body, googleToken }, d)).status, 401, String(googleToken));
  }
  assert.equal((await handleApi({ ...act, ...body, googleToken: "good:stranger@example.com" }, d)).status, 403);
  assert.equal(r_reason(await handleApi({ ...act, ...body, googleToken: "good:stranger@example.com" }, d)), "not_editor");
  assert.equal(r_reason(await handleApi({ ...act, ...body, googleToken: undefined }, d)), "not_signed_in");
  // a verifier that throws (expired or forged token) is a refusal, not a crash
  const throwing = editorDeps(c, {
    verifyGoogle: async () => {
      throw new Error("Token used too late");
    },
  });
  assert.equal((await handleApi({ ...act, ...body }, throwing.d)).status, 401);
  // no editors configured means nobody can change anything
  assert.equal((await handleApi({ ...act, ...body }, editorDeps(c, { editors: [] }).d)).status, 403);
  assert.equal(c.mutations.length, 0);
  assert.equal(changeLog.entries.length, 0);
  assert.equal(c.db.get("a")!.state, "SUBMITTED");
});
const r_reason = (r: { body: unknown }) => (r.body as { reason?: string }).reason;

test("whoami confirms an editor, matching the email without regard to case", async () => {
  const r = await handleApi({ ...act, action: "whoami" }, editorDeps(cameloWith([])).d);
  assert.deepEqual([r.status, r.body], [200, { email: "Boss@Example.com", editor: true }]);
});

test("approve sends one mutation for the waiting entries and logs each", async () => {
  const c = cameloWith([fake("a", "SUBMITTED"), fake("b", "DRAFT"), fake("c", "APPROVED"), fake("p", "PROCESSED")]);
  const { d, changeLog } = editorDeps(c, { now: () => 1234 });
  const r = await handleApi({ ...act, action: "approve", timesheetIds: ["a", "b", "c", "p", "missing", "a"] }, d);
  assert.equal(r.status, 200);
  assert.deepEqual(c.mutations, [{ name: "approveTimesheets", input: { timesheetIds: ["a", "b"] } }]);
  const results = (r.body as { results: { id: string; ok: boolean; state: string | null; message: string | null }[] }).results;
  assert.deepEqual(results.map((x) => [x.id, x.ok, x.state]).sort(), [
    ["a", true, "APPROVED"],
    ["b", true, "APPROVED"],
    ["c", false, "APPROVED"],
    ["missing", false, null],
    ["p", false, "PROCESSED"],
  ]);
  assert.match(results.find((x) => x.id === "p")!.message!, /Already processed/);
  assert.equal(changeLog.entries.length, 5);
  const a = changeLog.entries.find((e) => e.timesheetId === "a")!;
  assert.deepEqual(
    [a.at, a.email, a.action, a.employee, a.ok, a.before?.state, a.after?.state],
    [1234, "Boss@Example.com", "approve", "Alex", true, "SUBMITTED", "APPROVED"],
  );
  assert.equal(changeLog.entries.find((e) => e.timesheetId === "c")!.ok, false);
});

test("reject works one entry at a time and leaves approved entries alone", async () => {
  const c = cameloWith([fake("a", "SUBMITTED"), fake("b", "APPROVED"), fake("r", "REJECTED")]);
  const { d, changeLog } = editorDeps(c);
  const r = await handleApi({ ...act, action: "reject", timesheetIds: ["a", "b", "r"] }, d);
  assert.deepEqual(c.mutations, [{ name: "rejectTimesheet", input: { timesheetId: "a" } }]);
  const results = (r.body as { results: { id: string; ok: boolean; state: string }[] }).results;
  assert.deepEqual(results.map((x) => [x.id, x.ok, x.state]).sort(), [
    ["a", true, "REJECTED"],
    ["b", false, "APPROVED"],
    ["r", false, "REJECTED"],
  ]);
  assert.equal(changeLog.entries.filter((e) => e.ok).length, 1);
});

test("a refusal or outage from Camelo is reported and logged as a failure", async () => {
  const refused = cameloWith([fake("a", "SUBMITTED")], { refuse: "Timesheet is locked" });
  const one = editorDeps(refused);
  const r = await handleApi({ ...act, action: "approve", timesheetIds: ["a"] }, one.d);
  assert.deepEqual((r.body as { results: unknown[] }).results, [
    { id: "a", ok: false, state: "SUBMITTED", message: "Timesheet is locked" },
  ]);
  assert.deepEqual(
    [one.changeLog.entries[0].ok, one.changeLog.entries[0].message, one.changeLog.entries[0].after],
    [false, "Timesheet is locked", null],
  );

  const down = cameloWith([fake("a", "SUBMITTED")], { down: true });
  const two = editorDeps(down);
  const r2 = await handleApi({ ...act, action: "reject", timesheetIds: ["a"] }, two.d);
  assert.match((r2.body as { results: { message: string }[] }).results[0].message, /nothing was changed/);
  assert.equal(two.changeLog.entries[0].ok, false);
  // A change is sent once: a retry after a lost reply could apply it twice.
  assert.equal(down.mutations.length, 1);
});

test("bad requests are refused before anything is read or changed", async () => {
  const c = cameloWith([fake("a", "SUBMITTED")]);
  const { d } = editorDeps(c);
  for (const body of [
    { action: "approve" },
    { action: "approve", timesheetIds: [] },
    { action: "approve", timesheetIds: "a" },
    { action: "approve", timesheetIds: ["a", 5] },
    { action: "approve", timesheetIds: ["a b"] },
    { action: "approve", timesheetIds: Array.from({ length: 101 }, (_, i) => `id${i}`) },
    { action: "delete", timesheetIds: ["a"] },
    { timesheetIds: ["a"] },
  ]) {
    assert.equal((await handleApi({ ...act, ...body }, d)).status, 400, JSON.stringify(body).slice(0, 60));
  }
  assert.equal(c.mutations.length, 0);
});

test("the log lists a pay period's changes, newest first", async () => {
  const c = cameloWith([fake("a", "SUBMITTED", "2026-10-06"), fake("b", "SUBMITTED", "2026-10-09"), fake("z", "SUBMITTED", "2026-10-08")]);
  let clock = 1000;
  const { d } = editorDeps(c, { now: () => (clock += 1000) });
  await handleApi({ ...act, action: "approve", timesheetIds: ["a"] }, d);
  await handleApi({ ...act, action: "reject", timesheetIds: ["b"] }, d);
  await handleApi({ ...act, action: "reject", timesheetIds: ["z"] }, d);
  const r = await handleApi({ ...act, action: "log", periodStart: "2026-10-02" }, d);
  assert.deepEqual(
    (r.body as { entries: { timesheetId: string; action: string }[] }).entries.map((e) => [e.timesheetId, e.action]),
    [
      ["z", "reject"],
      ["a", "approve"],
    ],
  );
  assert.equal((await handleApi({ ...act, action: "log" }, d)).status, 400);
  assert.equal((await handleApi({ ...act, action: "log", periodStart: "2026-10-02", googleToken: "nope" }, d)).status, 401);
});

const T = (hm: string, day = "2026-10-06") => `${day}T${hm}:00-04:00`;

test("update changes one entry's times, keeps its state, and logs before and after", async () => {
  const c = cameloWith([fake("a", "APPROVED")]);
  const { d, changeLog } = editorDeps(c);
  const r = await handleApi({ ...act, action: "update", timesheetId: "a", from: T("09:00"), to: T("12:30") }, d);
  assert.deepEqual(c.mutations, [{ name: "updateTimesheet", input: { timesheetId: "a", from: T("09:00"), to: T("12:30") } }]);
  assert.deepEqual((r.body as { results: unknown[] }).results, [{ id: "a", ok: true, state: "APPROVED", message: null }]);
  const e = changeLog.entries[0];
  assert.deepEqual(
    [e.action, e.ok, e.employee, e.before?.to, e.after?.to, e.after?.state],
    ["update", true, "Alex", "2026-10-06T10:00:00.000-04:00", T("12:30"), "APPROVED"],
  );
});

test("update refuses bad times, processed entries and big moves without touching Camelo", async () => {
  const c = cameloWith([fake("a", "SUBMITTED"), fake("p", "PROCESSED")]);
  const { d, changeLog } = editorDeps(c);
  const upd = (over: Record<string, unknown>) =>
    handleApi({ ...act, action: "update", timesheetId: "a", from: T("09:00"), to: T("10:00"), ...over }, d);
  for (const over of [
    { to: T("09:00") },
    { to: T("08:00") },
    { to: T("09:00", "2026-10-08") },
    { from: "2026-10-06 09:00" },
    { from: "2026-10-06T09:00:00" },
    { to: undefined },
    { timesheetId: undefined },
    { timesheetId: "a b" },
    { from: "2026-13-45T09:00:00-04:00" },
  ])
    assert.equal((await upd(over)).status, 400, JSON.stringify(over));
  assert.equal(changeLog.entries.length, 0);
  const results = async (over: Record<string, unknown>) =>
    ((await upd(over)).body as { results: { ok: boolean; message: string }[] }).results[0];
  assert.match((await results({ timesheetId: "p" })).message, /processed/);
  assert.match((await results({ timesheetId: "missing" })).message, /Not found/);
  assert.match((await results({ from: T("09:00", "2026-10-09"), to: T("10:00", "2026-10-09") })).message, /at most a day/);
  assert.equal(c.mutations.length, 0);
  assert.deepEqual(
    changeLog.entries.map((e) => e.ok),
    [false, false, false],
  );
  // still needs the sign-in
  assert.equal((await upd({ googleToken: undefined })).status, 401);
});

test("create adds a draft for the employee, with a position when given", async () => {
  const c = cameloWith([]);
  const { d, changeLog } = editorDeps(c);
  const r = await handleApi({ ...act, action: "create", employeeId: "e2", from: T("13:00"), to: T("13:30"), groupId: "g1" }, d);
  assert.deepEqual(c.mutations, [
    { name: "draftTimesheet", input: { employeeId: "e2", from: T("13:00"), to: T("13:30"), timezone: "America/Toronto", groupId: "g1" } },
  ]);
  assert.deepEqual((r.body as { results: unknown[] }).results, [{ id: "new1", ok: true, state: "DRAFT", message: null }]);
  const e = changeLog.entries[0];
  assert.deepEqual([e.action, e.ok, e.timesheetId, e.employee, e.before, e.after?.state], ["create", true, "new1", "Bo", null, "DRAFT"]);
  await handleApi({ ...act, action: "create", employeeId: "e2", from: T("14:00"), to: T("14:30") }, d);
  for (const key of ["groupId", "clientId", "jobSiteId"]) assert.equal(key in c.mutations[1].input, false, key);
  assert.deepEqual([changeLog.entries[1].after?.client, changeLog.entries[1].after?.jobSite], [null, null]);
});

test("create puts the draft at a client and job site when given, and logs where", async () => {
  const c = cameloWith([]);
  const { d, changeLog } = editorDeps(c);
  await handleApi(
    { ...act, action: "create", employeeId: "e2", from: T("13:00"), to: T("13:30"), clientId: "c1", jobSiteId: "j1", groupId: null },
    d,
  );
  assert.deepEqual(c.mutations[0].input, {
    employeeId: "e2",
    from: T("13:00"),
    to: T("13:30"),
    timezone: "America/Toronto",
    clientId: "c1",
    jobSiteId: "j1",
  });
  const after = changeLog.entries[0].after;
  assert.deepEqual([after?.client, after?.jobSite], ["Maple Court", "Maple Court, back unit"]);
  // a client alone is fine too
  await handleApi({ ...act, action: "create", employeeId: "e2", from: T("14:00"), to: T("14:30"), clientId: "c1" }, d);
  assert.equal("jobSiteId" in c.mutations[1].input, false);
});

test("create validates its input and reports a refusal from Camelo", async () => {
  const c = cameloWith([]);
  const { d } = editorDeps(c);
  const mk = (over: Record<string, unknown>) =>
    handleApi({ ...act, action: "create", employeeId: "e2", from: T("13:00"), to: T("13:30"), ...over }, d);
  for (const over of [
    { employeeId: undefined },
    { employeeId: "" },
    { groupId: "bad id" },
    { clientId: "bad id" },
    { jobSiteId: 7 },
    { to: T("12:00") },
    { to: T("13:30", "2026-10-08") },
  ]) {
    assert.equal((await mk(over)).status, 400, JSON.stringify(over));
  }
  assert.equal(c.mutations.length, 0);
  assert.equal((await mk({ googleToken: "good:stranger@example.com" })).status, 403);
  const refused = editorDeps(cameloWith([], { refuse: "Employee is archived" }));
  const r = await handleApi({ ...act, action: "create", employeeId: "e2", from: T("13:00"), to: T("13:30") }, refused.d);
  assert.deepEqual(
    (r.body as { results: { ok: boolean; message: string }[] }).results.map((x) => [x.ok, x.message]),
    [[false, "Employee is archived"]],
  );
  assert.equal(refused.changeLog.entries[0].ok, false);
});

test("employees lists active people by name, for editors only", async () => {
  const pages = [
    [
      { id: "2", name: "bo", state: "ACTIVE" },
      { id: "3", name: "Zed", state: "ARCHIVED" },
    ],
    [
      { id: "1", name: "Alex", state: "ACTIVE" },
      { id: "4", name: null, state: "ACTIVE" },
    ],
  ];
  const afters: (string | null)[] = [];
  const fetchImpl = (async (_u: unknown, init: { body: string }) => {
    const { variables } = JSON.parse(init.body);
    afters.push(variables.after);
    const i = variables.after ? Number(variables.after) : 0;
    return new Response(
      JSON.stringify({ data: { users: { pageInfo: { hasNextPage: i + 1 < pages.length, endCursor: String(i + 1) }, nodes: pages[i] } } }),
    );
  }) as unknown as typeof fetch;
  const d = deps({ fetchImpl, verifyGoogle, editors: ["boss@example.com"], changeLog: new MemoryLog() });
  const r = await handleApi({ ...act, action: "employees" }, d);
  assert.deepEqual((r.body as { employees: unknown[] }).employees, [
    { id: "1", name: "Alex" },
    { id: "2", name: "bo" },
    { id: "4", name: "Unnamed employee" },
  ]);
  assert.deepEqual(afters, [null, "1"]);
  assert.equal((await handleApi({ ...act, action: "employees", googleToken: undefined }, d)).status, 401);
  const down = deps({
    fetchImpl: (async () => new Response("x", { status: 500 })) as typeof fetch,
    verifyGoogle,
    editors: ["boss@example.com"],
  });
  assert.equal((await handleApi({ ...act, action: "employees" }, down)).status, 502);
});

test("places lists clients and job sites by name, each site with its client, for editors only", async () => {
  const lists: Record<string, unknown[][]> = {
    clients: [
      [{ id: "c2", name: "birch House" }],
      [
        { id: "c1", name: "Alder Way" },
        { id: "c3", name: null },
      ],
    ],
    jobSites: [
      [
        { id: "j1", name: "Birch House", clients: [{ id: "c2" }] },
        { id: "j2", name: "Alder Way, upstairs", clients: [{ id: "c1" }, { id: "c3" }] },
        { id: "j3", name: null, clients: [] },
      ],
    ],
  };
  const fetchImpl = (async (_u: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    const list = /\b(clients|jobSites)\(first/.exec(query)![1];
    const i = variables.after ? Number(variables.after) : 0;
    const more = i + 1 < lists[list].length;
    return new Response(
      JSON.stringify({ data: { [list]: { pageInfo: { hasNextPage: more, endCursor: String(i + 1) }, nodes: lists[list][i] } } }),
    );
  }) as unknown as typeof fetch;
  const d = deps({ fetchImpl, verifyGoogle, editors: ["boss@example.com"], changeLog: new MemoryLog() });
  const r = await handleApi({ ...act, action: "places" }, d);
  assert.deepEqual(r.body, {
    clients: [
      { id: "c1", name: "Alder Way" },
      { id: "c2", name: "birch House" },
      { id: "c3", name: "Unnamed client" },
    ],
    sites: [
      { id: "j2", name: "Alder Way, upstairs", clientId: "c1" },
      { id: "j1", name: "Birch House", clientId: "c2" },
      { id: "j3", name: "Unnamed job site", clientId: null },
    ],
  });
  assert.equal((await handleApi({ ...act, action: "places", googleToken: "good:stranger@example.com" }, d)).status, 403);
  const down = deps({
    fetchImpl: (async () => new Response("x", { status: 500 })) as typeof fetch,
    verifyGoogle,
    editors: ["boss@example.com"],
  });
  assert.equal((await handleApi({ ...act, action: "places" }, down)).status, 502);
});

// ---- client feedback ---------------------------------------------------------

const fb = { method: "POST", path: "/api/feedback", googleToken: "good:Boss@Example.com" };
const fbDeps = (over = {}) => {
  const feedback = new MemoryFeedback();
  let clock = 1000;
  return { feedback, d: deps({ verifyGoogle, editors: ["boss@example.com"], feedback, now: () => (clock += 1000), ...over }) };
};
const kudos = {
  action: "create",
  type: "kudos",
  date: "2026-10-05",
  clientKey: "c1",
  clientName: " Harper Residence ",
  siteName: "Home",
  visitStart: "2026-10-05T08:02:00.000-04:00",
  visitEnd: "2026-10-05T10:05:00.000-04:00",
  timesheetIds: ["t1", "t2"],
  cleaners: [
    { id: "e1", name: "Maya" },
    { id: "e2", name: "Jonah" },
  ],
  text: "  Spotless kitchen  ",
  source: "Phone",
  category: "Quality",
};
const send = (d: ReturnType<typeof fbDeps>["d"], payload: Record<string, unknown>, over = {}) => handleApi({ ...fb, payload, ...over }, d);
const entryOf = (r: { body: unknown }) => (r.body as { entry: Feedback }).entry;
const listed = async (d: ReturnType<typeof fbDeps>["d"], from = "2026-10-01", to = "2026-10-31") =>
  ((await send(d, { action: "list", from, to })).body as { entries: Feedback[] }).entries;

test("feedback is for signed-in editors only, to read as well as to write", async () => {
  const { d, feedback } = fbDeps();
  for (const payload of [kudos, { action: "list", from: "2026-10-01", to: "2026-10-31" }]) {
    assert.equal((await send(d, payload, { googleToken: undefined })).status, 401);
    assert.equal((await send(d, payload, { googleToken: "good:stranger@example.com" })).status, 403);
  }
  assert.equal(feedback.entries.size, 0);
});

test("records kudos against a visit with its cleaners, and who recorded it", async () => {
  const { d } = fbDeps();
  const e = entryOf(await send(d, kudos));
  assert.deepEqual(
    [e.type, e.date, e.clientName, e.text, e.cleaners.map((c) => c.name), e.status, e.resolution, e.createdBy, e.timesheetIds, e.removedAt],
    ["kudos", "2026-10-05", "Harper Residence", "Spotless kitchen", ["Maya", "Jonah"], null, null, "Boss@Example.com", ["t1", "t2"], null],
  );
  assert.equal(typeof e.createdAt, "number");
  assert.equal((await listed(d)).length, 1);
});

test("a complaint starts open, can be resolved with a note, and edits are stamped", async () => {
  const { d } = fbDeps();
  const made = entryOf(await send(d, { ...kudos, type: "complaint", text: "Missed the mirror", category: "Quality" }));
  assert.deepEqual([made.status, made.resolution], ["open", null]);
  const done = entryOf(await send(d, { action: "update", id: made.id, status: "resolved", resolution: " Went back Tuesday " }));
  assert.deepEqual(
    [done.status, done.resolution, done.updatedBy, done.text],
    ["resolved", "Went back Tuesday", "Boss@Example.com", "Missed the mirror"],
  );
  const edited = entryOf(
    await send(d, { action: "update", id: made.id, text: "Missed two mirrors", cleaners: [{ id: "e1", name: "Maya" }] }),
  );
  assert.deepEqual([edited.text, edited.cleaners.length, edited.status], ["Missed two mirrors", 1, "resolved"]);
  assert.deepEqual(
    (await listed(d)).map((x) => [x.text, x.status]),
    [["Missed two mirrors", "resolved"]],
  );
});

test("feedback with no visit needs only a client, a date and the details", async () => {
  const { d } = fbDeps();
  const e = entryOf(
    await send(d, {
      action: "create",
      type: "kudos",
      date: "2026-10-07",
      clientName: "Lakeview Dental",
      cleaners: [],
      text: "Always reliable",
      source: "Email",
      category: "Other",
    }),
  );
  assert.deepEqual([e.visitStart, e.visitEnd, e.timesheetIds, e.clientKey, e.siteName, e.cleaners], [null, null, [], null, null, []]);
});

test("remove hides an entry but keeps it, with who removed it", async () => {
  const { d, feedback } = fbDeps();
  const e = entryOf(await send(d, kudos));
  assert.equal((await send(d, { action: "remove", id: e.id })).status, 200);
  assert.deepEqual(await listed(d), []);
  const kept = feedback.entries.get(e.id)!;
  assert.deepEqual([kept.text, kept.removedBy, typeof kept.removedAt], ["Spotless kitchen", "Boss@Example.com", "number"]);
  assert.equal((await send(d, { action: "update", id: e.id, text: "x" })).status, 404);
  assert.equal((await send(d, { action: "remove", id: e.id })).status, 404);
  assert.equal((await send(d, { action: "remove", id: "nope" })).status, 404);
});

test("lists by date range, newest first", async () => {
  const { d } = fbDeps();
  for (const date of ["2026-10-05", "2026-09-30", "2026-10-09", "2026-10-05"]) await send(d, { ...kudos, date, text: `on ${date}` });
  assert.deepEqual(
    (await listed(d)).map((e) => e.date),
    ["2026-10-09", "2026-10-05", "2026-10-05"],
  );
  assert.deepEqual(
    (await listed(d, "2026-09-30", "2026-09-30")).map((e) => e.text),
    ["on 2026-09-30"],
  );
  for (const range of [
    { from: "2026-10-31", to: "2026-10-01" },
    { from: "nope", to: "2026-10-01" },
    { from: "2024-01-01", to: "2026-10-01" },
    {},
  ]) {
    assert.equal((await send(d, { action: "list", ...range })).status, 400, JSON.stringify(range));
  }
});

test("refuses entries that are missing or malformed", async () => {
  const { d, feedback } = fbDeps();
  const long = "x".repeat(2001);
  for (const over of [
    { type: "praise" },
    { date: "2026-02-31" },
    { clientName: "" },
    { clientName: undefined },
    { text: "   " },
    { text: long },
    { text: undefined },
    { source: "Carrier pigeon" },
    { category: "Vibes" },
    { cleaners: "Maya" },
    { cleaners: [{ id: "e1" }] },
    { cleaners: [{ id: "bad id", name: "x" }] },
    { cleaners: Array.from({ length: 11 }, (_, i) => ({ id: `e${i}`, name: "x" })) },
    { visitStart: "yesterday" },
    { timesheetIds: ["a b"] },
    { timesheetIds: "t1" },
  ]) {
    assert.equal((await send(d, { ...kudos, ...over })).status, 400, JSON.stringify(over).slice(0, 50));
  }
  assert.equal((await send(d, { ...kudos, type: "complaint", status: "pending" })).status, 400);
  assert.equal(feedback.entries.size, 0);
  const e = entryOf(await send(d, kudos));
  assert.equal((await send(d, { action: "update", id: e.id })).status, 400);
  assert.equal((await send(d, { action: "update", id: e.id, source: "Fax" })).status, 400);
  assert.equal((await send(d, { action: "frobnicate" })).status, 400);
  // kudos has no follow-up, so a status sent for one is ignored rather than stored
  assert.equal((await send(d, { action: "update", id: e.id, status: "resolved" })).status, 400);
  // duplicate cleaners collapse to one
  const dup = entryOf(
    await send(d, {
      ...kudos,
      cleaners: [
        { id: "e1", name: "Maya" },
        { id: "e1", name: "Maya" },
      ],
    }),
  );
  assert.equal(dup.cleaners.length, 1);
});

// ---- unapproved timesheets review ---------------------------------------------

type RSheet = { id: string; state: string; from: string; referenceObject: { shiftId: string | null } | null };
type RShift = { id: string; startTime: string };
const rsheet = (id: string, from: string, state: string, shiftId: string | null): RSheet => ({
  id,
  state,
  from,
  referenceObject: shiftId ? { shiftId } : null,
});

/** A pretend Camelo for the review: timesheets for the period, shifts by day, single shifts by id. */
function reviewFetch(sheets: RSheet[], shifts: RShift[], byId: Record<string, RShift | null> = {}) {
  const asked = { timesheets: 0, shiftDays: [] as string[], single: [] as string[] };
  const fetchImpl = (async (_u: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    const reply = (data: unknown) => new Response(JSON.stringify({ data }));
    const page = (nodes: unknown[]) => ({ pageInfo: { hasNextPage: false, endCursor: null }, nodes });
    if (query.includes("shift(id:")) {
      asked.single.push(variables.id);
      return reply({ shift: byId[variables.id] ?? null });
    }
    if (query.includes("timesheets(")) {
      asked.timesheets++;
      return reply({ timesheets: page(sheets) });
    }
    const day = variables.filter.fromTime.slice(0, 10);
    asked.shiftDays.push(day);
    return reply({ shifts: page(shifts.filter((x) => x.startTime.startsWith(day))) });
  }) as unknown as typeof fetch;
  return { fetchImpl, asked };
}
const rev = { method: "POST", googleToken: signedIn, path: "/api/timesheet-review", periodStart: "2026-10-02" };

test("review returns the period's timesheets and shifts, and fetches a stray shift only for unapproved timesheets", async () => {
  const c = reviewFetch(
    [
      rsheet("t1", "2026-10-05T08:02:00.000-04:00", "SUBMITTED", "s1"),
      rsheet("t2", "2026-10-02T00:05:00.000-04:00", "SUBMITTED", "sOutside"),
      rsheet("t3", "2026-10-06T08:00:00.000-04:00", "APPROVED", "sAlsoOutside"),
      rsheet("t4", "2026-10-06T09:00:00.000-04:00", "DRAFT", null),
      rsheet("old", "2026-10-01T23:00:00.000-04:00", "SUBMITTED", "s1"),
    ],
    [
      { id: "s1", startTime: "2026-10-05T08:00:00.000-04:00" },
      { id: "s9", startTime: "2026-10-08T13:00:00.000-04:00" },
    ],
    { sOutside: { id: "sOutside", startTime: "2026-10-01T23:30:00.000-04:00" } },
  );
  const r = await handleApi(rev, deps({ fetchImpl: c.fetchImpl }));
  assert.equal(r.status, 200);
  const body = r.body as {
    timesheets: { id: string }[];
    shifts: { id: string }[];
    otherShifts: { id: string }[];
    from: string;
    to: string;
  };
  assert.deepEqual(
    body.timesheets.map((t) => t.id),
    ["t2", "t1", "t3", "t4"],
  );
  assert.deepEqual(
    body.shifts.map((x) => x.id),
    ["s1", "s9"],
  );
  assert.deepEqual(
    body.otherShifts.map((x) => x.id),
    ["sOutside"],
  );
  assert.deepEqual([body.from, body.to], ["2026-10-02T00:00:00-04:00", "2026-10-09T00:00:00-04:00"]);
  assert.equal(c.asked.timesheets, 1);
  assert.deepEqual(
    c.asked.shiftDays.sort(),
    ["02", "03", "04", "05", "06", "07", "08"].map((d) => `2026-10-${d}`),
  );
  assert.deepEqual(c.asked.single, ["sOutside"]);
});

test("review needs a sign-in, a real date, and reports an outage", async () => {
  const c = reviewFetch([], []);
  assert.equal((await handleApi({ ...rev, googleToken: undefined }, deps({ fetchImpl: c.fetchImpl }))).status, 401);
  assert.equal((await handleApi({ ...rev, periodStart: "soon" }, deps({ fetchImpl: c.fetchImpl }))).status, 400);
  assert.equal((await handleApi({ ...rev, method: "GET" }, deps({ fetchImpl: c.fetchImpl }))).status, 405);
  const down = await handleApi(rev, deps({ fetchImpl: (async () => new Response("x", { status: 500 })) as typeof fetch }));
  assert.equal(down.status, 502);
  // a stray shift that cannot be fetched is left out rather than failing the whole review
  const stray = reviewFetch([rsheet("t", "2026-10-05T08:00:00.000-04:00", "SUBMITTED", "gone")], []);
  const r = await handleApi(rev, deps({ fetchImpl: stray.fetchImpl }));
  assert.deepEqual([(r.body as { otherShifts: unknown[] }).otherShifts, r.status], [[], 200]);
});

/** A pretend Camelo for notes: one timesheet, its comments, and a record of what was posted. */
function notesFetch(opts: { refuse?: string; missing?: boolean } = {}) {
  const posted: Record<string, unknown>[] = [];
  const fetchImpl = (async (_u: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    const reply = (data: unknown) => new Response(JSON.stringify({ data }));
    if (query.includes("timesheet(id:")) return reply({ timesheet: opts.missing ? null : fake(variables.id, "SUBMITTED") });
    if (query.includes("createComment")) {
      posted.push(variables.input);
      return reply({
        createComment: opts.refuse
          ? { errors: [{ attribute: null, fullMessage: opts.refuse, type: "invalid" }], result: null }
          : { errors: [], result: { id: "c9" } },
      });
    }
    const all: Record<string, unknown[]> = {
      a: [
        { id: "c2", content: "Second note", createdAt: "2026-10-06T12:00:00Z", systemGenerated: false, author: { name: "Ryan" } },
        { id: "c0", content: "Submitted", createdAt: "2026-10-06T10:00:00Z", systemGenerated: true, author: { name: "Camelo" } },
        { id: "c1", content: "First note", createdAt: "2026-10-06T11:00:00Z", systemGenerated: false, author: null },
      ],
      b: [{ id: "c3", content: "Submitted", createdAt: "2026-10-06T10:00:00Z", systemGenerated: true, author: null }],
    };
    return reply({ comments: { nodes: all[variables.id] ?? [] } });
  }) as unknown as typeof fetch;
  return { fetchImpl, posted };
}

test("a note is posted to Camelo with the editor's address, and logged", async () => {
  const c = notesFetch();
  const { d, changeLog } = editorDeps(c as unknown as ReturnType<typeof cameloWith>);
  const r = await handleApi({ ...act, action: "comment", timesheetId: "a", content: "  Client asked for extra windows  " }, d);
  assert.deepEqual(c.posted, [
    {
      commentableId: "a",
      commentableType: "TIMESHEET",
      content: "Client asked for extra windows\n(Boss@Example.com, via the reports site)",
    },
  ]);
  assert.deepEqual(
    (r.body as { results: { ok: boolean }[] }).results.map((x) => x.ok),
    [true],
  );
  const e = changeLog.entries[0];
  assert.deepEqual([e.action, e.ok, e.employee, e.after?.note], ["comment", true, "Alex", "Client asked for extra windows"]);
});

test("notes need a sign-in and some text, and failures are reported", async () => {
  const c = notesFetch();
  const { d } = editorDeps(c as unknown as ReturnType<typeof cameloWith>);
  const note = { action: "comment", timesheetId: "a", content: "Hello" };
  assert.equal((await handleApi({ ...act, ...note, googleToken: undefined }, d)).status, 401);
  assert.equal((await handleApi({ ...act, action: "comments", timesheetIds: ["a"], googleToken: undefined }, d)).status, 401);
  for (const over of [{ content: "   " }, { content: "x".repeat(2001) }, { content: undefined }, { timesheetId: "bad id" }]) {
    assert.equal((await handleApi({ ...act, ...note, ...over }, d)).status, 400, JSON.stringify(over).slice(0, 40));
  }
  assert.equal(c.posted.length, 0);
  const refused = notesFetch({ refuse: "Not allowed" });
  const r = await handleApi({ ...act, ...note }, editorDeps(refused as unknown as ReturnType<typeof cameloWith>).d);
  assert.deepEqual(
    (r.body as { results: { ok: boolean; message: string }[] }).results.map((x) => [x.ok, x.message]),
    [[false, "Not allowed"]],
  );
  const gone = notesFetch({ missing: true });
  const r2 = await handleApi({ ...act, ...note }, editorDeps(gone as unknown as ReturnType<typeof cameloWith>).d);
  assert.match((r2.body as { results: { message: string }[] }).results[0].message, /Not found/);
  assert.equal(gone.posted.length, 0);
});

test("lists people's notes oldest first and leaves out Camelo's automatic comments", async () => {
  const c = notesFetch();
  const { d } = editorDeps(c as unknown as ReturnType<typeof cameloWith>);
  const r = await handleApi({ ...act, action: "comments", timesheetIds: ["a", "b", "a"] }, d);
  const comments = (r.body as { comments: Record<string, { content: string; author: string | null }[]> }).comments;
  assert.deepEqual(Object.keys(comments), ["a"]);
  assert.deepEqual(
    comments.a.map((n) => [n.content, n.author]),
    [
      ["First note", null],
      ["Second note", "Ryan"],
    ],
  );
  assert.equal((await handleApi({ ...act, action: "comments", timesheetIds: "a" }, d)).status, 400);
});

const inv = { method: "POST", googleToken: signedIn, path: "/api/invoices" };
const tick = {
  action: "set",
  date: "2026-10-05",
  clientKey: "site:Lake/view",
  clientName: " Lakeview ",
  invoiced: true,
  minutes: 135,
  amount: 168.75,
  timesheetIds: ["t1", "t2"],
};

test("invoicing needs a sign-in, like every route", async () => {
  const invoices = new MemoryInvoices();
  assert.equal((await handleApi({ ...inv, googleToken: undefined, payload: tick }, deps({ invoices }))).status, 401);
  assert.equal(invoices.entries.size, 0);
});

test("ticks a client-day as invoiced, keeps what was invoiced and who did it, and unticks it in place", async () => {
  const invoices = new MemoryInvoices();
  const d = deps({ invoices, now: () => 99 });
  const r = await handleInvoices({ ...inv, payload: tick }, d);
  assert.equal(r.status, 200);
  const id = invoiceId("2026-10-05", "site:Lake/view");
  assert.equal(id, "2026-10-05|site%3ALake%2Fview"); // no slash: safe as a Firestore document id
  assert.deepEqual(invoices.entries.get(id), {
    id,
    date: "2026-10-05",
    clientKey: "site:Lake/view",
    clientName: "Lakeview",
    invoiced: true,
    minutes: 135,
    amount: 168.75,
    timesheetIds: ["t1", "t2"],
    updatedAt: 99,
    updatedBy: "boss@example.com",
  });
  await handleInvoices({ ...inv, payload: { ...tick, invoiced: false } }, d);
  assert.equal(invoices.entries.size, 1);
  assert.equal(invoices.entries.get(id)!.invoiced, false);
  const listed = await handleInvoices({ ...inv, payload: { action: "list", from: "2026-10-01", to: "2026-10-07" } }, d);
  assert.equal((listed.body as { entries: unknown[] }).entries.length, 1);
});

test("refuses malformed ticks and ranges", async () => {
  const d = deps({ invoices: new MemoryInvoices() });
  for (const payload of [
    { ...tick, date: "2026-02-30" },
    { ...tick, clientKey: "" },
    { ...tick, invoiced: "yes" },
    { ...tick, amount: -1 },
    { ...tick, timesheetIds: ["bad id!"] },
    { action: "list", from: "2026-10-07", to: "2026-10-01" },
    { action: "list", from: "2026-01-01", to: "2026-12-31" },
    { action: "nope" },
  ]) {
    assert.equal((await handleInvoices({ ...inv, payload }, d)).status, 400, JSON.stringify(payload));
  }
});

const rates = { method: "POST", googleToken: signedIn, path: "/api/client-rates" };
const price = { action: "set", clientKey: "site:Lake/view", clientName: " Lakeview ", from: "2026-10-05", kind: "flat", dollars: 180 };

test("client prices need a sign-in, to read as well as to set", async () => {
  const clientRates = new MemoryClientRates();
  assert.equal((await handleApi({ ...rates, googleToken: undefined, payload: price }, deps({ clientRates }))).status, 401);
  assert.equal((await handleApi({ ...rates, googleToken: undefined, payload: { action: "list" } }, deps({ clientRates }))).status, 401);
  assert.equal(clientRates.entries.size, 0);
});

test("a client's prices are kept oldest first with who set each; the same start day replaces", async () => {
  const clientRates = new MemoryClientRates();
  let at = 0;
  const d = deps({ clientRates, now: () => ++at });
  assert.equal((await handleApi({ ...rates, payload: price }, d)).status, 200);
  await handleApi({ ...rates, payload: { ...price, from: "2026-09-01", kind: "hourly", dollars: 82.5 } }, d);
  const r = await handleApi({ ...rates, payload: { ...price, dollars: 199.999 } }, d);
  assert.deepEqual((r.body as { rate: unknown }).rate, {
    clientKey: "site:Lake/view",
    clientName: "Lakeview",
    rules: [
      { from: "2026-09-01", kind: "hourly", dollars: 82.5, setAt: 2, setBy: "boss@example.com" },
      { from: "2026-10-05", kind: "flat", dollars: 200, setAt: 3, setBy: "boss@example.com" },
    ],
  });
  const listed = await handleApi({ ...rates, payload: { action: "list" } }, d);
  assert.equal((listed.body as { rates: unknown[] }).rates.length, 1);
});

test("refuses malformed prices, and more than a hundred for one client", async () => {
  const clientRates = new MemoryClientRates();
  const d = deps({ clientRates });
  for (const payload of [
    { ...price, clientKey: "" },
    { ...price, clientName: " " },
    { ...price, from: "2026-02-30" },
    { ...price, kind: "weekly" },
    { ...price, dollars: 0 },
    { ...price, dollars: 0.004 },
    { ...price, dollars: -5 },
    { ...price, dollars: 10000 },
    { ...price, dollars: "180" },
    { action: "nope" },
  ]) {
    assert.equal((await handleApi({ ...rates, payload }, d)).status, 400, JSON.stringify(payload));
  }
  assert.equal(clientRates.entries.size, 0);
  const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);
  for (let n = 0; n < 100; n++) assert.equal((await handleApi({ ...rates, payload: { ...price, from: day(n) } }, d)).status, 200);
  assert.equal((await handleApi({ ...rates, payload: { ...price, from: day(100) } }, d)).status, 400);
  // replacing one that is there is still allowed
  assert.equal((await handleApi({ ...rates, payload: { ...price, from: day(5), dollars: 90 } }, d)).status, 200);
});

test("kudos can be marked as passed on to the cleaners, and unmarked; complaints cannot", async () => {
  const { d } = fbDeps();
  const made = entryOf(await send(d, kudos));
  assert.deepEqual([made.passedOnAt, made.passedOnBy], [null, null]);
  const on = entryOf(await send(d, { action: "passon", id: made.id, passedOn: true }));
  assert.equal(on.passedOnBy, "Boss@Example.com");
  assert.equal(typeof on.passedOnAt, "number");
  const off = entryOf(await send(d, { action: "passon", id: made.id, passedOn: false }));
  assert.deepEqual([off.passedOnAt, off.passedOnBy], [null, null]);
  const complaint = entryOf(await send(d, { ...kudos, type: "complaint" }));
  assert.equal((await send(d, { action: "passon", id: complaint.id, passedOn: true })).status, 400);
  assert.equal((await send(d, { action: "passon", id: made.id, passedOn: "yes" })).status, 400);
});

const chk = { method: "POST", googleToken: signedIn, path: "/api/schedule-check" };
/** A stand-in for Nominatim: finds any address but ones containing "nowhere"; records what it was asked. */
function fakeGeocoder(asked: string[], status = 200): typeof fetch {
  return (async (url: string, init: { headers: Record<string, string> }) => {
    const q = new URL(url).searchParams.get("q")!;
    asked.push(q);
    assert.match(init.headers["User-Agent"], /freshnest-ops/);
    return new Response(JSON.stringify(q.includes("nowhere") ? [] : [{ lat: "45.02", lon: "-74.73" }]), { status });
  }) as unknown as typeof fetch;
}

test("the schedule check needs a sign-in", async () => {
  const soloOk = new MemorySoloOk();
  const r = await handleApi(
    { ...chk, googleToken: undefined, payload: { action: "ok", shiftId: "s1", date: "2026-10-14", ok: true } },
    deps({ soloOk }),
  );
  assert.equal(r.status, 401);
  assert.equal(soloOk.entries.size, 0);
});

test("a solo visit is marked OK once per shift, with who and when, and can be undone", async () => {
  const soloOk = new MemorySoloOk();
  const d = deps({ soloOk, now: () => 77 });
  const set = (ok: boolean) => handleApi({ ...chk, payload: { action: "ok", shiftId: "s1", date: "2026-10-14", ok } }, d);
  const list = async () =>
    ((await handleApi({ ...chk, payload: { action: "oks", from: "2026-10-13", to: "2026-10-19" } }, d)).body as { entries: unknown[] })
      .entries;
  assert.equal((await set(true)).status, 200);
  await set(true);
  assert.deepEqual(await list(), [{ shiftId: "s1", date: "2026-10-14", ok: true, updatedAt: 77, updatedBy: "boss@example.com" }]);
  await set(false);
  assert.deepEqual(await list(), []);
  assert.equal(soloOk.entries.size, 1);
  for (const payload of [
    { action: "ok", shiftId: "a/b", date: "2026-10-14", ok: true },
    { action: "ok", shiftId: "s1", date: "soon", ok: true },
    { action: "ok", shiftId: "s1", date: "2026-10-14", ok: "yes" },
    { action: "oks", from: "2026-10-19", to: "2026-10-13" },
    { action: "other" },
  ]) {
    assert.equal((await handleApi({ ...chk, payload }, d)).status, 400, JSON.stringify(payload));
  }
});

test("addresses are looked up once, a few per request, and misses are remembered", async () => {
  const asked: string[] = [];
  const places = new MemoryPlaces();
  let now = 1000;
  const d = deps({ places, fetchImpl: fakeGeocoder(asked), geocodeGapMs: 0, now: () => now });
  const ask = async (addresses: unknown) =>
    (await handleApi({ ...chk, payload: { action: "places", addresses } }, d)).body as {
      places: Record<string, unknown>;
      pending: number;
      failed: boolean;
    };
  const ten = Array.from({ length: 10 }, (_, i) => `${i + 1} Pine St, Cornwall, ON`);

  const first = await ask([...ten, " 1  PINE St, Cornwall, ON "]);
  assert.deepEqual([Object.keys(first.places).length, first.pending, asked.length], [8, 2, 8]);
  assert.deepEqual(first.places["1 pine st, cornwall, on"], { lat: 45.02, lon: -74.73 });
  const second = await ask(ten);
  assert.deepEqual([Object.keys(second.places).length, second.pending, asked.length], [10, 0, 10]);
  await ask(ten);
  assert.equal(asked.length, 10);

  const miss = await ask(["nowhere at all"]);
  assert.deepEqual([miss.places["nowhere at all"], miss.pending], [null, 0]);
  await ask(["nowhere at all"]);
  assert.equal(asked.length, 11);
  now += 31 * 86_400_000;
  await ask(["nowhere at all", "1 Pine St, Cornwall, ON"]);
  assert.equal(asked.length, 12);

  for (const addresses of ["1 Pine St", [""], [5], Array.from({ length: 301 }, (_, i) => `${i} A St`)]) {
    assert.equal((await handleApi({ ...chk, payload: { action: "places", addresses } }, d)).status, 400);
  }
});

test("when the lookup service fails, it stops asking and says so", async () => {
  const asked: string[] = [];
  const places = new MemoryPlaces();
  const d = deps({ places, fetchImpl: fakeGeocoder(asked, 503), geocodeGapMs: 0 });
  const r = (await handleApi({ ...chk, payload: { action: "places", addresses: ["1 Pine St", "2 Pine St", "3 Pine St"] } }, d)).body;
  assert.deepEqual(r, { places: {}, pending: 3, failed: true });
  assert.deepEqual([asked.length, places.entries.size], [1, 0]);
});

const snap = { method: "POST", googleToken: signedIn, path: "/api/snapshots" };
const week = {
  action: "set",
  v: 1,
  periodStart: "2026-10-02",
  totals: { billed: 5793.75, onTime: 47, measured: 78 },
  cleaners: [{ id: "u1", name: "Maya", visits: 12, onTime: 9 }],
  clients: [{ key: "site:Lake/view", name: "Lakeview", billed: 150 }],
};
const afterIt = () => Date.parse("2026-10-12T12:00:00-04:00");

test("snapshots need a sign-in", async () => {
  const snapshots = new MemorySnapshots();
  assert.equal((await handleApi({ ...snap, googleToken: undefined, payload: week }, deps({ snapshots, now: afterIt }))).status, 401);
  assert.equal(snapshots.entries.size, 0);
});

test("a finished period's figures are saved once per period, stamped, and listed by range", async () => {
  const snapshots = new MemorySnapshots();
  const d = deps({ snapshots, now: afterIt });
  assert.equal((await handleApi({ ...snap, payload: week }, d)).status, 200);
  await handleApi({ ...snap, payload: { ...week, totals: { billed: 6000 } } }, d);
  assert.equal(snapshots.entries.size, 1);
  const list = async (from: string, to: string) =>
    ((await handleApi({ ...snap, payload: { action: "list", from, to } }, d)).body as { snapshots: unknown[] }).snapshots;
  assert.deepEqual(await list("2026-09-01", "2026-10-09"), [
    {
      v: 1,
      periodStart: "2026-10-02",
      totals: { billed: 6000 },
      cleaners: week.cleaners,
      clients: week.clients,
      savedAt: afterIt(),
      savedBy: "boss@example.com",
    },
  ]);
  assert.deepEqual(await list("2026-10-03", "2026-10-09"), []);
});

test("refuses a period that is not finished, not a Friday, or not plain figures", async () => {
  const d = deps({ snapshots: new MemorySnapshots(), now: afterIt });
  for (const over of [
    { periodStart: "2026-10-09" }, // still under way on the 12th
    { periodStart: "2026-10-01" }, // a Thursday
    { v: 0 },
    { totals: { billed: "lots" } },
    { totals: { "bad key": 1 } },
    { cleaners: [{ id: "u1", name: "Maya", note: { nested: true } }] },
    { cleaners: [{ name: "No id" }] },
    { clients: "all of them" },
  ]) {
    assert.equal((await handleApi({ ...snap, payload: { ...week, ...over } }, d)).status, 400, JSON.stringify(over));
  }
  assert.equal((await handleApi({ ...snap, payload: { action: "list", from: "2026-10-09", to: "2026-10-02" } }, d)).status, 400);
  // the period that ended at midnight is accepted as soon as it has ended
  const justAfter = deps({ snapshots: new MemorySnapshots(), now: () => Date.parse("2026-10-09T00:00:01-04:00") });
  assert.equal((await handleApi({ ...snap, payload: week }, justAfter)).status, 200);
});

test("the schedule check and the snapshots say what is wrong with a request, first fault first", async () => {
  const d = deps({ soloOk: new MemorySoloOk(), places: new MemoryPlaces(), snapshots: new MemorySnapshots(), now: afterIt });
  const said = async (route: typeof chk, payload: unknown) => {
    const r = await handleApi({ ...route, payload }, d);
    return r.status === 400 ? (r.body as { error: string }).error : `status ${r.status}`;
  };
  const ok = { action: "ok", shiftId: "s1", date: "2026-10-14", ok: true };
  const cases: [typeof chk, unknown, string][] = [
    [chk, undefined, "Unknown action"],
    [chk, "ok", "Unknown action"],
    [chk, { action: "oks" }, "from and to must be dates, in order"],
    [chk, { action: "oks", from: "2026-02-30", to: "2026-03-01" }, "from and to must be dates, in order"],
    [chk, { action: "oks", from: "2026-10-13", to: 20261019 }, "from and to must be dates, in order"],
    [chk, { action: "oks", from: "2026-10-19", to: "2026-10-13" }, "from and to must be dates, in order"],
    [chk, { action: "oks", from: "2026-01-01", to: "2026-04-04" }, "At most 92 days at a time"],
    [chk, { ...ok, shiftId: undefined, date: "soon" }, "shiftId is required"],
    [chk, { ...ok, shiftId: "a/b" }, "shiftId is required"],
    [chk, { ...ok, shiftId: "x".repeat(65) }, "shiftId is required"],
    [chk, { ...ok, date: "soon", ok: "yes" }, "date must be YYYY-MM-DD"],
    [chk, { ...ok, date: "2026-10-1" }, "date must be YYYY-MM-DD"],
    [chk, { ...ok, ok: 1 }, "ok must be true or false"],
    [chk, { action: "places" }, "addresses must be a list of up to 300 addresses"],
    [chk, { action: "places", addresses: ["1 Pine St", "   "] }, "addresses must be a list of up to 300 addresses"],
    [chk, { action: "places", addresses: ["x".repeat(301)] }, "addresses must be a list of up to 300 addresses"],
    [snap, { action: "save" }, "Unknown action"],
    [snap, { action: "list", from: "2026-10-02" }, "from and to must be dates, in order"],
    [snap, { action: "list", from: "2025-01-03", to: "2026-10-02" }, "At most 400 days at a time"],
    [snap, { ...week, v: "1", periodStart: "soon" }, "v must be a version number"],
    [snap, { ...week, v: 1.5 }, "v must be a version number"],
    [snap, { ...week, v: 1001 }, "v must be a version number"],
    [snap, { ...week, periodStart: "soon", totals: null }, "periodStart must be a Friday, YYYY-MM-DD"],
    [snap, { ...week, periodStart: 20261002 }, "periodStart must be a Friday, YYYY-MM-DD"],
    [snap, { ...week, periodStart: "2026-10-01" }, "periodStart must be a Friday, YYYY-MM-DD"],
    [snap, { ...week, periodStart: "2026-10-09", totals: null }, "That pay period has not finished yet"],
    [snap, { ...week, totals: undefined, cleaners: "all" }, "totals is required"],
    [snap, { ...week, totals: [1] }, "totals is required"],
    [snap, { ...week, totals: "lots" }, "totals is required"],
    [snap, { ...week, totals: { "bad key": 1 } }, "totals must be numbers by name"],
    [snap, { ...week, totals: { billed: "lots" } }, "totals must be numbers by name"],
    [snap, { ...week, totals: { billed: 1e9 } }, "totals must be numbers by name"],
    [
      snap,
      { ...week, totals: Object.fromEntries(Array.from({ length: 41 }, (_, i) => [String.fromCharCode(i < 26 ? 65 + i : 71 + i), 1])) },
      "totals must be numbers by name",
    ],
    [snap, { ...week, cleaners: undefined, clients: "all" }, "cleaners must be a list of rows"],
    [snap, { ...week, cleaners: [{ name: "No id" }] }, "cleaners must be a list of rows"],
    [snap, { ...week, cleaners: [{ id: "", name: "Empty id" }] }, "cleaners must be a list of rows"],
    [snap, { ...week, cleaners: [{ id: "u1", name: "Maya", note: "text" }] }, "cleaners must be a list of rows"],
    [snap, { ...week, cleaners: [{ id: "u1", name: "Maya", "bad key": 1 }] }, "cleaners must be a list of rows"],
    [snap, { ...week, cleaners: [["u1"]] }, "cleaners must be a list of rows"],
    [snap, { ...week, cleaners: Array.from({ length: 2001 }, () => ({ id: "u1", name: "Maya" })) }, "cleaners must be a list of rows"],
    [snap, { ...week, clients: [{ id: "u1", name: "No key" }] }, "clients must be a list of rows"],
    [snap, { ...week, clients: [{ key: "k", name: "x".repeat(201) }] }, "clients must be a list of rows"],
  ];
  for (const [route, payload, expected] of cases)
    assert.equal(await said(route, payload), expected, JSON.stringify(payload)?.slice(0, 120));
  // accepted, and saved as sent: a row's name may be empty, and nothing extra is added or dropped
  const row = { id: "u1", name: "", visits: 0, share: -0.5 };
  const saved = await handleApi({ ...snap, payload: { ...week, cleaners: [row], extra: "ignored" } }, d);
  const { action: _action, ...figures } = week;
  assert.deepEqual(saved.body, { snapshot: { ...figures, cleaners: [row], savedAt: afterIt(), savedBy: "boss@example.com" } });
  // the one difference from the hand-written checks (decision 0034): a name JSON cannot be trusted with is dropped, where it was refused
  const odd = JSON.parse('{"billed": 2, "__proto__": 1}');
  const kept = (await handleApi({ ...snap, payload: { ...week, totals: odd } }, d)).body as { snapshot: { totals: object } };
  assert.deepEqual(Object.keys(kept.snapshot.totals), ["billed"]);
  // set up or not is answered before the request is looked at
  assert.equal((await handleApi({ ...snap, payload: { action: "set" } }, deps({}))).status, 500);
  assert.equal((await handleApi({ ...chk, payload: { action: "ok" } }, deps({}))).status, 500);
  assert.equal((await handleApi({ ...chk, payload: { action: "places" } }, deps({}))).status, 500);
});

test("settings: get returns default or saved grace, set validates range 5-30m and saves with updater", async () => {
  const store = new MemorySettingsStore();
  const d = deps({ settings: store });
  const req = (payload: unknown) => handleApi({ method: "POST", path: "/api/settings", googleToken: signedIn, payload }, d);

  // Missing sign-in
  assert.equal((await handleApi({ method: "POST", path: "/api/settings", payload: { action: "get" } }, d)).status, 401);

  // Missing store
  assert.equal(
    (await handleApi({ method: "POST", path: "/api/settings", googleToken: signedIn, payload: { action: "get" } }, deps({}))).status,
    500,
  );

  // Default grace
  const get1 = await req({ action: "get" });
  assert.equal(get1.status, 200);
  assert.deepEqual(get1.body, { settings: { grace: { minutes: 15, updatedAt: null, updatedBy: null } } });

  // Unknown action
  const badAction = await req({ action: "other" });
  assert.equal(badAction.status, 400);
  assert.deepEqual(badAction.body, { error: "Unknown action" });

  // Invalid minutes on set
  for (const bad of [undefined, null, "15", 4, 31, 15.5, NaN, -10]) {
    const res = await req({ action: "set", minutes: bad });
    assert.equal(res.status, 400, String(bad));
    assert.deepEqual(res.body, { error: "minutes must be an integer between 5 and 30" });
  }

  // Valid set
  const set1 = await req({ action: "set", minutes: 20 });
  assert.equal(set1.status, 200);
  const grace1 = (set1.body as { settings: { grace: { minutes: number; updatedBy: string; updatedAt: number } } }).settings.grace;
  assert.equal(grace1.minutes, 20);
  assert.equal(grace1.updatedBy, "boss@example.com");
  assert.ok(typeof grace1.updatedAt === "number");

  // Get returns updated
  const get2 = await req({ action: "get" });
  assert.equal(get2.status, 200);
  assert.deepEqual(get2.body, { settings: { grace: grace1 } });
});

test("knows which requests would change Camelo, so the local dev server can refuse them", () => {
  for (const action of ["approve", "reject", "update", "create", "comment"])
    assert.equal(changesCamelo("/api/timesheet-actions", action), true, action);
  for (const action of ["whoami", "log", "employees", "places", "comments", undefined, 5])
    assert.equal(changesCamelo("/api/timesheet-actions", action), false, String(action));
  // other routes only read Camelo, or write to the site's own store
  for (const path of [
    "/api/shifts",
    "/api/timesheets",
    "/api/timesheet-review",
    "/api/invoices",
    "/api/client-rates",
    "/api/feedback",
    "/api/schedule-check",
    "/api/settings",
    "/api/snapshots",
    undefined,
  ]) {
    assert.equal(changesCamelo(path, "create"), false, String(path));
  }
});

test("a browser error needs a sign-in, is cut to size and is logged once with who sent it", async () => {
  const logged: BrowserError[] = [];
  const noCamelo = (async () => {
    throw new Error("Camelo must not be called");
  }) as unknown as typeof fetch;
  const d = deps({ logBrowserError: (e: BrowserError) => logged.push(e), fetchImpl: noCamelo });
  const report = { method: "POST", path: "/api/client-error", googleToken: signedIn };
  const payload = {
    message: "x is undefined",
    stack: "at Report (index-abc.js:1:2)",
    componentStack: "at PayrollView",
    view: "payroll",
    source: "render",
    url: "/?q=secret",
  };

  for (const googleToken of [undefined, "", "forged"]) {
    assert.equal((await handleApi({ ...report, googleToken, payload }, d)).status, 401, String(googleToken));
  }
  assert.equal((await handleApi({ ...report, googleToken: "good:stranger@example.com", payload }, d)).status, 403);
  assert.equal((await handleApi({ ...report, method: "GET", payload }, d)).status, 405);
  for (const bad of [undefined, {}, { message: 5 }, { message: "" }, "text"]) {
    assert.equal((await handleApi({ ...report, payload: bad }, d)).status, 400, JSON.stringify(bad));
  }
  assert.equal(logged.length, 0);

  const r = await handleApi({ ...report, payload }, d);
  assert.deepEqual([r.status, r.body], [200, { ok: true }]);
  // only the named fields are kept: the page address is not
  assert.deepEqual(logged, [
    {
      email: "boss@example.com",
      view: "payroll",
      source: "render",
      message: "x is undefined",
      stack: "at Report (index-abc.js:1:2)",
      componentStack: "at PayrollView",
    },
  ]);

  await handleApi(
    {
      ...report,
      payload: { message: "m".repeat(9000), stack: "s".repeat(9000), componentStack: 7, view: "v".repeat(99), source: "elsewhere" },
    },
    d,
  );
  const big = logged[1];
  assert.deepEqual([big.message.length, big.stack?.length, big.componentStack, big.view?.length, big.source], [500, 4000, null, 40, null]);
});

test("a Camelo read is kept for a minute, still needs a sign-in, and is dropped by a change or a failure", async () => {
  let asked = 0;
  let fail = false;
  const counting = (async (_u: unknown, init: { body: string }) => {
    asked++;
    if (fail) return new Response("no", { status: 500 });
    const body = JSON.parse(init.body);
    const field = body.query.includes("timesheets") ? "timesheets" : "shifts";
    return new Response(JSON.stringify({ data: { [field]: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } } }));
  }) as unknown as typeof fetch;
  let now = 1_000_000;
  const d = deps({ fetchImpl: counting, readCache: new ReadCache(60_000, () => now) });
  const week = { method: "POST", path: "/api/shifts", googleToken: signedIn, weekStart: "2026-10-05" };

  assert.equal((await handleApi(week, d)).status, 200);
  const first = asked;
  assert.ok(first > 0);
  // again within the minute: answered from what is held, by anyone signed in
  assert.equal((await handleApi(week, d)).status, 200);
  assert.equal(asked, first);
  // but never without a sign-in, and never for someone off the list
  assert.equal((await handleApi({ ...week, googleToken: undefined }, d)).status, 401);
  assert.equal((await handleApi({ ...week, googleToken: "good:stranger@example.com" }, d)).status, 403);
  // another week is another read
  await handleApi({ ...week, weekStart: "2026-10-12" }, d);
  assert.equal(asked, first * 2);
  // after a minute it is asked for again
  now += 60_000;
  await handleApi(week, d);
  assert.equal(asked, first * 3);

  // a change through the site empties it, whether or not the change went through
  const before = asked;
  await handleApi({ method: "POST", path: "/api/timesheet-actions", googleToken: signedIn, action: "approve", timesheetIds: [] }, d);
  await handleApi(week, d);
  assert.ok(asked > before);
  // reading the change log is not a change
  const held = asked;
  await handleApi({ method: "POST", path: "/api/timesheet-actions", googleToken: signedIn, action: "log", periodStart: "2026-10-02" }, d);
  await handleApi(week, d);
  assert.equal(asked, held);

  // a failed read is not kept
  cameloRetry.delaysMs = [0, 0];
  now += 60_000;
  fail = true;
  assert.equal((await handleApi(week, d)).status, 502);
  fail = false;
  assert.equal((await handleApi(week, d)).status, 200);
});

// ---- Roles: office and cleaner (decision 0037). Every name and address here is made up.

type FakePerson = { id: string; name: string | null; email: string | null; state: string };
const STAFF: FakePerson[] = [
  { id: "u1", name: "Maya Made-Up", email: "Maya@Example.com", state: "ACTIVE" },
  { id: "u2", name: "Jo Made-Up", email: "jo@example.com", state: "DEACTIVATED" },
  { id: "u3", name: null, email: "  noname@example.com ", state: "ACTIVE" },
  { id: "u4", name: "Boss Made-Up", email: "boss@example.com", state: "ACTIVE" },
  { id: "u5", name: "Twin One", email: "twin@example.com", state: "ACTIVE" },
  { id: "u6", name: "Twin Two", email: "TWIN@example.com", state: "ACTIVE" },
  { id: "u7", name: "No Address", email: null, state: "ACTIVE" },
];
/** A pretend Camelo that only knows its people; it counts what it is asked, by kind, and can be down. */
function cameloPeople(people = STAFF, opts: { down?: boolean; pageSize?: number } = {}) {
  const asked: string[] = [];
  const fetchImpl = (async (_url: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    const kind = /\busers\(/.test(query) ? "users" : /^\s*mutation\b/.test(query) ? "mutation" : "other";
    asked.push(kind);
    if (opts.down) return new Response("x", { status: 503 });
    if (kind !== "users") return new Response(JSON.stringify({ data: {} }));
    const size = opts.pageSize ?? 100;
    const from = variables.after ? Number(variables.after) : 0;
    const nodes = people.slice(from, from + size);
    return new Response(
      JSON.stringify({
        data: { users: { pageInfo: { hasNextPage: from + size < people.length, endCursor: String(from + size) }, nodes } },
      }),
    );
  }) as unknown as typeof fetch;
  return { asked, fetchImpl };
}
const as = (email: string) => ({ method: "POST", googleToken: `good:${email}` });
const whoami = (email: string, d: object) => handleApi({ ...as(email), path: "/api/whoami" }, d as Parameters<typeof handleApi>[1]);

test("with the switch off nobody is let in as a cleaner, and Camelo is not asked", async () => {
  for (const staff of [undefined, "", "off", " OFF "]) {
    const c = cameloPeople();
    const r = await whoami("maya@example.com", deps({ fetchImpl: c.fetchImpl, staff }));
    assert.deepEqual([r.status, (r.body as { reason: string }).reason, c.asked], [403, "not_editor", []], String(staff));
  }
});

test("someone on the office list is office, whatever Camelo says, and Camelo is not asked", async () => {
  const c = cameloPeople();
  for (const staff of ["off", "*"]) {
    const r = await whoami("Boss@Example.com", deps({ fetchImpl: c.fetchImpl, staff }));
    assert.deepEqual([r.status, r.body], [200, { email: "Boss@Example.com", role: "office" }]);
  }
  assert.deepEqual(c.asked, []);
});

test("with the switch on for everyone, a cleaner is an active person in Camelo with that email, and only one of them", async () => {
  const c = cameloPeople();
  const d = deps({ fetchImpl: c.fetchImpl, staff: "*" });
  // capitals and stray spaces do not matter, on either side
  assert.deepEqual((await whoami("maya@example.com", d)).body, { email: "maya@example.com", role: "cleaner", name: "Maya Made-Up" });
  assert.deepEqual((await whoami("NoName@example.com", d)).body, {
    email: "NoName@example.com",
    role: "cleaner",
    name: "Unnamed employee",
  });
  for (const [email, why] of [
    ["jo@example.com", "not active in Camelo"],
    ["stranger@example.com", "not in Camelo"],
    ["twin@example.com", "two active people share the address"],
    ["", "no address"],
  ]) {
    const r = await handleApi({ method: "POST", googleToken: email ? `good:${email}` : "bad", path: "/api/whoami" }, d);
    assert.equal(r.status, email ? 403 : 401, why);
  }
  // the answer never carries Camelo's id for the person, or anyone else's details
  assert.equal(JSON.stringify((await whoami("maya@example.com", d)).body).includes("u1"), false);
});

test("with the switch naming people, only they are let in, and still only if active in Camelo", async () => {
  const c = cameloPeople();
  const d = deps({ fetchImpl: c.fetchImpl, staff: " Maya@example.com , jo@example.com,ghost@example.com " });
  assert.equal((await whoami("maya@example.com", d)).status, 200);
  // named but not active, named but not in Camelo, active but not named
  for (const email of ["jo@example.com", "ghost@example.com", "noname@example.com"])
    assert.equal((await whoami(email, d)).status, 403, email);
  // someone not named does not cost Camelo a request
  const before = c.asked.length;
  await whoami("noname@example.com", d);
  assert.equal(c.asked.length, before);
});

test("a blank address is nobody, even though Camelo has an active person with no address", async () => {
  const c = cameloPeople();
  const blank = async () => "   ";
  for (const staff of ["*", "maya@example.com,"]) {
    const r = await handleApi(
      { method: "POST", googleToken: "any", path: "/api/whoami" },
      deps({ fetchImpl: c.fetchImpl, staff, verifyGoogle: blank }),
    );
    assert.equal(r.status, 403, staff);
  }
  assert.deepEqual(c.asked, []);
});

test("a list of people that Camelo does not finish is not trusted", async () => {
  // "more to come" with no place to continue from
  const fetchImpl = (async () =>
    new Response(
      JSON.stringify({ data: { users: { pageInfo: { hasNextPage: true, endCursor: null }, nodes: [STAFF[0]] } } }),
    )) as unknown as typeof fetch;
  assert.equal((await whoami("maya@example.com", deps({ fetchImpl, staff: "*" }))).status, 502);
});

test("if Camelo cannot be asked, nobody is let in as a cleaner", async () => {
  const c = cameloPeople(STAFF, { down: true });
  const r = await whoami("maya@example.com", deps({ fetchImpl: c.fetchImpl, staff: "*" }));
  assert.equal(r.status, 502);
  assert.equal(JSON.stringify(r.body).includes("cleaner"), false);
  // the office is not affected by Camelo being down
  assert.equal((await whoami("boss@example.com", deps({ fetchImpl: c.fetchImpl, staff: "*" }))).status, 200);
});

test("Camelo's people are read page by page, kept ten minutes, and a failed read is not kept", async () => {
  let now = 0;
  const c = cameloPeople(STAFF, { pageSize: 3 });
  const d = deps({ fetchImpl: c.fetchImpl, staff: "*", people: new PeopleCache(10 * 60_000, () => now) });
  assert.equal((await whoami("maya@example.com", d)).status, 200);
  // the seventh person is on the third page
  assert.equal(c.asked.length, 3);
  await whoami("maya@example.com", d);
  await whoami("stranger@example.com", d);
  assert.equal(c.asked.length, 3);
  now += 10 * 60_000;
  await whoami("maya@example.com", d);
  assert.equal(c.asked.length, 6);

  const down = cameloPeople(STAFF, { down: true });
  const cache = new PeopleCache(10 * 60_000, () => now);
  assert.equal((await whoami("maya@example.com", deps({ fetchImpl: down.fetchImpl, staff: "*", people: cache }))).status, 502);
  // Camelo is back: the failure was not kept
  assert.equal((await whoami("maya@example.com", deps({ fetchImpl: cameloPeople().fetchImpl, staff: "*", people: cache }))).status, 200);
});

test("every route says who it is for, and a cleaner is refused by every one that is for the office", async () => {
  const stores = () => ({
    changeLog: new MemoryLog(),
    feedback: new MemoryFeedback(),
    invoices: new MemoryInvoices(),
    soloOk: new MemorySoloOk(),
    liveHandled: new MemoryLiveHandledStore(),
    places: new MemoryPlaces(),
    settings: new MemorySettingsStore(),
    snapshots: new MemorySnapshots(),
  });
  const office = ROUTES.filter((r) => r.for === "office").map((r) => r.path);
  // if this list grows, the new route was declared for the office on purpose
  assert.deepEqual(office.sort(), [
    "client-rates",
    "feedback",
    "invoices",
    "live",
    "live-handled",
    "schedule-check",
    "settings",
    "shifts",
    "snapshots",
    "timesheet-actions",
    "timesheet-review",
    "timesheets",
  ]);
  assert.deepEqual(
    ROUTES.filter((r) => r.for === "staff")
      .map((r) => r.path)
      .sort(),
    ["client-error", "clock", "my-week", "visit-photos", "whoami"],
  );
  assert.deepEqual(
    ROUTES.filter((r) => r.for === "anyone").map((r) => r.path),
    ["health"],
  );

  // a request that would do something on each route if it were let through
  const bodies: Record<string, object> = {
    "timesheet-actions": { action: "approve", timesheetIds: ["t1"] },
    "timesheet-review": { periodStart: "2026-10-09" },
    feedback: { payload: { action: "list", from: "2026-10-01", to: "2026-10-31" } },
    invoices: { payload: { action: "list", from: "2026-10-01", to: "2026-10-31" } },
    "client-rates": { payload: { action: "list" } },
    "schedule-check": { payload: { action: "oks", from: "2026-10-01", to: "2026-10-31" } },
    settings: { payload: { action: "get" } },
    snapshots: { payload: { action: "list", from: "2026-10-01", to: "2026-10-31" } },
    timesheets: { periodStart: "2026-10-09" },
    shifts: { weekStart: "2026-10-05" },
    live: {},
    "live-handled": { payload: { action: "list", date: "2026-10-14" } },
  };
  for (const path of [...office, "no-such-route", ""]) {
    const c = cameloPeople();
    const kept = stores();
    const d = deps({ fetchImpl: c.fetchImpl, staff: "*", ...kept });
    const r = await handleApi({ ...as("maya@example.com"), path: `/api/${path}`, ...(bodies[path] ?? {}) }, d);
    assert.deepEqual([r.status, (r.body as { reason?: string }).reason], [403, "not_editor"], path);
    // refused before anything was read from Camelo or written anywhere
    assert.deepEqual(c.asked, [], path);
    assert.equal(kept.changeLog.entries.length + kept.feedback.entries.size + kept.invoices.entries.size, 0, path);
    // and the same request from the office is not refused, so the route was really reached
    const boss = await handleApi({ ...as("boss@example.com"), path: `/api/${path}`, ...(bodies[path] ?? {}) }, d);
    assert.notEqual(boss.status, 403, path);
    assert.notEqual(boss.status, 401, path);
  }
  // the routes for staff let a cleaner in
  const c = cameloPeople();
  const logged: BrowserError[] = [];
  const d = deps({ fetchImpl: c.fetchImpl, staff: "*", logBrowserError: (e: BrowserError) => logged.push(e) });
  assert.equal((await handleApi({ ...as("maya@example.com"), path: "/api/client-error", payload: { message: "Oops" } }, d)).status, 200);
  assert.equal(logged[0].email, "maya@example.com");
  // and with the switch off they do not
  const off = deps({ fetchImpl: c.fetchImpl, staff: "off" });
  for (const path of ["whoami", "client-error", "my-week"]) {
    assert.equal(
      (await handleApi({ ...as("maya@example.com"), path: `/api/${path}`, payload: { message: "Oops" } }, off)).status,
      403,
      path,
    );
  }
});

test("the routes the server answers are the ones the hosting sends it, and no others", () => {
  type HostingEntry = { target?: string; rewrites: { source: string; function?: unknown }[] };
  const raw = JSON.parse(readFileSync(new URL("../../firebase.json", import.meta.url), "utf8")).hosting as HostingEntry | HostingEntry[];
  const hosting = Array.isArray(raw) ? raw.find((h) => h.target === "freshnest-ops") : raw;
  assert.ok(hosting, "freshnest-ops hosting target must exist in firebase.json");
  const sent = hosting.rewrites.filter((r) => r.function).map((r) => r.source.replace("/api/", ""));
  assert.deepEqual(sent.sort(), ROUTES.map((r) => r.path).sort());
});

// ---- My week: the one route a cleaner reads data from. Every name and address is made up.

// Monday 2026-10-12, 9:00 in Toronto: the pay period is Fri Oct 9 to Thu Oct 15, and My week runs to Thu Oct 22.
const MW_NOW = Date.parse("2026-10-12T09:00:00-04:00");
const mwShift = (id: string, who: string | null, day: string, over: object = {}) => ({
  id,
  state: "CONFIRMED",
  startTime: `2026-10-${day}T08:00:00-04:00`,
  endTime: `2026-10-${day}T10:00:00-04:00`,
  timezone: "America/Toronto",
  note: null,
  client: { name: "Lakeview Made-Up", phoneNumber: "555-0100", email: "client@example.com" },
  jobSite: { name: "Lakeview", address: "12 Made-Up St", note: null },
  group: { name: "Cleaning" },
  assignee: who ? { id: who, phoneNumber: "555-0199" } : null,
  shiftPartners: [],
  ...over,
});
const mwSheet = (id: string, who: string, day: string, over: object = {}) => ({
  id,
  state: "APPROVED",
  from: `2026-10-${day}T08:00:00-04:00`,
  to: `2026-10-${day}T10:00:00-04:00`,
  totalDuration: 120,
  timezone: "America/Toronto",
  employee: { id: who, name: who === "u1" ? "Maya Made-Up" : "Someone Else" },
  group: { name: "Cleaning" },
  client: { name: "Lakeview Made-Up" },
  jobSite: { name: "Lakeview" },
  ...over,
});
/** A pretend Camelo with people, shifts and timesheets. `honest: false` ignores the filter by person, as a broken filter would. */
function cameloWeek(shifts: object[], sheets: object[], opts: { honest?: boolean; down?: boolean } = {}) {
  const asked: { kind: string; filter?: Record<string, unknown> }[] = [];
  const fetchImpl = (async (_url: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    const kind = /\busers\(/.test(query)
      ? "users"
      : /\bshifts\(/.test(query)
        ? "shifts"
        : /\btimesheets\(/.test(query)
          ? "timesheets"
          : "other";
    asked.push({ kind, filter: variables.filter });
    const page = (nodes: unknown[]) => ({ pageInfo: { hasNextPage: false, endCursor: null }, nodes });
    if (kind === "users") return new Response(JSON.stringify({ data: { users: page(STAFF) } }));
    if (opts.down) return new Response("x", { status: 503 });
    const honest = opts.honest !== false;
    const f = variables.filter as { userIds?: string[]; employeeIds?: string[] };
    if (kind === "shifts") {
      const rows = (shifts as { assignee: { id: string } | null }[]).filter(
        (s) => !honest || !f.userIds || f.userIds.includes(s.assignee?.id ?? ""),
      );
      return new Response(JSON.stringify({ data: { shifts: page(rows) } }));
    }
    const rows = (sheets as { employee: { id: string } }[]).filter(
      (t) => !honest || !f.employeeIds || f.employeeIds.includes(t.employee.id),
    );
    return new Response(JSON.stringify({ data: { timesheets: page(rows) } }));
  }) as unknown as typeof fetch;
  return { asked, fetchImpl };
}
type MyWeek = {
  name: string | null;
  periodStart: string;
  visits: Record<string, unknown>[];
  onCall: string[];
  timesheets: { id: string; employee: { id: string } }[];
};
const myWeek = async (email: string, d: object, payload?: object) => {
  const r = await handleApi({ ...as(email), path: "/api/my-week", payload }, d as Parameters<typeof handleApi>[1]);
  return { status: r.status, body: r.body as MyWeek & { error?: string } };
};
const EVERYONE = [
  mwShift("s1", "u1", "12", {
    note: " Lockbox 1234 ",
    jobSite: { name: "Lakeview", address: "12 Made-Up St", note: "Dog in the yard" },
    shiftPartners: [{ id: "s2", assignee: { id: "u3", name: "Pat Partner" } }],
  }),
  mwShift("s2", "u3", "12"),
  mwShift("s3", "u3", "13", { client: { name: "Secret Client" }, jobSite: { name: "Secret", address: "1 Hidden Rd", note: "Alarm 9999" } }),
];
const SHEETS = [mwSheet("t1", "u1", "09"), mwSheet("t2", "u3", "09"), mwSheet("t3", "u1", "12", { state: "SUBMITTED" })];

test("a cleaner's week holds their own visits and hours, put together field by field", async () => {
  const c = cameloWeek(EVERYONE, SHEETS);
  const r = await myWeek("maya@example.com", deps({ fetchImpl: c.fetchImpl, staff: "*", now: () => MW_NOW }));
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.name, r.body.periodStart, r.body.onCall], ["Maya Made-Up", "2026-10-09", []]);
  assert.deepEqual(r.body.visits, [
    {
      id: "s1",
      start: "2026-10-12T08:00:00-04:00",
      end: "2026-10-12T10:00:00-04:00",
      timezone: "America/Toronto",
      state: "CONFIRMED",
      position: "Cleaning",
      client: "Lakeview Made-Up",
      site: "Lakeview",
      address: "12 Made-Up St",
      note: "Lockbox 1234",
      siteNote: "Dog in the yard",
      with: ["Pat Partner"],
      partnerShiftIds: ["s2"],
    },
  ]);
  assert.deepEqual(
    r.body.timesheets.map((t) => t.id),
    ["t1", "t3"],
  );
  // Camelo was asked for this person's only: the pay period and the seven days after for visits, the period for hours
  const [shifts, sheets] = [c.asked.find((a) => a.kind === "shifts")!, c.asked.find((a) => a.kind === "timesheets")!];
  assert.deepEqual(shifts.filter!.userIds, ["u1"]);
  assert.deepEqual(sheets.filter!.employeeIds, ["u1"]);
  assert.deepEqual([shifts.filter!.fromTime, sheets.filter!.fromTime], ["2026-10-09T00:00:00-04:00", "2026-10-09T00:00:00-04:00"]);
  assert.equal(shifts.filter!.toTime, new Date(Date.parse("2026-10-23T00:00:00-04:00") - 1000).toISOString());
  assert.equal(sheets.filter!.toTime, new Date(Date.parse("2026-10-16T00:00:00-04:00") - 1000).toISOString());
  // nothing of the client's or a colleague's beyond what is listed above
  const sent = JSON.stringify(r.body);
  for (const leak of ["555-", "client@example.com", "u3", "Secret", "Hidden", "9999", "Someone Else"])
    assert.equal(sent.includes(leak), false, leak);
});

test("if Camelo's filter by person did nothing, the answer still holds nobody else's visits or hours", async () => {
  const c = cameloWeek(EVERYONE, SHEETS, { honest: false });
  const r = await myWeek("maya@example.com", deps({ fetchImpl: c.fetchImpl, staff: "*", now: () => MW_NOW }));
  assert.deepEqual(
    r.body.visits.map((v) => v.id),
    ["s1"],
  );
  assert.deepEqual(
    r.body.timesheets.map((t) => t.id),
    ["t1", "t3"],
  );
  const sent = JSON.stringify(r.body);
  for (const leak of ["Secret", "Hidden", "9999", "Someone Else", "u3"]) assert.equal(sent.includes(leak), false, leak);
});

test("a cleaner cannot ask for someone else's week: whose it is comes from who signed in", async () => {
  const c = cameloWeek(EVERYONE, SHEETS);
  const d = deps({ fetchImpl: c.fetchImpl, staff: "*", now: () => MW_NOW });
  for (const payload of [
    { employeeId: "u3" },
    { employeeId: ["u3"] },
    { userIds: ["u3"], employeeIds: ["u3"] },
    { employeeId: "not a valid id!" },
  ]) {
    const r = await myWeek("maya@example.com", d, payload);
    assert.equal(r.status, 200, JSON.stringify(payload));
    assert.deepEqual(
      r.body.visits.map((v) => v.id),
      ["s1"],
      JSON.stringify(payload),
    );
  }
  assert.equal(
    c.asked.some((a) => JSON.stringify(a.filter ?? {}).includes("u3")),
    false,
  );
});

test("a cleaner is not shown a shift the office has not released, an open one, or one they turned down", async () => {
  const shifts = ["DRAFT", "READY", "OPENING", "REJECTED", "draft", "CONFIRMED", "ASSIGNED", "FINISHED", "ABSENT"].map((state, i) =>
    mwShift(`s-${state}`, "u1", String(12 + i), { state }),
  );
  const r = await myWeek("maya@example.com", deps({ fetchImpl: cameloWeek(shifts, []).fetchImpl, staff: "*", now: () => MW_NOW }));
  assert.deepEqual(
    r.body.visits.map((v) => v.state),
    ["CONFIRMED", "ASSIGNED", "FINISHED", "ABSENT"],
  );
});

test("on call is a day named and nothing else, and time logged as On Call is dropped", async () => {
  const shifts = [
    mwShift("oc1", "u1", "13", { group: { name: "On Call" }, client: null, jobSite: null }),
    mwShift("oc2", "u1", "14", { group: { name: "on-call" } }),
    mwShift("oc3", "u3", "15", { group: { name: "On Call" } }),
    mwShift("v1", "u1", "13"),
  ];
  const sheets = [mwSheet("t1", "u1", "13"), mwSheet("t-oc", "u1", "13", { group: { name: "On Call" } })];
  const r = await myWeek("maya@example.com", deps({ fetchImpl: cameloWeek(shifts, sheets).fetchImpl, staff: "*", now: () => MW_NOW }));
  assert.deepEqual(r.body.onCall, ["2026-10-13", "2026-10-14"]);
  assert.deepEqual(
    r.body.visits.map((v) => v.id),
    ["v1"],
  );
  assert.deepEqual(
    r.body.timesheets.map((t) => t.id),
    ["t1"],
  );
});

test("the week is the pay period under way and the seven days after; hours are the pay period only", async () => {
  const shifts = [mwShift("before", "u1", "08"), mwShift("first", "u1", "09"), mwShift("last", "u1", "22"), mwShift("after", "u1", "23")];
  const sheets = [mwSheet("t-before", "u1", "08"), mwSheet("t-in", "u1", "15"), mwSheet("t-next", "u1", "16")];
  // a pretend Camelo that ignores the dates too, so the answer is cut here
  const fetchImpl = (async (_url: unknown, init: { body: string }) => {
    const { query } = JSON.parse(init.body);
    const page = (nodes: unknown[]) => ({ pageInfo: { hasNextPage: false, endCursor: null }, nodes });
    const data = /\busers\(/.test(query)
      ? { users: page(STAFF) }
      : /\bshifts\(/.test(query)
        ? { shifts: page(shifts) }
        : { timesheets: page(sheets) };
    return new Response(JSON.stringify({ data }));
  }) as unknown as typeof fetch;
  const r = await myWeek("maya@example.com", deps({ fetchImpl, staff: "*", now: () => MW_NOW }));
  assert.deepEqual(
    r.body.visits.map((v) => v.id),
    ["first", "last"],
  );
  assert.deepEqual(
    r.body.timesheets.map((t) => t.id),
    ["t-in"],
  );
  // on the Thursday night the period is still this one; a minute after midnight it is the next
  const at = async (iso: string) =>
    (await myWeek("maya@example.com", deps({ fetchImpl, staff: "*", now: () => Date.parse(iso) }))).body.periodStart;
  assert.deepEqual([await at("2026-10-15T23:59:00-04:00"), await at("2026-10-16T00:01:00-04:00")], ["2026-10-09", "2026-10-16"]);
});

test("the office can look at one person's week by naming them, and only then", async () => {
  const c = cameloWeek(EVERYONE, SHEETS);
  const d = deps({ fetchImpl: c.fetchImpl, staff: "off", now: () => MW_NOW });
  const r = await myWeek("boss@example.com", d, { employeeId: "u3" });
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.name, r.body.visits.map((v) => v.id)], [null, ["s2", "s3"]]);
  assert.equal((await myWeek("boss@example.com", d, {})).status, 400);
  assert.equal((await myWeek("boss@example.com", d, { employeeId: "a/b" })).status, 400);
  // the office is not looked up in Camelo's people for this
  assert.equal(
    c.asked.some((a) => a.kind === "users"),
    false,
  );
});

test("my week needs a sign-in and the switch, says so when Camelo is down, and is kept a minute per person", async () => {
  const c = cameloWeek(EVERYONE, SHEETS);
  const on = { fetchImpl: c.fetchImpl, staff: "*", now: () => MW_NOW };
  assert.equal((await handleApi({ method: "POST", path: "/api/my-week" }, deps(on))).status, 401);
  assert.equal((await myWeek("maya@example.com", deps({ ...on, staff: "off" }))).status, 403);
  assert.equal((await myWeek("stranger@example.com", deps(on))).status, 403);
  const down = cameloWeek(EVERYONE, SHEETS, { down: true });
  const failed = await myWeek("maya@example.com", deps({ ...on, fetchImpl: down.fetchImpl }));
  assert.deepEqual([failed.status, failed.body.error], [502, "Could not load your week from Camelo"]);

  const kept = cameloWeek(EVERYONE, SHEETS);
  const d = deps({ ...on, fetchImpl: kept.fetchImpl, readCache: new ReadCache(), people: new PeopleCache() });
  await myWeek("maya@example.com", d);
  const once = kept.asked.length;
  const again = await myWeek("maya@example.com", d);
  assert.equal(kept.asked.length, once);
  assert.equal(again.body.name, "Maya Made-Up");
  // another person's week is its own read, and is theirs
  const other = await myWeek("noname@example.com", d);
  assert.deepEqual(
    other.body.visits.map((v) => v.id),
    ["s2", "s3"],
  );
  assert.equal(other.body.name, "Unnamed employee");
});

test("/api/live loads today's shifts and timesheets, caches them, and respects refresh rate limit", async () => {
  let calls = 0;
  const mockFetch: typeof fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    calls++;
    const { query } = JSON.parse(init?.body as string);
    if (query.includes("LiveShifts")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            shifts: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  id: "s-today-1",
                  state: "PUBLISHED",
                  startTime: "2026-10-14T08:00:00-04:00",
                  endTime: "2026-10-14T10:00:00-04:00",
                  timezone: "America/Toronto",
                  breakDuration: 0,
                  client: { id: "c1", name: "Client A" },
                  assignee: { id: "u-avery", name: "Avery Stone" },
                  jobSite: { id: "j1", name: "Site 1", address: "123 Main St" },
                  group: { id: "g1", name: "Cleaning" },
                  checklistAssignments: [],
                  shiftPartners: [],
                },
              ],
            },
          },
        }),
      } as Response;
    }
    if (query.includes("LiveTimesheets")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            timesheets: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  id: "t-today-1",
                  state: "SUBMITTED",
                  from: "2026-10-14T08:05:00-04:00",
                  to: null,
                  totalDuration: null,
                  timezone: "America/Toronto",
                  approvedAt: null,
                  comments: 0,
                  employee: { id: "u-avery", name: "Avery Stone" },
                  group: { id: "g1", name: "Cleaning" },
                  client: { id: "c1", name: "Client A" },
                  jobSite: { id: "j1", name: "Site 1", address: "123 Main St" },
                  referenceObject: { __typename: "TimeCard", shiftId: "s-today-1", note: null },
                },
              ],
            },
          },
        }),
      } as Response;
    }
    return { ok: false, status: 500 } as Response;
  }) as typeof fetch;

  let currentNow = Date.parse("2026-10-14T09:00:00-04:00");
  const cache = new ReadCache(60_000, () => currentNow);
  const d = deps({
    fetchImpl: mockFetch,
    readCache: cache,
    now: () => currentNow,
  });

  // Sign in required
  const noAuth = await handleApi({ method: "POST", path: "/api/live" }, d);
  assert.equal(noAuth.status, 401);

  // Office access succeeds
  const res1 = await handleApi({ ...as("boss@example.com"), method: "POST", path: "/api/live" }, d);
  assert.equal(res1.status, 200);
  const body1 = res1.body as { today: string; shifts: unknown[]; timesheets: unknown[] };
  assert.equal(body1.today, "2026-10-14");
  assert.equal(body1.shifts.length, 1);
  assert.equal(body1.timesheets.length, 1);
  assert.equal(calls, 2); // 1 shifts + 1 timesheets

  // Immediate second call hits cache
  const res2 = await handleApi({ ...as("boss@example.com"), method: "POST", path: "/api/live" }, d);
  assert.equal(res2.status, 200);
  assert.equal(calls, 2);

  // First refresh clears cache and refetches
  currentNow += 5_000;
  const res3 = await handleApi({ ...as("boss@example.com"), method: "POST", path: "/api/live", refresh: true }, d);
  assert.equal(res3.status, 200);
  assert.equal(calls, 4);

  // Second refresh within 20s rate limit serves cache
  currentNow += 5_000;
  const res4 = await handleApi({ ...as("boss@example.com"), method: "POST", path: "/api/live", refresh: true }, d);
  assert.equal(res4.status, 200);
  assert.equal(calls, 4);

  // Third refresh after 20s clears cache and refetches
  currentNow += 20_000;
  const res5 = await handleApi({ ...as("boss@example.com"), method: "POST", path: "/api/live", refresh: true }, d);
  assert.equal(res5.status, 200);
  assert.equal(calls, 6);
});

test("POST /api/live-handled: lists and sets handled visits for the office, refuses cleaners", async () => {
  const store = new MemoryLiveHandledStore();
  const d = deps({
    liveHandled: store,
    now: () => 1_700_000_000_000,
  });

  // 1. Sign-in required
  const noAuth = await handleApi({ method: "POST", path: "/api/live-handled", payload: { action: "list", date: "2026-10-14" } }, d);
  assert.equal(noAuth.status, 401);

  // 2. Cleaner refused
  const cleanerReq = await handleApi(
    { ...as("maya@example.com"), method: "POST", path: "/api/live-handled", payload: { action: "list", date: "2026-10-14" } },
    deps({ fetchImpl: cameloPeople().fetchImpl, staff: "*", liveHandled: store }),
  );
  assert.equal(cleanerReq.status, 403);

  // 3. Store missing returns 500
  const noStore = await handleApi({ ...as("boss@example.com"), method: "POST", path: "/api/live-handled" }, deps());
  assert.equal(noStore.status, 500);

  // 4. Initial list is empty
  const list1 = await handleApi(
    { ...as("boss@example.com"), method: "POST", path: "/api/live-handled", payload: { action: "list", date: "2026-10-14" } },
    d,
  );
  assert.equal(list1.status, 200);
  assert.deepEqual((list1.body as { entries: unknown[] }).entries, []);

  // 5. Mark shift handled
  const set1 = await handleApi(
    {
      ...as("boss@example.com"),
      method: "POST",
      path: "/api/live-handled",
      payload: { action: "set", shiftId: "shift-123", date: "2026-10-14", handled: true },
    },
    d,
  );
  assert.equal(set1.status, 200);
  assert.deepEqual(set1.body, {
    entry: {
      shiftId: "shift-123",
      date: "2026-10-14",
      handled: true,
      updatedAt: 1_700_000_000_000,
      updatedBy: "boss@example.com",
    },
  });

  // 6. List returns the marked visit
  const list2 = await handleApi(
    { ...as("boss@example.com"), method: "POST", path: "/api/live-handled", payload: { action: "list", date: "2026-10-14" } },
    d,
  );
  assert.equal(list2.status, 200);
  assert.equal((list2.body as { entries: unknown[] }).entries.length, 1);

  // 7. Range list works
  const listRange = await handleApi(
    {
      ...as("boss@example.com"),
      method: "POST",
      path: "/api/live-handled",
      payload: { action: "list", from: "2026-10-10", to: "2026-10-20" },
    },
    d,
  );
  assert.equal(listRange.status, 200);
  assert.equal((listRange.body as { entries: unknown[] }).entries.length, 1);

  // 8. Undoing handled updates record with handled: false
  const set2 = await handleApi(
    {
      ...as("boss@example.com"),
      method: "POST",
      path: "/api/live-handled",
      payload: { action: "set", shiftId: "shift-123", date: "2026-10-14", handled: false },
    },
    d,
  );
  assert.equal(set2.status, 200);
  assert.equal((set2.body as { entry: { handled: boolean } }).entry.handled, false);

  // 9. Validation errors
  const badDate = await handleApi(
    {
      ...as("boss@example.com"),
      method: "POST",
      path: "/api/live-handled",
      payload: { action: "set", shiftId: "shift-123", date: "bad-date", handled: true },
    },
    d,
  );
  assert.equal(badDate.status, 400);

  const badHandled = await handleApi(
    {
      ...as("boss@example.com"),
      method: "POST",
      path: "/api/live-handled",
      payload: { action: "set", shiftId: "shift-123", date: "2026-10-14", handled: "yes" },
    },
    d,
  );
  assert.equal(badHandled.status, 400);

  const unknown = await handleApi(
    {
      ...as("boss@example.com"),
      method: "POST",
      path: "/api/live-handled",
      payload: { action: "something-else" },
    },
    d,
  );
  assert.equal(unknown.status, 400);
});

test("partners are the other cleaners at the same client at overlapping times, not Camelo's slow shiftPartners", async () => {
  const { withPartners } = await import("./partners.js");
  const at = (id: string, who: string, client: string | null, start: string, end: string) => ({
    id,
    startTime: `2026-10-16T${start}:00Z`,
    endTime: `2026-10-16T${end}:00Z`,
    client: client ? { id: client } : null,
    jobSite: null,
    assignee: { id: who, name: who },
  });
  const shifts = withPartners([
    at("a", "Avery", "maple", "12", "14"),
    at("b", "Blake", "maple", "12", "14"),
    at("c", "Casey", "maple", "15", "17"), // same client, later: not a partner
    at("d", "Devon", "birch", "12", "14"), // same time, other client: not a partner
    at("e", "Emery", null, "12", "14"), // no client or site (On Call): no partners
  ]);
  const partners = Object.fromEntries(shifts.map((s) => [s.id, (s.shiftPartners as { id: string }[]).map((p) => p.id)]));
  assert.deepEqual(partners, { a: ["b"], b: ["a"], c: [], d: [], e: [] });
});

// Photos of clients' homes on visits (decision 0044): the office any, a cleaner only their own visits, checked
// against Camelo; a JPEG only; a cleaner deletes their own the same day.
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)]).toString("base64");
function photoDeps(over: Record<string, unknown> = {}, camelo = { down: false }) {
  const people = cameloPeople();
  // s-maya and s-pat are one visit Maya (u1) and Pat (u3) work together; s-other is someone else's
  const visits: Record<string, { owner: string; partners: string[] }> = {
    "s-maya": { owner: "u1", partners: ["u3"] },
    "s-pat": { owner: "u3", partners: ["u1"] },
    "s-other": { owner: "u9", partners: [] },
  };
  const fetchImpl = (async (url: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    if (/\bshift\(id/.test(query)) {
      if (camelo.down) return new Response("busy", { status: 503 });
      const v = visits[variables.id];
      const shift = v ? { assignee: { id: v.owner }, shiftPartners: v.partners.map((id) => ({ assignee: { id } })) } : null;
      return new Response(JSON.stringify({ data: { shift } }));
    }
    return people.fetchImpl(url as string, init as unknown as RequestInit);
  }) as unknown as typeof fetch;
  const photos = new MemoryVisitPhotos();
  const files = new MemoryPhotoFiles();
  return { d: deps({ fetchImpl, staff: "*", visitPhotos: photos, photoFiles: files, ...over }), photos, files };
}
const photo = (email: string, d: object, payload: Record<string, unknown>) =>
  handleApi({ ...as(email), path: "/api/visit-photos", payload }, d as Parameters<typeof handleApi>[1]);

test("a cleaner adds and sees photos on their own visit, and the office sees them too", async () => {
  const { d, files } = photoDeps();
  const added = await photo("maya@example.com", d, { action: "add", shiftId: "s-maya", kind: "before", image: JPEG });
  assert.equal(added.status, 200);
  const id = (added.body as { photo: { id: string } }).photo.id;
  assert.equal(files.files.size, 1);
  const mine = await photo("maya@example.com", d, { action: "list", shiftIds: ["s-maya"] });
  assert.deepEqual(
    (mine.body as { photos: { kind: string; takenBy: string; canDelete: boolean }[] }).photos.map((p) => [p.kind, p.takenBy, p.canDelete]),
    [["before", "maya@example.com", true]],
  );
  assert.equal(JSON.stringify(mine.body).includes("visits/"), false, "the bucket path is never sent");
  const office = await photo("boss@example.com", d, { action: "view", id });
  assert.equal((office.body as { image: string }).image, JPEG);
});

test("a cleaner cannot add, list or see photos on someone else's visit", async () => {
  const { d } = photoDeps();
  const other = await photo("boss@example.com", d, { action: "add", shiftId: "s-other", kind: "after", image: JPEG });
  const id = (other.body as { photo: { id: string } }).photo.id;
  assert.equal((await photo("maya@example.com", d, { action: "add", shiftId: "s-other", kind: "after", image: JPEG })).status, 403);
  assert.equal((await photo("maya@example.com", d, { action: "list", shiftIds: ["s-maya", "s-other"] })).status, 403);
  assert.equal((await photo("maya@example.com", d, { action: "view", id })).status, 403);
  assert.equal((await photo("maya@example.com", d, { action: "delete", id })).status, 403);
});

test("a cleaner deletes their own photo the same day, not later; the office deletes any", async () => {
  let now = Date.parse("2026-10-20T15:00:00Z");
  const { d, photos, files } = photoDeps({ now: () => now });
  const a = (await photo("maya@example.com", d, { action: "add", shiftId: "s-maya", kind: "after", image: JPEG })).body as {
    photo: { id: string };
  };
  const b = (await photo("maya@example.com", d, { action: "add", shiftId: "s-maya", kind: "after", image: JPEG })).body as {
    photo: { id: string };
  };
  assert.equal((await photo("maya@example.com", d, { action: "delete", id: a.photo.id })).status, 200);
  now += 24 * 3600_000; // the next day in Toronto
  assert.equal((await photo("maya@example.com", d, { action: "delete", id: b.photo.id })).status, 403);
  assert.equal((await photo("boss@example.com", d, { action: "delete", id: b.photo.id })).status, 200);
  assert.deepEqual([photos.entries.size, files.files.size], [0, 0]);
});

test("partners on a shared visit see each other's photos, but add only on their own shift and delete only their own", async () => {
  const { d } = photoDeps();
  const pats = await photo("noname@example.com", d, { action: "add", shiftId: "s-pat", kind: "before", image: JPEG });
  assert.equal(pats.status, 200);
  const id = (pats.body as { photo: { id: string } }).photo.id;
  // Maya lists her own shift and Pat's on the same visit, and sees Pat's photo, without a Delete
  const listed = await photo("maya@example.com", d, { action: "list", shiftIds: ["s-maya", "s-pat"] });
  assert.equal(listed.status, 200);
  assert.deepEqual(
    (listed.body as { photos: { id: string; canDelete: boolean }[] }).photos.map((p) => [p.id, p.canDelete]),
    [[id, false]],
  );
  assert.equal((await photo("maya@example.com", d, { action: "view", id })).status, 200);
  assert.equal((await photo("maya@example.com", d, { action: "delete", id })).status, 403);
  assert.equal((await photo("maya@example.com", d, { action: "add", shiftId: "s-pat", kind: "after", image: JPEG })).status, 403);
  // someone who is not on the visit still sees nothing
  assert.equal((await photo("maya@example.com", d, { action: "list", shiftIds: ["s-maya", "s-other"] })).status, 403);
});

test("when Camelo cannot be asked, a cleaner is told to try again, not that the visit is not theirs", async () => {
  const camelo = { down: false };
  const { d } = photoDeps({}, camelo);
  const added = await photo("maya@example.com", d, { action: "add", shiftId: "s-maya", kind: "before", image: JPEG });
  const id = (added.body as { photo: { id: string } }).photo.id;
  camelo.down = true;
  for (const payload of [
    { action: "list", shiftIds: ["s-maya"] },
    { action: "add", shiftId: "s-maya", kind: "after", image: JPEG },
    { action: "view", id },
    { action: "delete", id },
  ]) {
    const r = await photo("maya@example.com", d, payload);
    assert.equal(r.status, 502, String(payload.action));
    assert.match((r.body as { error: string }).error, /Try again/);
  }
});

test("a photo must be a JPEG, and a photo is kept one year", async () => {
  const now = Date.parse("2026-10-20T15:00:00Z");
  const { d, photos } = photoDeps({ now: () => now });
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(200)]).toString("base64");
  assert.equal((await photo("boss@example.com", d, { action: "add", shiftId: "s-maya", kind: "after", image: png })).status, 400);
  assert.equal((await photo("boss@example.com", d, { action: "add", shiftId: "s-maya", kind: "during", image: JPEG })).status, 400);
  await photo("boss@example.com", d, { action: "add", shiftId: "s-maya", kind: "after", image: JPEG });
  assert.equal([...photos.entries.values()][0].expireAt, now + 365 * 86_400_000);
});

// ---- Cleaner Camelo token connection and encryption (decision 0044, item 2.4.7) ----

test("a cleaner's Camelo token is encrypted per cleaner with AES-256-GCM and cannot be decrypted with another key or after tampering", () => {
  const enc = encryptToken("camelo-secret-token-u1", "site-master-token", "u1");
  assert.notEqual(enc.ciphertext, "camelo-secret-token-u1");
  assert.equal(decryptToken({ employeeId: "u1", ...enc }, "site-master-token"), "camelo-secret-token-u1");
  assert.equal(decryptToken({ employeeId: "u2", ...enc }, "site-master-token"), null, "bound to employeeId");
  assert.equal(decryptToken({ employeeId: "u1", ...enc }, "rotated-master-token"), null, "bound to CAMELO_TOKEN");
  assert.equal(decryptToken({ employeeId: "u1", ...enc, tag: Buffer.alloc(16, 1).toString("base64") }, "site-master-token"), null);
});

test("a cleaner connects their Camelo account once via emailed code; the token stays encrypted on the server with its expiry", async () => {
  let now = MW_NOW;
  const expiresIso = new Date(now + 14 * 86_400_000).toISOString();
  const week = cameloWeek(EVERYONE, SHEETS);
  const askedLogins: string[] = [];
  let verifyWhoamiId = "u1";

  const fetchImpl = (async (url: unknown, init: { body: string }) => {
    const { query, variables } = JSON.parse(init.body);
    if (/requestLoginSession/.test(query)) {
      askedLogins.push(variables.input.authenticationValue);
      return new Response(
        JSON.stringify({
          data: { requestLoginSession: { errors: [], result: { id: "sess-u1" } } },
        }),
      );
    }
    if (/verifyOtp/.test(query)) {
      if (variables.input.loginSessionId !== "sess-u1" || variables.input.otpCode !== "654321") {
        return new Response(
          JSON.stringify({
            data: {
              verifyOtp: { errors: [{ attribute: "otp", fullMessage: "Invalid code", type: "invalid" }], result: null },
            },
          }),
        );
      }
      return new Response(
        JSON.stringify({
          data: {
            verifyOtp: {
              errors: [],
              result: {
                jwtToken: "cleaner-raw-camelo-token",
                expiredAt: expiresIso,
                whoami: { id: verifyWhoamiId, email: "maya@example.com" },
              },
            },
          },
        }),
      );
    }
    return week.fetchImpl(url as string, init as unknown as RequestInit);
  }) as unknown as typeof fetch;

  const cleanerTokens = new MemoryCleanerTokens();
  const d = deps({ fetchImpl, staff: "*", cleanerTokens, now: () => now });
  const clock = (email: string, payload: Record<string, unknown>) => handleApi({ ...as(email), path: "/api/clock", payload }, d);

  assert.equal(changesCamelo("/api/clock", "requestCode"), true);

  // Before connecting: my-week reports cameloConnected: false
  const before = await myWeek("maya@example.com", d);
  assert.equal((before.body as { cameloConnected?: boolean }).cameloConnected, false);

  // Office cannot use /api/clock
  assert.equal((await clock("boss@example.com", { action: "requestCode" })).status, 403);

  // Cleaner requests code: email comes from verified Google sign-in, ignoring any email in payload
  const reqCode = await clock("maya@example.com", { action: "requestCode", email: "someone-else@example.com" });
  assert.equal(reqCode.status, 200);
  assert.deepEqual(askedLogins, ["maya@example.com"]);
  assert.equal((reqCode.body as { sessionToken: string }).sessionToken, "sess-u1");

  // Wrong code is refused with 422
  const badCode = await clock("maya@example.com", { action: "verifyCode", sessionToken: "sess-u1", code: "000000" });
  assert.equal(badCode.status, 422);
  assert.equal(await cleanerTokens.get("u1"), null);

  // Mismatched Camelo whoami.id is refused with 403 and nothing is stored
  verifyWhoamiId = "u999";
  const wrongAccount = await clock("maya@example.com", { action: "verifyCode", sessionToken: "sess-u1", code: "654321" });
  assert.equal(wrongAccount.status, 403);
  assert.equal(await cleanerTokens.get("u1"), null);

  // Valid code for the signed-in cleaner stores the encrypted token and never sends the token back
  verifyWhoamiId = "u1";
  const ok = await clock("maya@example.com", { action: "verifyCode", sessionToken: "sess-u1", code: "654 321" });
  assert.equal(ok.status, 200);
  assert.equal(JSON.stringify(ok.body).includes("cleaner-raw-camelo-token"), false);

  const stored = await cleanerTokens.get("u1");
  assert.ok(stored);
  assert.equal(stored.expireAt, Date.parse(expiresIso));
  assert.equal(stored.ciphertext.includes("cleaner-raw-camelo-token"), false);
  assert.equal(decryptToken(stored, d.camelToken), "cleaner-raw-camelo-token");

  // My week now reports cameloConnected: true (without leaking the token)
  const after = await myWeek("maya@example.com", d);
  assert.equal((after.body as { cameloConnected?: boolean }).cameloConnected, true);
  assert.equal(JSON.stringify(after.body).includes("cleaner-raw-camelo-token"), false);
  assert.equal(JSON.stringify(after.body).includes(stored.ciphertext), false);

  // Once the token expires, cameloConnected becomes false again
  now = Date.parse(expiresIso) + 1000;
  const expired = await myWeek("maya@example.com", d);
  assert.equal((expired.body as { cameloConnected?: boolean }).cameloConnected, false);
});

test("a cleaner clocks in and out with GPS and a door photo, keeps the punch if S3 fails, and can attach a missing door photo later", async () => {
  let now = Date.parse("2026-10-12T12:00:00Z");
  const people = cameloPeople();
  let s3Fail = false;
  let uploadedBytes = 0;
  const authHeaders: string[] = [];
  const recordedBatches: unknown[][] = [];
  const attachedPhotos: { timeCardId: string; atTime: string; photoToken: string }[] = [];

  const timeCard: {
    id: string;
    state: string;
    punches: { id: string; punchType: string; atTime: string; attachment: { photo: string | null } | null }[];
  } = { id: "tc-s1", state: "READY", punches: [] };

  const fetchImpl = (async (url: unknown, init: { body?: unknown; headers?: Record<string, string> }) => {
    const href = String(url);
    if (href === "https://s3.example.com/upload") {
      if (s3Fail) return new Response("S3 error", { status: 500 });
      const form = init.body as FormData;
      const file = form.get("file") as Blob;
      uploadedBytes = file.size;
      assert.equal(form.get("success_action_status"), "200");
      assert.equal(form.get("Content-Type"), null, "no extra Content-Type field against S3 policy");
      return new Response("", { status: 200 });
    }
    const { query, variables } = JSON.parse(String(init.body));
    if (/\busers\(/.test(query)) return people.fetchImpl(url as string, init as unknown as RequestInit);
    if (/\bshift\(id/.test(query)) {
      if (variables.id === "s-other") {
        return new Response(
          JSON.stringify({
            data: { shift: { id: "s-other", assignee: { id: "u3" }, timeCard: { id: "tc-other", state: "READY", punches: [] } } },
          }),
        );
      }
      return new Response(JSON.stringify({ data: { shift: { id: "s1", assignee: { id: "u1" }, timeCard } } }));
    }
    if (/generateUploadUrl/.test(query)) {
      authHeaders.push(init.headers?.Authorization ?? "");
      return new Response(
        JSON.stringify({
          data: {
            generateUploadUrl: {
              errors: [],
              result: {
                acl: "private",
                key: `uploads/door-${attachedPhotos.length + 1}.jpg`,
                policy: "pol",
                uri: "https://s3.example.com/upload",
                xAmzAlgorithm: "AWS4-HMAC-SHA256",
                xAmzCredential: "cred",
                xAmzDate: "20261012T120000Z",
                xAmzSignature: "sig",
              },
            },
          },
        }),
      );
    }
    if (/syncTimeCardPunches/.test(query)) {
      authHeaders.push(init.headers?.Authorization ?? "");
      recordedBatches.push(variables.input.punches);
      timeCard.punches = (variables.input.punches as { punchType: string; atTime: string }[]).map((p, i) => ({
        id: `p-${i + 1}`,
        punchType: p.punchType,
        atTime: p.atTime,
        attachment: timeCard.punches.find((old) => old.punchType === p.punchType)?.attachment ?? null,
      }));
      timeCard.state = timeCard.punches.some((p) => p.punchType === "FINISH") ? "FINISHED" : "WORKING";
      return new Response(JSON.stringify({ data: { syncTimeCardPunches: { errors: [], result: timeCard.punches } } }));
    }
    if (/syncTimeCardPunchAttachment/.test(query)) {
      authHeaders.push(init.headers?.Authorization ?? "");
      attachedPhotos.push(variables.input);
      const p = timeCard.punches.find((x) => Date.parse(x.atTime) === Date.parse(variables.input.atTime));
      const photoUrl = `https://s3.example.com/${variables.input.photoKey}`;
      if (p) p.attachment = { photo: photoUrl };
      return new Response(
        JSON.stringify({
          data: {
            syncTimeCardPunchAttachment: {
              errors: [],
              result: { id: p?.id ?? "p1", photo: photoUrl },
            },
          },
        }),
      );
    }
    return new Response("{}", { status: 500 });
  }) as unknown as typeof fetch;

  const cleanerTokens = new MemoryCleanerTokens();
  const d = deps({ fetchImpl, staff: "*", cleanerTokens, now: () => now });
  const clock = (email: string, payload: Record<string, unknown>) => handleApi({ ...as(email), path: "/api/clock", payload }, d);

  // Without a connected Camelo token, punching is refused with 409
  assert.equal((await clock("maya@example.com", { action: "punch", shiftId: "s1", type: "in" })).status, 409);

  // Store Maya's encrypted Camelo token
  await cleanerTokens.put({
    employeeId: "u1",
    email: "maya@example.com",
    ...encryptToken("maya-camelo-jwt", d.camelToken, "u1"),
    connectedAt: now,
    expireAt: now + 86_400_000,
  });

  // Cannot clock in on another cleaner's visit
  assert.equal((await clock("maya@example.com", { action: "punch", shiftId: "s-other", type: "in" })).status, 403);

  // Clock in when S3 fails: the punch itself still succeeds (photoAttached: false)
  s3Fail = true;
  const punchIn = await clock("maya@example.com", {
    action: "punch",
    shiftId: "s1",
    type: "in",
    lat: 45.02,
    lon: -74.73,
    image: JPEG,
  });
  assert.equal(punchIn.status, 200);
  assert.deepEqual(punchIn.body, { ok: true, atTime: "2026-10-12T12:00:00.000Z", photoAttached: false });
  assert.equal(recordedBatches.length, 1);

  // Attach the missing clock-in door photo later
  s3Fail = false;
  const attachIn = await clock("maya@example.com", { action: "photo", shiftId: "s1", type: "in", image: JPEG });
  assert.equal(attachIn.status, 200);
  assert.ok(uploadedBytes >= 1024, "padded to at least 1 KB for Camelo S3 policy");
  assert.equal(attachedPhotos.length, 1);
  assert.equal(attachedPhotos[0].atTime, "2026-10-12T12:00:00.000Z");

  // Clock out 2 hours later with GPS and a door photo: sends CLOCK_IN, CLOCK_OUT at now, and FINISH at now + 500ms
  now += 2 * 3_600_000;
  const punchOut = await clock("maya@example.com", {
    action: "punch",
    shiftId: "s1",
    type: "out",
    lat: 45.02,
    lon: -74.73,
    image: JPEG,
  });
  assert.equal(punchOut.status, 200);
  assert.deepEqual(punchOut.body, { ok: true, atTime: "2026-10-12T14:00:00.000Z", photoAttached: true });
  const secondBatch = recordedBatches[1] as { punchType: string; atTime: string }[];
  assert.deepEqual(
    secondBatch.map((p) => [p.punchType, p.atTime]),
    [
      ["CLOCK_IN", "2026-10-12T12:00:00.000Z"],
      ["CLOCK_OUT", "2026-10-12T14:00:00.000Z"],
      ["FINISH", "2026-10-12T14:00:00.500Z"],
    ],
  );
  // Every Camelo mutation used the cleaner's own decrypted token, never the office token
  assert.ok(authHeaders.length >= 4);
  for (const h of authHeaders) assert.equal(h, "Bearer maya-camelo-jwt");
});

test("POST /api/clock signs an active cleaner in with a 6-digit Camelo code, connects Camelo, and issues a 30-day cleaner token", async () => {
  const now = MW_NOW;
  const expSec = Math.floor((now + 30 * 86_400_000) / 1000);
  const signed = signCleanerSession("maya@example.com", "u1", expSec, "server-secret");
  assert.ok(signed.startsWith("c1."));
  assert.deepEqual(verifyCleanerSession(signed, "server-secret", now), { email: "maya@example.com", employeeId: "u1" });
  assert.equal(verifyCleanerSession(signed, "other-secret", now), null, "rejects wrong server secret");
  assert.equal(verifyCleanerSession(signed + "x", "server-secret", now), null, "rejects tampered signature");
  assert.equal(verifyCleanerSession(signed, "server-secret", expSec * 1000), null, "rejects expired token");

  const otpRequests: string[] = [];
  let otpWhoId = "u1";
  const people = cameloPeople();
  const fetchImpl = (async (url: string, init: { body: string }) => {
    const q = JSON.parse(init.body) as { query: string; variables: Record<string, unknown> };
    if (/\busers\(/.test(q.query)) return people.fetchImpl(url, init as RequestInit);
    if (q.query.includes("requestLoginSession")) {
      const input = q.variables.input as { authenticationValue: string };
      otpRequests.push(input.authenticationValue);
      return new Response(
        JSON.stringify({
          data: { requestLoginSession: { errors: [], result: { id: "sess-1" } } },
        }),
      );
    }
    if (q.query.includes("verifyOtp")) {
      return new Response(
        JSON.stringify({
          data: {
            verifyOtp: {
              errors: [],
              result: {
                jwtToken: "cleaner-camelo-jwt",
                expiredAt: "2026-11-12T00:00:00Z",
                whoami: { id: otpWhoId, email: "maya@example.com" },
              },
            },
          },
        }),
      );
    }
    return new Response("{}", { status: 500 });
  }) as unknown as typeof fetch;

  const cleanerTokens = new MemoryCleanerTokens();
  const d = deps({ fetchImpl, staff: "*", cleanerTokens, now: () => now });
  const anonClock = (payload: Record<string, unknown>, customDeps = d) =>
    handleApi({ method: "POST", path: "/api/clock", payload }, customDeps);

  // Office emails are refused before touching requestLoginSession (office stays on Google sign-in)
  assert.equal((await anonClock({ action: "signInRequestCode", email: "boss@example.com" })).status, 403);
  // Unknown and inactive emails are refused before touching requestLoginSession
  assert.equal((await anonClock({ action: "signInRequestCode", email: "stranger@example.com" })).status, 403);
  assert.equal((await anonClock({ action: "signInRequestCode", email: "jo@example.com" })).status, 403);
  // Refused when SCHEDULE_STAFF is off
  assert.equal(
    (await anonClock({ action: "signInRequestCode", email: "maya@example.com" }, deps({ fetchImpl, staff: "off", cleanerTokens }))).status,
    403,
  );
  assert.deepEqual(otpRequests, [], "no Camelo login email sent for refused addresses");

  // Active cleaner can request a code
  const reqRes = await anonClock({ action: "signInRequestCode", email: "  MAYA@example.com " });
  assert.equal(reqRes.status, 200);
  assert.deepEqual(reqRes.body, { sessionToken: "sess-1", expiresAt: null });
  assert.deepEqual(otpRequests, ["maya@example.com"]);

  // Refused if Camelo's whoami.id does not match the cleaner's employeeId
  otpWhoId = "someone-else";
  assert.equal(
    (await anonClock({ action: "signInVerifyCode", email: "maya@example.com", sessionToken: "sess-1", code: "123456" })).status,
    403,
  );
  assert.equal(await cleanerTokens.get("u1"), null);

  // Verifies code, stores the encrypted Camelo token, and issues a c1. cleaner session token
  otpWhoId = "u1";
  const verRes = await anonClock({ action: "signInVerifyCode", email: "maya@example.com", sessionToken: "sess-1", code: "123 456" });
  assert.equal(verRes.status, 200);
  const verBody = verRes.body as { ok: boolean; token: string; email: string; role: string; name: string; cameloConnected: boolean };
  assert.equal(verBody.ok, true);
  assert.equal(verBody.email, "maya@example.com");
  assert.equal(verBody.role, "cleaner");
  assert.equal(verBody.name, "Maya Made-Up");
  assert.equal(verBody.cameloConnected, true);
  assert.ok(verBody.token.startsWith("c1."));
  const storedCamelo = await cleanerTokens.get("u1");
  assert.ok(storedCamelo);
  assert.equal(decryptToken(storedCamelo!, d.camelToken), "cleaner-camelo-jwt");

  // The c1. session token works on staff routes (/api/whoami) without calling verifyGoogle
  const whoRes = await handleApi({ method: "POST", path: "/api/whoami", googleToken: verBody.token }, d);
  assert.equal(whoRes.status, 200);
  assert.deepEqual(whoRes.body, { email: "maya@example.com", role: "cleaner", name: "Maya Made-Up" });

  // The c1. session token is refused by office routes (/api/shifts), even if forged with an office email
  const forgedOffice = signCleanerSession("boss@example.com", "u1", expSec, d.camelToken);
  const shiftRes = await handleApi({ method: "POST", path: "/api/shifts", googleToken: forgedOffice, weekStart: "2026-10-05" }, d);
  assert.equal(shiftRes.status, 403);

  // Turning SCHEDULE_STAFF off revokes an existing c1. session token immediately
  const revokedRes = await handleApi(
    { method: "POST", path: "/api/whoami", googleToken: verBody.token },
    deps({ fetchImpl, staff: "off", cleanerTokens, now: () => now }),
  );
  assert.equal(revokedRes.status, 403);
});

test("ADR-022 Strategy 2: Firebase Auth + live admins/{email} allowlist enforces full 401/403 matrix and immediate revocation", async () => {
  const { allowlistOfficeRole } = await import("./core.js");

  // allowlistOfficeRole matches functions/src/lib/roles.ts
  assert.equal(allowlistOfficeRole({ role: "owner" }), "owner");
  assert.equal(allowlistOfficeRole({ role: "manager" }), "manager");
  assert.equal(allowlistOfficeRole({ role: "admin" }), "owner");
  assert.equal(allowlistOfficeRole({}), "owner");
  assert.equal(allowlistOfficeRole({ role: "supervisor" }), null);
  assert.equal(allowlistOfficeRole({ role: "staff" }), null);
  assert.equal(allowlistOfficeRole({ role: "customer" }), null);
  assert.equal(allowlistOfficeRole(undefined), null);

  // Live in-memory admins/{email} table simulating Firestore
  const admins = new Map<string, "owner" | "manager">([
    ["lauren@freshnest.ca", "owner"],
    ["ryan@freshnest.ca", "manager"],
  ]);

  const tokenTable: Record<string, { email: string; role?: unknown }> = {
    "fb:owner": { email: "lauren@freshnest.ca", role: "owner" },
    "fb:manager": { email: "ryan@freshnest.ca", role: "manager" },
    "fb:preapproved-manager": { email: "ryan@freshnest.ca", role: undefined },
    "fb:supervisor": { email: "sam@freshnest.ca", role: "supervisor" },
    "fb:staff": { email: "brenda@freshnest.ca", role: "staff" },
    "fb:customer": { email: "diane@freshnest.ca", role: "customer" },
    "fb:legacy-admin": { email: "old@freshnest.ca", role: "admin" },
  };

  const s2Deps = {
    camelToken: "t",
    verifyAuth: async (tok: string) => tokenTable[tok] ?? null,
    resolveOfficeAllowlist: async (email: string) => admins.get(email.trim().toLowerCase()) ?? null,
    cleanerTokens: new MemoryCleanerTokens(),
    fetchImpl: fakeFetch([[]]),
    staff: "*",
  };

  // Unauthenticated / invalid token -> 401 on every non-health route
  for (const r of ROUTES.filter((rt) => rt.path !== "health")) {
    const noTok = await handleApi({ method: "POST", path: `/api/${r.path}`, weekStart: "2026-10-05" }, s2Deps);
    assert.equal(noTok.status, 401, `missing token should be 401 on ${r.path}`);
    const badTok = await handleApi({ method: "POST", path: `/api/${r.path}`, googleToken: "fb:expired", weekStart: "2026-10-05" }, s2Deps);
    assert.equal(badTok.status, 401, `bad token should be 401 on ${r.path}`);
  }
  assert.equal((await handleApi({ method: "GET", path: "/api/health" }, s2Deps)).status, 200);

  // Owner (Lauren) & Manager (Ryan) & newly pre-approved Manager (before claim refresh) -> 200
  for (const [tok, expectedEmail] of [
    ["fb:owner", "lauren@freshnest.ca"],
    ["fb:manager", "ryan@freshnest.ca"],
    ["fb:preapproved-manager", "ryan@freshnest.ca"],
  ] as const) {
    const who = await handleApi({ method: "POST", path: "/api/whoami", googleToken: tok }, s2Deps);
    assert.equal(who.status, 200, tok);
    assert.deepEqual(who.body, { email: expectedEmail, role: "office" });
    const shifts = await handleApi({ method: "POST", path: "/api/shifts", googleToken: tok, weekStart: "2026-10-05" }, s2Deps);
    assert.equal(shifts.status, 200, tok);
  }

  // Non-office accounts (supervisor, staff, customer, legacy admin) -> 403 on every office route
  const officeRoutes = ROUTES.filter((rt) => rt.for === "office").map((rt) => rt.path);
  for (const tok of ["fb:supervisor", "fb:staff", "fb:customer", "fb:legacy-admin"]) {
    for (const path of officeRoutes) {
      const res = await handleApi({ method: "POST", path: `/api/${path}`, googleToken: tok, weekStart: "2026-10-05" }, s2Deps);
      assert.equal(res.status, 403, `${tok} must be 403 on ${path}`);
    }
  }

  // Immediate revocation: removing Ryan from admins/{email} blocks access right away even while JWT still holds role: manager
  admins.delete("ryan@freshnest.ca");
  const afterRevoke = await handleApi({ method: "POST", path: "/api/shifts", googleToken: "fb:manager", weekStart: "2026-10-05" }, s2Deps);
  assert.equal(afterRevoke.status, 403);

  // Office emails in admins/{email} are refused cleaner OTP code requests (office stays on Firebase Auth Google Sign-In)
  const otpForOffice = await handleApi(
    { method: "POST", path: "/api/clock", payload: { action: "signInRequestCode", email: "lauren@freshnest.ca" } },
    s2Deps,
  );
  assert.equal(otpForOffice.status, 403);
});
