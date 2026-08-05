import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db'
import {
  selectQuestions,
  getQuestionById,
  countByFilters,
  getDailyChallenge,
} from '@/engines/questionEngine/selector'
import type { QuestionFilters } from '@/types/question'
import { ensureSeeded, importRealQuestions } from '@/db/seed'
import { useUIStore } from '@/stores/uiStore'

export const QK = {
  questions: 'questions',
  question: (id: string) => ['question', id] as const,
  count: (filters: QuestionFilters) => ['question-count', JSON.stringify(filters)] as const,
  seeded: ['seeded'] as const,
  results: ['test-results'] as const,
  drafts: ['test-drafts'] as const,
  mistakes: ['mistakes'] as const,
  bookmarks: ['bookmarks'] as const,
  flashcards: ['flashcards'] as const,
  formulas: ['formulas'] as const,
  daily: ['daily-activity'] as const,
  answers: ['answer-records'] as const,
}

export function useQuestions(filters: QuestionFilters, options?: { limit?: number }) {
  return useQuery({
    queryKey: ['questions', JSON.stringify(filters), options?.limit],
    queryFn: () =>
      selectQuestions({
        ...filters,
        limit: options?.limit ?? 50,
        seed: 42,
      }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useQuestion(id: string | undefined) {
  return useQuery({
    queryKey: QK.question(id ?? ''),
    queryFn: () => (id ? getQuestionById(id) : undefined),
    enabled: !!id,
  })
}

export function useQuestionCount(filters: QuestionFilters) {
  return useQuery({
    queryKey: QK.count(filters),
    queryFn: () => countByFilters(filters),
  })
}

export function useSeededStatus() {
  return useQuery({
    queryKey: QK.seeded,
    queryFn: ensureSeeded,
    staleTime: Infinity,
  })
}

export function useImportPyq() {
  const queryClient = useQueryClient()
  const pushToast = useUIStore((s) => s.pushToast)

  return async () => {
    const count = await importRealQuestions({ progress: () => {} })
    await queryClient.invalidateQueries()
    pushToast(`Imported ${count} real JEE Main questions`, 'success')
    return count
  }
}

export function useDailyChallenge() {
  return useQuery({
    queryKey: ['daily-challenge', new Date().toDateString()],
    queryFn: () => getDailyChallenge(),
    staleTime: 1000 * 60 * 60,
  })
}

export async function getDraftCount(): Promise<number> {
  return db.testDrafts.count()
}
