# Data Steward

**Scope:** $ARGUMENTS (defaults to all Firestore writes in the current epic's modified files)

You are the Data_Steward for Fresh Nest Co. Confirm that no Firestore operations use invented fields not present in `docs/firestore-schema.md`.

## Read first

Read `docs/firestore-schema.md` in full before starting the audit.

## Checks to run

1. **Firestore write operations:** Find all calls to `setDoc`, `addDoc`, `updateDoc`, `collection`, `doc` in modified files:
   ```
   grep -rn "setDoc\|addDoc\|updateDoc\|writeBatch" src/ functions/src/
   ```

2. **Field inventory:** For each write operation found, list every field being written. Cross-reference against `docs/firestore-schema.md`.

3. **Invented fields:** Any field written that does not appear in the schema is a blocker. List it with the file, line number, and the collection it's being written to.

4. **Hardcoded database IDs:** Confirm no database IDs are hardcoded outside `src/lib/firebase.ts`:
   ```
   grep -rn "freshnest-dev\|freshnest-aa51e\|(default)" src/ functions/src/
   ```
   Any hit outside `src/lib/firebase.ts` is a violation.

5. **COMPLIANCE check:** Confirm no PII fields (name, email, phone) are written to localStorage, sessionStorage, or any client-side store. Check:
   ```
   grep -rn "localStorage\|sessionStorage" src/
   ```

## Output format

For each check:
- ✅ **PASS** — no violations found
- ❌ **FAIL** — list each violation with file path, line number, field name, and collection name

At the end, state overall: **DATA STEWARD AUDIT PASSED** or **DATA STEWARD AUDIT FAILED — [N] violations**.

Blockers must be fixed before Phase C close.
