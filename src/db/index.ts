import Dexie, { type EntityTable } from 'dexie'
import type { Question } from '@/types/question'
import type { TestDraft, TestResult } from '@/types/test'
import type { Bookmark, BookmarkFolder, Flashcard, FormulaSheet, MistakeEntry } from '@/types/progress'
import type { UserSettings } from '@/types/settings'
import type { AccuracyEntry } from '@/types/analytics'

export interface QuestionMeta {
  id: string
  averageAccuracy: number
  averageTime: number
  attempts: number
  bookmarks: number
}

export interface AnswerRecord {
  questionId: string
  /** true if answered correctly in any test */
  everCorrect: boolean
  /** true if ever answered wrong */
  everWrong: boolean
  everGuessed: boolean
  everSkipped: boolean
  /** recent accuracy 0-1 */
  accuracy: number
  attempts: number
  correctAttempts: number
  totalTime: number
  lastAttemptedAt?: string
  lastResult?: 'correct' | 'wrong' | 'partial' | 'unattempted'
}

export class JeeArenaDB extends Dexie {
  questions!: EntityTable<Question, 'id'>
  questionMeta!: EntityTable<QuestionMeta, 'id'>
  answerRecords!: EntityTable<AnswerRecord, 'questionId'>
  testResults!: EntityTable<TestResult, 'id'>
  testDrafts!: EntityTable<TestDraft, 'id'>
  mistakes!: EntityTable<MistakeEntry, 'id'>
  bookmarks!: EntityTable<Bookmark, 'id'>
  bookmarkFolders!: EntityTable<BookmarkFolder, 'id'>
  flashcards!: EntityTable<Flashcard, 'id'>
  formulaSheets!: EntityTable<FormulaSheet, 'id'>
  dailyActivity!: EntityTable<AccuracyEntry, 'date'>
  settings!: EntityTable<UserSettings, 'id'>

  constructor() {
    super('jee-arena')
    this.version(1).stores({
      questions: 'id, subject, chapter, microTopic, exam, year, shift, type, difficulty, createdAt',
      questionMeta: 'id',
      answerRecords: 'questionId, lastAttemptedAt, accuracy',
      testResults: 'id, configId, submittedAt, totalMarks, accuracy',
      testDrafts: 'id, startedAt, lastSavedAt',
      mistakes: 'id, questionId, reason, attemptedAt, retried',
      bookmarks: 'id, questionId, createdAt, folderId',
      bookmarkFolders: 'id, name',
      flashcards: 'id, type, subject, box, nextReviewAt, createdAt',
      formulaSheets: 'id, subject, chapter',
      dailyActivity: 'date',
      settings: 'id',
    })
  }
}

export const db = new JeeArenaDB()

export async function dbHealth(): Promise<boolean> {
  try {
    await db.open()
    return true
  } catch {
    return false
  }
}

export async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
}

export async function countQuestions(): Promise<number> {
  return db.questions.count()
}

export async function getSettings(): Promise<UserSettings | undefined> {
  return db.settings.get('main')
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await db.settings.put(settings, 'main')
}
