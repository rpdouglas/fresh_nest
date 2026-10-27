import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import { useChecklistTemplates } from '@/components/admin/hooks/useChecklistTemplates'
import type { ChecklistTemplate, ChecklistTask, ServiceType } from '@/types'
import { ChecklistTaskEditor } from '@/components/admin/checklist/ChecklistTaskEditor'

const SERVICE_TYPES: ServiceType[] = [
  'standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial',
]

// ── Template Form ─────────────────────────────────────────────────────────────

interface TemplateFormProps {
  initial?: ChecklistTemplate
  onSave: (template: Omit<ChecklistTemplate, 'id'>) => Promise<void>
  onCancel: () => void
}

function TemplateForm({ initial, onSave, onCancel }: TemplateFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [serviceType, setServiceType] = useState<ServiceType>(initial?.serviceType ?? 'standard')
  const [tasks, setTasks] = useState<ChecklistTask[]>(initial?.tasks ?? [])
  const [active, setActive] = useState(initial?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError(t('admin.templates.form.nameRequired'))
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const orderedTasks = tasks.map((tk, idx) => ({ ...tk, order: idx }))
      await onSave({ name: name.trim(), serviceType, tasks: orderedTasks, active })
    } catch {
      setFormError(t('admin.templates.form.saveError'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-6">
      {formError && (
        <div className="bg-red-50 border border-red-200 rounded p-4 font-body text-base text-red-700">
          {formError}
        </div>
      )}

      {/* Name + ServiceType */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="template-name" className="font-body text-base text-charcoal font-medium">
            {t('admin.templates.form.name')}
          </label>
          <input
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('admin.templates.form.namePlaceholder')}
            className="min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="template-service" className="font-body text-base text-charcoal font-medium">
            {t('admin.templates.form.serviceType')}
          </label>
          <select
            id="template-service"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as ServiceType)}
            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            {SERVICE_TYPES.map((st) => (
              <option key={st} value={st}>
                {t(`admin.templates.serviceType.${st}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-2 cursor-pointer font-body text-base text-charcoal min-h-[44px]">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="w-5 h-5 rounded border-sand accent-slate-brand"
        />
        {t('admin.templates.form.active')}
      </label>

      <ChecklistTaskEditor tasks={tasks} onChange={setTasks} />

      {/* Form actions */}
      <div className="flex justify-end items-center gap-4 border-t border-sand pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={cn(
            'min-h-[48px] px-6 py-2 border border-slate-brand text-slate-brand font-body font-medium rounded',
            'hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand',
            'disabled:opacity-50 disabled:pointer-events-none',
          )}
        >
          {t('admin.templates.form.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'min-h-[48px] px-8 py-3 bg-slate-brand text-white font-body font-medium rounded',
            'hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            'disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center min-w-[140px]',
          )}
        >
          {saving
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : initial
              ? t('admin.templates.form.update')
              : t('admin.templates.form.create')}
        </button>
      </div>
    </form>
  )
}

// ── Main ChecklistTemplateManager ─────────────────────────────────────────────

interface ChecklistTemplateManagerProps {
  isAuthorized: boolean
}

export function ChecklistTemplateManager({ isAuthorized }: ChecklistTemplateManagerProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { templates, isLoading, error, handleCreate, handleUpdate, handleDelete } =
    useChecklistTemplates(isAuthorized)

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleSaveCreate = async (template: Omit<ChecklistTemplate, 'id'>) => {
    await handleCreate(template)
    showSuccess(t('admin.templates.success.created'))
    setView('list')
  }

  const handleSaveEdit = async (template: Omit<ChecklistTemplate, 'id'>) => {
    if (!editingTemplate?.id) return
    await handleUpdate(editingTemplate.id, template)
    showSuccess(t('admin.templates.success.updated'))
    setEditingTemplate(null)
    setView('list')
  }

  const handleDeactivate = async (templateId: string) => {
    await handleDelete(templateId)
    showSuccess(t('admin.templates.success.deactivated'))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-sub text-2xl text-charcoal">{t('admin.templates.title')}</h2>
          <p className="font-body text-base text-text-muted mt-1">{t('admin.templates.subtitle')}</p>
        </div>

        {view === 'list' && (
          <button
            type="button"
            id="create-template-btn"
            onClick={() => setView('create')}
            className={cn(
              'min-h-[48px] px-6 py-2 bg-slate-brand text-white font-body font-medium rounded',
              'hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
              'whitespace-nowrap self-start sm:self-auto',
            )}
          >
            + {t('admin.templates.createBtn')}
          </button>
        )}

        {view !== 'list' && (
          <button
            type="button"
            onClick={() => { setView('list'); setEditingTemplate(null) }}
            className={cn(
              'min-h-[48px] px-6 py-2 border border-slate-brand text-slate-brand font-body font-medium rounded',
              'hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand self-start sm:self-auto',
            )}
          >
            ← {t('admin.templates.backBtn')}
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-4 font-body text-base text-emerald-800">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 font-body text-base text-red-700">
          {error}
        </div>
      )}

      {/* Create form */}
      {view === 'create' && (
        <div className="bg-white border border-sand rounded p-6 shadow-sm">
          <h3 className="font-sub text-xl text-charcoal mb-6 border-b border-sand pb-3">
            {t('admin.templates.form.createHeading')}
          </h3>
          <TemplateForm onSave={handleSaveCreate} onCancel={() => setView('list')} />
        </div>
      )}

      {/* Edit form */}
      {view === 'edit' && editingTemplate && (
        <div className="bg-white border border-sand rounded p-6 shadow-sm">
          <h3 className="font-sub text-xl text-charcoal mb-6 border-b border-sand pb-3">
            {t('admin.templates.form.editHeading')}: {editingTemplate.name}
          </h3>
          <TemplateForm
            initial={editingTemplate}
            onSave={handleSaveEdit}
            onCancel={() => { setView('list'); setEditingTemplate(null) }}
          />
        </div>
      )}

      {/* Template list */}
      {view === 'list' && (
        <div className="flex flex-col gap-4">
          {templates.length === 0 ? (
            <div className="bg-white border border-sand rounded p-12 text-center shadow-sm">
              <p className="font-body text-base text-text-muted">{t('admin.templates.empty')}</p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-sub text-xl text-charcoal">{template.name}</h3>
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium',
                      template.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600',
                    )}>
                      {template.active ? t('admin.templates.statusActive') : t('admin.templates.statusInactive')}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium bg-slate-pale text-charcoal">
                      {t(`admin.templates.serviceType.${template.serviceType}`)}
                    </span>
                  </div>

                  <p className="font-body text-base text-text-muted">
                    {t('admin.templates.taskCount', { count: template.tasks.length })}
                    {template.tasks.filter((tk) => tk.requiresPhoto).length > 0 && (
                      <> · {t('admin.templates.photoCount', {
                        count: template.tasks.filter((tk) => tk.requiresPhoto).length,
                      })}</>
                    )}
                  </p>

                  {template.tasks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {template.tasks.slice(0, 6).map((tk) => (
                        <span key={tk.id} className="text-xl" title={tk.labelEn}>{tk.icon}</span>
                      ))}
                      {template.tasks.length > 6 && (
                        <span className="font-body text-base text-text-muted self-center">
                          +{template.tasks.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEditingTemplate(template); setView('edit') }}
                    className={cn(
                      'min-h-[44px] px-4 py-2 border border-slate-brand text-slate-brand font-body text-base font-medium rounded',
                      'hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand',
                    )}
                  >
                    {t('admin.templates.editBtn')}
                  </button>
                  {template.active && template.id && (
                    <button
                      type="button"
                      onClick={() => { if (template.id) void handleDeactivate(template.id) }}
                      className={cn(
                        'min-h-[44px] px-4 py-2 border border-sand text-text-muted font-body text-base font-medium rounded',
                        'hover:bg-warm-white hover:text-charcoal transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sand',
                      )}
                    >
                      {t('admin.templates.deactivateBtn')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
