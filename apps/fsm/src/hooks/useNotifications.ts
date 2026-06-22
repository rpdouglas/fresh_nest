import { useEffect, useState, useMemo } from 'react'
import { collection, query, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore'
import { toDate } from '@freshnest/shared'
import { db } from '../lib/firebase/firebase'
import { useStaffAuth } from './useStaffAuth'
import type { Notification } from '../types'

interface RawNotificationDoc {
  title: string
  body: string
  type: 'shift_assigned' | 'shift_unassigned' | 'shift_cancelled' | 'new_shift_board_posting'
  jobId?: string | null
  read?: boolean
  createdAt: unknown
}

export function useNotifications() {
  const { staffProfile } = useStaffAuth()
  const uid = staffProfile?.uid

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(!!uid)

  // Adjust state synchronously during render when uid changes
  const [prevUid, setPrevUid] = useState<string | undefined>(uid)
  if (uid !== prevUid) {
    setPrevUid(uid)
    setNotifications([])
    setLoading(!!uid)
  }

  useEffect(() => {
    if (!uid) {
      return
    }

    const messagesRef = collection(db, 'notifications', uid, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Notification[] = []
        snapshot.forEach((docSnap) => {
          const docData = docSnap.data() as RawNotificationDoc
          
          list.push({
            id: docSnap.id,
            title: docData.title,
            body: docData.body,
            type: docData.type,
            jobId: docData.jobId ?? null,
            read: docData.read ?? false,
            createdAt: toDate(docData.createdAt),
          })
        })
        setNotifications(list)
        setLoading(false)
      },
      (error) => {
        console.error('Error subscribing to notifications:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [uid])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  const markAllAsRead = async (): Promise<void> => {
    if (!uid) return
    const unread = notifications.filter((n) => !n.read)
    if (unread.length === 0) return

    const batch = writeBatch(db)
    // Limit batch size to 50 to avoid Firestore limits
    const targetSlice = unread.slice(0, 50)
    targetSlice.forEach((n) => {
      const docRef = doc(db, 'notifications', uid, 'messages', n.id)
      batch.update(docRef, { read: true })
    })

    try {
      await batch.commit()
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
  }
}

