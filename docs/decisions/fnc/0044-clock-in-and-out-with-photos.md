# 0044. Cleaners clock in and out in the app, with photos

- Date: 2026-10-17
- Decided by: Owner
- Status: Built (`scheduleVisitPhotos`, `scheduleCleanerTokens`, `POST /api/clock`)

## Decision

1. **Cleaners clock in and out of their visits in FNC Landing**, from My week, as real Camelo punches on the visit's
   own `shift.timeCard`: the same timesheets the office approves today, linked to the visit (`shiftId`), so Payroll
   hours stays the pay record ([0005](0005-payroll-hours-is-the-pay-record.md)).
2. **A photo of the front door or the address with every clock-in and clock-out.** Required: the app asks every time.
   If the camera or the signal fails, the cleaner can still clock in, and the visit shows "photo missing" until they
   add it, so no punch and no pay is lost.
3. **Photos of the client's home on a visit: before and after, or after only**, as the cleaner chooses. Several are
   allowed. The office sees every visit's photos; a cleaner sees and adds photos only for their own visits. A visit
   two cleaners work together is each one's own (owner, 2026-10-22): each sees the photos the other took on it, but
   adds photos on their own shift only and deletes only their own.
4. **The door photo lives in Camelo**, on the punch (`syncTimeCardPunchAttachment`). **The home photos live in this
   site's own storage** (owner, 2026-10-17), not in Camelo: a private Google Cloud Storage bucket used by this app
   only, with a small record per photo in Firestore (the visit, before or after, who, when). Every upload and every
   view goes through the function, which checks who is asking: the office sees all, a cleaner only their own visits.
   Nothing of them is kept in this repository.
5. **Home photos are kept one year**, then deleted by themselves (a lifecycle rule on the bucket and a TTL on the
   records). **The office may delete any photo; a cleaner may delete one they took, the same day only.**
6. **Home photos come first.** They need only the visit's id, which My week has.

## Why the home photos are not in Camelo

The proof run (2026-10-17, test workspace) found that adding a photo to a visit with `updateShift` replaces the
visit's photo list and puts a published visit back to draft, which in the real schedule could hide it from the
cleaner. Our own storage avoids both, keeps the "before" or "after" label beside the picture, and lets the site
decide who sees what.

## Why and how clock-in works in Camelo

The owner wants one app for the cleaners, and proof of where a clock-in happened and of the work done
(2026-10-17). The test-workspace proof run (2026-10-17) confirmed each piece:

- **Tying a clock-in to a visit:** `createTimeCard` is only for unscheduled shifts (`shiftId: null`). For a scheduled
  visit, **Camelo creates `shift.timeCard` automatically** (`state: "READY"`, `shiftId` set to the visit, and `creator`
  set to the assigned cleaner) once the visit is published and within `shiftClockInEarlyThreshold` (4 hours before
  `startTime` on the production workspace). Punching that existing `shift.timeCard.id` creates a `SUBMITTED` timesheet
  linked to the visit (`referenceObject.shiftId`), client and job site.
- **Who may punch:** `syncTimeCardPunches` checks that the token belongs to `timeCard.creator` (the owner token is
  refused with `"not allowed to clock_in? this CardPunch"` on another person's card, and `kioskPunch` is also refused
  and lacks GPS fields). So each cleaner connects their Camelo account once by an emailed code
  (`requestLoginSession`, `verifyOtp`, which returns `accessToken` and `expiresAt`), and our server keeps that token
  encrypted to send their punches.
- **Attaching the door photo:** `generateUploadUrl(uploader: PHOTO)` gives a signed S3 POST form; after uploading the
  image (`photos/<id>/…`), calling `syncTimeCardPunchAttachment(timeCardId, atTime, photoKey)` with the S3 `key`
  populates `attachment.photo` with the signed image URL, either at the moment of the punch or later if the signal
  failed. Ending a visit sends `CLOCK_OUT` at `t` (with the clock-out GPS and photo) and `FINISH` at `t + 500ms`.

## Where the cleaner's token is kept and how the door photo travels (plan item 2.4.6)

Three approaches were weighed for each question on 2026-10-17, and the owner chose the first for both:

### 1. Where a cleaner's Camelo token is kept (`2.4.7`)

- **Chosen: Firestore (`scheduleCleanerTokens`), encrypted with a key derived from `CAMELO_TOKEN` (`hkdfSync` + AES-256-GCM).**
  One document per cleaner (`employeeId`), holding `{ employeeId, email, ciphertext, iv, tag, connectedAt, expireAt }`
  with `expireAt` stored as a Firestore `Timestamp` for TTL cleanup. The 256-bit key is derived per cleaner from the
  existing `CAMELO_TOKEN` secret (`hkdfSync("sha256", camelToken, employeeId, "fnc-schedule-cleaner-camelo-token-v1", 32)`),
  so no fourth Secret Manager secret is needed (`functions/src/routes/clock.ts`). Neither the raw token nor the
  ciphertext ever leaves the server; `POST /api/my-week` returns only `cameloConnected: boolean`.
- *Not chosen:* a fourth Secret Manager secret for the encryption key (more console ceremony before deploying), or an
  encrypted cookie in the cleaner's browser (lost if the cleaner clears browser data or reinstalls the app).

### 2. How a door photo travels on clock-in and clock-out (`2.4.8`)

- **Chosen: one request from the phone to our function (`POST /api/clock`), which uploads to Camelo's S3 and attaches it.**
  The phone shrinks the door photo with `shrinkPhoto` (~80–150 KB JPEG) and sends it with `shiftId` and GPS (`lat`,
  `lon`) in one request to `POST /api/clock`. The function records the punch first (`syncTimeCardPunches`) so the punch
  is never lost if the photo step fails, then calls `generateUploadUrl(uploader: PHOTO)`, POSTs the JPEG to Camelo's
  presigned S3 URL from the server, and calls `syncTimeCardPunchAttachment(timeCardId, atTime, photoKey)`. If the
  photo step fails or was skipped, the punch still stands and the cleaner can attach the photo later. Because the
  upload to S3 happens on the server, the browser's Content Security Policy (`connect-src 'self' …` in
  `firebase.json`) does not need any Amazon S3 domains.
- *Not chosen:* uploading directly from the phone's browser to Camelo's S3 presigned URL (requires opening `connect-src`
  in `firebase.json` to S3 and making three round-trips over cellular), or keeping a copy in our own bucket first.

### 3. Who may connect a Camelo account

- **Only a signed-in cleaner (`who.role === "cleaner"`)** can request a code, verify it, or clock in and out. The email
  sent to `requestLoginSession` is always the cleaner's verified sign-in email (`who.email`), and `verifyOtp` checks
  that `whoami.id === who.employeeId` before storing the token. The office's "My week (as a cleaner sees it)" view is
  read-only.

## Where it lives

`docs/project-plan.md`, sprint 2.4; `docs/camelo-api.md`, section 5.5; `functions/src/routes/clock.ts`.

