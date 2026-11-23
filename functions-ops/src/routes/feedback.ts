// POST /api/feedback: client kudos and complaints.
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { requireOffice } from "../who.js";
import { DAY_MS, ISO_WITH_OFFSET, isId, text, validDate } from "../checks.js";
import type { Feedback } from "../stores.js";

export const FEEDBACK_SOURCES = ["Phone", "Text", "Email", "In person", "Online review", "Other"];
export const FEEDBACK_CATEGORIES = ["Quality", "Punctuality", "Damage", "Communication", "Attitude", "Other"];

const MAX_FEEDBACK_DAYS = 400;

/** Checks the fields an editor may set on an entry. Returns the clean values, or what is wrong. */
function feedbackFields(p: Record<string, unknown>, type: "kudos" | "complaint", partial: boolean): Partial<Feedback> | string {
  const out: Partial<Feedback> = {};
  if (!partial || "text" in p) {
    const t = text(p.text, 2000);
    if (!t) return "Write what the client said (up to 2000 characters)";
    out.text = t;
  }
  if (!partial || "cleaners" in p) {
    const list = p.cleaners;
    if (!Array.isArray(list) || list.length > 10) return "cleaners must be a list of at most 10 people";
    const seen = new Map<string, { id: string; name: string }>();
    for (const c of list as { id?: unknown; name?: unknown }[]) {
      const name = text(c?.name, 120);
      if (!isId(c?.id) || !name) return "Each cleaner needs an id and a name";
      seen.set(c.id, { id: c.id, name });
    }
    out.cleaners = [...seen.values()];
  }
  if (!partial || "source" in p) {
    if (typeof p.source !== "string" || !FEEDBACK_SOURCES.includes(p.source))
      return `source must be one of: ${FEEDBACK_SOURCES.join(", ")}`;
    out.source = p.source;
  }
  if (!partial || "category" in p) {
    if (typeof p.category !== "string" || !FEEDBACK_CATEGORIES.includes(p.category))
      return `category must be one of: ${FEEDBACK_CATEGORIES.join(", ")}`;
    out.category = p.category;
  }
  if (type === "complaint") {
    if (!partial || "status" in p) {
      const status = p.status ?? "open";
      if (status !== "open" && status !== "resolved") return "status must be open or resolved";
      out.status = status;
    }
    if (!partial || "resolution" in p) {
      const r = p.resolution == null ? "" : text(p.resolution, 2000);
      if (r === null) return "The follow-up note can be up to 2000 characters";
      out.resolution = r || null;
    }
  } else if (!partial) {
    out.status = null;
    out.resolution = null;
  }
  return out;
}

/** Client kudos and complaints. Editors only, for reading as well as writing. */
export async function handleFeedback(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;
  const store = deps.feedback;
  if (!store) return { status: 500, body: { error: "Feedback is not set up" } };
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const now = (deps.now ?? Date.now)();
  const bad = (error: string): ApiResponse => ({ status: 400, body: { error } });

  if (p.action === "list") {
    if (!validDate(p.from) || !validDate(p.to) || p.to < p.from) return bad("from and to must be dates, in order");
    if (Date.parse(p.to) - Date.parse(p.from) > MAX_FEEDBACK_DAYS * DAY_MS) return bad(`At most ${MAX_FEEDBACK_DAYS} days at a time`);
    const entries = (await store.list(p.from, p.to)).filter((e) => !e.removedAt);
    entries.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    return { status: 200, body: { entries } };
  }

  if (p.action === "create") {
    if (p.type !== "kudos" && p.type !== "complaint") return bad("type must be kudos or complaint");
    if (!validDate(p.date)) return bad("date must be YYYY-MM-DD");
    const clientName = text(p.clientName, 200);
    if (!clientName) return bad("A client name is required");
    const siteName = p.siteName == null ? "" : text(p.siteName, 200);
    const clientKey = p.clientKey == null ? "" : text(p.clientKey, 200);
    if (siteName === null || clientKey === null) return bad("Client and site are too long");
    const stamp = (x: unknown) =>
      x == null ? null : typeof x === "string" && ISO_WITH_OFFSET.test(x) && !Number.isNaN(Date.parse(x)) ? x : undefined;
    const [visitStart, visitEnd] = [stamp(p.visitStart), stamp(p.visitEnd)];
    if (visitStart === undefined || visitEnd === undefined) return bad("visitStart and visitEnd must be date-times");
    const ids = p.timesheetIds ?? [];
    if (!Array.isArray(ids) || ids.length > 20 || !ids.every(isId)) return bad("timesheetIds must be a list of at most 20 ids");
    const fields = feedbackFields(p, p.type, false);
    if (typeof fields === "string") return bad(fields);
    const entry = await store.create({
      type: p.type,
      date: p.date,
      visitStart,
      visitEnd,
      timesheetIds: ids as string[],
      clientKey: clientKey || null,
      clientName,
      siteName: siteName || null,
      cleaners: fields.cleaners!,
      text: fields.text!,
      source: fields.source!,
      category: fields.category!,
      status: fields.status ?? null,
      resolution: fields.resolution ?? null,
      createdAt: now,
      createdBy: who.email,
      updatedAt: null,
      updatedBy: null,
      removedAt: null,
      removedBy: null,
      passedOnAt: null,
      passedOnBy: null,
    });
    return { status: 200, body: { entry } };
  }

  if (p.action === "passon") {
    if (!isId(p.id)) return bad("id is required");
    if (typeof p.passedOn !== "boolean") return bad("passedOn must be true or false");
    const existing = await store.get(p.id);
    if (!existing || existing.removedAt) return { status: 404, body: { error: "That entry no longer exists" } };
    if (existing.type !== "kudos") return bad("Only kudos are passed on");
    const patch = p.passedOn ? { passedOnAt: now, passedOnBy: who.email } : { passedOnAt: null, passedOnBy: null };
    await store.update(p.id, patch);
    return { status: 200, body: { entry: { ...existing, ...patch } } };
  }

  if (p.action === "update" || p.action === "remove") {
    if (!isId(p.id)) return bad("id is required");
    const existing = await store.get(p.id);
    if (!existing || existing.removedAt) return { status: 404, body: { error: "That entry no longer exists" } };
    if (p.action === "remove") {
      await store.update(p.id, { removedAt: now, removedBy: who.email });
      return { status: 200, body: { removed: p.id } };
    }
    const fields = feedbackFields(p, existing.type, true);
    if (typeof fields === "string") return bad(fields);
    if (Object.keys(fields).length === 0) return bad("Nothing to change");
    const patch = { ...fields, updatedAt: now, updatedBy: who.email };
    await store.update(p.id, patch);
    return { status: 200, body: { entry: { ...existing, ...patch } } };
  }

  return bad("Unknown action");
}
