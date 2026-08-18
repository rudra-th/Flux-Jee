import { db } from '@/db'
import type { Question } from '@/types/question'
import type { TestConfig, TestResult, QuestionPerformance, AnsweredOption } from '@/types/test'
import { evaluateAnswer } from '@/utils/markScheme'
import { round } from '@/utils/cn'
import { getShuffledQuestion } from '@/engines/testBuilder'

/**
 * Score a completed test by fetching question data and evaluating
 * every answer against the correct answer with the section marking scheme.
 */
export async function scoreTestRun(
  config: TestConfig,
  answers: Record<string, AnsweredOption>,
  autoSubmitted: boolean,
  startedAt: string,
): Promise<TestResult> {
  const allIds = config.sections.flatMap((s) => s.questionIds)
  const questions = await getQuestionsMap(allIds)

  const performance: QuestionPerformance[] = []
  const scores: Record<string, number> = {}
  const sectionWise: TestResult['sectionWise'] = {}
  let totalMarks = 0
  let maxMarks = 0
  let totalTimeSpent = 0
  let guessedCorrect = 0
  let guessedWrong = 0
  let totalGuesses = 0
  let correct = 0
  let wrong = 0
  let partial = 0
  let unattempted = 0

  for (const section of config.sections) {
    let secMarks = 0
    let secMax = 0
    let secCorrect = 0
    let secWrong = 0
    let secUnattempted = 0
    let secPartial = 0
    let secTime = 0

    for (const qid of section.questionIds) {
      const q = questions[qid]
      if (!q) continue
      const ans = answers[qid]

      const hasAnswer = ans ? ans.selected.length > 0 || (ans.matrix && Object.keys(ans.matrix).length > 0) : false
      const isVisited = !!ans?.visited
      const timeSpent = ans?.timeSpent ?? 0
      const isGuessed = !!ans?.isGuessed

      const evaluation = hasAnswer
        ? evaluateAnswer(q, ans?.selected ?? [], ans?.matrix, section)
        : { result: 'unattempted' as const, awarded: 0, maxMarks: section.marksPerCorrect }

      if (evaluation.result === 'correct') secCorrect++
      else if (evaluation.result === 'wrong') secWrong++
      else if (evaluation.result === 'partial') secPartial++
      else secUnattempted++

      secMarks += evaluation.awarded
      secMax += evaluation.maxMarks
      secTime += timeSpent

      if (evaluation.result === 'correct') correct++
      else if (evaluation.result === 'wrong') wrong++
      else if (evaluation.result === 'partial') partial++
      else unattempted++

      if (isGuessed) {
        totalGuesses++
        if (evaluation.result === 'correct') guessedCorrect++
        else guessedWrong++
      }

      performance.push({
        questionId: qid,
        sectionId: section.id,
        result: evaluation.result,
        awardedMarks: round(evaluation.awarded),
        maxMarks: evaluation.maxMarks,
        selected: ans?.selected ?? [],
        matrix: ans?.matrix,
        correctIndices: getCorrectIndices(q),
        timeSpent: round(timeSpent),
        estimatedTime: q.estimatedTime,
        isGuessed,
        markedForReview: ans?.markedForReview ?? false,
        visited: isVisited,
        subject: q.subject,
        chapter: q.chapter,
        microTopic: q.microTopic,
        difficulty: q.difficulty,
        type: q.type,
        year: q.year,
        exam: q.exam,
        isBookmarked: false,
      })
    }

    scores[section.id] = round(secMarks)
    sectionWise[section.id] = {
      correct: secCorrect,
      wrong: secWrong,
      unattempted: secUnattempted,
      partial: secPartial,
      marks: round(secMarks),
      maxMarks: secMax,
      accuracy: secCorrect + secWrong > 0 ? round((secCorrect / (secCorrect + secWrong)) * 100) : 0,
      timeSpent: round(secTime),
    }
    totalMarks += secMarks
    maxMarks += secMax
    totalTimeSpent += secTime
  }

  const attempted = correct + wrong + partial
  const accuracy = attempted > 0 ? round((correct / attempted) * 100) : 0
  const attemptRate = maxMarks / 4 > 0 ? round((attempted / (maxMarks / 4)) * 100) : 0

  return {
    id: `result-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    configId: config.id,
    startedAt,
    submittedAt: new Date().toISOString(),
    autoSubmitted,
    sections: config.sections,
    performance,
    scores,
    sectionWise,
    totalMarks: round(totalMarks),
    maxMarks,
    accuracy,
    attemptRate,
    totalTimeSpent: round(totalTimeSpent),
    guessedCorrect,
    guessedWrong,
    totalGuesses,
    speed: attempted > 0 ? round(totalTimeSpent / attempted) : 0,
  }
}

async function getQuestionsMap(ids: string[]): Promise<Record<string, Question>> {
  const map: Record<string, Question> = {}
  const shuffled = new Map<string, Question>()
  const dbIds: string[] = []
  for (const id of ids) {
    const sq = getShuffledQuestion(id)
    if (sq) shuffled.set(id, sq)
    else dbIds.push(id)
  }
  const rows = await db.questions.bulkGet(dbIds)
  for (const q of rows) {
    if (q) map[q.id] = q
  }
  for (const [id, sq] of shuffled) {
    map[id] = sq
  }
  return map
}

function getCorrectIndices(q: Question): number[] {
  switch (q.answer.type) {
    case 'single':
    case 'assertion-reason':
      return [q.answer.correctIndex]
    case 'multiple':
      return q.answer.correctIndices
    default:
      return []
  }
}
