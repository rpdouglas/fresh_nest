// POST /api/invoices: which client-days have been invoiced.
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { requireOffice } from "../who.js";
import { DAY_MS, isId, validDate } from "../checks.js";
import { type Invoiced, invoiceId } from "../stores.js";

const MAX_INVOICE_DAYS = 92;

/** Invoiced ticks: list for a date range, or set one client-day on or off. */
export async function handleInvoices(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireOffice(req, deps);
  if ("status" in who) return who;
  const store = deps.invoices;
  if (!store) return { status: 500, body: { error: "Invoicing is not set up" } };
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const bad = (error: string): ApiResponse => ({ status: 400, body: { error } });

  if (p.action === "list") {
    if (!validDate(p.from) || !validDate(p.to) || p.to < p.from) return bad("from and to must be dates, in order");
    if (Date.parse(p.to) - Date.parse(p.from) > MAX_INVOICE_DAYS * DAY_MS) return bad(`At most ${MAX_INVOICE_DAYS} days at a time`);
    return { status: 200, body: { entries: await store.list(p.from, p.to) } };
  }

  if (p.action === "set") {
    const { date, clientKey, clientName, invoiced, minutes, amount, timesheetIds } = p;
    if (!validDate(date)) return bad("date must be YYYY-MM-DD");
    if (typeof clientKey !== "string" || !clientKey || clientKey.length > 200) return bad("clientKey is required");
    if (typeof clientName !== "string" || !clientName.trim() || clientName.length > 200) return bad("clientName is required");
    if (typeof invoiced !== "boolean") return bad("invoiced must be true or false");
    const count = (x: unknown) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < 1e7;
    if (!count(minutes) || !count(amount)) return bad("minutes and amount must be numbers");
    if (!Array.isArray(timesheetIds) || timesheetIds.length > 500 || !timesheetIds.every(isId))
      return bad("timesheetIds must be a list of ids");
    const entry: Invoiced = {
      id: invoiceId(date, clientKey),
      date,
      clientKey,
      clientName: clientName.trim(),
      invoiced,
      minutes: minutes as number,
      amount: amount as number,
      timesheetIds: timesheetIds as string[],
      updatedAt: (deps.now ?? Date.now)(),
      updatedBy: who.email,
    };
    await store.put(entry);
    return { status: 200, body: { entry } };
  }

  return bad("Unknown action");
}
