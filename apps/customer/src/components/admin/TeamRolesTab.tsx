import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { collection, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { officeRoleOf, type OfficeRole } from '@freshnest/shared'
import { db, functions } from '@/lib/firebase/firebase'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { cn } from '@/lib/utils/utils'

// P3-E35: Owners decide who has office access. Owners and Managers have the same access; only
// Owners can give or take away the Owner and Manager roles (enforced in the setUserRole function).

interface OfficeMember {
  /** Allowlist doc ID: the email, or an account ID on old hand-made entries. */
  id: string
  /** null when an old entry's account can't be found. */
  email: string | null
  role: OfficeRole
}

type SetUserRole = (data: { email: string; role: string; forceDowngrade?: boolean }) => Promise<{ data?: { pending?: boolean } }>
type ResolveOfficeEntries = (data: { ids: string[] }) => Promise<{ data?: { emails?: Record<string, string | null> } }>

const byRoleThenName = (a: OfficeMember, b: OfficeMember) =>
  a.role === b.role ? (a.email ?? a.id).localeCompare(b.email ?? b.id) : a.role === 'owner' ? -1 : 1

interface TeamRolesTabProps {
  currentEmail: string
}

const inputClass =
  'w-full min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand'
const secondaryButton =
  'min-h-[48px] px-4 border border-slate-brand text-slate-brand font-body font-medium rounded hover:bg-slate-pale focus:outline-none focus:ring-2 focus:ring-slate-brand disabled:opacity-50'

export function TeamRolesTab({ currentEmail }: TeamRolesTabProps) {
  const { t } = useTranslation()
  const [members, setMembers] = useState<OfficeMember[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OfficeRole>('manager')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pendingRemove, setPendingRemove] = useState<OfficeMember | null>(null)

  const me = currentEmail.trim().toLowerCase()
  const label = (m: OfficeMember) => m.email ?? t('admin.team.unknownAccount')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'admins'))
      const entries = snap.docs
        .map((d) => ({ id: d.id, email: d.id.includes('@') ? d.id : null, role: officeRoleOf(d.data().role ?? 'owner') }))
        .filter((m): m is OfficeMember => m.role !== null)
      // Old entries saved under an account ID: look up their email so people see who they are.
      const legacyIds = entries.filter((m) => m.email === null).map((m) => m.id)
      if (legacyIds.length > 0) {
        try {
          const res = await (httpsCallable(functions, 'resolveOfficeEntries') as unknown as ResolveOfficeEntries)({ ids: legacyIds })
          const emails = res?.data?.emails ?? {}
          for (const m of entries) if (m.email === null) m.email = emails[m.id] ?? null
        } catch (err) {
          console.error('Error looking up old office entries:', err)
        }
      }
      // An old entry for someone who also has an email entry is the same person: show them once.
      const emailIds = new Set(entries.filter((m) => m.id.includes('@')).map((m) => m.id))
      setMembers(entries.filter((m) => m.id.includes('@') || !m.email || !emailIds.has(m.email)).sort(byRoleThenName))
    } catch (err) {
      console.error('Error loading office roles:', err)
      setMessage({ kind: 'error', text: t('admin.team.errors.load') })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    // Deferred like the other admin tabs, so loading state isn't set synchronously in the effect.
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  // okText gets whether the email had no account yet (pre-approved; applied on first sign-in).
  const call = async (data: Parameters<SetUserRole>[0], okText: (pending: boolean) => string) => {
    setBusy(true)
    setMessage(null)
    try {
      const result = await (httpsCallable(functions, 'setUserRole') as unknown as SetUserRole)(data)
      setMessage({ kind: 'ok', text: okText(result?.data?.pending === true) })
      await load()
      return true
    } catch (err) {
      const raw = err instanceof Error ? err.message : ''
      setMessage({ kind: 'error', text: raw.includes('not found') ? t('admin.team.errors.noAccount') : t('admin.team.errors.save', { reason: raw }) })
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = email.trim().toLowerCase()
    if (!target.includes('@')) {
      setMessage({ kind: 'error', text: t('admin.team.errors.email') })
      return
    }
    const existing = members.find((m) => m.email === target)
    const ok = await call(
      { email: target, role, forceDowngrade: existing?.role === 'owner' && role === 'manager' },
      (pending) => t(pending ? 'admin.team.addedPending' : 'admin.team.added', { email: target, role: t(`admin.team.roles.${role}`) }),
    )
    if (ok) setEmail('')
  }

  const handleChangeRole = (member: OfficeMember) => {
    if (!member.email) return
    const next: OfficeRole = member.role === 'owner' ? 'manager' : 'owner'
    void call(
      { email: member.email, role: next, forceDowngrade: next === 'manager' },
      () => t('admin.team.changed', { email: member.email, role: t(`admin.team.roles.${next}`) }),
    )
  }

  const handleRemove = async () => {
    const member = pendingRemove
    setPendingRemove(null)
    if (!member) return
    // An entry whose account no longer exists is removed by its ID (only the list entry changes).
    const target = member.email ?? member.id
    await call({ email: target, role: 'customer', forceDowngrade: true }, () => t('admin.team.removed', { email: label(member) }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-sub text-2xl text-charcoal">{t('admin.team.title')}</h2>
        <p className="font-body text-base text-text-muted mt-1">{t('admin.team.subtitle')}</p>
      </div>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'font-body text-base rounded p-3 border',
            message.kind === 'error' ? 'text-red-700 bg-red-50 border-red-200' : 'text-emerald-800 bg-emerald-50 border-emerald-200',
          )}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={(e) => { void handleAdd(e) }} className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
        <h3 className="font-sub text-xl text-charcoal">{t('admin.team.addHeading')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="team-email" className="font-body text-base text-charcoal font-medium">{t('admin.team.email')}</label>
            <input id="team-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="team-role" className="font-body text-base text-charcoal font-medium">{t('admin.team.role')}</label>
            <select id="team-role" value={role} onChange={(e) => setRole(e.target.value as OfficeRole)} className={inputClass}>
              <option value="manager">{t('admin.team.roles.manager')}</option>
              <option value="owner">{t('admin.team.roles.owner')}</option>
            </select>
          </div>
        </div>
        <p className="font-body text-base text-text-muted">{t('admin.team.addHint')}</p>
        <button
          type="submit"
          disabled={busy}
          className="self-start min-h-[48px] px-6 bg-slate-brand text-white font-body font-medium rounded hover:bg-slate-dark focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-50"
        >
          {t('admin.team.add')}
        </button>
      </form>

      <div className="bg-white border border-sand rounded shadow-sm">
        <h3 className="font-sub text-xl text-charcoal p-6 pb-3">{t('admin.team.listHeading')}</h3>
        {loading ? (
          <p className="font-body text-base text-text-muted px-6 pb-6">{t('admin.team.loading')}</p>
        ) : members.length === 0 ? (
          <p className="font-body text-base text-text-muted px-6 pb-6">{t('admin.team.empty')}</p>
        ) : (
          <ul className="divide-y divide-sand">
            {members.map((member) => {
              const isMe = member.email === me
              return (
                <li key={member.id} className="flex flex-col md:flex-row md:items-center gap-3 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-base text-charcoal break-all">
                      {label(member)}
                      {isMe && <span className="text-text-muted"> · {t('admin.team.you')}</span>}
                    </p>
                    <p className="font-body text-base text-text-muted">{t(`admin.team.roles.${member.role}`)}</p>
                  </div>
                  {!isMe && (
                    <div className="flex gap-2 flex-wrap">
                      {member.email && (
                        <button type="button" disabled={busy} onClick={() => handleChangeRole(member)} className={secondaryButton}>
                          {t(member.role === 'owner' ? 'admin.team.makeManager' : 'admin.team.makeOwner')}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPendingRemove(member)}
                        className="min-h-[48px] px-4 border border-red-300 text-red-700 font-body font-medium rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                      >
                        {t('admin.team.remove')}
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        tone="danger"
        title={t('admin.team.removeTitle')}
        body={t('admin.team.removeBody', { email: pendingRemove ? label(pendingRemove) : '' })}
        confirmLabel={t('admin.team.remove')}
        cancelLabel={t('admin.checklist.cancel')}
        onConfirm={() => { void handleRemove() }}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}
