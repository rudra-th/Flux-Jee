import { db } from '@/db'
import type { Question } from '@/types/question'
import { SUBJECTS } from '@/constants/syllabus'
import { mulberry32, seededShuffle } from '@/utils/cn'
import { generateQuestion } from '@/engines/questionEngine/generator'
import type { QuestionMeta } from '@/db'

export { importRealQuestions, PYQ_SOURCE } from './importPyq'
export {
  importCuratedQuestions,
  CURATED_QUESTIONS,
  CURATED_QUESTION_COUNT,
  CURATED_VERSION,
} from './curated'

export interface SeedOptions {
  /** Questions per micro-topic */
  perTopic?: number
  /** Override: build from PYQ dataset instead of generated */
  progress?: (done: number, total: number) => void
  signal?: { cancelled: boolean }
}

const DIFFICULTIES = [1, 2, 3, 4, 5] as const
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024]

/**
 * Seeds the database with a large question set.
 * Uses a deterministic seed so rebuilds are consistent.
 */
export async function seedDatabase(opts: SeedOptions = {}): Promise<number> {
  const perTopic = opts.perTopic ?? 4
  const all: Question[] = []
  const meta: QuestionMeta[] = []

  const topics: Array<{ subject: (typeof SUBJECTS)[number]['id']; chapterId: string; topicId: string }> = []
  for (const subject of SUBJECTS) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        topics.push({ subject: subject.id, chapterId: chapter.id, topicId: topic.id })
      }
    }
  }

  const total = topics.length * perTopic
  let done = 0

  for (let t = 0; t < topics.length; t++) {
    if (opts.signal?.cancelled) break
    const topic = topics[t]
    if (!topic) continue

    // Assign years so each topic gets a spread of PYQs
    for (let k = 0; k < perTopic; k++) {
      if (opts.signal?.cancelled) break
      const seed = t * 1000 + k * 31 + 7
      const difficulty = DIFFICULTIES[k % DIFFICULTIES.length] as (typeof DIFFICULTIES)[number]
      const year = YEARS[k % YEARS.length] ?? 2023
      const exam = k % 5 === 4 ? 'practice' : 'jee-main'
      const q = generateQuestion({
        subject: topic.subject,
        chapterId: topic.chapterId,
        topicId: topic.topicId,
        difficulty,
        year,
        exam,
        seed,
      })
      q.id = `seed-${t}-${k}`
      all.push(q)
      done++

      meta.push({
        id: q.id,
        averageAccuracy: 0.35 + ((seed % 50) / 100),
        averageTime: q.estimatedTime * (0.8 + ((seed % 40) / 100)),
        attempts: (seed % 5000) + 50,
        bookmarks: seed % 300,
      })
    }
    opts.progress?.(done, total)
  }

  await db.transaction('rw', db.questions, db.questionMeta, async () => {
    await db.questions.clear()
    await db.questionMeta.clear()
    // Batch insert in chunks to avoid long transactions
    const CHUNK = 2000
    for (let i = 0; i < all.length; i += CHUNK) {
      await db.questions.bulkPut(all.slice(i, i + CHUNK))
    }
    for (let i = 0; i < meta.length; i += CHUNK) {
      await db.questionMeta.bulkPut(meta.slice(i, i + CHUNK))
    }
  })

  return all.length
}

/**
 * Returns the list of available years in the database (for PYQ mode filters).
 */
export async function getAvailableYears(): Promise<number[]> {
  const years = new Set<number>()
  await db.questions.each((q) => years.add(q.year))
  return Array.from(years).sort((a, b) => b - a)
}

/** Get a count breakdown by subject for display */
export async function getSubjectCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = { physics: 0, chemistry: 0, mathematics: 0 }
  await db.questions.each((q) => {
    counts[q.subject] = (counts[q.subject] ?? 0) + 1
  })
  return counts
}

export async function ensureSeeded(): Promise<boolean> {
  const count = await db.questions.count()
  return count > 0
}

/** Sample questions across subjects for a quick demo/full test */
export async function sampleQuestions(
  perSubject: number,
  seed = 42,
  exam: 'jee-main' | 'jee-advanced' = 'jee-main',
): Promise<Question[]> {
  const rng = mulberry32(seed)
  const out: Question[] = []
  for (const subject of ['physics', 'chemistry', 'mathematics'] as const) {
    const subset = await db.questions
      .where('subject')
      .equals(subject)
      .filter((q) => q.exam === exam || q.exam === 'practice')
      .limit(perSubject * 10)
      .toArray()
    const picked = seededShuffle(subset, rng).slice(0, perSubject)
    out.push(...picked)
  }
  return seededShuffle(out, rng)
}
