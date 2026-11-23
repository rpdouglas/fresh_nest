import { getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { defineSecret } from "firebase-functions/params";
import { OAuth2Client } from "google-auth-library";
import { error as logError } from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import { readFileSync } from "node:fs";
import { PeopleCache, ReadCache, handleApi } from "./core.js";
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

// Comma-separated Google accounts allowed to use the site at all.
const SCHEDULE_EDITORS = defineSecret("SCHEDULE_EDITORS");
// The site's OAuth client ID (public; also in web/.env.production).
const GOOGLE_CLIENT_ID = "793264910505-2eqpc1912efusd4puq5fml0aiu2bb4oe.apps.googleusercontent.com";
// Who, beyond the office list, is let in as a cleaner: "off", "*" for every active person in Camelo, or a
// comma-separated list of addresses for a trial (decision 0037; docs/operations.md, Access).
const SCHEDULE_STAFF = defineSecret("SCHEDULE_STAFF");
const google = new OAuth2Client();
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

/** The verified email behind a Google ID token issued to this site, or null. */
async function verifyGoogle(idToken: string): Promise<string | null> {
  try {
    const ticket = await google.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const who = ticket.getPayload();
    if (who?.email && who.email_verified) return who.email;
    console.warn("Google sign-in refused: no verified email on the token");
  } catch (e) {
    // The reason only (expired, wrong audience, bad signature); the library's
    // message can end with the token itself, so cut it off before that.
    console.warn(
      "Google sign-in refused:",
      String(e instanceof Error ? e.message : e)
        .split(":")[0]
        .slice(0, 120),
    );
  }
  return null;
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
  { secrets: [CAMELO_TOKEN, SCHEDULE_EDITORS, SCHEDULE_STAFF], region: "us-central1", maxInstances: 2, timeoutSeconds: 60 },
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
        verifyGoogle,
        editors: SCHEDULE_EDITORS.value().split(","),
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
