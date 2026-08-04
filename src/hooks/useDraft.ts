import { useEffect, useRef } from 'react'
import { db } from '@/db'
import { useTestStore, buildDraft } from '@/stores/testStore'

/**
 * Persists the running test draft to IndexedDB periodically and on unmount,
 * enabling resume-after-refresh / crash recovery.
 */
export function useDraftPersistence(intervalMs = 5000) {
  const state = useTestStore()
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const save = async () => {
      const s = stateRef.current
      if (!s.config || s.phase === 'submitted') return
      const draft = buildDraft(s)
      if (!draft) return
      await db.testDrafts.put(draft)
    }

    const id = setInterval(() => void save(), intervalMs)

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void save()
    }
    const onBeforeUnload = () => void save()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [intervalMs])
}

export async function getSavedDraft(testId?: string): Promise<import('@/types/test').TestDraft | undefined> {
  if (testId) {
    return db.testDrafts.get(testId)
  }
  return db.testDrafts.orderBy('lastSavedAt').last()
}

export async function deleteDraft(testId: string): Promise<void> {
  await db.testDrafts.delete(testId)
}
