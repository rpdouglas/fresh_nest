# HOTFIX-06 — Crew job photos blocked by Storage rules

**Date:** 2026-10-27 · **Found by:** FSM gap analysis ([R1](../gap-analysis/GAP_ANALYSIS_2026-10-27.md)) · **Owner approval to draft:** 2026-10-27 · **Status:** ✅ Closed 2026-10-27 — merged (PR #37), Storage rule deployed, owner phone test passed

## Persona
- **P11 Brenda Côté:** her mandatory photo proof never reached the office.
- **P12 Lauren:** sees the photos at review.

## Problem
The staff app uploads checklist photos to `jobs/{jobId}/photos/{photoId}` (`OfflineUploadProvider.tsx`). Since 2026-05-23, `storage.rules` has denied every path except `gallery/` (P3-E32). So every crew photo upload failed in production:
- the photos stayed in the phone's offline queue;
- job documents kept `temp:` placeholders instead of real photo links.

## Fix
- **Upload path:** `jobs/{jobId}/photos/{staffUid}/{photoId}`, built by the new `apps/fsm/src/lib/utils/jobPhotoPath.ts`. The upload now sends a `contentType`.
- **New Storage rule** for that path:
  - **create** only: signed in; the folder is the uploader's own uid; role staff, supervisor or admin; file doesn't already exist; image type; under 15 MB;
  - **read:** admins, and the uploader;
  - **no update or delete:** photo evidence is append-only.
- **Why not check the job's assignee from Storage rules:** dev runs on the named database `freshnest-dev`, and I couldn't confirm that cross-service `firestore.get()` supports named databases. Which job a photo is attached to is still enforced by `firestore.rules`: only the assigned cleaner can update the job's `photos` and `checklistCompletions`.
- **Queued photos:** photos already in a phone's queue upload to the new path automatically on the next sync. Nothing changes on the device.

## Tests
- `apps/customer/test/storage-rules.test.ts` (new, Storage emulator), 10 tests:
  - own-folder upload works for staff, supervisor and admin;
  - another person's folder is denied;
  - customers and signed-out users are denied;
  - non-images and files of 15 MB or more are denied;
  - overwrite and delete are denied;
  - the uploader and admin can read, other staff can't;
  - the old flat path stays closed;
  - the gallery rule is unchanged;
  - everything else is denied.
- `npm run test:rules` now starts the Firestore **and** Storage emulators: 35/35 passing.
- CI rules job: `storage.rules` added to its path filter, and the Storage emulator added.
- `apps/fsm/src/lib/utils/jobPhotoPath.test.ts`; FSM 57/57 passing, lint and build OK.

## Deploy (human)
CI never deploys rules on its own (COMPLIANCE.md §4). After merging, use either:
- **GitHub:** Actions → **Deploy Security Rules** → Run workflow, with target `storage` and DEPLOY typed in the confirm box ([ADR-016](../decisions/ADR-016-manual-rules-deploy-workflow.md)). It re-runs the rules tests first.
- **A signed-in machine:** `npx firebase deploy --only storage --project freshnest-aa51e`
Then, on a phone: complete a photo-required task, confirm the pending count drops to 0, and confirm the photo shows in admin.

The FSM app change deploys with the merge, but uploads only succeed once the rule is deployed. Deploy the rule right after merging.

## Not in this fix (gap analysis W3-4)
- Photo compression and a per-visit cap.
- EXIF location stripping.
- Short-lived URLs instead of `getDownloadURL` (R11).
- Retention cleanup.

## Close-out (2026-10-27)
- **Merged:** PR #37 merged to `main` at `5055e1d`. The FSM app deployed with it.
- **Storage rule deployed:** by the owner through the new **Deploy Security Rules** workflow ([ADR-016](../decisions/ADR-016-manual-rules-deploy-workflow.md)), target `storage`. In run #1, the rules tests passed and then the deploy succeeded. The existing deploy service account already had the permissions it needed.
- **Persona test (P11 Brenda / P12 Lauren):** passed. The owner completed a photo-required task on a phone, the upload queue drained, and the photo appeared on the job in admin.
