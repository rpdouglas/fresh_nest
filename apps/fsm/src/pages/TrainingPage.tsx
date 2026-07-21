import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { httpsCallable } from 'firebase/functions'
import { cn } from '@freshnest/shared'
import { functions } from '../lib/firebase/firebase'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { TRAINING_MODULES } from '../lib/data/trainingModules'

export const TrainingPage: React.FC = () => {
  const { t } = useTranslation()
  const { staffProfile } = useStaffAuth()
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!staffProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-brand"></div>
      </div>
    )
  }

  const checklist = staffProfile.onboardingChecklist || {}
  const completedCount = TRAINING_MODULES.filter((m) => checklist[m.id] === true).length

  const selectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId)
    setAnswers({})
    setError(null)
  }

  const selectedModule = TRAINING_MODULES.find((m) => m.id === selectedModuleId) || null

  const allAnswersCorrect = selectedModule
    ? selectedModule.questions.every((q, idx) => answers[idx] === q.correctIndex)
    : false
  const allQuestionsAnswered = selectedModule
    ? selectedModule.questions.every((_, idx) => answers[idx] !== undefined)
    : false

  const handleCompleteModule = async () => {
    if (!selectedModule || !allAnswersCorrect || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      const completeModule = httpsCallable(functions, 'completeTrainingModule')
      await completeModule({ moduleId: selectedModule.id })
      setSelectedModuleId(null)
    } catch (err) {
      console.error('Failed to complete training module:', err)
      setError(t('fsm.training.submitError'))
    } finally {
      setIsSaving(false)
    }
  }

  if (selectedModule) {
    const moduleIsComplete = checklist[selectedModule.id] === true
    return (
      <main className="min-h-screen bg-warm-white py-12 px-4 md:py-20 md:px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <button
            type="button"
            onClick={() => setSelectedModuleId(null)}
            className="self-start min-h-[48px] px-3 font-body text-base font-medium text-slate-brand hover:text-slate-dark transition-colors"
          >
            {t('fsm.training.backToList')}
          </button>

          <div>
            <p className="font-body text-base font-semibold text-slate-brand">
              {t('fsm.training.moduleNumberLabel', { number: selectedModule.order })}
            </p>
            <h1 className="font-display text-4xl text-charcoal mt-1">
              {t(selectedModule.titleKey)}
            </h1>
            {selectedModule.isLegallyRequired && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium bg-amber-100 text-amber-800 mt-3">
                {t('fsm.training.legallyRequiredBadge')}
              </span>
            )}
          </div>

          <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
            {selectedModule.sectionKeys.map((sectionKey) => (
              <p key={sectionKey} className="font-body text-base text-charcoal leading-relaxed">
                {t(sectionKey)}
              </p>
            ))}
          </div>

          <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
            <h2 className="font-sub text-2xl text-charcoal border-b border-sand pb-3">
              {t('fsm.training.quiz.title')}
            </h2>

            {selectedModule.questions.map((question, qIdx) => (
              <fieldset key={question.questionKey} className="flex flex-col gap-3">
                <legend className="font-body text-base text-charcoal font-medium mb-1">
                  {t(question.questionKey)}
                </legend>
                {question.choiceKeys.map((choiceKey, cIdx) => (
                  <label
                    key={choiceKey}
                    className="flex items-center gap-3 min-h-[48px] px-4 py-1 border border-sand rounded cursor-pointer hover:bg-warm-white transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${qIdx}`}
                      checked={answers[qIdx] === cIdx}
                      onChange={() => setAnswers((prev) => ({ ...prev, [qIdx]: cIdx }))}
                      className="w-5 h-5 text-slate-brand focus:ring-slate-brand"
                    />
                    <span className="font-body text-base text-charcoal">{t(choiceKey)}</span>
                  </label>
                ))}
              </fieldset>
            ))}

            {allQuestionsAnswered && (
              <p className={cn(
                'font-body text-base font-medium',
                allAnswersCorrect ? 'text-emerald-700' : 'text-red-700'
              )}>
                {allAnswersCorrect ? t('fsm.training.quiz.allCorrectMsg') : t('fsm.training.quiz.incorrectHint')}
              </p>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => { void handleCompleteModule() }}
              disabled={!allAnswersCorrect || isSaving || moduleIsComplete}
              className={cn(
                'min-h-[48px] px-8 py-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed self-start',
                isSaving && 'bg-slate-dark'
              )}
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('fsm.training.quiz.completing')}</span>
                </>
              ) : moduleIsComplete ? (
                <span>{t('fsm.training.completedBadge')}</span>
              ) : (
                <span>{t('fsm.training.quiz.completeBtn')}</span>
              )}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-display text-5xl text-charcoal">
            {t('fsm.training.pageTitle')}
          </h1>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.training.pageSubtitle')}
          </p>
          <p className="font-body text-base font-semibold text-slate-brand mt-3">
            {t('fsm.training.progressLabel', { completed: completedCount, total: TRAINING_MODULES.length })}
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {TRAINING_MODULES.map((moduleItem) => {
            const isComplete = checklist[moduleItem.id] === true
            return (
              <li key={moduleItem.id}>
                <button
                  type="button"
                  onClick={() => selectModule(moduleItem.id)}
                  className="w-full text-left bg-white border border-sand rounded p-4 shadow-sm hover:bg-warm-white transition-colors flex items-center justify-between gap-4 min-h-[48px]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-body text-base font-semibold text-charcoal">
                      {t('fsm.training.moduleNumberLabel', { number: moduleItem.order })}: {t(moduleItem.titleKey)}
                    </span>
                    <div className="flex gap-2">
                      {moduleItem.isLegallyRequired && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium bg-amber-100 text-amber-800">
                          {t('fsm.training.legallyRequiredBadge')}
                        </span>
                      )}
                      {isComplete && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium bg-emerald-100 text-emerald-800">
                          {t('fsm.training.completedBadge')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-body text-base font-medium text-slate-brand shrink-0">
                    {isComplete ? t('fsm.training.reviewBtn') : t('fsm.training.startBtn')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}

export default TrainingPage
