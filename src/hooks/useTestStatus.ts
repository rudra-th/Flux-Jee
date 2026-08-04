import { useMemo } from 'react'
import { useTestStore } from '@/stores/testStore'
import type { QuestionStatus } from '@/types/core'

/** Compute palette status for each question in a section */
export function useSectionStatuses(sectionId: string) {
  const config = useTestStore((s) => s.config)
  const answers = useTestStore((s) => s.answers)
  const currentSectionId = useTestStore((s) => s.currentSectionId)
  const currentQuestionIndex = useTestStore((s) => s.currentQuestionIndex)

  return useMemo(() => {
    const section = config?.sections.find((s) => s.id === sectionId)
    if (!section) return []
    return section.questionIds.map((qid, idx) => {
      const ans = answers[qid]
      const hasAnswer = ans ? ans.selected.length > 0 || (ans.matrix && Object.keys(ans.matrix).length > 0) : false
      let status: QuestionStatus = 'not-visited'
      if (ans?.visited) status = 'visited'
      if (hasAnswer && !ans?.markedForReview) status = 'answered'
      if (ans?.markedForReview && !hasAnswer) status = 'marked'
      if (ans?.markedForReview && hasAnswer) status = 'answered-marked'
      if (!ans?.visited && hasAnswer) status = 'answered'
      return {
        index: idx,
        qid,
        status,
        isCurrent: currentSectionId === sectionId && currentQuestionIndex === idx,
      }
    })
  }, [config, answers, currentSectionId, currentQuestionIndex, sectionId])
}
