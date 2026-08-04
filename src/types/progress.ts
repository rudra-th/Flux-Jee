import type { SubjectId } from './core'

export interface Bookmark {
  id: string
  questionId: string
  tags: string[]
  folderId?: string
  note?: string
  createdAt: string
}

export interface BookmarkFolder {
  id: string
  name: string
  color?: string
  createdAt: string
}

export interface MistakeEntry {
  id: string
  questionId: string
  reason: 'wrong' | 'guessed' | 'skipped' | 'slow'
  testId?: string
  userNote?: string
  attemptedAt: string
  retried: boolean
  retriedCorrect?: boolean
}

export type FlashcardType = 'formula' | 'reaction' | 'concept' | 'mistake' | 'custom'

export interface Flashcard {
  id: string
  type: FlashcardType
  questionId?: string
  subject: SubjectId
  chapter?: string
  front: string
  frontLatex?: string
  back: string
  backLatex?: string
  tags: string[]
  /** Leitner box 1..5 */
  box: number
  nextReviewAt: string
  lastReviewedAt?: string
  repetitions: number
  createdAt: string
}

export interface FormulaSheet {
  id: string
  subject: SubjectId
  chapter: string
  title: string
  formulas: FormulaItem[]
  createdAt: string
}

export interface FormulaItem {
  id: string
  name: string
  latex: string
  /** Short explanation */
  note?: string
}

export interface MistakeStats {
  wrong: number
  guessed: number
  skipped: number
  slow: number
}
