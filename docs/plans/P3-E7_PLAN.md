---
epic: P3-E7
title: Cloud Functions Bug Fixes — Plan
strategy: 1
approved: 2026-06-18
---

# P3-E7 PLAN — Cloud Functions Bug Fixes

## Strategy 1 (Approved): Fix in-place, minimal surface

**Files changed:** `functions/src/index.ts`, `functions/package.json`

**Changes:**
1. Add `import Stripe from 'stripe'` and `import twilio from 'twilio'` at module scope
2. Remove `require('stripe')` and `require('twilio')` from inside function bodies
3. Replace `let bookingsQuery = ... as any` with `let bookingsQuery: Query | CollectionReference`
4. Replace aggregation-then-manual-loop with aggregation results directly
5. Replace `auditLogs: any[]` with typed `AuditLogEntry` local type

**Persona impact:** All personas — production stability for all booking flows.

**Risks:** None — behaviour-preserving refactor, no schema change.

**Schema audit:** No Firestore schema change.
