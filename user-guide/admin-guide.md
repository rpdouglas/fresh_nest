# Admin Guide — Fresh Nest Co.
**For:** Ryan (Owner/Admin)  
**Updated:** 2026-06-06

---

## Accessing the Admin Dashboard

> **Phase 5 feature** — Admin dashboard with Firebase Auth will be built in Epic E28.

Once live, navigate to [lilypad-freshnest.web.app/admin](https://lilypad-freshnest.web.app/admin) and sign in with your authorized Google account.

---

## Viewing and Managing Bookings

### Booking Statuses
| Status | Meaning |
| :--- | :--- |
| `pending` | New booking submitted, not yet confirmed |
| `confirmed` | Booking confirmed and scheduled |
| `completed` | Clean completed |
| `cancelled` | Booking cancelled by client or owner |

### Updating a Booking
1. Find the booking in the dashboard table.
2. Use the **Status** dropdown to update the status.
3. Use the **Assigned To** field to assign a cleaner by name.

---

## Firestore Databases

| Environment | Database | Used For |
| :--- | :--- | :--- |
| Production | `(default)` | Real client bookings |
| Development | `freshnest-dev` | Testing and preview PRs |

To view databases: [Firebase Console → Firestore](https://console.firebase.google.com/project/freshnest-aa51e/firestore)

---

## Deploying Updates

### Automatic (Recommended)
- Push commits to `main` → GitHub Actions automatically builds and deploys to production.
- Open a PR → GitHub Actions creates an ephemeral preview URL (7-day expiry).

### Manual (Emergency)
```bash
npm run build
firebase deploy --only hosting:freshnest-prod
```

---

## Critical Rules

- **Never commit `.env.local`** — it contains private credentials.
- **Never modify `firestore.rules` without human review** — security changes require approval.
- **Never run `git push` directly** — always create a PR for review.
- **Always run `npm run build` before any deploy** — catch TypeScript errors before CI.
