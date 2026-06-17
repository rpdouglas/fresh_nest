# Phase A Plan: P2-E8 Firebase Custom Claims RBAC

This plan outlines three strategies for migrating the Fresh Nest Co. platform from the Firestore collection email allowlist pattern to cryptographically secure Firebase Custom Claims for Role-Based Access Control (RBAC).

---

## Strategy 1: Custom Claims RBAC with Automatic Synchronization during Auth Creation & Trigger Fallback (Recommended)

This strategy automates custom claim assignment when user accounts are first created, while providing an admin callable function for explicitly setting or upgrading roles. It re-wires `firestore.rules` and the client auth hooks in both the Customer and FSM applications to rely purely on token custom claims, drastically reducing document reads and securing admin/staff routing.

### Files Changed

- **[functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts)**:
  - Enhance `onUserCreated` Auth trigger to check if the newly created user's email exists in the `staff` collection (if yes, assign the `'staff'` or `'supervisor'` claim role based on their profile role) or the `admins` collection (assign `'admin'`). Default to `'customer'` otherwise.
  - Implement a new HTTPS callable Cloud Function `setUserRole` that allows an admin to update a user's role claim.
  - In `setUserRole`, verify that the caller is an admin by checking `request.auth.token.role === 'admin'`. Fall back to checking if the caller's email is present in the `admins` collection in Firestore to bootstrap the first admin.
- **[firestore.rules](file:///workspaces/fresh_nest/firestore.rules)** (and `firestore.dev.rules`):
  - Redefine the `isAdmin()` helper function to return `request.auth != null && request.auth.token.role == 'admin'`. This eliminates the need for expensive `exists()` queries across all collections.
  - Implement an `isStaff()` helper: `request.auth != null && (request.auth.token.role == 'staff' || request.auth.token.role == 'supervisor' || request.auth.token.role == 'admin')`.
  - Secure `/checklistTemplates` and `/jobs` collections by replacing general auth checks with the `isStaff()` check.
- **[apps/customer/src/components/admin/hooks/useAdminAuth.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useAdminAuth.ts)**:
  - Re-implement authorization checks using `idTokenResult.claims.role === 'admin'` after fetching the token. Remove the `getDoc` read on the `admins` collection.
- **[apps/fsm/src/context/StaffAuthProvider.tsx](file:///workspaces/fresh_nest/apps/fsm/src/context/StaffAuthProvider.tsx)**:
  - Modify the `onAuthStateChanged` handler to inspect the custom claim `role` of the logged-in user using `currentUser.getIdTokenResult(true)`.
  - If the custom claim `role` is not `'staff'`, `'supervisor'`, or `'admin'` (e.g. they are a `'customer'`), block authentication, show an appropriate login error (e.g., `'fsm.login.errorNoProfile'`), and log the user out.
- **[apps/fsm/src/components/auth/ProtectedRoute.tsx](file:///workspaces/fresh_nest/apps/fsm/src/components/auth/ProtectedRoute.tsx)**:
  - Update to verify both that the user has a valid staff profile and that the custom claim role is authorized (not `'customer'`).

### Persona Impact

- **P12 Sarah (Owner / Compliance)**: High impact. Cryptographically signed claims prevent spoofing or unauthorized entry into business operations. Eliminating document lookups reduces Firestore costs.
- **FSM Cleaners (Carla, Mike, Ahmed, Jasmine, Brenda)**: Medium impact. Ensures they can access their dashboard instantly with the token claims cached, while guaranteeing that customer users cannot read jobs or checklist templates.

### Risks & Mitigations

- *Risk*: Token latency. Custom claim changes require a token refresh (`getIdToken(true)`) to take effect on the client. If an admin upgrades a user, the change might not register immediately without a refresh.
  - *Mitigation*: The `useAdminAuth` and `StaffAuthProvider` hooks force a token refresh when users sign in/change auth state, and the `setUserRole` function documentation advises that changes apply on the next token refresh or manual sign-out/sign-in.

### Schema Audit

- **Schema changes:** None. We continue using the existing collections, but access control changes from collections to token claims.
- **firestore.rules changes:** Redefine `isAdmin()`, introduce `isStaff()`, and secure staff-only collections (`/checklistTemplates`, `/jobs`, `/payRates`, `/auditLog`).
- **firestore.indexes.json changes:** None.

---

## Strategy 2: Pure Callable-driven Upgrade and Explicit Route-Level Guard Components

This strategy relies strictly on manual role assignment by admins (no auto-sync on creation for staff) and places the responsibility of protection on explicit layout wrapper components rather than hooks.

### Files Changed

- **[functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts)**:
  - Keep `onUserCreated` setting `'customer'` for everyone.
  - Implement `setUserRole` callable Cloud Function checking only `request.auth.token.role === 'admin'`.
- **[firestore.rules](file:///workspaces/fresh_nest/firestore.rules)**:
  - Re-implement `isAdmin()` check using claims.
- **[apps/customer/src/App.tsx](file:///workspaces/fresh_nest/apps/customer/src/App.tsx)** & **[apps/fsm/src/App.tsx](file:///workspaces/fresh_nest/apps/fsm/src/App.tsx)**:
  - Define new router components `AdminRoute` and `StaffRoute` which wrap pages at the router config level instead of hook logic.
- **[apps/customer/src/components/admin/hooks/useAdminAuth.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useAdminAuth.ts)**:
  - Re-wire to verify claim roles.

### Persona Impact

- **P12 Sarah**: Requires her to manually run a role promotion command or click a button in the UI to upgrade every new staff member. This adds friction to onboarding but provides tighter manual control.

### Risks & Mitigations

- *Risk*: Friction and delays. If a new cleaner signs up but Sarah has not yet upgraded their claims, they will get access denied and cannot see their shifts.
  - *Mitigation*: Detailed admin warnings and user prompts instructing them to contact the administrator.

### Schema Audit

- **Schema changes:** None.
- **firestore.rules changes:** Redefine `isAdmin()`.
- **firestore.indexes.json changes:** None.

---

## Strategy 3: Hybrid Firestore Allowlist & Claims Sync (Minimum Claims Reliance)

This strategy implements custom claims as an optimization layer, but keeps the collection check as a fallback in security rules and client hooks to ensure access is never blocked due to token caching.

### Files Changed

- **[firestore.rules](file:///workspaces/fresh_nest/firestore.rules)**:
  - Update `isAdmin()` to check if `request.auth.token.role == 'admin'` OR `exists(/admins/{email})`.
- **[apps/customer/src/components/admin/hooks/useAdminAuth.ts](file:///workspaces/fresh_nest/apps/customer/src/components/admin/hooks/useAdminAuth.ts)**:
  - Check claims first; if claims are missing, fall back to checking the `/admins` collection.

### Persona Impact

- **P12 Sarah / Dev Team**: Slower page load due to redundant document reads. Stale claim tokens will silently resolve using the collection fallback, hiding token synchronization bugs.

### Risks & Mitigations

- *Risk*: Defeats the cost/performance goals of migrating away from document reads in security rules.
  - *Mitigation*: None, this is a compromise strategy.

### Schema Audit

- **Schema/Rules changes:** Keep fallback references to `/admins` collection.

---

## Recommended Strategy

We recommend **Strategy 1**. It fully achieves the security, cost, and architecture goals of migrating to Custom Claims by completely eliminating collection-based role lookups, while resolving the staff onboarding flow automatically by matching signup emails with existing `staff` records.
