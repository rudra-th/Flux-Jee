import { db } from '@/db'
import type { Question, QuestionFilters } from '@/types/question'
import { mulberry32, seededShuffle } from '@/utils/cn'
import { getShuffledQuestion } from '@/engines/testBuilder'

export interface SelectionOptions extends QuestionFilters {
  limit?: number
  seed?: number
  shuffle?: boolean
  excludeIds?: string[]
}

/**
 * Query the question database with rich filters.
 * Uses Dexie indexes where possible, filters in memory otherwise.
 */
export async function selectQuestions(opts: SelectionOptions): Promise<Question[]> {
  const {
    limit = 50,
    seed = 1,
    shuffle = true,
    excludeIds = [],
    subject,
    chapter,
    microTopic,
    difficulty,
    year,
    type,
    exam,
    tags,
    search,
    onlyWrong,
    onlyUnattempted,
    onlyBookmarked,
    onlyGuessed,
    concept,
  } = opts

  let collection = db.questions.toCollection()

  if (subject) collection = db.questions.where('subject').equals(subject)
  else if (exam) collection = db.questions.where('exam').equals(exam)

  let rows = await collection.toArray()

  // Apply chapter/topic/type filters
  if (chapter) rows = rows.filter((q) => q.chapter === chapter)
  if (microTopic) rows = rows.filter((q) => q.microTopic === microTopic)
  if (difficulty) rows = rows.filter((q) => q.difficulty === difficulty)
  if (year) rows = rows.filter((q) => q.year === year)
  if (type) rows = rows.filter((q) => q.type === type)
  if (exam && exam !== 'practice') rows = rows.filter((q) => q.exam === exam || q.exam === 'practice')
  if (tags && tags.length) rows = rows.filter((q) => tags.every((t) => q.tags.includes(t)))
  if (concept) rows = rows.filter((q) => q.solution.concept?.toLowerCase().includes(concept.toLowerCase()))
  if (search) {
    const s = search.toLowerCase()
    rows = rows.filter(
      (q) =>
        q.content.text?.toLowerCase().includes(s) ||
        q.chapter.toLowerCase().includes(s) ||
        q.microTopic.toLowerCase().includes(s) ||
        q.solution.concept?.toLowerCase().includes(s) ||
        q.tags.some((t) => t.toLowerCase().includes(s)),
    )
  }

  if (onlyWrong || onlyUnattempted || onlyGuessed || onlyBookmarked) {
    const answerRecords = await db.answerRecords.toArray()
    const bookmarks = await db.bookmarks.toArray()
    const bookmarkedIds = new Set(bookmarks.map((b) => b.questionId))

    if (onlyWrong) {
      const wrongIds = new Set(
        answerRecords.filter((r) => r.everWrong && !r.everCorrect).map((r) => r.questionId),
      )
      rows = rows.filter((q) => wrongIds.has(q.id))
    }
    if (onlyUnattempted) {
      const attemptedIds = new Set(answerRecords.map((r) => r.questionId))
      rows = rows.filter((q) => !attemptedIds.has(q.id))
    }
    if (onlyGuessed) {
      const guessedIds = new Set(
        answerRecords.filter((r) => r.everGuessed).map((r) => r.questionId),
      )
      rows = rows.filter((q) => guessedIds.has(q.id))
    }
    if (onlyBookmarked) {
      rows = rows.filter((q) => bookmarkedIds.has(q.id))
    }
  }

  if (excludeIds.length) {
    const ex = new Set(excludeIds)
    rows = rows.filter((q) => !ex.has(q.id))
  }

  if (shuffle) {
    const rng = mulberry32(seed)
    rows = seededShuffle(rows, rng)
  }

  return rows.slice(0, limit)
}

export async function getQuestionById(id: string): Promise<Question | undefined> {
  return getShuffledQuestion(id) ?? db.questions.get(id)
}

export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  const out: Question[] = []
  for (const id of ids) {
    const q = await db.questions.get(id)
    if (q) out.push(q)
  }
  return out
}

export async function countByFilters(opts: QuestionFilters): Promise<number> {
  const rows = await selectQuestions({ ...opts, limit: 100000, shuffle: false })
  return rows.length
}

/** Fetch a random "daily challenge" set */
export async function getDailyChallenge(seed?: number): Promise<Question[]> {
  const today = new Date().toDateString()
  const daySeed = seed ?? hashString(today)
  return selectQuestions({
    limit: 10,
    seed: daySeed,
    difficulty: 3,
  })
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export async function getWeakChapterQuestions(limit = 20): Promise<Question[]> {
  const records = await db.answerRecords.toArray()
  const failed: Record<string, number> = {}
  for (const r of records) {
    if (r.everWrong && !r.everCorrect) {
      failed[r.questionId] = (failed[r.questionId] ?? 0) + 1
    }
  }
  const ids = Object.keys(failed)
  if (!ids.length) return selectQuestions({ limit, difficulty: 3, seed: 7 })
  return getQuestionsByIds(ids).then((qs) => seededShuffle(qs, mulberry32(3)).slice(0, limit))
}
