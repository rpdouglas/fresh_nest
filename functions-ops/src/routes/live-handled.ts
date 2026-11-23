// POST /api/live-handled: red visits on the live board marked handled.
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { requireOffice } from "../who.js";
import { z } from "zod";
import { type LiveHandled } from "../stores.js";
import { day, dayRange, id, parse, rangeWords } from "../validate.js";

const MAX_HANDLED_DAYS = 92;
const Range = dayRange(MAX_HANDLED_DAYS);
const SingleDate = z.object({ date: day });
const SetHandled = z.object({ shiftId: id, date: day, handled: z.boolean() });

/**
 * Live board handled visits: list by day or range, or mark/undo a visit as handled.
 * Persisted in scheduleLiveHandled, never in Camelo (decision 0029).
 */
export async function handleLiveHandled(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;

  const store = deps.liveHandled;
  if (!store) return { status: 500, body: { error: "Live handled store is not set up" } };

  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const bad = (error: string): ApiResponse => ({ status: 400, body: { error } });

  if (p.action === "list") {
    let from: string;
    let to: string;
    if (typeof p.date === "string") {
      const parsed = parse(SingleDate, p, { date: "date must be YYYY-MM-DD" });
      if ("error" in parsed) return bad(parsed.error);
      from = parsed.data.date;
      to = parsed.data.date;
    } else {
      const parsed = parse(Range, p, rangeWords);
      if ("error" in parsed) return bad(parsed.error);
      from = parsed.data.from;
      to = parsed.data.to;
    }
    const entries = await store.list(from, to);
    return { status: 200, body: { entries } };
  }

  if (p.action === "set") {
    const sent = parse(SetHandled, p, {
      shiftId: "shiftId is required",
      date: "date must be YYYY-MM-DD",
      handled: "handled must be true or false",
    });
    if ("error" in sent) return bad(sent.error);

    const now = (deps.now ?? Date.now)();
    const entry: LiveHandled = {
      ...sent.data,
      updatedAt: now,
      updatedBy: who.email,
    };
    await store.put(entry);
    return { status: 200, body: { entry } };
  }

  return bad("Unknown action");
}
