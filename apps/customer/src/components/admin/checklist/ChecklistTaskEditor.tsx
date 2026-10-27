import { useCallback, useId } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils/utils'
import type { ChecklistTask } from '@/types'
import { ICON_OPTIONS, newTask } from '@/lib/utils/checklistTasks'

// P3-E34: the task editor shared by saved lists (Checklist Templates tab) and job checklists.

// ── Sortable Task Row ─────────────────────────────────────────────────────────

interface SortableTaskRowProps {
  task: ChecklistTask
  onUpdate: (taskId: string, updates: Partial<ChecklistTask>) => void
  onDelete: (taskId: string) => void
}

function SortableTaskRow({ task, onUpdate, onDelete }: SortableTaskRowProps) {
  const { t } = useTranslation()
  const fieldId = useId()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border border-sand rounded p-4 flex flex-col gap-3',
        isDragging && 'shadow-lg border-slate-brand',
      )}
    >
      {/* Drag handle + controls row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-text-muted hover:text-charcoal p-1 touch-none min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label={t('admin.templates.task.dragHandle')}
        >
          ⠿
        </button>

        {/* Icon selector */}
        <select
          value={task.icon}
          onChange={(e) => onUpdate(task.id, { icon: e.target.value })}
          className="min-h-[40px] px-2 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
          aria-label={t('admin.templates.task.icon')}
        >
          {ICON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value} {opt.label}
            </option>
          ))}
        </select>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className={cn(
            'ml-auto min-h-[40px] px-3 py-1 border border-red-300 text-red-600 font-body text-base rounded',
            'hover:bg-red-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400',
          )}
        >
          {t('admin.templates.task.remove')}
        </button>
      </div>

      {/* EN label */}
      <div className="flex flex-col gap-1">
        <label htmlFor={`${fieldId}-labelEn`} className="font-body text-base text-charcoal font-medium">
          {t('admin.templates.task.labelEn')}
        </label>
        <input
          id={`${fieldId}-labelEn`}
          type="text"
          value={task.labelEn}
          onChange={(e) => onUpdate(task.id, { labelEn: e.target.value })}
          placeholder={t('admin.templates.task.labelEnPlaceholder')}
          className="min-h-[44px] px-3 py-2 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
        />
      </div>

      {/* FR label */}
      <div className="flex flex-col gap-1">
        <label htmlFor={`${fieldId}-labelFr`} className="font-body text-base text-charcoal font-medium">
          {t('admin.templates.task.labelFr')}
        </label>
        <input
          id={`${fieldId}-labelFr`}
          type="text"
          value={task.labelFr}
          onChange={(e) => onUpdate(task.id, { labelFr: e.target.value })}
          placeholder={t('admin.templates.task.labelFrPlaceholder')}
          className="min-h-[44px] px-3 py-2 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
        />
      </div>

      {/* requiresPhoto + photoPhase */}
      <div className="flex flex-col sm:flex-row gap-4">
        <label className="flex items-center gap-2 cursor-pointer font-body text-base text-charcoal min-h-[44px]">
          <input
            type="checkbox"
            checked={task.requiresPhoto}
            onChange={(e) =>
              onUpdate(task.id, {
                requiresPhoto: e.target.checked,
                photoPhase: e.target.checked ? (task.photoPhase ?? 'after') : null,
              })
            }
            className="w-5 h-5 rounded border-sand accent-slate-brand"
          />
          {t('admin.templates.task.requiresPhoto')}
        </label>

        {task.requiresPhoto && (
          <div className="flex flex-col gap-1">
            <label className="font-body text-base text-charcoal font-medium">
              {t('admin.templates.task.photoPhase')}
            </label>
            <select
              value={task.photoPhase ?? 'after'}
              onChange={(e) =>
                onUpdate(task.id, { photoPhase: e.target.value as 'before' | 'after' })
              }
              className="min-h-[44px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="before">{t('admin.templates.task.phaseBefore')}</option>
              <option value="after">{t('admin.templates.task.phaseAfter')}</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Task list editor ──────────────────────────────────────────────────────────

interface ChecklistTaskEditorProps {
  tasks: ChecklistTask[]
  onChange: (update: (prev: ChecklistTask[]) => ChecklistTask[]) => void
}

export function ChecklistTaskEditor({ tasks, onChange }: ChecklistTaskEditorProps) {
  const { t } = useTranslation()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleAddTask = () => {
    onChange((prev) => [...prev, newTask(prev.length)])
  }

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<ChecklistTask>) => {
    onChange((prev) => prev.map((tk) => (tk.id === taskId ? { ...tk, ...updates } : tk)))
  }, [onChange])

  const handleDeleteTask = useCallback((taskId: string) => {
    onChange((prev) => prev.filter((tk) => tk.id !== taskId))
  }, [onChange])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event
    if (over && dragActive.id !== over.id) {
      onChange((prev) => {
        const oldIndex = prev.findIndex((tk) => tk.id === dragActive.id)
        const newIndex = prev.findIndex((tk) => tk.id === over.id)
        return arrayMove(prev, oldIndex, newIndex).map((tk, idx) => ({ ...tk, order: idx }))
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-sub text-xl text-charcoal">
          {t('admin.templates.form.tasksHeading')}
        </h3>
        <span className="font-body text-base text-text-muted">
          {t('admin.templates.form.taskCount', { count: tasks.length })}
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="font-body text-base text-text-muted text-center py-6 border border-dashed border-sand rounded">
          {t('admin.templates.form.noTasks')}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map((tk) => tk.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={handleAddTask}
        className={cn(
          'min-h-[48px] px-6 py-2 border border-slate-brand text-slate-brand font-body font-medium rounded',
          'hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand self-start',
        )}
      >
        + {t('admin.templates.form.addTask')}
      </button>
    </div>
  )
}
