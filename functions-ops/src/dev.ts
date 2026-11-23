// Local stand-in for the Cloud Function: `npm run dev` in functions/.
// Needs CAMELO_TOKEN in the environment. Sign in with the dev token below.
import { createServer } from "node:http";
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
  changesCamelo,
  PeopleCache,
  ReadCache,
  handleApi,
} from "./core.js";

const camelToken = process.env.CAMELO_TOKEN;
if (!camelToken) {
  console.error("Set CAMELO_TOKEN in your environment first.");
  process.exit(1);
}
const changeLog = new MemoryLog();
const feedback = new MemoryFeedback();
const invoices = new MemoryInvoices();
const clientRates = new MemoryClientRates();
const soloOk = new MemorySoloOk();
const liveHandled = new MemoryLiveHandledStore();
// home photos and cleaner tokens stay in memory locally: nothing reaches the real bucket or Firestore
const visitPhotos = new MemoryVisitPhotos();
const photoFiles = new MemoryPhotoFiles();
const cleanerTokens = new MemoryCleanerTokens();
const settings = new MemorySettingsStore();
const snapshots = new MemorySnapshots();
// Address lookups send job-site addresses to OpenStreetMap, and nothing is remembered
// between runs here, so they are off unless asked for: GEOCODE=on npm run dev
const places = process.env.GEOCODE === "on" ? new MemoryPlaces() : undefined;
// Local stand-in for Google sign-in: a token of "dev:someone@example.com" is
// accepted as that address. This file is never deployed.
const editors = (process.env.SCHEDULE_EDITORS ?? "dev@example.com").split(",");
const verifyGoogle = async (token: string) => (token.startsWith("dev:") ? token.slice(4) : null);
// Cleaners are let in only when asked for: SCHEDULE_STAFF="*" (every active person in Camelo) or a list of addresses.
const staff = process.env.SCHEDULE_STAFF ?? "";
const port = Number(process.env.PORT ?? 8787);
// The token here is the real one and Camelo has no read-only kind. An approval cannot be
// undone, so changes to Camelo are refused unless asked for: CAMELO_WRITES=on npm run dev
const cameloWrites = process.env.CAMELO_WRITES === "on";

const readCache = new ReadCache();
const people = new PeopleCache();

createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body: Record<string, unknown> = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    // leave empty; the handler reports the missing date
  }
  const result =
    !cameloWrites && changesCamelo(req.url, body.action)
      ? {
          status: 409,
          body: {
            error: "This local server does not change Camelo. Restart it with CAMELO_WRITES=on to allow it; an approval cannot be undone.",
          },
        }
      : req.url === "/api/health" ||
          req.url === "/api/client-error" ||
          req.url === "/api/whoami" ||
          req.url === "/api/my-week" ||
          req.url === "/api/visit-photos" ||
          req.url === "/api/clock" ||
          req.url === "/api/shifts" ||
          req.url === "/api/timesheets" ||
          req.url === "/api/timesheet-actions" ||
          req.url === "/api/feedback" ||
          req.url === "/api/invoices" ||
          req.url === "/api/client-rates" ||
          req.url === "/api/schedule-check" ||
          req.url === "/api/settings" ||
          req.url === "/api/snapshots" ||
          req.url === "/api/timesheet-review" ||
          req.url === "/api/live" ||
          req.url === "/api/live-handled"
        ? await handleApi(
            {
              method: req.method ?? "GET",
              path: req.url,
              weekStart: body.weekStart,
              periodStart: body.periodStart,
              googleToken: req.headers["x-editor-token"] as string | undefined,
              action: body.action,
              refresh: body.refresh,
              timesheetIds: body.timesheetIds,
              timesheetId: body.timesheetId,
              from: body.from,
              to: body.to,
              employeeId: body.employeeId,
              groupId: body.groupId,
              clientId: body.clientId,
              jobSiteId: body.jobSiteId,
              content: body.content,
              payload: body,
            },
            {
              camelToken,
              verifyGoogle,
              editors,
              staff,
              people,
              changeLog,
              feedback,
              invoices,
              clientRates,
              soloOk,
              liveHandled,
              visitPhotos,
              photoFiles,
              cleanerTokens,
              places,
              settings,
              snapshots,
              readCache,
            },
          )
        : { status: 404, body: { error: "Not found" } };
  res.writeHead(result.status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(result.body));
}).listen(port, () =>
  console.log(
    `Dev API on http://localhost:${port}/api/shifts (sign in as ${editors[0]}; changes to Camelo are ${cameloWrites ? "ALLOWED" : "refused"})`,
  ),
);
