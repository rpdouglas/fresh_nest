# Phase A Plan: P1-E1 Secrets & Security Remediation

This plan outlines three strategies for removing `.env.production` from git history and securing referrals security rules.

---

## Strategy 1: Git filter-repo script & Credential Rotation (Recommended)
This strategy uses `git filter-repo` (a modern replacement for `git filter-branch`) to completely excise `.env.production` from all git history branches and tags. It includes rotating credentials and fixing firestore rules.

### Files Changed
- `.gitignore` (ensure tracking rules are robust)
- `firestore.rules` (modify referrals rule)
- `scripts/cleanup-git-history.sh` (new utility script for the user)
- `docs/decisions/ADR-008-secrets-management.md` (new ADR)

### Persona Impact
- **Developer Team / Operator**: Ensures zero trace of admin emails or keys in git repository. Forces a local clean/re-clone for active branches but guarantees PIPEDA compliance.

### Risks & Mitigations
- *Risk*: Rewriting history breaks active feature branches of other developers.
- *Mitigation*: Run on main branch when developer activity is low; instruct developers to rebase or fresh-clone.

### Schema Audit
- No fields added or removed.
- Firestore Security Rules:
  ```diff
  match /referrals/{promoCode} {
-   allow read: if true;
+   allow get: if true;
  }
  ```

---

## Strategy 2: BFG Repo Cleaner (Alternative)
Use the JVM-based BFG Repo Cleaner tool instead of `git filter-repo`.

### Files Changed
- Same as Strategy 1 (except cleanup script uses BFG command syntax).

### Persona Impact
- Same as Strategy 1.

### Risks & Mitigations
- *Risk*: BFG requires Java runtime locally, which might not be installed on the operator's machine.
- *Mitigation*: Provide detailed prerequisite instructions in the script or use a dockerized BFG run.

### Schema Audit
- Same as Strategy 1.

---

## Strategy 3: Standard Git Commit Removal (No History Rewrite)
Remove `.env.production` from the current commit, rotate all credentials to invalidate the exposed history, and set up future secrets in GitHub Secrets.

### Files Changed
- `.gitignore`
- `firestore.rules`
- `docs/decisions/ADR-008-secrets-management.md`

### Persona Impact
- **Developer Team / Operator**: Simplest transition; no history rewriting or force-pushing required.

### Risks & Mitigations
- *Risk*: High security exposure if the repository is ever made public or shared with third parties, as the history still contains the credentials and admin emails.
- *Mitigation*: Invalidation of all rotated credentials mitigates key misuse, but admin email addresses (PII) remain permanently in history.

### Schema Audit
- Same as Strategy 1.
