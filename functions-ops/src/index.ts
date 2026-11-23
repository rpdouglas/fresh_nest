import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { defineSecret } from "firebase-functions/params";
import { error as logError } from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import { readFileSync } from "node:fs";
import { PeopleCache, ReadCache, allowlistOfficeRole, handleApi } from "./core.js";
import type { OfficeAllowlistRole, VerifiedAuth } from "./api.js";
import type { PhotoFiles } from "./stores.js";
import {
  FirestoreCleanerTokens,
  FirestoreClientRates,
  FirestoreFeedback,
  FirestoreInvoices,
  FirestoreLiveHandled,
  FirestoreVisitPhotos,
  FirestoreLog,
  FirestorePlaces,
  FirestoreSettings,
  FirestoreSnapshots,
  FirestoreSoloOk,
} from "./firestore.js";

const CAMELO_TOKEN = defineSecret("CAMELO_TOKEN");

// Who, beyond the office list (`admins/{email}`), is let in as a cleaner: "off", "*" for every active person in
// Camelo, or a comma-separated list of addresses for a trial (decision 0037).
// Office access is controlled by Fresh Nest's `admins/{email}` allowlist (`owner` / `manager`, ADR-017 & ADR-022).
const SCHEDULE_STAFF = defineSecret("SCHEDULE_STAFF");
// Trial (plan item 1.2.5): Camelo reads kept for a minute, in this instance's memory.
const readCache = new ReadCache();
// Camelo's list of people, kept ten minutes, for telling which cleaner has signed in.
const people = new PeopleCache();

/** The commit this build was made from: written beside the built code at a deploy (scripts/stamp-build.mjs). */
function builtFrom(): string | undefined {
  try {
    const { commit } = JSON.parse(readFileSync(new URL("./build.json", import.meta.url), "utf8")) as { commit?: unknown };
    return typeof commit === "string" && commit ? commit : undefined;
  } catch {
    return undefined;
  }
}
const build = builtFrom();

/** Verifies a Fresh Nest (`freshnest-aa51e`) Firebase ID token and returns its verified email & role claim, or null. */
async function verifyAuth(idToken: string): Promise<VerifiedAuth | null> {
  if (!idToken) return null;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    if (decoded.email && decoded.email_verified !== false) {
      return { email: decoded.email.trim().toLowerCase(), role: decoded.role };
    }
    console.warn("Firebase Auth sign-in refused: no verified email on the token");
  } catch (e) {
    console.warn(
      "Firebase Auth sign-in refused:",
      String(e instanceof Error ? e.message : e)
        .split(":")[0]
        .slice(0, 120),
    );
  }
  return null;
}

/** Live check against `admins/{email}` in `freshnest-aa51e` `(default)` for Owner/Manager access & instant revocation. */
async function resolveOfficeAllowlist(email: string): Promise<OfficeAllowlistRole | null> {
  const key = email.trim().toLowerCase();
  if (!key) return null;
  const snap = await getFirestore().collection("admins").doc(key).get();
  return snap.exists ? allowlistOfficeRole(snap.data() as { role?: unknown }) : null;
}

/** This app's private bucket for photos of clients' homes (decision 0044, migrated under ADR-022 / P3-E41); made by hand, with a one-year lifecycle rule. */
const PHOTO_BUCKET = "freshnest-aa51e-schedule-photos";

/** The pictures, kept in the bucket; private, read and written only by this function. */
function bucketFiles(name: string): PhotoFiles {
  const bucket = () => getStorage().bucket(name);
  return {
    save: (path, bytes, contentType) => bucket().file(path).save(bytes, { contentType, resumable: false }),
    read: async (path) => (await bucket().file(path).download())[0],
    remove: async (path) => void (await bucket().file(path).delete({ ignoreNotFound: true })),
  };
}

export const scheduleApi = onRequest(
  { secrets: [CAMELO_TOKEN, SCHEDULE_STAFF], region: "us-central1", maxInstances: 2, timeoutSeconds: 60 },
  async (req, res) => {
    if (!getApps().length) initializeApp();
    const result = await handleApi(
      {
        method: req.method,
        path: req.path,
        weekStart: req.body?.weekStart,
        periodStart: req.body?.periodStart,
        // Not an "x-google-..." name: Google's front end strips those before they reach the function.
        googleToken: req.get("x-editor-token"),
        action: req.body?.action,
        timesheetIds: req.body?.timesheetIds,
        timesheetId: req.body?.timesheetId,
        from: req.body?.from,
        to: req.body?.to,
        employeeId: req.body?.employeeId,
        groupId: req.body?.groupId,
        clientId: req.body?.clientId,
        jobSiteId: req.body?.jobSiteId,
        content: req.body?.content,
        payload: req.body,
      },
      {
        camelToken: CAMELO_TOKEN.value(),
        verifyAuth,
        resolveOfficeAllowlist,
        staff: SCHEDULE_STAFF.value(),
        people,
        changeLog: new FirestoreLog(),
        feedback: new FirestoreFeedback(),
        invoices: new FirestoreInvoices(),
        clientRates: new FirestoreClientRates(),
        soloOk: new FirestoreSoloOk(),
        liveHandled: new FirestoreLiveHandled(),
        visitPhotos: new FirestoreVisitPhotos(),
        photoFiles: bucketFiles(PHOTO_BUCKET),
        cleanerTokens: new FirestoreCleanerTokens(),
        places: new FirestorePlaces(),
        settings: new FirestoreSettings(),
        snapshots: new FirestoreSnapshots(),
        readCache,
        build,
        // a structured entry with severity ERROR, so the error alert picks it up whatever the runtime does with plain text
        logBrowserError: (entry) => logError("Browser error", entry),
      },
    );
    res.set("Cache-Control", "no-store").status(result.status).json(result.body);
  },
);
