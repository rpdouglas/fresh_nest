/**
 * P3-E34: job checklist snapshots.
 *
 * A job keeps its own copy of the checklist tasks it was given, so editing or deleting a
 * saved list (checklistTemplates) never changes a job that is already scheduled or done.
 */

export type ChecklistSource = 'auto' | 'template' | 'custom'

export interface ChecklistTaskData {
  id: string
  labelEn: string
  labelFr: string
  icon: string
  requiresPhoto: boolean
  photoPhase: 'before' | 'after' | null
}

export interface ChecklistSnapshot {
  checklistTemplate: string
  checklistName: string
  checklistSource: ChecklistSource
  checklistTasks: ChecklistTaskData[]
}

export const EMPTY_CHECKLIST: ChecklistSnapshot = {
  checklistTemplate: '',
  checklistName: '',
  checklistSource: 'auto',
  checklistTasks: [],
}

/** Copies a template's tasks in display order, keeping only the fields the cleaner app uses. */
export function snapshotTasks(tasks: unknown): ChecklistTaskData[] {
  if (!Array.isArray(tasks)) return []
  return tasks
    .map((task, index) => ({ task: (task ?? {}) as Record<string, unknown>, index }))
    .sort((a, b) => {
      const ao = typeof a.task.order === 'number' ? a.task.order : a.index
      const bo = typeof b.task.order === 'number' ? b.task.order : b.index
      return ao - bo
    })
    .filter(({ task }) => typeof task.id === 'string' && task.id !== '')
    .map(({ task }) => ({
      id: task.id as string,
      labelEn: typeof task.labelEn === 'string' ? task.labelEn : '',
      labelFr: typeof task.labelFr === 'string' ? task.labelFr : '',
      icon: typeof task.icon === 'string' ? task.icon : '✅',
      requiresPhoto: task.requiresPhoto === true,
      photoPhase: task.photoPhase === 'before' || task.photoPhase === 'after' ? task.photoPhase : null,
    }))
}

export function snapshotFromTemplate(
  templateId: string,
  template: Record<string, unknown>,
  source: ChecklistSource,
): ChecklistSnapshot {
  return {
    checklistTemplate: templateId,
    checklistName: typeof template.name === 'string' ? template.name : '',
    checklistSource: source,
    checklistTasks: snapshotTasks(template.tasks),
  }
}
