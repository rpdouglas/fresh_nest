// POST /api/settings: system settings (grace period for live board and punctuality).
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { requireOffice } from "../who.js";

/** System settings: get or update shared company settings like grace period. */
export async function handleSettings(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;
  const store = deps.settings;
  if (!store) return { status: 500, body: { error: "Settings are not set up" } };
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const bad = (error: string): ApiResponse => ({ status: 400, body: { error } });

  if (p.action === "get") {
    const grace = await store.getGrace();
    return { status: 200, body: { settings: { grace } } };
  }

  if (p.action === "set") {
    const minutes = p.minutes;
    if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 5 || minutes > 30) {
      return bad("minutes must be an integer between 5 and 30");
    }
    const grace = await store.setGrace(minutes, who.email);
    return { status: 200, body: { settings: { grace } } };
  }

  return bad("Unknown action");
}
