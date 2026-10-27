---
epic: P3-E32
title: Before/After Gallery — Easy Photo Management from Phones — Plan
strategy: 2
approved: 2026-10-04
---

# P3-E32 PLAN — Before/After Gallery: Easy Photo Management from Phones

**Phase A written:** 2026-10-04 · **Status:** ✅ Strategy 2 approved by human 2026-10-04

There is no `docs/projects/P3-E32.md` spec. The scope below is the human request of 2026-10-04,
and `P3-E32` is the next free epic ID after P3-E31.

## Scope (human request, 2026-10-04)

Make the before/after gallery easy to manage and update, using photos taken on phones, with every
photo made uniform and fitted the way the current (hidden) gallery photos are.

The gallery itself stays hidden (`SHOW_GALLERY = false`, P3-E31) until the human switches it on.

## Personas

| Persona | Why this epic touches them |
|---|---|
| **P12 Lauren** (primary) | She is the one who adds, replaces and removes gallery photos. "Easy" is measured against her, on her phone. |
| **P5 Sophie** | The before/after gallery is her primary trust mechanism (PERSONAS.md line 344). Real, well-presented photos are what her persona test needs. |
| **P6 Gallagher** | Photo proof for Airbnb turnovers. |
| **P11 Brenda** | Already takes timestamped before/after job photos in the staff app; Strategy 3 reuses them. |
| **P2 Travis / P3 Margaret** | Page speed on mobile: today's ten photos weigh 7.1 MB. |

## What the code looks like today

- **Data:** five before/after pairs are hard-coded in `apps/customer/src/lib/data/galleryData.ts`
  (`id`, `serviceKey`, `captionKey`, `featured`, `beforeSrc`, `afterSrc`). Captions are i18n keys in
  `en.json` / `fr.json`. Adding a pair means editing three files and deploying.
- **Photos:** ten files in `apps/customer/public/images/gallery/`. Each is a 1024×1024 square JPEG
  (saved with a `.png` extension), 550–930 KB.
- **How they are fitted:** `GalleryImage` uses `object-cover`. On the home page and `/gallery` each
  photo fills half of a 4:3 tile, so only the centre portrait strip (2:3) of the square shows. The
  lightbox shows each photo as half of a 16:9 frame (close to square).
- **Storage:** the customer app does not initialise Firebase Storage. The staff app does, for job
  photos under `jobs/{jobId}/photos/{photoId}`. There is no `storage.rules` file and no `storage`
  section in `firebase.json`, so Storage rules are not managed from this repo today.
- **Schema:** `docs/firestore-schema.md` has no gallery collection.
- **Admin page:** eight tabs; `ReviewsModerationTab` is the closest precedent for curated public content.
- The site's Content-Security-Policy already allows images from `firebasestorage.googleapis.com`.

## The uniform photo format (all three strategies)

Every gallery photo is saved the same way, matching the current ones so no layout changes:

- Square, 1200×1200, JPEG at ~80% quality — roughly 150–250 KB instead of 550–930 KB.
- Rotated upright from the phone's orientation data, then that data is discarded.
- All embedded metadata removed, **including GPS location**. Phone photos carry the coordinates of
  the client's home; these must never reach the public site.
- Cropped to the square around a chosen centre point. The centre portrait strip is what the grid shows.

## Privacy note (all three strategies)

These are photos of the inside of clients' homes. `docs/COMPLIANCE.md` (PIPEDA, Quebec Law 25)
requires explicit consent for use of personal information, and has no rule yet for publishing
client-home photos. No strategy below invents a consent field. Until the human decides how consent
is recorded, the plan assumes Lauren obtains consent outside the app before publishing a pair, and
the upload screen shows a reminder she must tick. See open question 2.

---

## Strategy 1: Photos stay in the repo, processed by a script

Lauren sends phone photos to whoever maintains the site. A script does the fitting:
`npm run gallery:add -- --before a.jpg --after b.jpg --service deep --caption-en "…" --caption-fr "…"`.
It rotates, strips metadata, crops to the uniform square, writes the two files into
`public/images/gallery/`, and appends the pair to a manifest. Then a PR and a deploy.

**Files changed:**
- `scripts/gallery-add.mjs` (new) — processing script using `sharp`
- `package.json`, `package-lock.json` — `sharp` as a dev dependency; `gallery:add` script
- `apps/customer/src/lib/data/galleryPairs.json` (new) — manifest with EN + FR captions per pair
- `apps/customer/src/lib/data/galleryData.ts` — read the manifest
- `apps/customer/src/pages/Gallery.tsx`, `components/home/GalleryPreview.tsx`, `components/ui/Lightbox.tsx` — captions from the manifest by language
- `apps/customer/public/images/gallery/*` — existing ten photos re-processed to the uniform format and given honest `.jpg` extensions
- `apps/customer/src/i18n/locales/en.json`, `fr.json` — remove the per-pair caption keys
- `user-guide/admin-guide.md` — how to add a pair

**Persona impact:** P5, P6 get a consistent gallery; P2, P3 get a lighter page (about 7 MB → about 2 MB).
P12 Lauren still cannot do it herself — every change goes through a developer and a deploy.

**Risks:**
- Does not meet "easy": no phone upload, no self-service.
- Captions move out of `en.json` / `fr.json` into a manifest. They stay bilingual, but this is a
  second place for copy; the Linguistic_Auditor rule ("all UI strings in en.json / fr.json") needs a
  human ruling that gallery captions are content, not UI strings.
- Photo files keep growing the repository.

**Schema audit:** no Firestore change.
**Tailwind audit:** no new classes.

## Strategy 2 (recommended): Gallery tab in the admin page — upload from the phone

A new **Gallery** tab on `/admin`. On her phone Lauren taps "Add pair", picks the service, types a
caption in English and French, then picks or takes the before and after photos. The browser fits
each photo to the uniform square before upload, with a preview she can drag to choose what stays in
frame. She can then publish/unpublish, mark as featured (shown on the home page), reorder, replace
a photo, or delete a pair. The public pages read published pairs from Firestore.

**Files changed:**
- `apps/customer/src/components/admin/GalleryManagerTab.tsx` (new) — list, add, edit, publish, feature, reorder, delete
- `apps/customer/src/components/admin/GalleryPhotoPicker.tsx` (new) — pick/take a photo, drag-to-position crop preview
- `apps/customer/src/lib/utils/imageProcessing.ts` (new) + test — rotate, crop to square, resize, re-encode (drops all metadata)
- `apps/customer/src/components/admin/hooks/useGalleryAdmin.ts` (new) — admin reads and writes
- `apps/customer/src/hooks/useGalleryPairs.ts` (new) — public read of published pairs (TanStack Query)
- `apps/customer/src/lib/firebase/firebase.ts` — initialise Storage
- `apps/customer/src/lib/firebase/converters.ts` — `galleryPairs` converter
- `packages/shared/src/types/` — `GalleryPair` type
- `apps/customer/src/pages/AdminPage.tsx` — add the tab
- `apps/customer/src/pages/Gallery.tsx`, `components/home/GalleryPreview.tsx`, `components/ui/Lightbox.tsx` — read from the hook; loading and empty states
- `apps/customer/src/lib/data/galleryData.ts` — removed, or kept only as seed data
- `apps/customer/src/i18n/locales/en.json`, `fr.json` — admin tab strings; remove per-pair caption keys
- `docs/firestore-schema.md` — new collection (below)
- `firestore.rules` — **human-approved change only** (proposal below)
- `storage.rules` (new) + `firebase.json` `storage` section — **human-approved change only**
- `user-guide/admin-guide.md` — how to manage the gallery

**Persona impact:**
- **P12 Lauren:** adds a pair from her phone in about a minute, with no developer and no deploy.
  48px targets and 16px text, as on the rest of the admin page.
- **P5 Sophie, P6 Gallagher:** fresh, real, consistently framed photos.
- **P2 Travis, P3 Margaret:** lighter photos, lazy-loaded.

**Risks:**
- **Two security rule changes** that need human review: a new `galleryPairs` match in
  `firestore.rules`, and Storage rules for a `gallery/` path. Storage rules are not in the repo
  today; adding `storage.rules` must reproduce whatever protects `jobs/…` photos now, or deploying
  it would overwrite those rules. This needs the human to export the current console rules first.
- The public gallery now depends on a Firestore read (loading state, and an empty state if it fails).
- Browser cropping uses the canvas; very large phone photos on older phones can be slow.
- iPhone HEIC photos convert automatically when picked on the phone, but a HEIC file uploaded from
  a desktop browser cannot be read. The picker will say so in plain language.
- The existing five pairs appear to be stock or generated placeholders; they would be re-added
  through the tab or dropped (open question 1).

**Schema audit — new collection, needs human approval (not in `docs/firestore-schema.md` today):**

`galleryPairs/{pairId}`

| Field | Type | Notes |
|---|---|---|
| `serviceKey` | `string` | Existing `ServiceType` values |
| `captionEn` | `string` | English caption |
| `captionFr` | `string` | French caption (required — bilingual rule) |
| `beforePath` | `string` | Storage path `gallery/{pairId}/before.jpg` |
| `afterPath` | `string` | Storage path `gallery/{pairId}/after.jpg` |
| `beforeUrl` | `string` | Download URL |
| `afterUrl` | `string` | Download URL |
| `published` | `boolean` | Only published pairs are publicly readable |
| `featured` | `boolean` | Shown in the home page preview |
| `order` | `number` | Display order |
| `consentConfirmed` | `boolean` | Admin ticked "client agreed to publication" (see open question 2) |
| `createdAt` | `Timestamp` | |
| `updatedAt` | `Timestamp` | |
| `createdBy` | `string` | Admin uid |

All of these are new. They are a blocker until the human approves the collection; on approval they
are added to `docs/firestore-schema.md` in Phase C.

**Rules proposal (for human review, not applied by the agent):**
- Firestore: `galleryPairs` — read if `resource.data.published == true || isAdmin()`; write if `isAdmin()`.
- Storage: `gallery/{pairId}/{file}` — public read; write if admin, image content type, under 1 MB.

**Tailwind audit:** new components reuse existing admin classes and tokens only
(`bg-white`, `border-sand`, `rounded`, `text-charcoal`, `text-text-muted`, `bg-slate-brand`,
`hover:bg-slate-dark`, `bg-slate-pale`, `font-body`, `font-sub`, `min-h-[48px]`, `aspect-square`).
No new tokens.

## Strategy 3: Promote photos from completed jobs

Staff already take before and after photos on every job in the staff app. Instead of a separate
upload, Lauren opens a completed job in the admin page, picks one before and one after photo, and
taps "Add to gallery". A Cloud Function copies the two photos, fits them to the uniform square,
strips metadata and location, and creates the gallery pair. Includes the Gallery tab from
Strategy 2 for captions, publish, feature, reorder and delete (but not its phone upload).

**Files changed:** everything in Strategy 2 except `GalleryPhotoPicker.tsx` and `imageProcessing.ts`, plus
- `functions/src/callables/promoteJobPhotosToGallery.ts` (new) + test — copy, process with `sharp`, write the pair
- `functions/package.json`, `functions/package-lock.json` — add `sharp`
- `functions/src/index.ts` — export the callable
- `apps/customer/src/components/admin/BookingDetailPanel.tsx` (or the job photo viewer) — "Add to gallery" action

**Persona impact:**
- **P12 Lauren:** fewest steps — the photos are already in the system.
- **P11 Brenda:** her photos become the public gallery. They were taken as proof, not for marketing.
- **P5, P6:** every gallery pair is traceable to a real job.

**Risks:**
- **Privacy is the main one.** Job photos are proof photos of a specific client's home, stored with
  GPS coordinates and marked "not accessible to clients" (PERSONAS.md line 708). Publishing them needs
  per-client consent that the schema cannot record today — a consent field on `bookings` or
  `customers` would be an invented field and a change to a consent flow, which COMPLIANCE.md
  reserves for the human.
- Proof photos are not composed for marketing (close-ups of a stove), so matching before/after
  framing is unlikely.
- Largest scope: a new Cloud Function with a native image dependency, on top of Strategy 2's rule changes.
- Depends on job photos existing in production; there may be few or none yet.

**Schema audit:** Strategy 2's `galleryPairs` collection plus `sourceJobId` (`string`) — all new,
all need approval. A consent field on `bookings`/`customers` would also be needed and is **not**
proposed here: flagged as a blocker for this strategy.

**Tailwind audit:** same as Strategy 2.

---

## Recommendation

**Strategy 2.** It is the only one that gives Lauren self-service from a phone without publishing
proof photos. Strategy 1 is a fallback if the two rule changes are not wanted now. Strategy 3 is
best treated as a later add-on to Strategy 2 once photo consent is settled.

## Open questions for the human — answered 2026-10-04

Answers: (1) placeholders — drop them. (2) A tick box on the upload screen is fine. (3) Storage rules — not answered yet; see `docs/projects/P3-E32.md`. (4) Admin only.

1. **Existing five pairs.** Are the current photos real Fresh Nest jobs, or placeholders? Keep them
   (re-added through the new tab) or drop them?
2. **Client consent.** How do you want consent to publish a client's home recorded — a tick box on
   the upload screen confirming you have it (Strategy 2 as written), or something more formal?
3. **Storage rules.** Storage rules are not in this repo. To add a public `gallery/` path safely,
   the current rules need exporting from the Firebase console first. Are you able to do that, or
   would you prefer the gallery rule be added in the console by hand?
4. **Who uploads.** Admin only (Lauren and the office person), or should lead cleaners be able to
   submit pairs for approval?
