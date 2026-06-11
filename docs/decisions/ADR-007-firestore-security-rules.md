# ADR-007 — Firestore Database Security Rules Architecture
**Status:** Proposed  
**Date:** 2026-06-11  
**Deciders:** Ryan (Owner), Dev Team  

---

## Context

The June 2026 architectural review identified critical security vulnerabilities in our Firestore database configuration:
1. **F-01**: The production Firestore security rules allow unauthenticated read and write access on all collections (`allow read, write: if true`). This means any user with our Firebase project ID can access all client PII (names, addresses, emails, phone numbers) via the Firebase REST API.
2. **F-02**: Admin authorization is enforced purely client-side in the browser ([AdminPage.tsx](file:///workspaces/fresh_nest/src/pages/AdminPage.tsx)). The UI gate reads a build-time environment variable `VITE_ADMIN_EMAILS` to grant access. Since the database is world-readable, this UI-layer check provides no security for our actual data store.

We need a database-level access control model that:
- Restricts read/update access on the `bookings` collection to authorized administrators only.
- Allows unauthenticated site visitors to submit bookings via the public booking form.
- Enforces a schema structure on public booking submissions to prevent data pollution (e.g., self-confirming bookings).
- Avoids committing admin user lists to version control or baking them into the client-side JavaScript bundle.

---

## Decision

Implement database-level role-based access control inside [firestore.rules](file:///workspaces/fresh_nest/firestore.rules) using a Firestore-backed allowlist. We will divide the database into three zones:

1.  **`bookings/{bookingId}` Collection**:
    *   `create`: Allowed for anyone (including unauthenticated visitors) *if and only if* the submitted payload passes schema validation (all required fields present, types correct, and `status` is explicitly set to `'pending'`).
    *   `read`, `update`: Restricted to authenticated admin users.
    *   `delete`: Disabled (`allow delete: if false`). Bookings are archived or marked `cancelled` via status update but never permanently deleted.
2.  **`admins/{email}` Collection**:
    *   `read`: Allowed only for the authenticated user whose email matches the document ID (e.g. `request.auth.token.email == email`).
    *   `write`: Disabled entirely in code. Administration privileges are managed manually inside the Firebase Console by adding/removing documents in this collection.
3.  **All Other Collections**:
    *   `read`, `write`: Denied by default (`allow read, write: if false`).

### Server-Side Identity Verification

Admin verification in the rules is checked by reading from the `admins` collection using the `exists()` function:

```javascript
function isAdmin() {
  return request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.token.email));
}
```

---

## Rationale

*   **Server-Side Security**: Moving the authorization logic to Firestore rules guarantees security. Even if a user bypasses the UI and attempts to query the REST API directly, the database layer will return a `403 Forbidden`.
*   **Dynamic Administration management**: Adding or removing an admin no longer requires a git commit or project rebuild. Ryan can add or revoke admin access instantly in the Firebase Console by editing the `admins` collection.
*   **Schema Safety at the Database Layer**: Restricting public booking creation to `status == 'pending'` ensures that clients cannot inject pre-confirmed bookings into the system. Required field checks protect data integrity.
*   **No Code Coupling**: Keeps emails out of git repository commits and the compiled JavaScript bundle.

---

## Consequences

**Positive:**
*   Eliminates the risk of exposing client PII (resolves **F-01**).
*   Correctly secures the admin route (resolves **F-02**).
*   Enforces booking field integrity (strict typing, required fields, and initial status check).
*   Enables dynamic admin membership administration via the Firebase console.

**Negative:**
*   **Operational Dependency**: Before deploying the new rules, the `admins` collection must be created and populated in Firestore. Deploying rules before this step will lock out all administrators.
*   **Test Suite Mocking**: Local tests and E2E automation must mock Firebase Auth credentials/tokens or bypass rules using the Local Emulator to run successfully.

**Neutral:**
*   Admin authorization requires an additional Firestore read hook (costs 1 read operation per admin check, which is negligible under Firebase free quotas).

---

## Alternatives Considered

*   **Firebase Auth Custom Claims**: We considered setting custom claims (e.g. `admin: true`) on the user record. This is rejected because setting custom claims requires a custom backend setup (such as a Firebase Cloud Function or Admin SDK script). The Firestore document presence check (`exists()`) is self-contained within security rules and requires zero administrative backend code.
*   **Email Domain Restrictions (e.g. `*@freshnest.co`)**: Checking whether the email ends in `@freshnest.co` in the rules. Rejected because our primary administrators use standard `@gmail.com` accounts, and we do not wish to mandate GSuite organizational emails for operations.
