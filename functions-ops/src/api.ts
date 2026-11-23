// What every route shares: the request and the answer, what a handler is given to work with,
// and the short cache for Camelo reads. Who may use a route is in who.ts.
import type {
  ChangeLog,
  CleanerTokenStore,
  ClientRateStore,
  FeedbackStore,
  InvoiceStore,
  LiveHandledStore,
  PhotoFiles,
  VisitPhotoStore,
  PlaceStore,
  SettingsStore,
  SnapshotStore,
  SoloOkStore,
} from "./stores.js";
import type { PeopleCache } from "./who.js";

/** Verified caller identity returned by Firebase Auth ID token verification (ADR-022 / P3-E41 Strategy 2). */
export interface VerifiedAuth {
  email: string;
  role?: unknown;
}

export type OfficeAllowlistRole = "owner" | "manager";

export interface Deps {
  camelToken: string;
  /**
   * Verifies a Fresh Nest Firebase ID token (`freshnest-aa51e`) and returns its verified email & custom role claim.
   * Preferred in production (ADR-022 / P3-E41 Strategy 2).
   */
  verifyAuth?: (idToken: string) => Promise<VerifiedAuth | null>;
  /**
   * Live lookup against `admins/{email}` in Firestore (`owner` or `manager`, or `null` if absent/revoked).
   * Gives immediate access to pre-approved Managers and immediate revocation when removed in Team & Roles.
   */
  resolveOfficeAllowlist?: (email: string) => Promise<OfficeAllowlistRole | null>;
  /** Legacy/test verifier returning a verified email address, or null (used by unit tests when verifyAuth is unset). */
  verifyGoogle?: (idToken: string) => Promise<string | null>;
  /** Legacy/test office email allowlist (used only when resolveOfficeAllowlist is unset). */
  editors?: string[];
  changeLog?: ChangeLog;
  feedback?: FeedbackStore;
  invoices?: InvoiceStore;
  clientRates?: ClientRateStore;
  soloOk?: SoloOkStore;
  liveHandled?: LiveHandledStore;
  /** Photos of clients' homes on visits (decision 0044): the records, and the pictures in this app's private bucket. */
  visitPhotos?: VisitPhotoStore;
  photoFiles?: PhotoFiles;
  /** Encrypted Camelo tokens for cleaners who have connected their account once (decision 0044). */
  cleanerTokens?: CleanerTokenStore;
  places?: PlaceStore;
  snapshots?: SnapshotStore;
  settings?: SettingsStore;
  /** Milliseconds to wait between address lookups (tests pass 0). */
  geocodeGapMs?: number;
  now?: () => number;
  fetchImpl?: typeof fetch;
  /** Trial (plan item 1.2.5): answers to Camelo reads, kept for a minute. Without one, every read goes to Camelo. */
  readCache?: ReadCache;
  /**
   * Who, beyond the office list, is let in as a cleaner (decision 0037). Empty or "off": nobody, and the site
   * behaves as it did before there were roles. "*": every active person in Camelo. Otherwise a comma-separated
   * list of email addresses, each of whom must also be an active person in Camelo.
   */
  staff?: string;
  /** Camelo's list of people, kept for a few minutes. Without one it is read each time it is needed. */
  people?: PeopleCache;
  /** The commit this build was made from, for `/api/health`. Set at a deploy; absent in dev and in tests. */
  build?: string;
  /** Where a fault reported by the browser is written (tests read it); the function's log when not given. */
  logBrowserError?: (entry: BrowserError) => void;
}

/**
 * Answers to the three Camelo reads (a week of shifts, a week of timesheets, a pay period for
 * review), kept for a short while in this instance's memory, so that two people opening the
 * same period, or one person reloading the page, cost Camelo one set of requests and not two.
 * Only good answers are kept. A change made through the site empties it. It is per instance,
 * so with two instances running it helps without being a guarantee, and a change made in
 * Camelo itself shows up to `ttlMs` late.
 */
export class ReadCache {
  private held = new Map<string, { at: number; answer: Promise<ApiResponse> }>();
  constructor(
    private ttlMs = 60_000,
    private now: () => number = Date.now,
  ) {}

  /** The answer for `key`: the one held if it is recent enough, otherwise from `load`. */
  get(key: string, load: () => Promise<ApiResponse>): Promise<ApiResponse> {
    const t = this.now();
    for (const [k, v] of this.held) if (t - v.at >= this.ttlMs) this.held.delete(k);
    const hit = this.held.get(key);
    if (hit) return hit.answer;
    const answer = load();
    const entry = { at: t, answer };
    this.held.set(key, entry);
    // an answer that is not a good one is not kept: the next request asks Camelo again
    const drop = () => this.held.get(key) === entry && this.held.delete(key);
    answer.then((r) => r.status !== 200 && drop(), drop);
    return answer;
  }

  clear(): void {
    this.held.clear();
  }
}
/** A Camelo read, through the cache when there is one. Call it only after the sign-in check. */
export const read = (deps: Deps, key: string, load: () => Promise<ApiResponse>) =>
  deps.readCache ? deps.readCache.get(key, load) : load();

/** A fault in the site, as reported by the browser of someone signed in. */
export interface BrowserError {
  email: string;
  /** The report that was open. */
  view: string | null;
  /** Where it was caught: while drawing, by the window, or as a promise nobody handled. */
  source: string | null;
  message: string;
  stack: string | null;
  componentStack: string | null;
}

export interface ApiRequest {
  method: string;
  /** Request path; anything ending in /timesheets is the payroll route. */
  path?: string;
  weekStart?: unknown;
  periodStart?: unknown;
  /** Google ID token of the person signed in. Every route but /health needs one. */
  googleToken?: string;
  action?: unknown;
  refresh?: unknown;
  timesheetIds?: unknown;
  /** For editing one entry's times, adding a new one, or leaving a note on one. */
  timesheetId?: unknown;
  content?: unknown;
  from?: unknown;
  to?: unknown;
  employeeId?: unknown;
  groupId?: unknown;
  clientId?: unknown;
  jobSiteId?: unknown;
  /** The whole request body, for routes that take a structured entry (feedback). */
  payload?: unknown;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}
