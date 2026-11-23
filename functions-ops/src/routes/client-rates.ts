// POST /api/client-rates: what each client is billed, and from when.
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { requireOffice } from "../who.js";
import { validDate } from "../checks.js";
import type { RateRule } from "../stores.js";

const MAX_RULES = 100;

/** Client prices: list them all, or set one client's price from a day onwards. */
export async function handleClientRates(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;
  const store = deps.clientRates;
  if (!store) return { status: 500, body: { error: "Client prices are not set up" } };
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const bad = (error: string): ApiResponse => ({ status: 400, body: { error } });

  if (p.action === "list") return { status: 200, body: { rates: await store.list() } };

  if (p.action === "set") {
    const { clientKey, clientName, from, kind, dollars } = p;
    if (typeof clientKey !== "string" || !clientKey || clientKey.length > 200) return bad("clientKey is required");
    if (typeof clientName !== "string" || !clientName.trim() || clientName.length > 200) return bad("clientName is required");
    if (!validDate(from)) return bad("from must be YYYY-MM-DD");
    if (kind !== "hourly" && kind !== "flat") return bad("kind must be hourly or flat");
    // to the cent first, so a price under half a cent is refused and not kept as $0
    const cents = typeof dollars === "number" && Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
    if (cents <= 0 || cents >= 1_000_000) return bad("dollars must be more than 0 and less than 10,000");
    const rule: RateRule = { from, kind, dollars: cents / 100, setAt: (deps.now ?? Date.now)(), setBy: who.email };
    // a rare write, so reading the list to check the limit first costs little
    const held = (await store.list()).find((r) => r.clientKey === clientKey);
    if (held && held.rules.length >= MAX_RULES && !held.rules.some((r) => r.from === from))
      return bad(`At most ${MAX_RULES} prices for one client`);
    return { status: 200, body: { rate: await store.add(clientKey, clientName.trim(), rule) } };
  }

  return bad("Unknown action");
}
