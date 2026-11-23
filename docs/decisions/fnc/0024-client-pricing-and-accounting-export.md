# 0024. Client pricing rules and accounting export

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

1. **Client pricing rules.** A client's billing model may be set in Firestore (`scheduleClientRates`, e.g. Client X = $180 flat-rate, default = $75/h hourly per visit). An in-app screen allows signed-in editors to manage client pricing rules. The Invoicing view automatically applies these rules.
2. **Accounting export.** The Invoicing view provides 1-click downloads for both:
   - **QuickBooks Online CSV** matching QBO's standard invoice import schema.
   - **Universal Accounting CSV** with customer, date, site, hours, rate, and amount.
3. **Prompt on export.** Exporting prompts the editor: "Mark exported rows as invoiced?", allowing a 1-click update of the Invoicing status in Firestore.

Decision 0006 (a visit is billed at $75 an hour) stays as the default; this adds a rule per client on top of it.
Decision 0033 settles what this left open: a price has a start date, what one QuickBooks invoice is, and where
invoice numbers come from.

## Why

Benchmark against residential cleaning software (Jobber, ZenMaid) revealed that a flat $75/h rate penalizes efficient teams on fixed-price jobs, and manual data entry from FNC Landing into QuickBooks takes considerable bookkeeper time every week.

## Where it lives

`docs/project-plan.md` (Sprint 1.4); `web/src/lib/billing.ts`; `web/src/lib/invoicing.ts`; `web/src/components/InvoicingView.tsx`; `functions/src/core.ts`.
