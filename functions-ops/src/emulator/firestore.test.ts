// The Firestore stores, run against the Firestore emulator: `npm run test:stores` in functions/.
// Every name here is made up. Nothing reaches the real project: the project id is a "demo-" one,
// which the Firebase tools never connect to anything real, and without the emulator this stops.
import assert from "node:assert/strict";
import { before, beforeEach, test } from "node:test";
import { initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import {
  FirestoreCleanerTokens,
  FirestoreClientRates,
  FirestoreFeedback,
  FirestoreInvoices,
  FirestoreLiveHandled,
  FirestoreVisitPhotos,
  FirestoreLog,
  FirestorePlaces,
  FirestoreSettings,
  FirestoreSnapshots,
  FirestoreSoloOk,
  LOG_KEEP_MS,
} from "../firestore.js";
import { type ChangeEntry, type Feedback, type Invoiced, type RateRule, clientRateId, invoiceId, placeKey } from "../stores.js";

const PROJECT = "demo-fnc-stores";
const host = process.env.FIRESTORE_EMULATOR_HOST;

before(() => {
  if (!host) throw new Error("No Firestore emulator: run `npm run test:stores`, which starts one. These tests never use a real project.");
  initializeApp({ projectId: PROJECT });
});

// every test starts with nothing stored
beforeEach(async () => {
  const res = await fetch(`http://${host}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  assert.equal(res.status, 200);
});

const entry = (over: Partial<ChangeEntry>): ChangeEntry => ({
  at: Date.parse("2026-10-06T15:00:00Z"),
  email: "boss@example.com",
  action: "approve",
  timesheetId: "t1",
  employee: "Maya Made-Up",
  sheetFrom: "2026-10-05T09:00:00-04:00",
  before: { state: "SUBMITTED" },
  after: { state: "APPROVED" },
  ok: true,
  message: null,
  ...over,
});
const [periodFrom, periodTo] = ["2026-10-02T00:00:00-04:00", "2026-10-09T00:00:00-04:00"];

test("the change log lists a pay period's entries, newest first, as they were written", async () => {
  const log = new FirestoreLog();
  const older = entry({ timesheetId: "t1", at: 1000 });
  const newer = entry({ timesheetId: "t2", at: 2000, ok: false, after: null, message: "Camelo did not approve it" });
  await log.write(older);
  await log.write(newer);
  // the period's first moment is in it, the next period's first moment is not
  await log.write(entry({ timesheetId: "first", at: 500, sheetFrom: periodFrom }));
  await log.write(entry({ timesheetId: "next", sheetFrom: periodTo }));
  await log.write(entry({ timesheetId: "before", sheetFrom: "2026-10-01T23:59:00-04:00" }));
  // an entry for a timesheet that was never found has no start, so belongs to no period
  await log.write(entry({ timesheetId: "missing", sheetFrom: null }));

  const listed = await log.list(periodFrom, periodTo);
  assert.deepEqual(
    listed.map((e) => e.timesheetId),
    ["t2", "t1", "first"],
  );
  // exactly what was written: the fields kept for the query and for expiry do not come back
  assert.deepEqual(listed[0], newer);
  assert.deepEqual(listed[1], older);
});

test("a change-log entry is stored with its expiry, three years on, and its start as a number", async () => {
  const written = entry({});
  await new FirestoreLog().write(written);
  const docs = (await getFirestore().collection("scheduleChangeLog").get()).docs;
  assert.equal(docs.length, 1);
  const stored = docs[0].data();
  assert.equal(stored.sheetFromMs, Date.parse(written.sheetFrom!));
  assert.ok(stored.expireAt instanceof Timestamp);
  assert.equal(stored.expireAt.toMillis(), written.at + LOG_KEEP_MS);
  assert.equal(LOG_KEEP_MS, 3 * 365 * 86_400_000);
});

test("the change log still finds entries written before the start was kept as a number", async () => {
  const old = entry({ timesheetId: "old", at: Date.parse("2026-10-06T12:00:00Z") });
  // as the first version wrote it: the entry and nothing else
  await getFirestore().collection("scheduleChangeLog").add(old);
  await getFirestore()
    .collection("scheduleChangeLog")
    .add(entry({ timesheetId: "old-other-period", sheetFrom: "2026-09-28T09:00:00-04:00" }));
  const log = new FirestoreLog();
  await log.write(entry({ timesheetId: "new", at: Date.parse("2026-10-06T13:00:00Z") }));
  const listed = await log.list(periodFrom, periodTo);
  assert.deepEqual(
    listed.map((e) => e.timesheetId),
    ["new", "old"],
  );
  assert.deepEqual(listed[1], old);
});

const kudos: Omit<Feedback, "id"> = {
  type: "kudos",
  date: "2026-10-05",
  visitStart: null,
  visitEnd: null,
  timesheetIds: ["t1"],
  clientKey: "site:Lake/view",
  clientName: "Lakeview Made-Up",
  siteName: null,
  cleaners: [{ id: "u1", name: "Maya Made-Up" }],
  text: "Spotless",
  source: "Phone",
  category: "Quality",
  status: null,
  resolution: null,
  createdAt: 1,
  createdBy: "boss@example.com",
  updatedAt: null,
  updatedBy: null,
  removedAt: null,
  removedBy: null,
  passedOnAt: null,
  passedOnBy: null,
};

test("feedback is created with an id, read back, changed in part, and listed by day, both ends included", async () => {
  const store = new FirestoreFeedback();
  const made = await store.create(kudos);
  assert.ok(made.id);
  assert.deepEqual(made, { ...kudos, id: made.id });
  assert.deepEqual(await store.get(made.id), made);
  assert.equal(await store.get("no-such-entry"), null);

  await store.update(made.id, { passedOnAt: 5, passedOnBy: "boss@example.com" });
  assert.deepEqual(await store.get(made.id), { ...made, passedOnAt: 5, passedOnBy: "boss@example.com" });

  const first = await store.create({ ...kudos, date: "2026-10-01" });
  const last = await store.create({ ...kudos, date: "2026-10-31", removedAt: 9, removedBy: "boss@example.com" });
  await store.create({ ...kudos, date: "2026-09-30" });
  await store.create({ ...kudos, date: "2026-11-01" });
  const ids = (await store.list("2026-10-01", "2026-10-31")).map((e) => e.id).sort();
  // a removed entry is still listed here: the route is what leaves it out
  assert.deepEqual(ids, [made.id, first.id, last.id].sort());
});

test("changing feedback that does not exist fails, and stores nothing", async () => {
  const store = new FirestoreFeedback();
  await assert.rejects(store.update("no-such-entry", { text: "x" }));
  assert.equal(await store.get("no-such-entry"), null);
});

const tick = (date: string, clientKey: string, over: Partial<Invoiced> = {}): Invoiced => ({
  id: invoiceId(date, clientKey),
  date,
  clientKey,
  clientName: "Lakeview Made-Up",
  invoiced: true,
  minutes: 120,
  amount: 150,
  timesheetIds: ["t1", "t2"],
  updatedAt: 1,
  updatedBy: "boss@example.com",
  ...over,
});

test("an invoiced tick is one record per client per day, even for a client whose key has a slash in it", async () => {
  const store = new FirestoreInvoices();
  const key = "site:Lake/view";
  await store.put(tick("2026-10-05", key));
  await store.put(tick("2026-10-05", key, { invoiced: false, updatedAt: 2 }));
  await store.put(tick("2026-10-05", "client:c2"));
  await store.put(tick("2026-10-01", key));
  await store.put(tick("2026-10-31", key));
  await store.put(tick("2026-09-30", key));
  await store.put(tick("2026-11-01", key));
  const listed = await store.list("2026-10-01", "2026-10-31");
  assert.deepEqual(listed.map((e) => e.id).sort(), [
    invoiceId("2026-10-01", key),
    invoiceId("2026-10-05", "client:c2"),
    invoiceId("2026-10-05", key),
    invoiceId("2026-10-31", key),
  ]);
  assert.deepEqual(
    listed.find((e) => e.id === invoiceId("2026-10-05", key)),
    tick("2026-10-05", key, { invoiced: false, updatedAt: 2 }),
  );
});

const rule = (from: string, dollars: number, kind: RateRule["kind"] = "flat"): RateRule => ({
  from,
  kind,
  dollars,
  setAt: 1,
  setBy: "boss@example.com",
});

test("a client's prices are one record, oldest first, and a price for the same day replaces the one there", async () => {
  const store = new FirestoreClientRates();
  const key = "site:Lake/view";
  assert.deepEqual(await store.list(), []);
  await store.add(key, "Lakeview Made-Up", rule("2026-10-05", 180));
  await store.add(key, "Lakeview Made-Up", rule("2026-09-01", 160));
  const saved = await store.add(key, "Lakeview", rule("2026-10-05", 200, "hourly"));
  const expected = { clientKey: key, clientName: "Lakeview", rules: [rule("2026-09-01", 160), rule("2026-10-05", 200, "hourly")] };
  assert.deepEqual(saved, expected);
  await store.add("client:c2", "Second Made-Up", rule("2026-10-05", 90));
  const all = (await store.list()).sort((a, b) => a.clientKey.localeCompare(b.clientKey));
  assert.deepEqual(all, [{ clientKey: "client:c2", clientName: "Second Made-Up", rules: [rule("2026-10-05", 90)] }, expected]);
  assert.ok((await getFirestore().collection("scheduleClientRates").doc(clientRateId(key)).get()).exists);
});

test("prices set for one client at the same moment are all kept", async () => {
  const store = new FirestoreClientRates();
  const days = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"];
  await Promise.all(days.map((d, i) => store.add("client:c1", "First Made-Up", rule(d, 100 + i))));
  const [rate] = await store.list();
  assert.deepEqual(
    rate.rules.map((r) => r.from),
    days,
  );
});

test("a solo visit marked OK is one record per shift, listed by day, both ends included", async () => {
  const store = new FirestoreSoloOk();
  const ok = (shiftId: string, date: string, okNow = true) => ({ shiftId, date, ok: okNow, updatedAt: 1, updatedBy: "boss@example.com" });
  await store.put(ok("s1", "2026-10-05"));
  await store.put(ok("s1", "2026-10-05", false));
  await store.put(ok("s2", "2026-10-01"));
  await store.put(ok("s3", "2026-10-07"));
  await store.put(ok("s4", "2026-09-30"));
  await store.put(ok("s5", "2026-10-08"));
  const listed = (await store.list("2026-10-01", "2026-10-07")).sort((a, b) => a.shiftId.localeCompare(b.shiftId));
  // one marked not OK is still listed here: the route is what leaves it out
  assert.deepEqual(listed, [ok("s1", "2026-10-05", false), ok("s2", "2026-10-01"), ok("s3", "2026-10-07")]);
});

test("a visit marked handled is one record per shift in scheduleLiveHandled, listed by day, both ends included", async () => {
  const store = new FirestoreLiveHandled();
  const item = (shiftId: string, date: string, handled = true) => ({
    shiftId,
    date,
    handled,
    updatedAt: 100,
    updatedBy: "boss@example.com",
  });
  await store.put(item("shift-1", "2026-10-14"));
  // Undoing handled updates the record rather than creating a duplicate
  await store.put(item("shift-1", "2026-10-14", false));
  await store.put(item("shift-2", "2026-10-14", true));
  await store.put(item("shift-3", "2026-10-10", true));
  await store.put(item("shift-4", "2026-10-15", true));
  await store.put(item("shift-5", "2026-10-09", true));

  const listed = (await store.list("2026-10-10", "2026-10-14")).sort((a, b) => a.shiftId.localeCompare(b.shiftId));
  assert.deepEqual(listed, [
    item("shift-1", "2026-10-14", false),
    item("shift-2", "2026-10-14", true),
    item("shift-3", "2026-10-10", true),
  ]);

  // Verify document id is shiftId
  const doc = await getFirestore().collection("scheduleLiveHandled").doc("shift-1").get();
  assert.ok(doc.exists);
  assert.equal(doc.id, "shift-1");
  assert.deepEqual(doc.data(), item("shift-1", "2026-10-14", false));
});

test("a period's snapshot is one record per period, and comes back as it was saved", async () => {
  const store = new FirestoreSnapshots();
  const snap = (periodStart: string, billed: number) => ({
    v: 1,
    periodStart,
    totals: { billed, onTime: 47 },
    cleaners: [{ id: "u1", name: "Maya Made-Up", visits: 12 }],
    clients: [{ key: "site:Lake/view", name: "Lakeview Made-Up", billed: 150.5 }],
    savedAt: 1,
    savedBy: "boss@example.com",
  });
  await store.put(snap("2026-10-02", 5000));
  await store.put(snap("2026-10-02", 6000.25));
  await store.put(snap("2026-09-25", 1));
  await store.put(snap("2026-10-09", 2));
  await store.put(snap("2026-09-18", 3));
  const listed = (await store.list("2026-09-25", "2026-10-02")).sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  assert.deepEqual(listed, [snap("2026-09-25", 1), snap("2026-10-02", 6000.25)]);
});

test("a place is kept under its address, whatever characters that holds, found or not", async () => {
  const store = new FirestorePlaces();
  assert.deepEqual(await store.get([]), []);
  const found = { key: placeKey("12 Made-Up St / Unit #4, Cornwall, ON"), lat: 45.02, lon: -74.73, at: 1 };
  const miss = { key: placeKey("nowhere at all"), lat: null, lon: null, at: 2 };
  await store.put(found);
  await store.put(miss);
  await store.put({ ...found, at: 3 });
  const got = await store.get([miss.key, placeKey("never asked"), found.key]);
  assert.deepEqual(
    got.sort((a, b) => a.at - b.at),
    [miss, { ...found, at: 3 }],
  );
  assert.equal((await getFirestore().collection("schedulePlaces").get()).size, 2);
});

test("the grace setting defaults to 15, is saved with updater email and timestamp, and comes back as saved", async () => {
  const store = new FirestoreSettings();
  assert.deepEqual(await store.getGrace(), { minutes: 15, updatedAt: null, updatedBy: null });
  const saved = await store.setGrace(20, "boss@example.com");
  assert.equal(saved.minutes, 20);
  assert.equal(saved.updatedBy, "boss@example.com");
  assert.ok(typeof saved.updatedAt === "number" && saved.updatedAt > 0);
  assert.deepEqual(await store.getGrace(), saved);
});

test("a visit photo is one record per photo, listed by visit past 30 visits, with its expiry for the TTL", async () => {
  const store = new FirestoreVisitPhotos();
  const at = Date.parse("2026-10-20T15:00:00Z");
  const year = 365 * 86_400_000;
  // 35 visits, past the 30 that one "in" query takes
  for (let i = 0; i < 35; i++) {
    await store.add({
      id: `p${i}`,
      shiftId: `s${i}`,
      kind: i % 2 ? "after" : "before",
      takenAt: at + i,
      takenBy: "maya@example.com",
      path: `visits/s${i}/p${i}.jpg`,
      expireAt: at + year,
    });
  }
  const all = await store.list(Array.from({ length: 35 }, (_, i) => `s${i}`));
  assert.equal(all.length, 35);
  assert.deepEqual(
    all.slice(0, 2).map((p) => p.id),
    ["p0", "p1"],
    "oldest first",
  );
  assert.equal((await store.get("p3"))?.expireAt, at + year, "the expiry comes back as a number");
  const raw = (await getFirestore().collection("scheduleVisitPhotos").doc("p3").get()).data()!;
  assert.ok(raw.expireAt instanceof Timestamp, "stored as a date, for Firestore's TTL policy");
  await store.remove("p3");
  assert.equal(await store.get("p3"), null);
  assert.equal((await store.list(["s3"])).length, 0);
});

test("a cleaner's Camelo token is one encrypted record per cleaner, with its expiry for the TTL", async () => {
  const store = new FirestoreCleanerTokens();
  assert.equal(await store.get("u1"), null);
  const at = Date.parse("2026-10-20T15:00:00Z");
  const rec = {
    employeeId: "u1",
    email: "maya@example.com",
    ciphertext: "Y2lwaGVydGV4dA==",
    iv: "aXYxMjM0NTY3ODkw",
    tag: "dGFnMTIzNDU2Nzg5",
    connectedAt: at,
    expireAt: at + 30 * 86_400_000,
  };
  await store.put(rec);
  const replaced = { ...rec, ciphertext: "bmV3LWNpcGhlcnRleHQ=", connectedAt: at + 1000 };
  await store.put(replaced);
  assert.deepEqual(await store.get("u1"), replaced);
  const doc = await getFirestore().collection("scheduleCleanerTokens").doc("u1").get();
  assert.ok(doc.exists);
  assert.ok(doc.data()!.expireAt instanceof Timestamp, "stored as a date, for Firestore's TTL policy");
  await store.remove("u1");
  assert.equal(await store.get("u1"), null);
});
