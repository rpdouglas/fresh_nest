# P3-E5: CI/CD Pipeline Hardening — Phase A Strategy Plan

**Epic:** P3-E5 · **Priority:** P1 · **Complexity:** S
**Prepared:** 2026-06-18
**Persona gate:** High-severity CVEs block every deploy. Lighthouse scores visible on every PR.

---

## Strategy 1 — Full Suite: npm audit + Dependabot + Lighthouse CI + CodeQL (Recommended)

**What:** Add all four pipeline hardening mechanisms in a single PR. Each targets a distinct risk surface: dependency vulnerabilities (npm audit), dependency freshness (Dependabot), performance regression (Lighthouse CI), and code-level security (CodeQL).

**Files changed:**
- `.github/workflows/firebase-deploy.yml` — add `npm audit --audit-level=high --workspaces` step before the build step; build fails on high-severity CVE
- `.github/dependabot.yml` — new file: weekly PRs for npm packages across all workspaces (`apps/customer`, `apps/fsm`, `functions`, root)
- `.github/workflows/firebase-preview.yml` — add Lighthouse CI step: runs against Firebase preview channel URL; posts score comment on PR via `treosh/lighthouse-ci-action`
- `.github/workflows/codeql.yml` — new workflow: runs on PR + push to main; JS/TS language; standard security query suite
- `apps/customer/vite.config.ts` — add `rollup-plugin-visualizer` (already planned for P3-E2 — coordinate so it's added once)
- `docs/decisions/ADR-012-rollback-procedure.md` — new ADR: documented rollback steps (revert commit + `firebase deploy` from previous tag)

**Persona impact:** No user-facing change. Operator (Lauren) and developer benefit from early CVE detection, automated dependency updates (fewer manual security patches), and Lighthouse score visibility that prevents Performance regressions from sneaking into PRs.

**Risks:**
- `npm audit --audit-level=high` may immediately flag existing high-severity CVEs in the current `node_modules` — run a pre-check before adding the gate so the deploy isn't broken on day one; remediate first if needed
- Lighthouse CI requires the Firebase preview channel URL to be accessible; preview channel must be deployed before Lighthouse step runs — order the workflow steps accordingly
- CodeQL scans can take 5–10 minutes; add to a parallel job to avoid blocking the deploy pipeline

**Schema audit:** No Firestore changes. No `docs/firestore-schema.md` update required.

---

## Strategy 2 — Security Gate Only: npm audit + Dependabot

**What:** Add `npm audit` as a deploy gate and Dependabot for weekly dependency PRs. Skip Lighthouse CI and CodeQL.

**Files changed:**
- `.github/workflows/firebase-deploy.yml` — add npm audit step
- `.github/dependabot.yml` — new file

**Persona impact:** Dependency vulnerabilities blocked from deploy. No performance regression detection, no code-level security scanning.

**Risks:** Without Lighthouse CI, performance regressions from new PRs are invisible until after deploy. After P3-E2 (code splitting) ships, the payload target must be maintained — without Lighthouse on PRs, this is unenforceable. CodeQL absence leaves code-level security patterns (XSS vectors, prototype pollution) unchecked — especially relevant when Stripe integration code ships.

**Schema audit:** None.

---

## Strategy 3 — Quality Gate Only: Lighthouse CI + CodeQL

**What:** Add Lighthouse CI for performance scoring on PRs and CodeQL for security scanning. Skip `npm audit` gate and Dependabot.

**Files changed:**
- `.github/workflows/firebase-preview.yml` — add Lighthouse CI step
- `.github/workflows/codeql.yml` — new workflow

**Persona impact:** Performance and security code quality visible on PRs, but known CVEs in dependencies are not blocked. Dependency freshness remains a manual responsibility.

**Risks:** Without `npm audit`, a high-severity CVE in a transitive dependency can ship to production undetected. Without Dependabot, security patches for dependencies remain manual and are easily missed in a small team. This strategy inverts the priority — code scanning is good but dependency hygiene is more immediately actionable.

**Schema audit:** None.

---

## Recommended Strategy: **Strategy 1**

All four mechanisms are S-complexity individually and ship in a single PR. The pre-check on existing CVEs is the only gotcha — run `npm audit --audit-level=high` locally first and patch before adding the gate. Strategy 1 is the complete, planned approach.

**Awaiting human approval to proceed to Phase B.**
