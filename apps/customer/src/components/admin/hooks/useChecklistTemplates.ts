import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { checklistTemplatesCollection } from '@freshnest/shared'
import { query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import {
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
} from '@/lib/firebase/firestore'
import type { ChecklistTemplate } from '@/types'

/**
 * useChecklistTemplates — mirrors the useBookings / useStaff TanStack-Query pattern.
 * Uses useCollectionQuery to subscribe to /checklistTemplates without raw useEffect setState.
 */
export function useChecklistTemplates(isAuthorized: boolean) {
  const queryClient = useQueryClient()

  const checklistQuery = useMemo(() => {
    return query(checklistTemplatesCollection(db), orderBy('serviceType', 'asc'))
  }, [])

  const { data, isLoading, error } = useCollectionQuery(checklistQuery, {
    queryKey: ['checklistTemplates'],
    enabled: isAuthorized,
  })

  const templates = useMemo<ChecklistTemplate[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => docSnap.data())
  }, [data])

  const handleCreate = async (template: Omit<ChecklistTemplate, 'id'>): Promise<string> => {
    const id = await createChecklistTemplate(template)
    await queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] })
    return id
  }

  const handleUpdate = async (
    templateId: string,
    updates: Partial<Omit<ChecklistTemplate, 'id'>>,
  ): Promise<void> => {
    await updateChecklistTemplate(templateId, updates)
    await queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] })
  }

  const handleDelete = async (templateId: string): Promise<void> => {
    await deleteChecklistTemplate(templateId)
    await queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] })
  }

  return {
    templates,
    isLoading,
    error: error ? String(error) : null,
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
