// Who is signed in, and what they may use (decision 0037). Two kinds of people:
//  - office: on the office list (Deps.editors), signed in with Google. Every route, as before there were roles.
//  - cleaner: an active person in Camelo, known by the email Camelo holds for them, and let in by the
//    switch (Deps.staff). They sign in with Google or with a 6-digit code emailed by Camelo (decision 0045).
//    Only the few routes that say so with requireStaff.
// A route says which it is for by the check it calls. There is no third check: a new route has to choose.
import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import type { ApiRequest, ApiResponse, Deps } from "./api.js";
import { camelo } from "./camelo.js";

/** Someone the server has let in. */
export type Who = { email: string; role: "office" } | { email: string; role: "cleaner"; employeeId: string; name: string };

/** One person in Camelo, as far as deciding who is who needs. */
export interface Person {
  id: string;
  name: string | null;
  email: string | null;
  state: string;
}

const SESSION_HKDF_INFO = "fnc-schedule-cleaner-session-token-v1";
export const CLEANER_SESSION_TTL_MS = 30 * 86_400_000;

function sessionKey(camelToken: string): Buffer {
  if (!camelToken) throw new Error("CAMELO_TOKEN is required to sign cleaner session tokens");
  return Buffer.from(hkdfSync("sha256", camelToken, "cleaner-session", SESSION_HKDF_INFO, 32));
}

/** Issues a 30-day signed cleaner session token (`c1.<payloadB64Url>.<hmacB64Url>`) after Camelo verifies their emailed code. */
export function signCleanerSession(email: string, employeeId: string, expSec: number, camelToken: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email: email.trim().toLowerCase(), sub: employeeId, exp: Math.floor(expSec) }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", sessionKey(camelToken)).update(`c1.${payload}`).digest("base64url");
  return `c1.${payload}.${sig}`;
}

/** Verifies a `c1.` cleaner session token and returns its `{ email, employeeId }`, or `null` if invalid or expired. */
export function verifyCleanerSession(token: string, camelToken: string, nowMs = Date.now()): { email: string; employeeId: string } | null {
  if (!token.startsWith("c1.") || !camelToken) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, payloadB64, sigB64] = parts;
  try {
    const expected = createHmac("sha256", sessionKey(camelToken)).update(`c1.${payloadB64}`).digest();
    const actual = Buffer.from(sigB64, "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      email?: unknown;
      sub?: unknown;
      exp?: unknown;
    };
    if (typeof parsed.email !== "string" || !parsed.email || typeof parsed.sub !== "string" || !parsed.sub) return null;
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp) || parsed.exp * 1000 <= nowMs) return null;
    return { email: parsed.email, employeeId: parsed.sub };
  } catch {
    return null;
  }
}

const PEOPLE_QUERY =
  "query($after: String) { users(first: 100, after: $after) { pageInfo { hasNextPage endCursor } nodes { id name email state } } }";

/** Everyone in Camelo, active or not. Throws if Camelo cannot be asked. */
async function loadPeople(deps: Deps): Promise<Person[]> {
  type Page = { users: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Person[] } };
  const people: Person[] = [];
  let after: string | null = null;
  for (;;) {
    const data: Page = await camelo<Page>(deps, PEOPLE_QUERY, { after });
    people.push(...data.users.nodes);
    if (!data.users.pageInfo.hasNextPage) return people;
    // "more to come" with nowhere to go on from, or far more pages than a company has people: not a list to trust
    if (!data.users.pageInfo.endCursor || people.length > 5000) throw new Error("Camelo's list of people could not be read to the end");
    after = data.users.pageInfo.endCursor;
  }
}

/**
 * Camelo's list of people, kept for ten minutes in this instance's memory, so that a signed-in cleaner does not
 * cost Camelo a request on every page. Someone made inactive in Camelo loses their way in within that time. A
 * failed read is not kept: the next request asks again.
 */
export class PeopleCache {
  private held: { at: number; people: Promise<Person[]> } | null = null;
  constructor(
    private ttlMs = 10 * 60_000,
    private now: () => number = Date.now,
  ) {}

  get(load: () => Promise<Person[]>): Promise<Person[]> {
    const t = this.now();
    if (this.held && t - this.held.at < this.ttlMs) return this.held.people;
    const entry = { at: t, people: load() };
    this.held = entry;
    entry.people.catch(() => this.held === entry && (this.held = null));
    return entry.people;
  }
}

const same = (a: string | null | undefined, b: string) => (a ?? "").trim().toLowerCase() === b;

/**
 * Normalized office role stored on an `admins/{email}` allowlist doc (matches `functions/src/lib/roles.ts`).
 * Legacy docs with no role or `'admin'` read as `'owner'`; only `'owner'` and `'manager'` grant office access.
 */
export function allowlistOfficeRole(doc: { role?: unknown } | undefined): "owner" | "manager" | null {
  if (!doc) return null;
  const raw = doc.role === undefined || doc.role === null || doc.role === "admin" ? "owner" : doc.role;
  return raw === "owner" || raw === "manager" ? raw : null;
}

/** A POST with a sign-in the server vouches for (Firebase Auth ID token or `c1.` cleaner session token), or the refusal (405, 401). */
async function signedIn(
  req: ApiRequest,
  deps: Deps,
): Promise<{ email: string; via: "auth"; role?: unknown } | { email: string; via: "code"; employeeId: string } | ApiResponse> {
  if (req.method !== "POST") return { status: 405, body: { error: "Use POST" } };
  const tok = req.googleToken ?? "";
  if (tok.startsWith("c1.")) {
    const cleaner = verifyCleanerSession(tok, deps.camelToken, (deps.now ?? Date.now)());
    if (!cleaner) {
      return { status: 401, body: { error: "Your sign-in has expired. Sign in again to continue.", reason: "not_signed_in" } };
    }
    return { email: cleaner.email, via: "code", employeeId: cleaner.employeeId };
  }
  if (deps.verifyAuth) {
    const verified = await deps.verifyAuth(tok).catch(() => null);
    if (!verified?.email) {
      return { status: 401, body: { error: "Sign in with Google to continue.", reason: "not_signed_in" } };
    }
    return { email: verified.email.trim().toLowerCase(), via: "auth", role: verified.role };
  }
  if (!deps.verifyGoogle) {
    return { status: 401, body: { error: "Sign in with Google to continue.", reason: "not_signed_in" } };
  }
  const email = await deps.verifyGoogle(tok).catch(() => null);
  if (!email) {
    return { status: 401, body: { error: "Sign in with Google to continue.", reason: "not_signed_in" } };
  }
  return { email, via: "auth" };
}

/**
 * Checks whether `email` currently holds an Owner or Manager office seat.
 * In production (ADR-022 / P3-E41 Strategy 2), reads `admins/{email}` via `deps.resolveOfficeAllowlist`
 * so pre-approved Managers get immediate access and removed accounts lose access immediately.
 */
async function isOfficeEmail(email: string, deps: Deps): Promise<boolean> {
  const key = email.trim().toLowerCase();
  if (!key) return false;
  if (deps.resolveOfficeAllowlist) {
    const role = await deps.resolveOfficeAllowlist(key);
    return role === "owner" || role === "manager";
  }
  return (deps.editors ?? [])
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(key);
}

const notOnTheList = (email: string): ApiResponse => ({
  status: 403,
  body: { error: `${email} is not on the list of people who can use this site.`, reason: "not_editor", email },
});

/**
 * Checks whether `email` belongs to an active cleaner in Camelo who is allowed by `SCHEDULE_STAFF` and is NOT
 * on the office list (office accounts always sign in with Firebase Auth / Google). Used both by `requireStaff`
 * and before asking Camelo to email a 6-digit sign-in code.
 */
export async function resolveActiveCleaner(
  email: string,
  deps: Deps,
): Promise<{ email: string; role: "cleaner"; employeeId: string; name: string } | ApiResponse> {
  const key = email.trim().toLowerCase();
  // an address that is blank could otherwise match a person Camelo holds no address for
  if (!key) return notOnTheList(email);
  if (await isOfficeEmail(key, deps)) return notOnTheList(email);
  const staff = (deps.staff ?? "").trim().toLowerCase();
  if (!staff || staff === "off") return notOnTheList(email);
  if (staff !== "*" && !staff.split(",").some((e) => e.trim() === key)) return notOnTheList(email);

  let people: Person[];
  try {
    people = await (deps.people ? deps.people.get(() => loadPeople(deps)) : loadPeople(deps));
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not check with Camelo who you are. Try again in a moment." } };
  }
  const matches = people.filter((p) => p.state === "ACTIVE" && same(p.email, key));
  if (matches.length > 1) console.warn(`Sign-in refused: ${matches.length} active people in Camelo share one email address`);
  if (matches.length !== 1) return notOnTheList(email);
  return { email, role: "cleaner", employeeId: matches[0].id, name: matches[0].name || "Unnamed employee" };
}

/**
 * A POST with a Firebase Auth sign-in by an Owner or Manager (`admins/{email}`). Returns their email, or the refusal.
 * 401 means sign in (again): no token, or one that has expired. 403 means signed in but not an office Owner/Manager,
 * which is what a cleaner, supervisor, staff, customer, or revoked manager gets from every office route.
 * A `c1.` cleaner session token is never accepted for the office. It never asks Camelo anything.
 */
export async function requireOffice(req: ApiRequest, deps: Deps): Promise<{ email: string } | ApiResponse> {
  const who = await signedIn(req, deps);
  if ("status" in who) return who;
  if (who.via !== "auth") return notOnTheList(who.email);
  return (await isOfficeEmail(who.email, deps)) ? { email: who.email } : notOnTheList(who.email);
}

/**
 * A POST with a sign-in by an office Owner/Manager (via Firebase Auth) or by a cleaner (via Firebase Auth or a `c1.`
 * cleaner session token). Returns who they are, or the refusal. Office users are office only when signed in via
 * Firebase Auth, and Camelo is not asked. Anyone else is a cleaner only if the switch lets them in and their email
 * is that of exactly one active person in Camelo. If Camelo cannot be asked, nobody is let in as a cleaner (502).
 */
export async function requireStaff(req: ApiRequest, deps: Deps): Promise<Who | ApiResponse> {
  const who = await signedIn(req, deps);
  if ("status" in who) return who;
  if (who.via === "auth" && (await isOfficeEmail(who.email, deps))) return { email: who.email, role: "office" };
  const cleaner = await resolveActiveCleaner(who.email, deps);
  if ("status" in cleaner) return cleaner;
  if (who.via === "code" && cleaner.employeeId !== who.employeeId) return notOnTheList(who.email);
  return cleaner;
}
