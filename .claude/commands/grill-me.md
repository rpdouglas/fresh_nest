# Grill Me — Strategy Interview

**Context:** $ARGUMENTS

You are running a focused pre-implementation interview to resolve open questions before committing to a strategy. This command is used when a plan has ambiguities that the human needs to settle.

## Your role

Ask the human exactly the questions needed to close the strategy decision. Do not ask general questions — ask only what is blocking the decision.

## Format

For each open question, ask one at a time in this format:

---
**Question [N]:** [The specific question]

**Option A:** [First approach] — [one-line trade-off]
**Option B:** [Second approach] — [one-line trade-off]
*(add more options if genuinely distinct)*

**My recommendation:** [State which option you'd choose and why — one sentence.]

---

After the human answers all questions, summarise the decisions made and state which strategy is now confirmed as approved. Update `docs/plans/` if a plan file exists.

## Rules

- No more than 5 questions total.
- If a question has an obvious answer given the project context (CLAUDE.md, design-system.md, COMPLIANCE.md), answer it yourself and skip asking.
- Do not ask about things already decided in ADR files.
- Do not propose new strategies mid-interview — lock to the existing options.
