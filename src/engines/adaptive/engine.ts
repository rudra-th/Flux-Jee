import { db } from '@/db'
import type { TestConfig } from '@/types/test'
import { buildTest } from '@/engines/testBuilder'
import { round } from '@/utils/cn'
import type { ChapterPerformance } from '@/types/analytics'

export interface AdaptiveProfile {
  level: number
  weakChapters: ChapterPerformance[]
  strongChapters: ChapterPerformance[]
  suggestedDifficulty: 1 | 2 | 3 | 4 | 5
}

/**
 * Compute a student's adaptive profile from answer records.
 */
export async function computeAdaptiveProfile(): Promise<AdaptiveProfile> {
  const [records] = await Promise.all([
    db.answerRecords.toArray(),
    db.testResults.toArray(),
  ])

  if (!records.length) {
    return {
      level: 3,
      weakChapters: [],
      strongChapters: [],
      suggestedDifficulty: 3,
    }
  }

  const chapterMap = new Map<string, ChapterPerformance>()
  const uniqueIds = [...new Set(records.map((r) => r.questionId))]
  const questions = await db.questions.bulkGet(uniqueIds)
  const qMap = new Map<string, typeof questions[0]>()
  for (const q of questions) {
    if (q) qMap.set(q.id, q)
  }
  for (const r of records) {
    if (!r.lastAttemptedAt) continue
    const q = qMap.get(r.questionId)
    if (!q) continue
    const key = `${q.subject}|${q.chapter}`
    const entry = chapterMap.get(key) ?? {
      subject: q.subject,
      chapter: q.chapter,
      attempted: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      avgTime: 0,
      weaknessScore: 0,
      lastAttemptedAt: r.lastAttemptedAt,
    }
    entry.attempted++
    if (r.lastResult === 'correct') entry.correct++
    if (r.lastResult === 'wrong') entry.wrong++
    entry.avgTime = round(r.totalTime / entry.attempted)
    entry.accuracy = entry.attempted ? round((entry.correct / entry.attempted) * 100) : 0
    entry.weaknessScore = round((1 - entry.accuracy / 100) * 70 + (entry.avgTime / 180) * 30)
    chapterMap.set(key, entry)
  }

  const chapters = Array.from(chapterMap.values()).filter((c) => c.attempted > 0)
  const sorted = [...chapters].sort((a, b) => b.weaknessScore - a.weaknessScore)
  const weakChapters = sorted.slice(0, Math.min(5, sorted.length))
  const strongChapters = sorted.slice(-3).reverse()

  const avgAccuracy =
    sorted.length > 0 ? round(sorted.reduce((s, c) => s + c.accuracy, 0) / sorted.length) : 50
  const suggestedDifficulty = (avgAccuracy >= 75 ? 4 : avgAccuracy >= 55 ? 3 : avgAccuracy >= 35 ? 2 : 1) as AdaptiveProfile['suggestedDifficulty']

  return {
    level: suggestedDifficulty,
    weakChapters,
    strongChapters,
    suggestedDifficulty,
  }
}

/**
 * Generate an adaptive test from the weakest chapters.
 */
export async function buildAdaptiveTest(questionCount = 20): Promise<TestConfig> {
  const profile = await computeAdaptiveProfile()
  const weakIds = profile.weakChapters.map((c) => c.chapter)

  if (!weakIds.length) {
    return buildTest({
      name: 'Adaptive Test',
      mode: 'adaptive',
      exam: 'practice',
      subjects: ['physics', 'chemistry', 'mathematics'],
      difficulties: [profile.suggestedDifficulty],
      questionsPerSection: Math.ceil(questionCount / 3),
      timeLimitSeconds: 60 * 60,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowPause: true,
      autoSubmit: true,
      isAdaptive: true,
      seed: Date.now(),
    })
  }

  return buildTest({
    name: 'Adaptive Test',
    mode: 'adaptive',
    exam: 'practice',
    subjects: ['physics', 'chemistry', 'mathematics'],
    chapters: weakIds,
    difficulties: [profile.suggestedDifficulty, (Math.min(5, profile.suggestedDifficulty + 1) as AdaptiveProfile['suggestedDifficulty'])],
    questionsPerSection: Math.ceil(questionCount / 3),
    timeLimitSeconds: 60 * 60,
    negativeMarking: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowPause: true,
    autoSubmit: true,
    isAdaptive: true,
    seed: Date.now(),
  })
}
