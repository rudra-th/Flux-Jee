import type { TestConfig } from '@/types/test'
import { computeAdaptiveProfile } from '@/engines/adaptive/engine'
import { buildTest } from '@/engines/testBuilder'

/**
 * Build a test targeting the student's weakest chapters.
 * Uses the adaptive profile engine to compute chapter-level weakness,
 * then builds a standard test filtered to those chapters.
 */
export async function buildWeakChapterTest(questionCount = 30): Promise<TestConfig> {
  const profile = await computeAdaptiveProfile()
  const weakChapterNames = profile.weakChapters.map((c) => c.chapter)

  if (!weakChapterNames.length) {
    // No history available - build a general medium-difficulty test
    return buildTest({
      name: 'Weak Chapter Test',
      mode: 'weak-chapter',
      exam: 'practice',
      subjects: ['physics', 'chemistry', 'mathematics'],
      difficulties: [3],
      totalQuestions: questionCount,
      timeLimitSeconds: 30 * 60,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowPause: true,
      autoSubmit: true,
      seed: Date.now(),
    })
  }

  // Determine which subjects the weak chapters belong to
  const weakSubjects = new Set(profile.weakChapters.map((c) => c.subject))
  const subjects = Array.from(weakSubjects) as Array<'physics' | 'chemistry' | 'mathematics'>

  return buildTest({
    name: 'Weak Chapter Test',
    mode: 'weak-chapter',
    exam: 'practice',
    subjects,
    chapters: weakChapterNames,
    difficulties: [
      profile.suggestedDifficulty,
      Math.min(5, profile.suggestedDifficulty + 1) as 1 | 2 | 3 | 4 | 5,
    ],
    totalQuestions: questionCount,
    timeLimitSeconds: 30 * 60,
    negativeMarking: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowPause: true,
    autoSubmit: true,
    seed: Date.now(),
  })
}
