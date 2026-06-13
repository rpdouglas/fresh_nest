# F01b — FSM Hosting Target & Firestore Rules Setup
**Epic:** F01 | **Phase:** Phase 1 (Infrastructure) | **Date:** June 13, 2026  
**Primary Personas:** Owner (Lauren), Dev Team (Ryan)  
**Dependencies:** F01a  

---

## 1. Context & User Story

As an administrator, I want to configure the hosting and database routing for the FSM staff portal so that it deploys securely to its own domain (`freshnest-fsm`) and can read/write FSM-specific collections (`staff`, `jobs`, `payRates`, etc.) under strict security constraints.

---

## 2. Technical Architecture

The FSM portal runs on the same Firebase project but requires a dedicated hosting target mapped to a separate site in the console. The Firestore security rules must be updated to restrict access to FSM collections:
- `staff` collection: Authenticated staff can read their own profile; admins can read/write all.
- `jobs` collection: Cleaners can read/write status/checklists on their assigned jobs; admins can read/write all.
- `payRates`, `checklistTemplates`: Admins write, authenticated staff read.
- `auditLog`: Writeable by Cloud Functions (service accounts) only; admins read.

---

## 3. Implementation Steps

### Step 1: Register Hosting Target (Manual Pre-requisite)
1. Open [Firebase Console](https://console.firebase.google.com) → project `freshnest-aa51e`.
2. Go to **Hosting** → click **Add another site**.
3. Create a site with ID `freshnest-fsm`.
4. Verify **Firebase Storage** is active.

### Step 2: Update `.firebaserc`
Add the new target routing configuration under `targets.freshnest-aa51e.hosting`:
```json
{
  "projects": {
    "default": "freshnest-aa51e"
  },
  "targets": {
    "freshnest-aa51e": {
      "hosting": {
        "freshnest-prod": ["lilypad-freshnest"],
        "freshnest-dev": ["lilypad-freshnest-dev"],
        "freshnest-fsm": ["freshnest-fsm"]
      }
    }
  }
}
```

### Step 3: Update `firebase.json`
Add the FSM hosting configuration block under `hosting`. Ensure Content-Security-Policy (CSP) allows photo uploads to Storage:
```json
    {
      "target": "freshnest-fsm",
      "public": "apps/fsm/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [
        { "source": "**/*.@(js|css|woff2)", "headers": [
            { "key": "Cache-Control", "value": "max-age=31536000, immutable" }
        ]},
        { "source": "**", "headers": [
            { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://firebasestorage.googleapis.com; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://firebasestorage.googleapis.com; frame-ancestors 'none';" }
        ]}
      ]
    }
```

### Step 4: Extend Firestore Security Rules
Add the following blocks to both `firestore.rules` and `firestore.dev.rules` before the catch-all `match /{document=**}`:
```javascript
    // ── FSM Collections ──────────────────────────────────────────────────────────
    match /staff/{staffId} {
      allow read:  if (request.auth != null && request.auth.uid == staffId) || isAdmin();
      allow write: if isAdmin();
    }

    match /jobs/{jobId} {
      allow read:   if (request.auth != null && resource.data.assignedTo == request.auth.uid) || isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin()
        || (request.auth != null
            && resource.data.assignedTo == request.auth.uid
            && request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['status', 'checkedInAt', 'checkedInGeo', 'completedAt', 'checklistCompletions'])
           );
      allow delete: if false;
    }

    match /payRates/{rateId} {
      allow read:   if isAdmin();
      allow create: if isAdmin();
      allow update, delete: if false;
    }

    match /auditLog/{logId} {
      allow read:   if isAdmin();
      allow create: if false; 
      allow update, delete: if false;
    }

    match /checklistTemplates/{templateId} {
      allow read:  if request.auth != null;
      allow write: if isAdmin();
    }

    match /notifications/{staffId}/messages/{messageId} {
      allow read:   if request.auth != null && request.auth.uid == staffId;
      allow create: if false;
      allow update, delete: if false;
    }
```

### Step 5: Configure FSM App Local Environment
Create `apps/fsm/.env.local` with the Firebase keys of the dev project matching `apps/customer/.env.local`, setting `VITE_FIRESTORE_DB_ID=freshnest-dev`. Ensure it is gitignored.

### Step 6: Update GitHub Actions Deploy Workflows
Update `.github/workflows/firebase-deploy.yml` and preview workflows to split builds and deploy both `freshnest-prod` (from `apps/customer`) and `freshnest-fsm` (from `apps/fsm`).

---

## 4. Persona Acceptance Tests

* **Ryan (Dev Team / Audit):**
  - Running `firebase deploy --only hosting:freshnest-fsm` deploys the FSM portal successfully to the newly registered hosting site.
  - Running `firebase deploy --only firestore:rules` successfully deploys security rules.
  - Reading the `staff` or `jobs` collections as an unauthenticated user or cross-staff member yields a `PERMISSION_DENIED` error.
  - Updating a job's status/checklist completions as the assigned cleaner is allowed, but updating the job's client metadata or pay rate snapshot is denied.
