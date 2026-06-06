# ADR-002 — Multiple Firestore Databases in One Project
**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Project Lead, Firebase Architecture

## Context

Development and testing workflows require data isolation from production bookings. A test booking submitted during development should never appear in the live booking queue. Real customer bookings must never be visible to automated test runs or seeded with test data.

Three options were evaluated:
1. Two separate Firebase projects (one for prod, one for dev)
2. One Firebase project with two Firestore databases
3. One Firebase project with one Firestore database using collection-level separation (e.g., `/dev/bookings` vs `/bookings`)

## Decision

Use **one Firebase project** (`freshnest-aa51e`) with **two Firestore databases**:
- `(default)` — production data
- `freshnest-dev` — development and preview channel data

Database is selected at build time via the `VITE_FIRESTORE_DB_ID` environment variable, already wired in `src/lib/firebase.ts`. Preview channel PRs always point to `freshnest-dev`. Production builds from `main` always point to `(default)`.

## Rationale

- True data isolation at the database level, not just the collection level
- No need to manage two separate Firebase projects and two sets of credentials/service accounts
- Single project billing — both databases appear on one invoice
- CI/CD routing is clean: `VITE_FIRESTORE_DB_ID` drives the switch at build time
- Firebase Preview Channels (see ADR-004) automatically use `freshnest-dev` via environment injection
- Security rules can be maintained in a single `firestore.rules` file and deployed to both databases

## Consequences

**Positive:**
- Real, enforced data isolation — test data cannot bleed into production
- Single project billing and credential management
- Simple CI/CD routing via a single environment variable
- Clean separation visible in Firebase console

**Negative:**
- Multi-database Firestore is a newer feature (GA'd 2023); some third-party Firebase tooling may not fully support it
- Slightly more complex `firebase.json` configuration (requires `databases` array with named database targets)

**Neutral:**
- Both databases share the same Firebase project quotas and limits

## Alternatives Considered

- **Two Firebase projects** — Rejected. Requires managing two sets of credentials, two `firebase.json` configs, two service account keys, and double the Firebase console navigation overhead for a solo developer.
- **Collection-level separation** — Rejected. Provides no real isolation. A misconfigured environment variable or a missing conditional could allow test data to write to production collections. The risk is not acceptable for a booking system handling real customer data.
