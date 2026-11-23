import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { feedbackAction, isSignInError } from '../api'
import { feedbackChanged, feedbackQuery } from '../lib/queries'
import type { Editor } from './useEditor'

const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'

/** Loads the feedback dated from..to for the signed-in person, and sends changes. */
export function useFeedback(editor: Editor | null, from: string, to: string, onExpired: (message: string) => void) {
  const token = editor?.token
  const list = useQuery({ ...feedbackQuery(from, to, token ?? ''), enabled: !!token })
  const failure = token ? list.error : null

  useEffect(() => {
    if (isSignInError(failure)) onExpired(failure.reason === 'not_signed_in' ? EXPIRED : failure.message)
  }, [failure, onExpired])

  /** Sends one change, then reloads. Rejects with a message to show beside the form. */
  const send = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!token) throw new Error('Sign in to record feedback.')
      try {
        await feedbackAction(payload, token)
        feedbackChanged()
      } catch (e) {
        if (isSignInError(e)) onExpired(e.reason === 'not_signed_in' ? EXPIRED : e.message)
        throw e instanceof Error ? e : new Error('The change could not be saved.')
      }
    },
    [token, onExpired],
  )

  const error = failure && !isSignInError(failure) ? failure.message || 'Feedback could not be loaded.' : null
  return { entries: list.data ?? [], loading: !!token && !list.data && !error, error, send }
}
