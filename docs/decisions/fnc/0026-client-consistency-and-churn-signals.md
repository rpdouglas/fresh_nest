# 0026. Client consistency and churn signals

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

1. **Cleaner-client consistency score.** On By Client and Client Hours reports, recurring clients show an 8-week pairing consistency badge (% of visits performed by their primary cleaner).
2. **Schedule check warning.** Schedule check adds a soft warning when an upcoming shift books a cleaner who has not previously serviced that recurring client.
3. **Lapsed cadence churn alert.** Dashboard "Needs attention" adds a summary counter ("X recurring clients lapsed") flagging recurring clients whose cadence has lapsed with no upcoming booking in the next 14–28 days, linking directly to a filtered view on By Client.

## Why

In residential cleaning, team consistency is the single largest driver of customer retention. Unparking consistency and churn signals into Phase 3 provides early warning before clients formally cancel service.

## Where it lives

`docs/project-plan.md` (Sprint 3.2); `web/src/lib/scheduleCheck.ts`; `web/src/components/DashboardView.tsx`; `web/src/components/GroupCard.tsx`.
