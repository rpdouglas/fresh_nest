import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { useCustomerAuthContext } from '@/components/layout/CustomerAuthContext'
import { cn } from '@/lib/utils/utils'

export default function CustomerProfilePage() {
  const { t } = useTranslation()
  const { user } = useCustomerAuthContext()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'customers', user.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          setFirstName((data['firstName'] as string) || '')
          setLastName((data['lastName'] as string) || '')
          setPhone((data['phone'] as string) || '')
          setAddress((data['address'] as string) || '')
        } else {
          // Prefill from Auth user display name if possible
          if (user.displayName) {
            const parts = user.displayName.split(' ')
            setFirstName(parts[0] || '')
            setLastName(parts.slice(1).join(' ') || '')
          }
        }
      } catch (err) {
        console.error('Error fetching customer profile:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchProfile()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      const docRef = doc(db, 'customers', user.uid)
      await setDoc(
        docRef,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          email: user.email?.trim().toLowerCase(),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(), // Falls back to server timestamp if setDoc is new, merge preserves it
        },
        { merge: true }
      )
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      const errMsg = err instanceof Error ? err.message : t('customerPortal.profile.saveError', 'Failed to update profile')
      setError(errMsg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-slate-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <h2 className="font-display text-4xl text-charcoal mb-6">
        {t('customerPortal.profile.title')}
      </h2>

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded font-body text-sm animate-fade-in">
          {t('customerPortal.profile.saveSuccess')}
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded font-body text-sm">
          {error}
        </div>
      )}

      <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4 font-body text-charcoal">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block font-body text-sm text-text-muted mb-1">
              {t('customerPortal.profile.firstName')}
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full text-base px-4 py-2 border border-sand rounded bg-warm-white focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block font-body text-sm text-text-muted mb-1">
              {t('customerPortal.profile.lastName')}
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full text-base px-4 py-2 border border-sand rounded bg-warm-white focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block font-body text-sm text-text-muted mb-1">
            {t('customerPortal.profile.phone')}
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-base px-4 py-2 border border-sand rounded bg-warm-white focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
          />
        </div>

        <div>
          <label htmlFor="address" className="block font-body text-sm text-text-muted mb-1">
            {t('customerPortal.profile.address')}
          </label>
          <textarea
            id="address"
            required
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-base px-4 py-2 border border-sand rounded bg-warm-white focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={cn(
            'w-full bg-slate-brand text-white font-body font-medium text-base rounded',
            'py-2.5 min-h-[48px] inline-flex items-center justify-center',
            'hover:bg-slate-dark transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {saving ? t('customerPortal.profile.savingState', 'Saving...') : t('customerPortal.profile.saveBtn')}
        </button>
      </form>
    </div>
  )
}
