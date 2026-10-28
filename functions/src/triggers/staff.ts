import { onDocumentUpdated } from 'firebase-functions/v2/firestore'

// F12 → P3-E37: staff audit entries now come from `auditStaff` (triggers/audit.ts), which records
// who made the change instead of a hard-coded 'admin'. This trigger is kept as a no-op only so the
// non-interactive production deploy doesn't have to delete a function (that needs `--force`);
// remove it with a forced deploy later (ACTIVE_CYCLE F17).
export const onStaffUpdatedTrigger = onDocumentUpdated(
  {
    document: 'staff/{docId}',
    database: '(default)',
  },
  async () => {},
)
