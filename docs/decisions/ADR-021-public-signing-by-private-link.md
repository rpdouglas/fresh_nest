# ADR-021 — Public Signing by Private Link (Hashed Tokens, Server-Only Access)
**Status:** Proposed
**Date:** 2026-11-20
**Deciders:** Owner (approval pending, with P3-E39 strategy choice)

## Context
P3-E39 lets a client sign their service agreement from a link, without an account. This is the first time the site will expose **sensitive, per-client data to a signed-out visitor**. It includes the client's address, rate and entry details, and the client writes back door and alarm codes. Today's public patterns are not safe enough for this:
- **Quote form:** a public Firestore `create`.
- **Review page:** reads Firestore directly by `jobId` in the query string.

## Decision
1. **Tokens.**
   - A signing link carries a bearer token of at least 32 random bytes (`crypto.randomBytes`), base64url.
   - Firestore stores **only `sha256(token)`**. The raw token is returned once, to the Owner or Manager who created or reissued the link, and is never logged.
   - Reissuing replaces the hash, so the old link stops working.
   - Tokens expire (`tokenExpiresAt`), and the hash is cleared on signing.
2. **Server-only access.**
   - Signed-out visitors reach agreement data **only through callables** (`getAgreementForSigning`, `signAgreement`) with `enforceAppCheck: true`.
   - Firestore and Storage rules allow office read and **no client writes** on `agreements`, its subcollections, the template collections and `agreements/` storage.
3. **Uniform refusal.** Unknown, expired, used, locked and malformed tokens return the same neutral error, so a token's state cannot be probed.
4. **Least data out.**
   - Responses contain only what the page shows.
   - Access codes are write-only from the client and kept in a restricted subdocument. They never appear in a response, PDF or email.
5. **Evidence.** Each signature is a create-once record with:
   - the typed name and both consents (e-signature and terms);
   - server time, IP, user agent and language;
   - the version ID and the SHA-256 of the exact rendered text.
6. **Wording outside code.** Agreement text lives in versioned, immutable-once-published Firestore documents, not in the app bundle or locale files.

## Rationale
- **Low client friction:** a no-account link fits P2 Travis and P3 Margaret. Magic-link sign-in exists (ADR-010) but adds an email round-trip.
- **Leaked database reads:** hashing means a leaked office screen or export does not hand out working links.
- **Rules stay simple:** routing everything through callables keeps the rules small (deny-all for clients), and the server validates the whole form.

## Consequences
**Positive:**
- No signed-out Firestore reads of sensitive data.
- Links cannot be recovered from the database.
- The evidence trail is append-only.
- Wording changes need no release.

**Negative:**
- A lost link can't be re-shown, only reissued.
- Two more public endpoints to protect (App Check plus an attempt limit).
- Callables must route to the right database (`(default)` vs `freshnest-dev`) explicitly.

**Neutral:** The pattern is reusable for team agreements and future signed-out flows (for example a review link, F19).

## Alternatives Considered
- **Token as the document ID, read through the rules:** rejected. The office list exposes working links, and rules cannot hide fields from a read.
- **Customer magic-link sign-in before signing (ADR-010):** rejected for launch because of the extra step for seniors. It is kept for a later "My agreements" portal view.
- **Third-party e-signature service:** rejected for standard residential agreements (cost, integration). It stays available where a lawyer asks for it (FSM spec Part 4 §5, option 3).
