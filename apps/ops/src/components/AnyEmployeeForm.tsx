import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { isSignInError } from '../api'
import { employeesQuery } from '../lib/queries'
import type { Pending, Position } from './PayrollEditor'
import { TimesForm } from './PayrollEditor'
import type { Editor } from './useEditor'

const muted = 'text-ink-muted'

interface Props {
  editor: Editor
  /** The days that can be chosen; the first is preselected. */
  days: string[]
  positions: Position[]
  title?: string
  onExpired: (message: string) => void
  /** Called with the entry to add, ready for its confirm step. */
  onReview: (pending: Pending) => void
  onCancel: () => void
}

/** The form for adding a timesheet for any active employee, with or without a scheduled shift. */
export default function AnyEmployeeForm({
  editor,
  days,
  positions,
  title = 'Add an entry for any employee',
  onExpired,
  onReview,
  onCancel,
}: Props) {
  const token = editor.token
  const list = useQuery(employeesQuery(token))
  const staff: Position[] | null = list.data ?? null
  const expired = isSignInError(list.error)
  useEffect(() => {
    if (expired) onExpired('Your Google sign-in has expired. Sign in again to make changes.')
  }, [expired, onExpired])
  const error = list.error && !expired ? list.error.message || 'The employee list could not be loaded.' : null

  if (error) {
    return (
      <p role="alert" className="px-4 py-3 text-sm text-red-700 dark:text-red-400">
        {error}
      </p>
    )
  }
  if (!staff) return <p className={`px-4 py-3 text-sm ${muted}`}>Loading employees…</p>
  return (
    <TimesForm
      title={title}
      employees={staff}
      date={days[0]}
      days={days}
      start=""
      end=""
      positions={positions}
      places={{ token }}
      onCancel={onCancel}
      onReview={({ from, to, position, employee, client, site }) =>
        employee &&
        onReview({
          action: 'create',
          employeeId: employee.id,
          employeeName: employee.name,
          from,
          to,
          groupId: position?.id ?? null,
          groupName: position?.name ?? null,
          client,
          site,
        })
      }
    />
  )
}
