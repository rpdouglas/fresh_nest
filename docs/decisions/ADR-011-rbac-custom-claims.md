# ADR-011 — Custom Claims RBAC Role Taxonomy & onCreate Trigger
**Status:** Accepted  
**Date:** 2026-06-16  
**Deciders:** Dev Team, Ryan (Owner)

## Context
For multi-role security across our customer and FSM applications (**Epic P2-E8**), we need a robust access control mechanism. The existing pattern relies on checking if the user's email exists in a Firestore `/admins` collection. Doing this check in security rules on every request is expensive and doesn't scale to handle multiple roles (admin, supervisor, staff cleaner, customer).

## Decision
1. Implement Firebase Custom Claims to store role information on the user's authentication token.
2. Define a strict role taxonomy:
   - `admin`: Full administrative access to both marketing, customer portal, and FSM administration.
   - `supervisor`: Access to bookings and staff, but restricted from sensitive financial data.
   - `staff`: Access to the FSM app only, with permissions limited to their assigned shifts/jobs.
   - `customer`: Access to their own bookings only, gated in the customer portal.
3. Automatically assign the `customer` role to new users via a Firebase Auth `onCreate` Cloud Function trigger:
   - When a new auth account is created, the Cloud Function runs, sets `{ role: 'customer' }` in custom claims, and creates a `/customers/{uid}` profile.
4. Refactor `firestore.rules` helper methods to validate roles via tokens instead of collection lookups:
   ```javascript
   function isAdmin() {
     return request.auth != null && request.auth.token.role == 'admin';
   }
   function isSupervisor() {
     return request.auth != null && (request.auth.token.role == 'supervisor' || request.auth.token.role == 'admin');
   }
   function isStaff() {
     return request.auth != null && (request.auth.token.role == 'staff' || request.auth.token.role == 'admin');
   }
   ```

## Rationale
- **Performance & Cost:** Token custom claims eliminate the need for a Firestore document lookup (`exists()`) on every single database security rule execution, drastically reducing Firestore read costs.
- **Security Boundaries:** Custom Claims are cryptographically signed by Google, making them tamper-proof. They cannot be modified client-side.
- **Reliable Automation:** Using an auth trigger ensures that no customer account can bypass the default role assignment.

## Consequences
- **Positive:** Eliminates database document lookup overhead in Firestore rules; provides role-based routes out-of-the-box.
- **Negative:** Firebase custom claims take effect upon token refresh, meaning users might need to force-refresh their auth token (`getIdToken(true)`) immediately after their role is elevated by an admin.

## Alternatives Considered
- **Firestore-based Role Collection:** Rejected. Too expensive (generates a read on every query/write rules check).
- **Implicit Rules Mapping:** Rejected. Treating no-role as customer makes rules less readable and increases the risk of accidental privilege escalation if a role claim is misconfigured.
