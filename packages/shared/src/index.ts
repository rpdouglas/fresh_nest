import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export * from './firebase'
export * from './types/booking'
export * from './types/staff'
export * from './types/job'
export * from './types/common'

/**
 * Utility to merge Tailwind classes using clsx and tailwind-merge.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
