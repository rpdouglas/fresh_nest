// POST /api/snapshots: finished pay periods' figures, for the dashboard's trends.
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { requireOffice } from "../who.js";
import { z } from "zod";
import { addDays, torontoMidnight } from "../checks.js";
import type { PeriodSnapshot } from "../stores.js";
import { day, dayRange, parse, rangeWords } from "../validate.js";

const MAX_SNAPSHOT_DAYS = 400;
const MAX_SNAPSHOT_ROWS = 2000;

const NAME = /^[A-Za-z]{1,30}$/;
const figure = z.number().gt(-1e9).lt(1e9);
/** A row of a snapshot: a few short names and plain numbers, nothing else. */
const row = <K extends "id" | "key">(idField: K) =>
  z
    .object({ [idField]: z.string().min(1).max(200), name: z.string().max(200) } as Record<K | "name", z.ZodString>)
    .catchall(figure)
    .refine((r) => Object.keys(r).length <= 30 && Object.keys(r).every((k) => NAME.test(k)));

const List = dayRange(MAX_SNAPSHOT_DAYS);
/** One finished pay period's figures, as the dashboard sends them; `now` decides whether it has finished. */
const Figures = (now: number) =>
  z.object({
    v: z.int().min(1).max(1000),
    // pay periods start on a Friday
    periodStart: day
      .refine((d) => new Date(`${d}T00:00:00Z`).getUTCDay() === 5, { abort: true })
      .refine((d) => Date.parse(torontoMidnight(addDays(d, 7))) <= now, "That pay period has not finished yet"),
    totals: z
      .record(z.string().regex(NAME), figure, { error: (issue) => (issue.code === "invalid_type" ? "totals is required" : undefined) })
      .refine((t) => Object.keys(t).length <= 40),
    cleaners: z.array(row("id")).max(MAX_SNAPSHOT_ROWS),
    clients: z.array(row("key")).max(MAX_SNAPSHOT_ROWS),
  });
const FIGURES_WORDS = {
  v: "v must be a version number",
  periodStart: "periodStart must be a Friday, YYYY-MM-DD",
  totals: "totals must be numbers by name",
  cleaners: "cleaners must be a list of rows",
  clients: "clients must be a list of rows",
};

/** Pay-period figures for the dashboard's trends: list a range, or save one finished period. */
export async function handleSnapshots(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;
  const store = deps.snapshots;
  if (!store) return { status: 500, body: { error: "Trends are not set up" } };
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const bad = (error: string): ApiResponse => ({ status: 400, body: { error } });
  const now = (deps.now ?? Date.now)();

  if (p.action === "list") {
    const range = parse(List, p, rangeWords);
    if ("error" in range) return bad(range.error);
    return { status: 200, body: { snapshots: await store.list(range.data.from, range.data.to) } };
  }

  if (p.action === "set") {
    const sent = parse(Figures(now), p, FIGURES_WORDS);
    if ("error" in sent) return bad(sent.error);
    const snapshot: PeriodSnapshot = { ...sent.data, savedAt: now, savedBy: who.email };
    await store.put(snapshot);
    return { status: 200, body: { snapshot } };
  }

  return bad("Unknown action");
}
