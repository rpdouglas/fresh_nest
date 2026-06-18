// Shared types — re-exported from @freshnest/shared
export type {
  Language,
  StaffLanguage,
  TransportMode,
  StaffRole,
  StaffStatus,
  BlockedWindow,
  TermsAcceptance,
  Staff,
  JobStatus,
  PayRateSnapshot,
  JobPhoto,
  ChecklistCompletion,
  Job,
  ChecklistTask,
  ChecklistTemplate,
  PayRate,
  AuditEntry,
} from '@freshnest/shared'

// FSM-app-only types

export type TaskIconType =
  | 'mop' | 'toilet' | 'trash' | 'key' | 'bed'
  | 'oven' | 'fridge' | 'window' | 'photo' | 'check'
  | 'vacuum' | 'sink'

export type EarningsSafetyState = 'safe' | 'caution' | 'at_limit'

export interface Notification {
  id: string
  title: string
  body: string
  type: 'shift_assigned' | 'shift_unassigned' | 'shift_cancelled' | 'new_shift_board_posting'
  jobId: string | null
  read: boolean
  createdAt: Date
}
