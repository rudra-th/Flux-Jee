import type { TestConfig, SectionConfig } from '@/types/test'
import type { SubjectId } from '@/types/core'
import { randomId } from '@/utils/cn'
import { selectQuestions } from '@/engines/questionEngine/selector'
import { shuffleOptions } from '@/engines/questionEngine/shuffle'
import { mulberry32 } from '@/utils/cn'
import { getSubject, SUBJECTS } from '@/constants/syllabus'
import { getMockTestById } from '@/constants/mockTestSeries'
import type { Question } from '@/types/question'

const sessionShuffledQuestions = new Map<string, Question>()

export function getShuffledMockQuestion(id: string): Question | undefined {
  return sessionShuffledQuestions.get(id)
}

function mapChapterNameToId(subject: SubjectId, chapterName: string): string | undefined {
  const sub = getSubject(subject)
  const normalized = chapterName.toLowerCase().trim()
  return sub.chapters.find((c) => {
    const name = c.name.toLowerCase()
    return name === normalized ||
      name.includes(normalized) ||
      normalized.includes(name)
  })?.id
}

function mapChapterNamesToIds(subject: SubjectId, chapterNames: string[]): string[] {
  if (chapterNames.length === 0) return []
  return chapterNames
    .map((name) => mapChapterNameToId(subject, name))
    .filter((id): id is string => id !== undefined)
}

function getQuestionTypesForFormat(format: 'main' | 'advanced') {
  if (format === 'main') {
    return { single: true, integer: true, multiple: false, numerical: false, matrix: false, paragraph: false, 'assertion-reason': false, 'match-columns': false }
  }
  return { single: true, integer: true, multiple: true, numerical: true, matrix: true, paragraph: true, 'assertion-reason': true, 'match-columns': true }
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    ;(acc[k] = acc[k] ?? []).push(item)
    return acc
  }, {})
}

export async function buildMockTest(testId: string, seed?: number): Promise<TestConfig> {
  const mockTest = getMockTestById(testId)
  if (!mockTest) throw new Error(`Mock test not found: ${testId}`)

  const actualSeed = seed ?? Date.now()
  const rng = mulberry32(actualSeed)
  const types = getQuestionTypesForFormat(mockTest.format)
  const enabledTypes = Object.entries(types).filter(([, v]) => v).map(([k]) => k) as Array<Question['type']>

  const questionsPerSubject = Math.ceil(mockTest.questionCount / 3)
  const isFullSyllabus = mockTest.type === 'major' && mockTest.chapters.physics.length === 0

  const sections: SectionConfig[] = []
  const allQuestions: Question[] = []

  for (const subject of SUBJECTS) {
    const subjectId = subject.id as SubjectId
    const chapterNames = mockTest.chapters[subjectId] ?? []
    const chapterIds = mapChapterNamesToIds(subjectId, chapterNames)

    const difficultyFilter: Array<1 | 2 | 3 | 4 | 5> = mockTest.format === 'advanced'
      ? [4, 5]
      : [3, 4, 5]

    const questions = await selectQuestions({
      subject: subjectId,
      exam: mockTest.format === 'main' ? 'jee-main' : 'jee-advanced',
      limit: 2000,
      seed: actualSeed + subjectId.length,
      shuffle: true,
    })

    let filtered = questions.filter((q) => {
      if (!enabledTypes.includes(q.type)) return false
      if (!difficultyFilter.includes(q.difficulty)) return false
      return true
    })

    if (!isFullSyllabus && chapterIds.length > 0) {
      const grouped = groupBy(filtered, (q) => q.chapter)
      const picked: Question[] = []
      const perChapter = Math.ceil(questionsPerSubject / chapterIds.length)
      for (const chId of chapterIds) {
        const qs = grouped[chId] ?? []
        picked.push(...qs.slice(0, perChapter))
      }
      filtered = picked
    }

    const picked = filtered.slice(0, questionsPerSubject)
    if (!picked.length) continue

    const sectionId = `section-${subjectId}`
    const isAdvanced = mockTest.format === 'advanced'

    sections.push({
      id: sectionId,
      type: subjectId,
      subject: subjectId,
      questionIds: picked.map((q) => q.id),
      marksPerCorrect: 4,
      marksPerWrong: isAdvanced ? 0 : -1,
      marksPerUnattempted: 0,
      partialScheme: isAdvanced ? 'proportional' : undefined,
      durationSeconds: mockTest.durationMinutes * 60,
    })
    allQuestions.push(...picked)
  }

  if (!sections.length) {
    throw new Error('No questions matched the test criteria. The question bank may not have enough high-difficulty questions for this test.')
  }

  for (const q of allQuestions) {
    const shuffled = shuffleOptions(q, rng)
    sessionShuffledQuestions.set(shuffled.id, shuffled)
  }

  return {
    id: randomId('mock-'),
    name: mockTest.name,
    mode: 'full',
    exam: mockTest.format === 'main' ? 'jee-main' : 'jee-advanced',
    sections,
    totalQuestions: allQuestions.length,
    durationSeconds: mockTest.durationMinutes * 60,
    negativeMarking: true,
    shuffleQuestions: false,
    shuffleOptions: true,
    allowPause: true,
    autoSubmit: true,
    warnings: [600, 300, 120, 60, 10],
    createdAt: new Date().toISOString(),
  }
}
