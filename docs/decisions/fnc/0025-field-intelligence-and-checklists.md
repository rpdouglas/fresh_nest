# 0025. Field intelligence and checklists

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

1. **Smart property badges.** Camelo notes (`jobSite.note` and `shift.note`) are automatically parsed for common security and hazard keywords (Lockbox, Alarm, Code, Keys, Dog, Cat, Pet) and highlighted with high-contrast badges on Daily Teams, the Google Doc export, and the upcoming Live Board.
2. **Checklist visibility.** Assigned Camelo checklists (`checklistAssignments`) are displayed on Daily Teams visit rows and the Live Board.
3. **Approval compliance warning.** In Unapproved timesheets (`ReviewView.tsx`), shifts with incomplete checklists (<100%) display a warning badge, alerting managers before approving time.

## Why

Cleaners need immediate, high-visibility access to entry codes and pet precautions without reading paragraphs of unformatted text. Managers need assurance that turnover checklists were completed before timesheets are approved for payroll.

## Where it lives

`docs/project-plan.md` (Sprint 1.5); `web/src/components/TeamsView.tsx`; `web/src/components/ReviewView.tsx`; `web/src/lib/teamsText.ts`.
