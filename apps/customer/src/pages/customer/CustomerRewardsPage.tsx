import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { query, where, orderBy, getDocs } from 'firebase/firestore'
import { referralsCollection, creditsCollection } from '@freshnest/shared'
import { db } from '@/lib/firebase/firebase'
import { useCustomerAuthContext } from '@/components/layout/CustomerAuthContext'
import type { Referral, Credit } from '@/types'

export default function CustomerRewardsPage() {
  const { t } = useTranslation()
  const { user } = useCustomerAuthContext()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user?.email) return

    const fetchRewards = async () => {
      try {
        const email = user.email!.trim().toLowerCase()
        const [referralsSnap, creditsSnap] = await Promise.all([
          getDocs(query(referralsCollection(db), where('ownerEmail', '==', email), orderBy('createdAt', 'desc'))),
          getDocs(query(creditsCollection(db), where('customerEmail', '==', email), orderBy('issuedAt', 'desc'))),
        ])
        setReferrals(referralsSnap.docs.map((d) => d.data()))
        setCredits(creditsSnap.docs.map((d) => d.data()))
      } catch (err) {
        console.error('[CustomerRewardsPage] Error fetching rewards:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchRewards()
  }, [user])

  const handleCopy = (link: string) => {
    void navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmt = (n: number) => n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })

  const availableBalance = credits
    .filter((c) => c.status === 'available')
    .reduce((sum, c) => sum + c.amount, 0)

  const activeCode = referrals.find((r) => r.active) ?? referrals[0]

  const getStatusLabel = (status: Credit['status']) => {
    switch (status) {
      case 'available':
        return t('customerPortal.rewards.status.available')
      case 'redeemed':
        return t('customerPortal.rewards.status.redeemed')
      default:
        return t('customerPortal.rewards.status.revoked')
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
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-4xl text-charcoal mb-2">
          {t('customerPortal.rewards.title')}
        </h2>
        <p className="font-body text-base text-text-muted">
          {t('customerPortal.rewards.subtitle')}
        </p>
      </div>

      {/* Balance */}
      <div className="bg-slate-pale border border-sand rounded p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="font-body text-base text-charcoal font-medium">
          {t('customerPortal.rewards.balanceLabel')}
        </span>
        <span className="font-display text-4xl text-slate-dark font-bold">
          {fmt(availableBalance)}
        </span>
      </div>

      {/* Share code */}
      {activeCode ? (
        <div className="bg-white border border-sand rounded p-6">
          <h3 className="font-sub text-2xl text-charcoal mb-2">
            {t('referrals.referralShareTitle')}
          </h3>
          <p className="font-body text-base text-text-muted mb-4">
            {t('referrals.referralShareDesc')}
          </p>
          <div className="bg-slate-pale border border-sand rounded p-3 mb-4 text-center">
            <span className="font-body text-base text-text-muted uppercase tracking-wider block mb-1">
              {t('referrals.promoCodeLabel')}
            </span>
            <span className="font-display text-2xl text-slate-dark font-bold tracking-widest">
              {activeCode.id}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/booking?ref=${activeCode.id}`}
              className="flex-grow border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal bg-cream focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleCopy(`${window.location.origin}/booking?ref=${activeCode.id}`)}
              className="bg-slate-brand text-white font-body font-medium text-base rounded px-6 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
            >
              {copied ? t('referrals.linkCopied') : t('referrals.copyLink')}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-warm-white rounded border border-sand">
          <p className="font-body text-charcoal text-base">
            {t('customerPortal.rewards.noCodeYet')}
          </p>
        </div>
      )}

      {/* Credit history */}
      <div>
        <h3 className="font-sub text-2xl text-charcoal mb-4">
          {t('customerPortal.rewards.historyTitle')}
        </h3>
        {credits.length === 0 ? (
          <div className="text-center py-8 bg-warm-white rounded border border-sand">
            <p className="font-body text-charcoal text-base">
              {t('customerPortal.rewards.noHistory')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {credits.map((credit) => (
              <div
                key={credit.id}
                className="border border-sand rounded p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-body text-base text-charcoal font-medium">
                    {fmt(credit.amount)}
                  </p>
                  <p className="font-body text-base text-text-muted">
                    {credit.issuedAt.toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={
                    credit.status === 'available'
                      ? 'text-base font-body px-2.5 py-0.5 rounded bg-green-100 text-green-800'
                      : credit.status === 'redeemed'
                        ? 'text-base font-body px-2.5 py-0.5 rounded bg-slate-100 text-text-muted'
                        : 'text-base font-body px-2.5 py-0.5 rounded bg-red-100 text-red-800'
                  }
                >
                  {getStatusLabel(credit.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
