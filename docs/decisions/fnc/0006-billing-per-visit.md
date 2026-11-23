# 0006. Billing is $75 an hour per visit

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

A visit is billed at $75 an hour however many cleaners attend. Its time is the average of the cleaners' times, rounded to the nearest 15 minutes for each visit. Only approved visits are billed.

## Why

The owner's pricing rule.

## Where it lives

`.claude/rules/client-hours-billing.md`; `web/src/lib/billing.ts`.
