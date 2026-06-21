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
  referredBy:       z.string().nullable().optional(),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>

export const STEP_FIELDS: Record<number, (keyof BookingFormData)[]> = {
  0: ['serviceType', 'propertyType', 'bedrooms', 'bathrooms', 'pets'],
  1: ['frequency', 'preferredDate'],
  2: ['firstName', 'lastName', 'email', 'phone', 'address'],
  3: ['marketingConsent', 'referredBy'],
}

export const adminBookingSchema = z.object({
  // Section 1 — Service & Property
  serviceType:   z.enum(['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial']),
  propertyType:  z.enum(['apartment', '1-2bed', '3-4bed', '5+bed', 'commercial']),
  bedrooms:      z.number().int().min(0).max(20),
  bathrooms:     z.number().int().min(0).max(10),
  pets:          z.boolean(),
  addOns:        z.array(z.enum(['oven', 'fridge', 'windows', 'laundry', 'petHair', 'basement'])),
  squareFootage: z.number().int().min(0).optional(),

  // Section 2 — Schedule & Contact
  frequency:     z.enum(['one-time', 'weekly', 'biweekly', 'monthly']),
  preferredDate: z.string().min(1),
  firstName:     z.string().min(1),
  lastName:      z.string().min(1),
  email:         z.string().email(),
  phone:         z.string().min(10),
  address:       z.string().min(5),
  notes:         z.string().max(1000).optional(),

  // Section 3 — Admin Controls
  language:         z.enum(['en', 'fr']),
  leadSource:       z.enum(['organic', 'google', 'referral', 'facebook', 'direct', 'phone', 'walk-in']),
  assignedTo:       z.string().nullable().optional(),
  status:           z.enum(['pending', 'confirmed']),
  marketingConsent: z.boolean(),
})

export type AdminBookingFormData = z.infer<typeof adminBookingSchema>
