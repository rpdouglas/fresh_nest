// What the site keeps of its own: each record, the store it is kept in, and the in-memory
// stores for the dev server and tests. The Firestore ones are in firestore.ts.

/** One line of the change log: who did what to which timesheet, and how it went. */
export interface ChangeEntry {
  at: number;
  email: string;
  action: string;
  timesheetId: string;
  employee: string | null;
  /** Start of the timesheet, so the log can be listed per pay period. */
  sheetFrom: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ok: boolean;
  message: string | null;
}

export interface ChangeLog {
  write(entry: ChangeEntry): Promise<void>;
  /** Entries for timesheets starting in [from, to), newest first. */
  list(from: string, to: string): Promise<ChangeEntry[]>;
}

/** One piece of client feedback about a job, or about a client in general. */
export interface Feedback {
  id: string;
  type: "kudos" | "complaint";
  /** YYYY-MM-DD: the visit's local day, or the day chosen when there is no visit. */
  date: string;
  visitStart: string | null;
  visitEnd: string | null;
  timesheetIds: string[];
  clientKey: string | null;
  clientName: string;
  siteName: string | null;
  /** Who the feedback counts for. */
  cleaners: { id: string; name: string }[];
  text: string;
  source: string;
  category: string;
  /** Complaints only. */
  status: "open" | "resolved" | null;
  resolution: string | null;
  createdAt: number;
  createdBy: string;
  updatedAt: number | null;
  updatedBy: string | null;
  /** Set when removed; the entry stays in the store but is no longer listed. */
  removedAt: number | null;
  removedBy: string | null;
  /** Kudos only: when, and by whom, it was passed on to the cleaners. Absent on older entries. */
  passedOnAt?: number | null;
  passedOnBy?: string | null;
}

export interface FeedbackStore {
  create(entry: Omit<Feedback, "id">): Promise<Feedback>;
  get(id: string): Promise<Feedback | null>;
  update(id: string, patch: Partial<Omit<Feedback, "id">>): Promise<void>;
  /** Entries dated from..to inclusive (YYYY-MM-DD), removed ones included. */
  list(from: string, to: string): Promise<Feedback[]>;
}

/**
 * Whether one client's billable time on one day has been invoiced. What was
 * invoiced is kept (hours, amount, timesheets) so later changes can be spotted.
 */
export interface Invoiced {
  /** `${date}|${clientKey}`; see invoiceId. */
  id: string;
  date: string;
  clientKey: string;
  clientName: string;
  invoiced: boolean;
  /** Billable minutes and dollars when it was ticked. */
  minutes: number;
  amount: number;
  timesheetIds: string[];
  updatedAt: number;
  updatedBy: string;
}

export interface InvoiceStore {
  /** Records dated from..to inclusive (YYYY-MM-DD). */
  list(from: string, to: string): Promise<Invoiced[]>;
  /** Creates or replaces the record with this id. */
  put(entry: Invoiced): Promise<void>;
}

/** One record per client per day, so ticking twice cannot make two. */
export const invoiceId = (date: string, clientKey: string) => `${date}|${encodeURIComponent(clientKey)}`;

/**
 * What one client is billed, from a day onwards (decision 0024). `hourly` is dollars an hour for
 * each visit; `flat` is dollars for each visit, whatever its length. A client with no rule in
 * force on a day is billed the default (web/src/lib/billing.ts, where the prices are applied).
 */
export interface RateRule {
  /** The first day the price applies, YYYY-MM-DD. */
  from: string;
  kind: "hourly" | "flat";
  dollars: number;
  setAt: number;
  setBy: string;
}

/** One client's prices, oldest first. Nothing is removed: the list is the record of what was charged when. */
export interface ClientRate {
  clientKey: string;
  clientName: string;
  rules: RateRule[];
}

export interface ClientRateStore {
  list(): Promise<ClientRate[]>;
  /** Adds a rule to a client's list (see withRule) and returns the list as saved. */
  add(clientKey: string, clientName: string, rule: RateRule): Promise<ClientRate>;
}

/** One document per client. */
export const clientRateId = (clientKey: string) => encodeURIComponent(clientKey);

/** A client's prices with one more: a rule starting the same day replaces the one there. */
export function withRule(existing: ClientRate | null, clientKey: string, clientName: string, rule: RateRule): ClientRate {
  const rules = [...(existing?.rules ?? []).filter((r) => r.from !== rule.from), rule].sort((a, b) => a.from.localeCompare(b.from));
  return { clientKey, clientName, rules };
}

/** A solo visit marked OK on the dashboard's schedule check; one record per shift. */
export interface SoloOk {
  shiftId: string;
  /** The visit's day, YYYY-MM-DD, so a range can be listed. */
  date: string;
  ok: boolean;
  updatedAt: number;
  updatedBy: string;
}

export interface SoloOkStore {
  /** Records dated from..to inclusive (YYYY-MM-DD). */
  list(from: string, to: string): Promise<SoloOk[]>;
  /** Creates or replaces the record for this shift. */
  put(entry: SoloOk): Promise<void>;
}

/** A red visit on the live board marked handled; one record per shift. */
export interface LiveHandled {
  shiftId: string;
  /** The visit's day, YYYY-MM-DD, so a range can be listed. */
  date: string;
  handled: boolean;
  updatedAt: number;
  updatedBy: string;
}

export interface LiveHandledStore {
  /** Records dated from..to inclusive (YYYY-MM-DD). */
  list(from: string, to: string): Promise<LiveHandled[]>;
  /** Creates or replaces the record for this shift. */
  put(entry: LiveHandled): Promise<void>;
}

/** A photo of a client's home on a visit (decision 0044): the record; the picture is in `PhotoFiles` at `path`. */
export interface VisitPhoto {
  id: string;
  /** The visit (a shift id). A partner's photos are on their own shift. */
  shiftId: string;
  kind: "before" | "after";
  takenAt: number;
  /** The email of whoever added it. */
  takenBy: string;
  /** Where the picture is in the bucket. */
  path: string;
  /** When it is deleted by itself: one year after it was taken (a TTL in Firestore, a lifecycle rule on the bucket). */
  expireAt: number;
}

export interface VisitPhotoStore {
  /** The photos on these visits. */
  list(shiftIds: string[]): Promise<VisitPhoto[]>;
  get(id: string): Promise<VisitPhoto | null>;
  add(photo: VisitPhoto): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Where the pictures themselves are: this app's private bucket, never public. */
export interface PhotoFiles {
  save(path: string, bytes: Buffer, contentType: string): Promise<void>;
  read(path: string): Promise<Buffer>;
  remove(path: string): Promise<void>;
}

/** A cleaner's encrypted Camelo token, for clocking in and out on their own visits (decision 0044). */
export interface CleanerToken {
  employeeId: string;
  email: string;
  ciphertext: string;
  iv: string;
  tag: string;
  connectedAt: number;
  /** When the Camelo token expires (ms since epoch); stored as a Date in Firestore for TTL. */
  expireAt: number;
}

export interface CleanerTokenStore {
  get(employeeId: string): Promise<CleanerToken | null>;
  put(token: CleanerToken): Promise<void>;
  remove(employeeId: string): Promise<void>;
}

/**
 * One finished pay period's figures, for the dashboard's trends. The dashboard works
 * them out with the reports' own rules (web/src/lib/trends.ts) and saves them here.
 */
export interface PeriodSnapshot {
  /** Bumped when the rules behind the figures change, so old ones are worked out again. */
  v: number;
  /** The period's Friday, YYYY-MM-DD. */
  periodStart: string;
  /** The period's totals, by name (billed, onTime, noShows, ...): see web/src/lib/trends.ts. */
  totals: Record<string, number>;
  cleaners: ({ id: string; name: string } & Record<string, string | number>)[];
  clients: ({ key: string; name: string } & Record<string, string | number>)[];
  savedAt: number;
  savedBy: string;
}

export interface SnapshotStore {
  /** Snapshots for periods starting from..to inclusive (YYYY-MM-DD). */
  list(from: string, to: string): Promise<PeriodSnapshot[]>;
  /** Creates or replaces the snapshot for its period. */
  put(snapshot: PeriodSnapshot): Promise<void>;
}

/** Where an address is, or that it could not be found (lat and lon null). */
export interface Place {
  /** The address, trimmed, single-spaced and lower-cased: see placeKey. */
  key: string;
  lat: number | null;
  lon: number | null;
  at: number;
}

export interface PlaceStore {
  get(keys: string[]): Promise<Place[]>;
  put(place: Place): Promise<void>;
}

export const placeKey = (address: string) => address.replace(/\s+/g, " ").trim().toLowerCase();

export class MemorySnapshots implements SnapshotStore {
  entries = new Map<string, PeriodSnapshot>();
  async list(from: string, to: string): Promise<PeriodSnapshot[]> {
    return [...this.entries.values()].filter((e) => e.periodStart >= from && e.periodStart <= to);
  }
  async put(snapshot: PeriodSnapshot): Promise<void> {
    this.entries.set(snapshot.periodStart, snapshot);
  }
}

/** In-memory stores for the dev server and tests. */
export class MemorySoloOk implements SoloOkStore {
  entries = new Map<string, SoloOk>();
  async list(from: string, to: string): Promise<SoloOk[]> {
    return [...this.entries.values()].filter((e) => e.date >= from && e.date <= to);
  }
  async put(entry: SoloOk): Promise<void> {
    this.entries.set(entry.shiftId, entry);
  }
}

export class MemoryLiveHandledStore implements LiveHandledStore {
  entries = new Map<string, LiveHandled>();
  async list(from: string, to: string): Promise<LiveHandled[]> {
    return [...this.entries.values()].filter((e) => e.date >= from && e.date <= to);
  }
  async put(entry: LiveHandled): Promise<void> {
    this.entries.set(entry.shiftId, entry);
  }
}

export class MemoryVisitPhotos implements VisitPhotoStore {
  entries = new Map<string, VisitPhoto>();
  async list(shiftIds: string[]): Promise<VisitPhoto[]> {
    return [...this.entries.values()].filter((p) => shiftIds.includes(p.shiftId)).sort((a, b) => a.takenAt - b.takenAt);
  }
  async get(id: string): Promise<VisitPhoto | null> {
    return this.entries.get(id) ?? null;
  }
  async add(photo: VisitPhoto): Promise<void> {
    this.entries.set(photo.id, photo);
  }
  async remove(id: string): Promise<void> {
    this.entries.delete(id);
  }
}

export class MemoryPhotoFiles implements PhotoFiles {
  files = new Map<string, Buffer>();
  async save(path: string, bytes: Buffer): Promise<void> {
    this.files.set(path, bytes);
  }
  async read(path: string): Promise<Buffer> {
    const bytes = this.files.get(path);
    if (!bytes) throw new Error("no such photo");
    return bytes;
  }
  async remove(path: string): Promise<void> {
    this.files.delete(path);
  }
}

export class MemoryCleanerTokens implements CleanerTokenStore {
  entries = new Map<string, CleanerToken>();
  async get(employeeId: string): Promise<CleanerToken | null> {
    return this.entries.get(employeeId) ?? null;
  }
  async put(token: CleanerToken): Promise<void> {
    this.entries.set(token.employeeId, token);
  }
  async remove(employeeId: string): Promise<void> {
    this.entries.delete(employeeId);
  }
}

export class MemoryPlaces implements PlaceStore {
  entries = new Map<string, Place>();
  async get(keys: string[]): Promise<Place[]> {
    return keys.map((k) => this.entries.get(k)).filter((p): p is Place => !!p);
  }
  async put(place: Place): Promise<void> {
    this.entries.set(place.key, place);
  }
}

/** In-memory invoiced ticks for the dev server and tests. */
export class MemoryInvoices implements InvoiceStore {
  entries = new Map<string, Invoiced>();
  async list(from: string, to: string): Promise<Invoiced[]> {
    return [...this.entries.values()].filter((e) => e.date >= from && e.date <= to);
  }
  async put(entry: Invoiced): Promise<void> {
    this.entries.set(entry.id, entry);
  }
}

/** In-memory client prices for the dev server and tests. */
export class MemoryClientRates implements ClientRateStore {
  entries = new Map<string, ClientRate>();
  async list(): Promise<ClientRate[]> {
    return [...this.entries.values()];
  }
  async add(clientKey: string, clientName: string, rule: RateRule): Promise<ClientRate> {
    const rate = withRule(this.entries.get(clientKey) ?? null, clientKey, clientName, rule);
    this.entries.set(clientKey, rate);
    return rate;
  }
}

/** In-memory feedback store for the dev server and tests. */
export class MemoryFeedback implements FeedbackStore {
  entries = new Map<string, Feedback>();
  private next = 1;
  async create(entry: Omit<Feedback, "id">): Promise<Feedback> {
    const made = { ...entry, id: `f${this.next++}` };
    this.entries.set(made.id, made);
    return made;
  }
  async get(id: string): Promise<Feedback | null> {
    return this.entries.get(id) ?? null;
  }
  async update(id: string, patch: Partial<Omit<Feedback, "id">>): Promise<void> {
    const e = this.entries.get(id);
    if (e) this.entries.set(id, { ...e, ...patch });
  }
  async list(from: string, to: string): Promise<Feedback[]> {
    return [...this.entries.values()].filter((e) => e.date >= from && e.date <= to);
  }
}

/** In-memory change log for the dev server and tests. */
export class MemoryLog implements ChangeLog {
  entries: ChangeEntry[] = [];
  async write(entry: ChangeEntry): Promise<void> {
    this.entries.push(entry);
  }
  async list(from: string, to: string): Promise<ChangeEntry[]> {
    const [lo, hi] = [Date.parse(from), Date.parse(to)];
    return this.entries
      .filter((e) => e.sheetFrom && Date.parse(e.sheetFrom) >= lo && Date.parse(e.sheetFrom) < hi)
      .sort((a, b) => b.at - a.at);
  }
}

export interface GraceSetting {
  minutes: number;
  updatedAt: number | null;
  updatedBy: string | null;
}

export interface SettingsStore {
  getGrace(): Promise<GraceSetting>;
  setGrace(minutes: number, by: string): Promise<GraceSetting>;
}

export class MemorySettingsStore implements SettingsStore {
  private grace: GraceSetting = { minutes: 15, updatedAt: null, updatedBy: null };
  async getGrace(): Promise<GraceSetting> {
    return { ...this.grace };
  }
  async setGrace(minutes: number, by: string): Promise<GraceSetting> {
    this.grace = { minutes, updatedAt: Date.now(), updatedBy: by };
    return { ...this.grace };
  }
}
