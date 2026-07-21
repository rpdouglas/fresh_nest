export interface TrainingQuestion {
  questionKey: string
  choiceKeys: string[]
  correctIndex: number
}

export interface TrainingModule {
  id: string
  order: number
  isLegallyRequired: boolean
  titleKey: string
  sectionKeys: string[]
  questions: TrainingQuestion[]
}

const t = (path: string) => `fsm.training.modules.${path}`

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'module1Welcome',
    order: 1,
    isLegallyRequired: false,
    titleKey: t('module1Welcome.title'),
    sectionKeys: [t('module1Welcome.sec1'), t('module1Welcome.sec2')],
    questions: [
      {
        questionKey: t('module1Welcome.q1.question'),
        choiceKeys: [t('module1Welcome.q1.choiceA'), t('module1Welcome.q1.choiceB'), t('module1Welcome.q1.choiceC')],
        correctIndex: 1,
      },
      {
        questionKey: t('module1Welcome.q2.question'),
        choiceKeys: [t('module1Welcome.q2.choiceA'), t('module1Welcome.q2.choiceB'), t('module1Welcome.q2.choiceC')],
        correctIndex: 0,
      },
      {
        questionKey: t('module1Welcome.q3.question'),
        choiceKeys: [t('module1Welcome.q3.choiceA'), t('module1Welcome.q3.choiceB'), t('module1Welcome.q3.choiceC')],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'module2AppTraining',
    order: 2,
    isLegallyRequired: false,
    titleKey: t('module2AppTraining.title'),
    sectionKeys: [t('module2AppTraining.sec1'), t('module2AppTraining.sec2'), t('module2AppTraining.sec3')],
    questions: [
      {
        questionKey: t('module2AppTraining.q1.question'),
        choiceKeys: [t('module2AppTraining.q1.choiceA'), t('module2AppTraining.q1.choiceB'), t('module2AppTraining.q1.choiceC')],
        correctIndex: 1,
      },
      {
        questionKey: t('module2AppTraining.q2.question'),
        choiceKeys: [t('module2AppTraining.q2.choiceA'), t('module2AppTraining.q2.choiceB'), t('module2AppTraining.q2.choiceC')],
        correctIndex: 2,
      },
      {
        questionKey: t('module2AppTraining.q3.question'),
        choiceKeys: [t('module2AppTraining.q3.choiceA'), t('module2AppTraining.q3.choiceB'), t('module2AppTraining.q3.choiceC')],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'module3CleaningTechniques',
    order: 3,
    isLegallyRequired: false,
    titleKey: t('module3CleaningTechniques.title'),
    sectionKeys: [t('module3CleaningTechniques.sec1'), t('module3CleaningTechniques.sec2')],
    questions: [
      {
        questionKey: t('module3CleaningTechniques.q1.question'),
        choiceKeys: [t('module3CleaningTechniques.q1.choiceA'), t('module3CleaningTechniques.q1.choiceB'), t('module3CleaningTechniques.q1.choiceC')],
        correctIndex: 0,
      },
      {
        questionKey: t('module3CleaningTechniques.q2.question'),
        choiceKeys: [t('module3CleaningTechniques.q2.choiceA'), t('module3CleaningTechniques.q2.choiceB'), t('module3CleaningTechniques.q2.choiceC')],
        correctIndex: 1,
      },
      {
        questionKey: t('module3CleaningTechniques.q3.question'),
        choiceKeys: [t('module3CleaningTechniques.q3.choiceA'), t('module3CleaningTechniques.q3.choiceB'), t('module3CleaningTechniques.q3.choiceC')],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'module4Whmis',
    order: 4,
    isLegallyRequired: true,
    titleKey: t('module4Whmis.title'),
    sectionKeys: [t('module4Whmis.sec1'), t('module4Whmis.sec2'), t('module4Whmis.sec3')],
    questions: [
      {
        questionKey: t('module4Whmis.q1.question'),
        choiceKeys: [t('module4Whmis.q1.choiceA'), t('module4Whmis.q1.choiceB'), t('module4Whmis.q1.choiceC')],
        correctIndex: 1,
      },
      {
        questionKey: t('module4Whmis.q2.question'),
        choiceKeys: [t('module4Whmis.q2.choiceA'), t('module4Whmis.q2.choiceB'), t('module4Whmis.q2.choiceC')],
        correctIndex: 0,
      },
      {
        questionKey: t('module4Whmis.q3.question'),
        choiceKeys: [t('module4Whmis.q3.choiceA'), t('module4Whmis.q3.choiceB'), t('module4Whmis.q3.choiceC')],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'module5ClientStandards',
    order: 5,
    isLegallyRequired: false,
    titleKey: t('module5ClientStandards.title'),
    sectionKeys: [t('module5ClientStandards.sec1'), t('module5ClientStandards.sec2'), t('module5ClientStandards.sec3')],
    questions: [
      {
        questionKey: t('module5ClientStandards.q1.question'),
        choiceKeys: [t('module5ClientStandards.q1.choiceA'), t('module5ClientStandards.q1.choiceB'), t('module5ClientStandards.q1.choiceC')],
        correctIndex: 0,
      },
      {
        questionKey: t('module5ClientStandards.q2.question'),
        choiceKeys: [t('module5ClientStandards.q2.choiceA'), t('module5ClientStandards.q2.choiceB'), t('module5ClientStandards.q2.choiceC')],
        correctIndex: 1,
      },
      {
        questionKey: t('module5ClientStandards.q3.question'),
        choiceKeys: [t('module5ClientStandards.q3.choiceA'), t('module5ClientStandards.q3.choiceB'), t('module5ClientStandards.q3.choiceC')],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'module6EmergencyProcedures',
    order: 6,
    isLegallyRequired: false,
    titleKey: t('module6EmergencyProcedures.title'),
    sectionKeys: [t('module6EmergencyProcedures.sec1'), t('module6EmergencyProcedures.sec2'), t('module6EmergencyProcedures.sec3')],
    questions: [
      {
        questionKey: t('module6EmergencyProcedures.q1.question'),
        choiceKeys: [t('module6EmergencyProcedures.q1.choiceA'), t('module6EmergencyProcedures.q1.choiceB'), t('module6EmergencyProcedures.q1.choiceC')],
        correctIndex: 0,
      },
      {
        questionKey: t('module6EmergencyProcedures.q2.question'),
        choiceKeys: [t('module6EmergencyProcedures.q2.choiceA'), t('module6EmergencyProcedures.q2.choiceB'), t('module6EmergencyProcedures.q2.choiceC')],
        correctIndex: 1,
      },
      {
        questionKey: t('module6EmergencyProcedures.q3.question'),
        choiceKeys: [t('module6EmergencyProcedures.q3.choiceA'), t('module6EmergencyProcedures.q3.choiceB'), t('module6EmergencyProcedures.q3.choiceC')],
        correctIndex: 0,
      },
    ],
  },
]
