# 0002. Timesheets cannot be deleted from the site

- Date: by 2026-10-10 (when editing from the site was added; the exact day was not recorded)
- Decided by: Owner
- Status: In force

## Decision

The site can approve, reject, edit and add timesheets. It cannot delete one.

## Why

The owner's choice. The reason was not recorded.

## Where it lives

`.claude/rules/timesheet-review-and-changes.md`; there is no delete action in `functions/src/core.ts`.
