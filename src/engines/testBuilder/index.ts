import type { TestConfig, SectionConfig } from '@/types/test'
import type { Difficulty, ExamId, QuestionTypeId, SubjectId } from '@/types/core'
import { randomId } from '@/utils/cn'
import { selectQuestions } from '@/engines/questionEngine/selector'
import { shuffleOptions } from '@/engines/questionEngine/shuffle'
import { mulberry32 } from '@/utils/cn'
import { getSubject } from '@/constants/syllabus'
import type { Question } from '@/types/question'

const sessionShuffledQuestions = new Map<string, Question>()

export function getShuffledQuestion(id: string): Question | undefined {
  return sessionShuffledQuestions.get(id)
}

export interface TestBuildOptions {
  name: string
  mode: TestConfig['mode']
  exam: ExamId
  subjects: SubjectId[]
  chapters?: string[]
  microTopics?: string[]
  difficulties?: Difficulty[]
  questionTypes?: QuestionTypeId[]
  questionsPerSection?: number
  totalQuestions?: number
  timeLimitSeconds?: number
  negativeMarking: boolean
  shuffleQuestions: boolean
  shuffleOptions: boolean
  years?: number[]
  allowPause: boolean
  autoSubmit: boolean
  includeWrong?: boolean
  includeBookmarked?: boolean
  onlyWrong?: boolean
  onlyBookmarked?: boolean
  onlyUnattempted?: boolean
  isAdaptive?: boolean
  seed?: number
}

const DEFAULT_DURATION = {
  'jee-main': 180 * 60,
  'jee-advanced': 180 * 60,
  practice: 60 * 60,
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    ;(acc[k] = acc[k] ?? []).push(item)
    return acc
  }, {})
}

export async function buildTest(opts: TestBuildOptions): Promise<TestConfig> {
  const seed = opts.seed ?? Date.now()
  const rng = mulberry32(seed)
  const perSection = opts.questionsPerSection ?? Math.max(5, Math.floor((opts.totalQuestions ?? 30) / Math.max(1, opts.subjects.length)))

  // Fetch questions per subject
  const bySubject: Record<string, Question[]> = {}
  for (const subject of opts.subjects) {
    const questions = await selectQuestions({
      subject,
      exam: opts.exam,
      chapter: undefined,
      limit: 2000,
      seed: seed + subject.length,
      shuffle: true,
      onlyWrong: opts.onlyWrong,
      onlyUnattempted: opts.onlyUnattempted,
      onlyBookmarked: opts.onlyBookmarked,
      year: undefined,
    })

    // Apply additional filters
    const chapters = opts.chapters
    const microTopics = opts.microTopics
    const difficulties = opts.difficulties
    const questionTypes = opts.questionTypes
    const years = opts.years
    let filtered = questions
    if (chapters?.length) filtered = filtered.filter((q) => chapters.includes(q.chapter))
    if (microTopics?.length) filtered = filtered.filter((q) => microTopics.includes(q.microTopic))
    if (difficulties?.length) filtered = filtered.filter((q) => difficulties.includes(q.difficulty))
    if (questionTypes?.length) filtered = filtered.filter((q) => questionTypes.includes(q.type))
    if (years?.length) filtered = filtered.filter((q) => years.includes(q.year))
    if (opts.includeWrong || opts.onlyWrong) {
      // already filtered via selector
    }

    bySubject[subject] = filtered
  }

  // Build balanced selection
  const sections: SectionConfig[] = []
  const allQuestions: Question[] = []

  for (const subject of opts.subjects) {
    const pool = bySubject[subject] ?? []
    const picked: Question[] = []

    // If chapters selected, balance across chapters
    if (opts.chapters?.length) {
      const grouped = groupBy(pool, (q) => q.chapter)
      const chapterIds = opts.chapters
      const perChapter = Math.ceil(perSection / chapterIds.length)
      for (const ch of chapterIds) {
        const qs = grouped[ch] ?? []
        const selected = qs.slice(0, perChapter)
        picked.push(...selected)
      }
    } else if (opts.microTopics?.length) {
      const grouped = groupBy(pool, (q) => q.microTopic)
      const perTopic = Math.ceil(perSection / opts.microTopics.length)
      for (const tp of opts.microTopics) {
        picked.push(...(grouped[tp] ?? []).slice(0, perTopic))
      }
    } else {
      picked.push(...pool.slice(0, perSection))
    }

    if (!picked.length) continue

    const sectionId = `section-${subject}`
    sections.push({
      id: sectionId,
      type: subject,
      subject,
      questionIds: picked.map((q) => q.id),
      marksPerCorrect: 4,
      marksPerWrong: opts.negativeMarking ? (opts.exam === 'jee-advanced' ? 0 : -1) : 0,
      marksPerUnattempted: 0,
      durationSeconds: opts.timeLimitSeconds ?? DEFAULT_DURATION[opts.exam],
    })
    allQuestions.push(...picked)
  }

  if (!sections.length) {
    throw new Error('No questions matched the selected filters. Try widening your selection.')
  }

  // Apply option shuffling and store shuffled variants in session map
  if (opts.shuffleOptions) {
    for (const q of allQuestions) {
      const shuffled = shuffleOptions(q, rng)
      sessionShuffledQuestions.set(shuffled.id, shuffled)
    }
  }

  return {
    id: randomId('test-'),
    name: opts.name,
    mode: opts.mode,
    exam: opts.exam,
    sections,
    totalQuestions: allQuestions.length,
    durationSeconds: opts.timeLimitSeconds ?? DEFAULT_DURATION[opts.exam],
    negativeMarking: opts.negativeMarking,
    shuffleQuestions: opts.shuffleQuestions,
    shuffleOptions: opts.shuffleOptions,
    allowPause: opts.allowPause,
    autoSubmit: opts.autoSubmit,
    warnings: [600, 300, 120, 60, 10],
    isAdaptive: opts.isAdaptive,
    createdAt: new Date().toISOString(),
  }
}

export function getDefaultDuration(exam: ExamId): number {
  return DEFAULT_DURATION[exam]
}

export function chapterNameToId(subject: SubjectId, chapterName: string): string | undefined {
  return getSubject(subject).chapters.find((c) => c.name === chapterName)?.id
}

export function idToChapterName(subject: SubjectId, chapterId: string): string {
  return getSubject(subject).chapters.find((c) => c.id === chapterId)?.name ?? chapterId
}
