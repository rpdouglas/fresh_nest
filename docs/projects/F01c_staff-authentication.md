# F01c — FSM Staff Authentication & Login
**Epic:** F01 | **Phase:** Phase 1 (Infrastructure) | **Date:** June 13, 2026  
**Primary Personas:** Ahmed (P10 - Bilingual UI, Magic link), Dev Team (Ryan)  
**Dependencies:** F01a, F01b  

---

## 1. Context & User Story

As a staff member (like Ahmed), I want to log in securely to the FSM portal using my email and either a password or a direct magic link sent to my inbox so that I can access my schedule without needing to remember a complex password on my mobile phone.

---

## 2. Technical Architecture & Enrollment Rules

The authentication flow utilizes Firebase Authentication's email/password and passwordless magic link methods:
1. The user inputs their email.
2. The system checks Firestore `/staff` for a document matching the email. If no approved staff record exists, sign-in/link generation is blocked with a user-friendly error.
3. If approved, the user can either sign in with a password or trigger `sendSignInLinkToEmail` for a magic link.
4. On success, the session state is managed via a React context and a `useStaffAuth` hook.

---

## 3. Implementation Steps

### Step 1: Add i18n Translation Keys
Add translation keys in `apps/fsm/src/i18n/locales/` (`en.json`, `fr.json`) for login fields, errors (e.g. "email not found", "invalid credentials"), and placeholders.

### Step 2: Implement the `useStaffAuth` Hook
Create `apps/fsm/src/hooks/useStaffAuth.ts` which exposes:
- `user`: User object from Firebase Auth or `null`.
- `staffProfile`: Staff profile document from Firestore `staff` collection or `null`.
- `loading`: Boolean state.
- `error`: Error state.
- `signInWithPassword(email, password)`: Sign-in handler.
- `sendMagicLink(email)`: Triggers passwordless email link setup.
- `completeMagicLinkSignIn()`: Validates magic link parameters on landing.
- `logout()`: Signs the user out.

### Step 3: Build the Login Page
Create `apps/fsm/src/pages/LoginPage.tsx`:
- Toggle buttons for Language Selection (EN / FR).
- Forms for Email + Password sign-in.
- Button to request a Magic Link (triggers `sendMagicLink`).
- Clean visual states (loading spinners, error alerts) matching the warm-white, slate-brand, and sand design system.

### Step 4: Create Router Guards and Protected Routes
Create a `<ProtectedRoute>` component in `apps/fsm/src/components/auth/ProtectedRoute.tsx` that redirects to `/login` if no authenticated staff session is detected.
Update `apps/fsm/src/App.tsx` to wrap schedule, dashboard, and job paths with the protected route guard.

---

## 4. Persona Acceptance Tests

*   **P10 Ahmed (Bilingual UX & Magic Link):**
    Ahmed opens the portal on his mobile. He switches the language toggle between English and French. The interface text changes accordingly. He enters his email and clicks "Send Magic Link". He receives the email, clicks it, and is redirected to the FSM portal where he is automatically logged in and lands on the dashboard without password entry.
*   **Intruder / Public User:**
    An unauthorized user enters their email and attempts to log in or request a magic link. The app returns a clear bilingual validation error: "Access Denied. Your email is not registered in the system." No magic link is sent.
