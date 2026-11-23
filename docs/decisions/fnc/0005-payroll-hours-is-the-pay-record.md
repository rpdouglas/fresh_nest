# 0005. Payroll hours is the pay record

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

Nothing is paid out of Camelo. The Payroll hours report goes to the bookkeeper every week, so its totals and rounding are what gets paid.

## Why

Stated by the owner when asked whether hiding On Call timesheets could leave them paid by Camelo.

## Where it lives

`AGENTS.md`; rounding in `web/src/lib/payroll.ts`.
