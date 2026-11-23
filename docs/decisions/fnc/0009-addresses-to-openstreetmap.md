# 0009. Job-site addresses may be sent to OpenStreetMap

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

To estimate drive times, each job-site address is looked up once at OpenStreetMap's Nominatim service and the position is kept. Only the address is sent, from the server, never a client's name.

## Why

Camelo holds no coordinates, and this is free. The owner approved sending addresses.

## Where it lives

`.claude/rules/dashboard.md`; `handleScheduleCheck` in `functions/src/core.ts`; `docs/operations.md`.
