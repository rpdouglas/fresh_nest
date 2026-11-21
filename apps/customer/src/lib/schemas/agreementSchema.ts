import { z } from 'zod'
import { AGREEMENT_ENTRY_METHODS } from '@freshnest/shared'

export const agreementSignFormSchema = z.object({
  phone: z.string().trim().min(7, 'agreement.validation.phoneRequired').max(40),
  email: z.string().trim().email('agreement.validation.emailInvalid').max(200),
  entryMethod: z.enum(AGREEMENT_ENTRY_METHODS),
  pets: z.string().trim().max(400),
  hasAlarm: z.boolean(),
  specialInstructions: z.string().trim().max(1500),
  valuables: z.string().trim().max(1000),
  // Separate write-only access fields -> restricted private/access record only
  doorCode: z.string().trim().max(120),
  alarmCode: z.string().trim().max(120),
  keyLocation: z.string().trim().max(300),
  accessNotes: z.string().trim().max(600),
  // Three separate required signing controls (P3-E39 criterion 6)
  consentESign: z.boolean().refine((v) => v === true, {
    message: 'agreement.validation.consentESignRequired',
  }),
  consentTerms: z.boolean().refine((v) => v === true, {
    message: 'agreement.validation.consentTermsRequired',
  }),
  signedName: z.string().trim().min(2, 'agreement.validation.signedNameRequired').max(160),
  // Hidden honeypot
  website: z.string().max(200),
})

export type AgreementSignFormData = z.infer<typeof agreementSignFormSchema>
