// The site's own records in Firestore: the stores the Cloud Function is given (index.ts).
// Tested against the Firestore emulator (src/emulator/firestore.test.ts), never the real project.
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import {
  type ChangeEntry,
  type ChangeLog,
  type CleanerToken,
  type CleanerTokenStore,
  type ClientRate,
  type ClientRateStore,
  type Feedback,
  type FeedbackStore,
  type GraceSetting,
  type InvoiceStore,
  type Invoiced,
  type LiveHandled,
  type LiveHandledStore,
  type PeriodSnapshot,
  type Place,
  type PlaceStore,
  type RateRule,
  type SettingsStore,
  type SnapshotStore,
  type SoloOk,
  type SoloOkStore,
  type VisitPhoto,
  type VisitPhotoStore,
  clientRateId,
  withRule,
} from "./stores.js";

// Own collections, written only through the Admin SDK (which bypasses security
// rules), so the project's existing Firestore data and rules are untouched.
const LOG_COLLECTION = "scheduleChangeLog";

// Ontario's Employment Standards Act has employers keep records of hours for three
// years; a TTL policy on expireAt (see docs/operations.md) deletes entries after that.
export const LOG_KEEP_MS = 3 * 365 * 86_400_000;

/** A log entry as stored: the entry, plus fields for the period query and for TTL. */
type StoredEntry = ChangeEntry & { sheetFromMs?: number | null; expireAt?: Timestamp };

export class FirestoreLog implements ChangeLog {
  private col = getFirestore().collection(LOG_COLLECTION);

  async write(entry: ChangeEntry): Promise<void> {
    const stored: StoredEntry = {
      ...entry,
      sheetFromMs: entry.sheetFrom ? Date.parse(entry.sheetFrom) : null,
      expireAt: Timestamp.fromMillis(entry.at + LOG_KEEP_MS),
    };
    await this.col.add(stored);
  }

  async list(from: string, to: string): Promise<ChangeEntry[]> {
    const [lo, hi] = [Date.parse(from), Date.parse(to)];
    // One range on one field: Firestore's automatic index covers it, so nothing to deploy.
    const fresh = this.col.where("sheetFromMs", ">=", lo).where("sheetFromMs", "<", hi).limit(1000).get();
    // Entries written before sheetFromMs existed, found the old way (a scan of the newest).
    // They stop mattering once no one opens a period that old.
    const legacy = this.col
      .where("at", ">=", lo - 400 * 86_400_000)
      .orderBy("at", "desc")
      .limit(1000)
      .get();
    const byId = new Map<string, ChangeEntry>();
    for (const d of (await fresh).docs) byId.set(d.id, plain(d.data() as StoredEntry));
    for (const d of (await legacy).docs) {
      const e = d.data() as StoredEntry;
      if (e.sheetFromMs === undefined && e.sheetFrom && Date.parse(e.sheetFrom) >= lo && Date.parse(e.sheetFrom) < hi)
        byId.set(d.id, plain(e));
    }
    return [...byId.values()].sort((a, b) => b.at - a.at).slice(0, 200);
  }
}

/** The entry without its storage-only fields. */
function plain({ sheetFromMs: _ms, expireAt: _exp, ...entry }: StoredEntry): ChangeEntry {
  return entry;
}

const FEEDBACK_COLLECTION = "scheduleFeedback";

// Client kudos and complaints. Like the change log, only this function touches it.
export class FirestoreFeedback implements FeedbackStore {
  private col = getFirestore().collection(FEEDBACK_COLLECTION);

  async create(entry: Omit<Feedback, "id">): Promise<Feedback> {
    const ref = await this.col.add(entry);
    return { ...entry, id: ref.id };
  }

  async get(id: string): Promise<Feedback | null> {
    const doc = await this.col.doc(id).get();
    return doc.exists ? { ...(doc.data() as Omit<Feedback, "id">), id: doc.id } : null;
  }

  async update(id: string, patch: Partial<Omit<Feedback, "id">>): Promise<void> {
    await this.col.doc(id).update(patch);
  }

  async list(from: string, to: string): Promise<Feedback[]> {
    // one range on one field, so the automatic single-field index is enough
    const snap = await this.col.where("date", ">=", from).where("date", "<=", to).limit(5000).get();
    return snap.docs.map((d) => ({ ...(d.data() as Omit<Feedback, "id">), id: d.id }));
  }
}

const INVOICE_COLLECTION = "scheduleInvoiced";

// Which client-days have been invoiced; one document per client per day.
export class FirestoreInvoices implements InvoiceStore {
  private col = getFirestore().collection(INVOICE_COLLECTION);

  async list(from: string, to: string): Promise<Invoiced[]> {
    // one range on one field, so the automatic single-field index is enough
    const snap = await this.col.where("date", ">=", from).where("date", "<=", to).limit(5000).get();
    return snap.docs.map((d) => d.data() as Invoiced);
  }

  async put(entry: Invoiced): Promise<void> {
    await this.col.doc(entry.id).set(entry);
  }
}

const CLIENT_RATE_COLLECTION = "scheduleClientRates";

// What each client is billed, and from when; one document per client (decision 0024).
export class FirestoreClientRates implements ClientRateStore {
  private col = getFirestore().collection(CLIENT_RATE_COLLECTION);

  async list(): Promise<ClientRate[]> {
    const snap = await this.col.limit(5000).get();
    return snap.docs.map((d) => d.data() as ClientRate);
  }

  // in a transaction, so two people setting prices for one client at once cannot lose one
  async add(clientKey: string, clientName: string, rule: RateRule): Promise<ClientRate> {
    const ref = this.col.doc(clientRateId(clientKey));
    return getFirestore().runTransaction(async (tx) => {
      const held = await tx.get(ref);
      const rate = withRule(held.exists ? (held.data() as ClientRate) : null, clientKey, clientName, rule);
      tx.set(ref, rate);
      return rate;
    });
  }
}

const SOLO_OK_COLLECTION = "scheduleSoloOk";

// Solo visits marked OK on the schedule check; one document per shift.
export class FirestoreSoloOk implements SoloOkStore {
  private col = getFirestore().collection(SOLO_OK_COLLECTION);

  async list(from: string, to: string): Promise<SoloOk[]> {
    // one range on one field, so the automatic single-field index is enough
    const snap = await this.col.where("date", ">=", from).where("date", "<=", to).limit(5000).get();
    return snap.docs.map((d) => d.data() as SoloOk);
  }

  async put(entry: SoloOk): Promise<void> {
    await this.col.doc(entry.shiftId).set(entry);
  }
}

const LIVE_HANDLED_COLLECTION = "scheduleLiveHandled";

// Red visits on the live board marked handled; one document per shift.
export class FirestoreLiveHandled implements LiveHandledStore {
  private col = getFirestore().collection(LIVE_HANDLED_COLLECTION);

  async list(from: string, to: string): Promise<LiveHandled[]> {
    // one range on one field, so the automatic single-field index is enough
    const snap = await this.col.where("date", ">=", from).where("date", "<=", to).limit(5000).get();
    return snap.docs.map((d) => d.data() as LiveHandled);
  }

  async put(entry: LiveHandled): Promise<void> {
    await this.col.doc(entry.shiftId).set(entry);
  }
}

const VISIT_PHOTO_COLLECTION = "scheduleVisitPhotos";

// Photos of clients' homes on a visit (decision 0044): one document per photo; the picture is in the bucket.
// `expireAt` is a Date for Firestore's TTL policy, as the change log's is.
export class FirestoreVisitPhotos implements VisitPhotoStore {
  private col = getFirestore().collection(VISIT_PHOTO_COLLECTION);

  async list(shiftIds: string[]): Promise<VisitPhoto[]> {
    const out: VisitPhoto[] = [];
    // "in" takes at most 30 values
    for (let i = 0; i < shiftIds.length; i += 30) {
      const snap = await this.col.where("shiftId", "in", shiftIds.slice(i, i + 30)).get();
      out.push(...snap.docs.map((d) => fromDoc(d.data())));
    }
    return out.sort((a, b) => a.takenAt - b.takenAt);
  }

  async get(id: string): Promise<VisitPhoto | null> {
    const doc = await this.col.doc(id).get();
    return doc.exists ? fromDoc(doc.data()!) : null;
  }

  async add(photo: VisitPhoto): Promise<void> {
    await this.col.doc(photo.id).set({ ...photo, expireAt: new Date(photo.expireAt) });
  }

  async remove(id: string): Promise<void> {
    await this.col.doc(id).delete();
  }
}

const fromDoc = (d: FirebaseFirestore.DocumentData): VisitPhoto => ({
  ...(d as VisitPhoto),
  expireAt:
    d.expireAt instanceof Date ? d.expireAt.getTime() : typeof d.expireAt?.toMillis === "function" ? d.expireAt.toMillis() : d.expireAt,
});

const CLEANER_TOKEN_COLLECTION = "scheduleCleanerTokens";

// Each cleaner's encrypted Camelo token for clocking in and out (decision 0044); one document per employeeId.
// `expireAt` is stored as a Date for Firestore's TTL policy.
export class FirestoreCleanerTokens implements CleanerTokenStore {
  private col = getFirestore().collection(CLEANER_TOKEN_COLLECTION);

  async get(employeeId: string): Promise<CleanerToken | null> {
    const doc = await this.col.doc(employeeId).get();
    return doc.exists ? tokenFromDoc(doc.data()!) : null;
  }

  async put(token: CleanerToken): Promise<void> {
    await this.col.doc(token.employeeId).set({ ...token, expireAt: new Date(token.expireAt) });
  }

  async remove(employeeId: string): Promise<void> {
    await this.col.doc(employeeId).delete();
  }
}

const tokenFromDoc = (d: FirebaseFirestore.DocumentData): CleanerToken => ({
  ...(d as CleanerToken),
  expireAt:
    d.expireAt instanceof Date ? d.expireAt.getTime() : typeof d.expireAt?.toMillis === "function" ? d.expireAt.toMillis() : d.expireAt,
});

const SNAPSHOT_COLLECTION = "scheduleSnapshots";

// Each finished pay period's figures, for the dashboard's trends; one document per period.
export class FirestoreSnapshots implements SnapshotStore {
  private col = getFirestore().collection(SNAPSHOT_COLLECTION);

  async list(from: string, to: string): Promise<PeriodSnapshot[]> {
    // one range on one field, so the automatic single-field index is enough
    const snap = await this.col.where("periodStart", ">=", from).where("periodStart", "<=", to).limit(500).get();
    return snap.docs.map((d) => d.data() as PeriodSnapshot);
  }

  async put(snapshot: PeriodSnapshot): Promise<void> {
    await this.col.doc(snapshot.periodStart).set(snapshot);
  }
}

const PLACE_COLLECTION = "schedulePlaces";

// Where each job-site address is, looked up once. The document id is a hash of the
// address, since an address can hold characters a document id cannot.
export class FirestorePlaces implements PlaceStore {
  private col = getFirestore().collection(PLACE_COLLECTION);
  private ref = (key: string) => this.col.doc(createHash("sha256").update(key).digest("hex"));

  async get(keys: string[]): Promise<Place[]> {
    if (!keys.length) return [];
    const docs = await getFirestore().getAll(...keys.map(this.ref));
    return docs.filter((d) => d.exists).map((d) => d.data() as Place);
  }

  async put(place: Place): Promise<void> {
    await this.ref(place.key).set(place);
  }
}

const SETTINGS_COLLECTION = "scheduleSettings";
const GRACE_DOC = "grace";

// System-wide settings: the shared punctuality & live board grace; one document per setting.
export class FirestoreSettings implements SettingsStore {
  private col = getFirestore().collection(SETTINGS_COLLECTION);

  async getGrace(): Promise<GraceSetting> {
    const doc = await this.col.doc(GRACE_DOC).get();
    if (!doc.exists) return { minutes: 15, updatedAt: null, updatedBy: null };
    const data = doc.data() as { minutes?: number; updatedAt?: number; updatedBy?: string };
    return {
      minutes: typeof data.minutes === "number" ? data.minutes : 15,
      updatedAt: data.updatedAt ?? null,
      updatedBy: data.updatedBy ?? null,
    };
  }

  async setGrace(minutes: number, by: string): Promise<GraceSetting> {
    const setting: GraceSetting = { minutes, updatedAt: Date.now(), updatedBy: by };
    await this.col.doc(GRACE_DOC).set(setting);
    return setting;
  }
}
