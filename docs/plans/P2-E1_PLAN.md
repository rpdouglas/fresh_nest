# Phase A Plan: P2-E1 Customer Account Portal

This plan outlines three strategies for building the Customer Account Portal, enabling authenticated customer self-service scheduling, rebooking, cancellations, and profile management.

---

## Strategy 1: Passwordless Magic-Link + Google Sign-In with Auth onCreate Trigger (Recommended)
This strategy implements Firebase Auth email link authentication (passwordless magic-link) as primary, with Google Sign-In as secondary. Newly registered users are assigned `{ role: 'customer' }` custom claims via a Cloud Function auth trigger.

### Files Changed
- `apps/customer/src/App.tsx` (Add `/account` routes, protected route wrapper)
- `apps/customer/src/pages/customer/` (New directory with `CustomerBookingsPage.tsx`, `CustomerProfilePage.tsx`, `CustomerUpcomingPage.tsx`, `LoginPage.tsx` or similar)
- `apps/customer/src/components/layout/Navbar.tsx` (Add customer login/portal navigation link)
- `firestore.rules` & `firestore.dev.rules` (Secure `/bookings` collection reads to match own email or admin claim)
- `functions/src/index.ts` (Add `onUserCreated` Auth trigger setting custom claim `role: 'customer'`)
- `docs/plans/P2-E1_PLAN.md` (This document)

### Persona Impact
- **P1 Diane Lafleur & P3 Margaret Storey**: Frictionless login via magic-link. They can view booking details, manage schedules, and cancel without having to remember passwords.

### Risks & Mitigations
- *Risk*: Magic-link requires correct setup of Auth Action URL and email handlers.
- *Mitigation*: Configure standard Firebase passwordless handler URL, falling back gracefully to Google Sign-In. Use robust error messages.

### Schema Audit
- Adds `/customers/{uid}` profile mapping.
- Firestore Security Rules:
  ```javascript
  match /bookings/{bookingId} {
    allow read: if request.auth != null && (request.auth.token.email == resource.data.email || request.auth.token.role == 'admin');
    allow update: if request.auth != null && request.auth.token.email == resource.data.email 
      && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
      && request.resource.data.status == 'cancelled';
  }
  ```

---

## Strategy 2: Magic-Link Only (No Google Sign-In) with Client-Side Role Set
Passwordless email authentication only, with the client-side portal triggering role assignment.

### Files Changed
- Similar to Strategy 1, except no Google Sign-In component in UI.
- No `onCreate` function; role assigned via a callable function triggered on portal load.

### Persona Impact
- Higher friction for Google users who could otherwise sign in with one click.

### Risks & Mitigations
- *Risk*: Client-triggered role assignment is prone to race conditions if rules evaluate before the claim is set/refreshed.
- *Mitigation*: Force token refresh on sign-in before routing to protected pages.

---

## Strategy 3: Traditional Email/Password Auth
Traditional username/password sign-in.

### Files Changed
- UI pages for signup/login (requires password inputs, confirmation inputs, strength checkers).
- Firebase config uses email/password auth provider.

### Persona Impact
- High friction for elderly/occasional users (P3 Margaret) who may forget their passwords.

### Risks & Mitigations
- *Risk*: Credentials stuffing and lockouts increase customer support load.
- *Mitigation*: Implement standard reset password email templates.
