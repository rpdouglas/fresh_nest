import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export * from './firebase'
export * from './firebase/converters'
export * from './types/booking'
export * from './types/staff'
export * from './types/job'
export * from './types/common'
export * from './roles'
export * from './auth/waitForRoleClaim'
export * from './domain/scheduling'

/**
 * Utility to merge Tailwind classes using clsx and tailwind-merge.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
