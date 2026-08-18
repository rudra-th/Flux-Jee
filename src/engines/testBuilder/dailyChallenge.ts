import type { TestConfig } from '@/types/test'
import { getDailyChallenge } from '@/engines/questionEngine/selector'
import { randomId } from '@/utils/cn'
import { shuffleOptions } from '@/engines/questionEngine/shuffle'
import { mulberry32 } from '@/utils/cn'
import type { Question } from '@/types/question'

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    ;(acc[k] = acc[k] ?? []).push(item)
    return acc
  }, {})
}

/**
 * Build a daily challenge test using the deterministic daily question set.
 * Same date = same questions for all users.
 */
export async function buildDailyChallengeTest(): Promise<TestConfig> {
  const questions = await getDailyChallenge()

  if (!questions.length) {
    throw new Error('No questions available for the daily challenge.')
  }

  const seed = Date.now()
  const rng = mulberry32(seed)

  // Group questions by subject for section structure
  const bySubject = groupBy(questions, (q) => q.subject)
  const subjects = Object.keys(bySubject) as Array<'physics' | 'chemistry' | 'mathematics'>

  const sections = subjects.map((subject) => ({
    id: `section-${subject}`,
    type: subject as 'physics' | 'chemistry' | 'mathematics',
    subject,
    questionIds: bySubject[subject]!.map((q) => q.id),
    marksPerCorrect: 4,
    marksPerWrong: 0,
    marksPerUnattempted: 0,
    durationSeconds: 15 * 60,
  }))

  // Shuffle options if needed
  for (const q of questions) {
    const shuffled = shuffleOptions(q, rng)
    await persistShuffled(shuffled)
  }

  return {
    id: randomId('test-'),
    name: `Daily Challenge \u00b7 ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    mode: 'daily-challenge',
    exam: 'practice',
    sections,
    totalQuestions: questions.length,
    durationSeconds: 15 * 60,
    negativeMarking: false,
    shuffleQuestions: false,
    shuffleOptions: true,
    allowPause: false,
    autoSubmit: true,
    warnings: [300, 120, 60, 10],
    createdAt: new Date().toISOString(),
  }
}

async function persistShuffled(q: Question): Promise<void> {
  const existing = await (await import('@/db')).db.questions.get(q.id)
  if (existing) {
    await (await import('@/db')).db.questions.put(q)
  }
}
