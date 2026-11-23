# 0021. Dual-agent setup: Claude Code and Antigravity (agy)

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

Claude Code (`.claude/`) and Google Antigravity CLI (`agy`, `.agents/`) operate with identical rules, skills, and safety guards:

1. **Shared rules and skills via symlinks.** `.agents/rules` symlinks to `../.claude/rules`, and `.agents/skills` symlinks to `../.claude/skills`. Changes to any rule or skill apply immediately to both tools.
2. **Unified safety hook (`guard-bash`).** `.agents/hooks.json` hooks `run_command` and `view_file` through `.claude/hooks/guard-bash.sh`. `guard-bash.mjs` handles both Claude Code and Antigravity hook protocols:
   - Blocks unscoped Firebase deploys (`--only functions:schedule,hosting:schedule`), `--force`, and Firestore rules deploys.
   - Blocks deploys off `main` or with running/failed CI.
   - Blocks `gh pr merge` before CI checks pass.
   - Blocks opening `schedule_by_client.html` (which contains real client PII), and, since 2026-10-13, any command that names it (`cat`, `head`, `grep`): before that only the file viewer was covered.
3. **Shared second-look review skill.** `skills/code-review/SKILL.md` defines the procedure for reviewing risky changes (pay/billing rules, auth, Camelo writes, CI/guard) in both tools.
4. **CI verification.** `scripts/check-docs.mjs` verifies that `.agents/rules` and `.agents/skills` symlinks remain healthy, and `.agents/hooks.json` is valid. `scripts/check-docs-updated.mjs` recognizes `.agents/` in doc checks.

## Why

Having two agents operate under different capabilities or safety guards creates drift, risks unverified deploys, and adds maintenance burden. Symlinks and a dual-protocol hook ensure zero duplication and guaranteed synchronization.

## Where it lives

`.agents/`; `.claude/`; `AGENTS.md`; `scripts/check-docs.mjs`; `scripts/check-docs-updated.mjs`.
