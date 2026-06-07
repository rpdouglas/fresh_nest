import { z } from 'zod'

export const bookingFormSchema = z.object({
  // Step 1 — Service details
  serviceType:  z.enum(['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial']),
  propertyType: z.enum(['apartment', '1-2bed', '3-4bed', '5+bed', 'commercial']),
  bedrooms:     z.number().int().min(0).max(20),
  bathrooms:    z.number().int().min(0).max(10),
  pets:         z.boolean(),

  // Step 2 — Schedule
  frequency:      z.enum(['one-time', 'weekly', 'biweekly', 'monthly']),
  preferredDate:  z.string().min(1),
  addOns:         z.array(z.enum(['oven', 'fridge', 'windows', 'laundry', 'petHair', 'basement'])),
  squareFootage:  z.number().int().min(0).optional(),

  // Step 3 — Contact
  firstName:        z.string().min(1),
  lastName:         z.string().min(1),
  email:            z.string().email(),
  phone:            z.string().min(10),
  address:          z.string().min(5),
  preferredCleaner: z.string().nullable().optional(),
  notes:            z.string().max(1000).optional(),

  // Step 4 — Consent
  marketingConsent: z.boolean(),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>

export const STEP_FIELDS: Record<number, (keyof BookingFormData)[]> = {
  0: ['serviceType', 'propertyType', 'bedrooms', 'bathrooms', 'pets'],
  1: ['frequency', 'preferredDate'],
  2: ['firstName', 'lastName', 'email', 'phone', 'address'],
  3: [],
}
