# ADR-014 — Gallery photos: Firebase Storage, fitted in the browser
**Status:** Proposed  
**Date:** 2026-10-04  
**Deciders:** Owner (human); drafted by AI agent during P3-E32

## Context
The before/after gallery was a hard-coded list with photo files in the repository. Adding a pair
meant a code change and a deploy. The owner wants to add pairs from a phone, with every photo
coming out uniform. Phone photos are large (3–5 MB), inconsistently shaped, sometimes rotated, and
carry the GPS coordinates of the client's home.

## Decision
- Gallery pairs are stored in a Firestore collection, `galleryPairs`, and their photos in Firebase
  Storage under `gallery/{pairId}/`. The customer app now uses Firebase Storage (admin tab only;
  the SDK is loaded on demand).
- Photos are fitted **in the admin's browser before upload**: rotated upright, cropped to a square,
  scaled to at most 1200×1200, re-encoded as JPEG. No server-side image processing.
- Only admins can read or write `gallery/` through Storage rules. Visitors load photos through the
  download URLs saved on each pair. Pairs are listed publicly only when `published`.

## Rationale
Browser-side fitting needs no Cloud Function and no native image library, uploads ~200 KB instead of
several MB over a phone connection, and means the original — with its location data — never leaves
the phone. A square matches the existing layout, so the public pages did not change shape.

## Consequences
**Positive:** Self-service from a phone; no deploy to change the gallery; location data is never uploaded; small, uniform files.  
**Negative:** The public gallery depends on a Firestore read. Fitting quality depends on the browser's canvas. HEIC files picked on a desktop cannot be read. Storage rules now matter to the customer site and are not yet managed in the repository.  
**Neutral:** Captions for gallery pairs are stored with the pair (EN + FR), not in `en.json` / `fr.json`; they are content, not UI strings.

## Alternatives Considered
- Photos in the repository, fitted by a script — no self-service; every change needs a developer.
- Server-side fitting in a Cloud Function (`sharp`) — uploads the original with its location data, adds a native dependency and a function to maintain.
- Promoting staff job photos — publishes proof photos of a specific client's home; no way to record consent in the schema today.
