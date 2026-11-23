// Framework-free request handling, so the same code runs in the Cloud Function
// (index.ts) and the local dev server (dev.ts).
// This file is the way in: it sends a request to its route (routes/, one file each) and
// passes on everything the function, the dev server and the tests use.
import type { ApiRequest, ApiResponse, Deps } from "./api.js";
import { handleClientError } from "./routes/client-error.js";
import { handleClientRates } from "./routes/client-rates.js";
import { handleFeedback } from "./routes/feedback.js";
import { handleInvoices } from "./routes/invoices.js";
import { handleMyWeek } from "./routes/my-week.js";
import { handleScheduleCheck } from "./routes/schedule-check.js";
import { handleSettings } from "./routes/settings.js";
import { handleShifts } from "./routes/shifts.js";
import { handleSnapshots } from "./routes/snapshots.js";
import { changesCamelo, handleActions } from "./routes/timesheet-actions.js";
import { handleReview } from "./routes/timesheet-review.js";
import { handleTimesheets } from "./routes/timesheets.js";
import { handleLive } from "./routes/live.js";
import { handleLiveHandled } from "./routes/live-handled.js";
import { handleVisitPhotos } from "./routes/visit-photos.js";
import { handleClock } from "./routes/clock.js";
import { requireStaff } from "./who.js";

export * from "./api.js";
export * from "./camelo.js";
export * from "./checks.js";
export * from "./stores.js";
export * from "./who.js";
export * from "./routes/client-error.js";
export * from "./routes/client-rates.js";
export * from "./routes/feedback.js";
export * from "./routes/invoices.js";
export * from "./routes/my-week.js";
export * from "./routes/schedule-check.js";
export * from "./routes/settings.js";
export * from "./routes/shifts.js";
export * from "./routes/snapshots.js";
export * from "./routes/timesheet-actions.js";
export * from "./routes/timesheet-review.js";
export * from "./routes/timesheets.js";
export * from "./routes/live.js";
export * from "./routes/live-handled.js";
export * from "./routes/visit-photos.js";
export * from "./routes/clock.js";

/** Who is signed in and which kind of person they are, so the page can show the right thing. For staff. */
export async function handleWhoami(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireStaff(req, deps);
  if ("status" in who) return who;
  return {
    status: 200,
    body: who.role === "office" ? { email: who.email, role: who.role } : { email: who.email, role: who.role, name: who.name },
  };
}

/** For an uptime check: no sign-in, no Camelo call, nothing about the data. */
const health = (_req: ApiRequest, deps: Deps): Promise<ApiResponse> =>
  // It also names the build, so a deploy can be checked: "ok" stays first, since the uptime check looks for the text "ok":true.
  Promise.resolve({ status: 200, body: deps.build ? { ok: true, build: deps.build } : { ok: true } });

function timesheetActions(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  if (!changesCamelo(req.path, req.action)) return handleActions(req, deps);
  // A change to Camelo: what was read before it is out of date, and so is anything read while it was under way.
  deps.readCache?.clear();
  return handleActions(req, deps).finally(() => deps.readCache?.clear());
}

/**
 * Every route the server answers: the end of its path, what answers it, and who it is for. `for` is a statement
 * of intent that the tests hold the handlers to: "office" routes refuse a cleaner, "staff" routes let one in,
 * and "anyone" (the health check alone) needs no sign-in. A new route goes here, with a rewrite in firebase.json;
 * a test fails if the two lists differ.
 */
export const ROUTES: { path: string; for: "anyone" | "staff" | "office"; handle: (req: ApiRequest, deps: Deps) => Promise<ApiResponse> }[] =
  [
    { path: "health", for: "anyone", handle: health },
    { path: "whoami", for: "staff", handle: handleWhoami },
    // a fault in the page is worth hearing about whoever was looking at it; nothing is read and nothing is stored
    { path: "client-error", for: "staff", handle: handleClientError },
    // a person's own visits and hours, and nobody else's: the one route a cleaner reads data from
    { path: "my-week", for: "staff", handle: handleMyWeek },
    // photos of a client's home on a visit: the office any, a cleaner only their own visits, checked against Camelo
    { path: "visit-photos", for: "staff", handle: handleVisitPhotos },
    // a cleaner connects their Camelo account once and clocks in and out with a door photo
    { path: "clock", for: "staff", handle: handleClock },
    { path: "timesheet-actions", for: "office", handle: timesheetActions },
    { path: "timesheet-review", for: "office", handle: handleReview },
    { path: "feedback", for: "office", handle: handleFeedback },
    { path: "invoices", for: "office", handle: handleInvoices },
    { path: "client-rates", for: "office", handle: handleClientRates },
    { path: "schedule-check", for: "office", handle: handleScheduleCheck },
    { path: "settings", for: "office", handle: handleSettings },
    { path: "snapshots", for: "office", handle: handleSnapshots },
    { path: "timesheets", for: "office", handle: handleTimesheets },
    { path: "shifts", for: "office", handle: handleShifts },
    { path: "live", for: "office", handle: handleLive },
    { path: "live-handled", for: "office", handle: handleLiveHandled },
  ];

/** Routes a request by the end of its path. A path that is none of them is answered as shifts, which is for the office. */
export function handleApi(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const last = (req.path ?? "").replace(/\/$/, "").split("/").pop();
  return (ROUTES.find((r) => r.path === last)?.handle ?? handleShifts)(req, deps);
}
