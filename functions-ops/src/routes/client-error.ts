// POST /api/client-error: a fault in the site, written to the function's log.
import { type ApiRequest, type ApiResponse, type BrowserError, type Deps } from "../api.js";
import { requireStaff } from "../who.js";

const BROWSER_ERROR_SOURCES = new Set(["render", "window", "promise"]);
/** A string cut to `max` characters, or null when it is not a string or is empty. */
const cut = (v: unknown, max: number): string | null => (typeof v === "string" && v ? v.slice(0, max) : null);

/**
 * A fault in the site, sent by the browser so that it reaches the log and the error alert.
 * Nothing is read from Camelo and nothing is stored: one line at ERROR, each field cut to a
 * fixed length so a request cannot write a huge entry.
 */
export async function handleClientError(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireStaff(req, deps);
  if ("status" in who) return who;
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const message = cut(p.message, 500);
  if (!message) return { status: 400, body: { error: "message must be text" } };
  const entry: BrowserError = {
    email: who.email,
    view: cut(p.view, 40),
    source: typeof p.source === "string" && BROWSER_ERROR_SOURCES.has(p.source) ? p.source : null,
    message,
    stack: cut(p.stack, 4000),
    componentStack: cut(p.componentStack, 4000),
  };
  (deps.logBrowserError ?? ((e) => console.error("Browser error", JSON.stringify(e))))(entry);
  return { status: 200, body: { ok: true } };
}
