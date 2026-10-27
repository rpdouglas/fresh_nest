import type { ChecklistTask, Job } from '@/types'

// P3-E34: shared helpers for saved lists (checklistTemplates) and job checklists.

export const ICON_OPTIONS = [
  { value: '🧹', label: 'Sweep / Broom' },
  { value: '🧽', label: 'Scrub / Sponge' },
  { value: '🪣', label: 'Bucket / Mop' },
  { value: '🚿', label: 'Shower' },
  { value: '🛁', label: 'Bathtub' },
  { value: '🚽', label: 'Toilet' },
  { value: '🪟', label: 'Windows' },
  { value: '🛏️', label: 'Bed / Linens' },
  { value: '🧺', label: 'Laundry' },
  { value: '🍽️', label: 'Dishes / Kitchen' },
  { value: '♻️', label: 'Trash / Recycling' },
  { value: '🏠', label: 'General / Room' },
  { value: '📸', label: 'Photo Required' },
  { value: '✅', label: 'Checklist Item' },
]

let taskSeq = 0
export function newTask(order: number): ChecklistTask {
  taskSeq += 1
  return {
    id: `task-${Date.now()}-${taskSeq}`,
    labelEn: '',
    labelFr: '',
    icon: '✅',
    requiresPhoto: false,
    photoPhase: null,
    order,
  }
}

/** Tasks in display order with `order` renumbered — what gets saved on a list or a job. */
export function orderedTasks(tasks: ChecklistTask[]): ChecklistTask[] {
  return tasks.map((task, index) => ({
    ...task,
    photoPhase: task.requiresPhoto ? (task.photoPhase ?? 'after') : null,
    order: index,
  }))
}

/** Every task needs both an EN and an FR label: cleaners see the list in their own language. */
export function hasMissingLabels(tasks: ChecklistTask[]): boolean {
  return tasks.some((task) => !task.labelEn.trim() || !task.labelFr.trim())
}

/**
 * A job's checklist can change only before work starts. Completions are stored by task ID, so
 * swapping the list after any task is done would orphan the cleaner's proof.
 */
export function canChangeChecklist(job: Pick<Job, 'status' | 'checklistCompletions'>): boolean {
  return (
    ['unassigned', 'assigned', 'acknowledged'].includes(job.status)
    && (job.checklistCompletions?.length ?? 0) === 0
  )
}
