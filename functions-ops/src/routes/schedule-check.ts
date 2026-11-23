// POST /api/schedule-check: solo visits marked OK, and where job sites are.
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { requireOffice } from "../who.js";
import { z } from "zod";
import { DAY_MS } from "../checks.js";
import { type SoloOk, placeKey } from "../stores.js";
import { day, dayRange, id, parse, rangeWords } from "../validate.js";

// Address lookups go to OpenStreetMap's Nominatim, which the owner approved for
// job-site addresses (the address only; never a client's name). Its usage policy:
// at most one request a second, and a User-Agent that says who is asking.
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const GEOCODE_USER_AGENT = "freshnest-ops-schedule-check/1.0 (https://ops.freshnestco.ca)";
/** New lookups per request, so one request stays well inside the function's 60 s. */
const MAX_LOOKUPS = 8;
const MAX_ADDRESSES = 300;
/** An address that was not found is tried again after this long. */
const RETRY_MISS_MS = 30 * DAY_MS;
const MAX_OK_DAYS = 92;

// What each action may send. The words for a field that fails are beside each use.
const Oks = dayRange(MAX_OK_DAYS);
const Ok = z.object({ shiftId: id, date: day, ok: z.boolean() });
const Places = z.object({
  addresses: z
    .array(
      z
        .string()
        .max(300)
        .refine((a) => a.trim() !== ""),
    )
    .max(MAX_ADDRESSES),
});
let lastLookup = 0;

/** One address to a position; null when Nominatim has no match. Throws if it cannot be asked. */
async function lookUp(address: string, deps: Deps): Promise<{ lat: number; lon: number } | null> {
  const gap = deps.geocodeGapMs ?? 1100;
  const wait = lastLookup + gap - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastLookup = Date.now();
  const url = `${NOMINATIM}?${new URLSearchParams({ q: address, format: "jsonv2", limit: "1", countrycodes: "ca" })}`;
  const res = await (deps.fetchImpl ?? fetch)(url, {
    headers: { "User-Agent": GEOCODE_USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const hits = (await res.json()) as { lat?: string; lon?: string }[];
  const [lat, lon] = [Number(hits[0]?.lat), Number(hits[0]?.lon)];
  return hits.length && Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

/**
 * The dashboard's schedule check: solo visits marked OK (oks, ok), and where job
 * sites are (places), for the drive time between visits.
 */
export async function handleScheduleCheck(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const bad = (error: string): ApiResponse => ({ status: 400, body: { error } });
  const now = (deps.now ?? Date.now)();

  if (p.action === "oks" || p.action === "ok") {
    const store = deps.soloOk;
    if (!store) return { status: 500, body: { error: "The schedule check is not set up" } };
    if (p.action === "oks") {
      const range = parse(Oks, p, rangeWords);
      if ("error" in range) return bad(range.error);
      return { status: 200, body: { entries: (await store.list(range.data.from, range.data.to)).filter((e) => e.ok) } };
    }
    const sent = parse(Ok, p, { shiftId: "shiftId is required", date: "date must be YYYY-MM-DD", ok: "ok must be true or false" });
    if ("error" in sent) return bad(sent.error);
    const entry: SoloOk = { ...sent.data, updatedAt: now, updatedBy: who.email };
    await store.put(entry);
    return { status: 200, body: { entry } };
  }

  if (p.action === "places") {
    const store = deps.places;
    if (!store) return { status: 500, body: { error: "The schedule check is not set up" } };
    const sent = parse(Places, p, { addresses: `addresses must be a list of up to ${MAX_ADDRESSES} addresses` });
    if ("error" in sent) return bad(sent.error);
    const wanted = new Map(sent.data.addresses.map((a) => [placeKey(a), a.replace(/\s+/g, " ").trim()]));
    const known = new Map((await store.get([...wanted.keys()])).map((k) => [k.key, k]));
    const places: Record<string, { lat: number; lon: number } | null> = {};
    let pending = 0;
    let looked = 0;
    let failed = false;
    for (const [key, address] of wanted) {
      const have = known.get(key);
      if (have && (have.lat !== null || now - have.at < RETRY_MISS_MS)) {
        places[key] = have.lat !== null && have.lon !== null ? { lat: have.lat, lon: have.lon } : null;
      } else if (failed || looked >= MAX_LOOKUPS) {
        pending++;
      } else {
        looked++;
        try {
          const found = await lookUp(address, deps);
          await store.put({ key, lat: found?.lat ?? null, lon: found?.lon ?? null, at: now });
          places[key] = found;
        } catch (e) {
          // the lookup service is down or refusing: stop asking, and say so
          console.error("Address lookup failed:", e instanceof Error ? e.message : e);
          failed = true;
          pending++;
        }
      }
    }
    // pending: addresses still to look up; ask again for those unless the lookup failed
    return { status: 200, body: { places, pending, failed } };
  }

  return bad("Unknown action");
}
