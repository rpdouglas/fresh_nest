# AGY Phase C — Ticket Close

**Epic:** $ARGUMENTS

You are entering Phase C of the AGY 3-Phase Gate. Implementation is complete and the build is green.

## Steps (execute in order)

1. **Update `docs/ACTIVE_CYCLE.md`** — mark the epic as `Completed ✅` with today's date.

2. **Update `docs/firestore-schema.md`** — ONLY if new fields were added during this epic. If no schema changes were made, skip this step and say so explicitly.

3. **Write close report** at `docs/reports/$ARGUMENTS-close-YYYY-MM-DD.md` (use today's date). Include:
   - Epic ID and title
   - Approved strategy name and why it was chosen
   - Files created or modified (with paths)
   - Persona tests — name each one and state pass/fail explicitly
   - Any deviations from the approved plan and why
   - Known limitations or follow-up work

4. **Update `user-guide/`** — if any user-visible behaviour changed (new page, new form field, new flow). If nothing user-visible changed, skip and say so.

5. **Persona test gate** — name each primary persona for this epic and state the acceptance criteria from the epic spec. Confirm pass or fail for each.

## Final output

Return a one-paragraph summary: what was built, which personas it serves, and what the close report path is.

**Stop. Do not commit. Do not push. The human handles git.**
