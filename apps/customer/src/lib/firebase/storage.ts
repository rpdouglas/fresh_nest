import { getStorage } from 'firebase/storage'
import app from '@/lib/firebase/firebase'

// Kept out of firebase.ts so the Storage SDK only loads with the admin Gallery tab (P3-E32).
export const storage = getStorage(app)
