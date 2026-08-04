import type { Question } from '@/types/question'
import type { SectionConfig } from '@/types/test'
import type { QuestionTypeId } from '@/types/core'
import type { MatrixAnswer } from '@/types/question'

export interface MarkResult {
  result: 'correct' | 'wrong' | 'partial' | 'unattempted'
  awarded: number
  maxMarks: number
}

/** Evaluate a single answer against the correct answer. */
export function evaluateAnswer(
  question: Question,
  selected: number[],
  matrix?: Record<number, number>,
  section?: SectionConfig,
): MarkResult {
  const scheme = section ?? defaultSection(question)
  const answer = question.answer
  const correctMarks = scheme.marksPerCorrect
  const wrongMarks = scheme.marksPerWrong
  const max = correctMarks

  // Unattempted
  if (selected.length === 0 && !matrix) {
    return { result: 'unattempted', awarded: 0, maxMarks: max }
  }

  switch (answer.type) {
    case 'single':
    case 'assertion-reason': {
      const correct = selected.length === 1 && selected[0] === answer.correctIndex
      return correct
        ? { result: 'correct', awarded: correctMarks, maxMarks: max }
        : { result: 'wrong', awarded: wrongMarks, maxMarks: max }
    }
    case 'multiple': {
      const correctSet = new Set(answer.correctIndices)
      const selectedSet = new Set(selected)
      const correctCount = [...selectedSet].filter((i) => correctSet.has(i)).length
      const wrongCount = [...selectedSet].filter((i) => !correctSet.has(i)).length

      if (correctCount === answer.correctIndices.length && wrongCount === 0) {
        return { result: 'correct', awarded: correctMarks, maxMarks: max }
      }
      if (wrongCount > 0 || correctCount === 0) {
        return { result: 'wrong', awarded: wrongMarks, maxMarks: max }
      }
      // Partially correct (some but not all correct options, no wrong ones)
      if (scheme.partialScheme === 'proportional') {
        const proportion = correctCount / answer.correctIndices.length
        const partial = round2(correctMarks * proportion)
        return { result: 'partial', awarded: partial, maxMarks: max }
      }
      return { result: 'partial', awarded: 0, maxMarks: max }
    }
    case 'integer': {
      if (selected.length !== 1) {
        return { result: 'unattempted', awarded: 0, maxMarks: max }
      }
      const val = selected[0]
      if (val === undefined) {
        return { result: 'unattempted', awarded: 0, maxMarks: max }
      }
      const ok = answer.range
        ? val >= answer.range[0] && val <= answer.range[1]
        : val === answer.correctValue
      return ok
        ? { result: 'correct', awarded: correctMarks, maxMarks: max }
        : { result: 'wrong', awarded: wrongMarks, maxMarks: max }
    }
    case 'numerical': {
      if (selected.length !== 1) {
        return { result: 'unattempted', awarded: 0, maxMarks: max }
      }
      const val = selected[0]
      if (val === undefined) {
        return { result: 'unattempted', awarded: 0, maxMarks: max }
      }
      const ok = val >= answer.range[0] && val <= answer.range[1]
      return ok
        ? { result: 'correct', awarded: correctMarks, maxMarks: max }
        : { result: 'wrong', awarded: wrongMarks, maxMarks: max }
    }
    case 'matrix':
    case 'match-columns': {
      if (!matrix || Object.keys(matrix).length === 0) {
        return { result: 'unattempted', awarded: 0, maxMarks: max }
      }
      const correct = answer.correct
      let correctCount = 0
      let total = 0
      for (const row of Object.keys(correct.matches)) {
        total++
        if (matrix[Number(row)] === correct.matches[Number(row)]) correctCount++
      }
      if (correctCount === total) {
        return { result: 'correct', awarded: correctMarks, maxMarks: max }
      }
      if (scheme.partialScheme === 'proportional') {
        const partial = round2((correctMarks * correctCount) / total)
        return { result: 'partial', awarded: partial, maxMarks: max }
      }
      return { result: 'wrong', awarded: wrongMarks, maxMarks: max }
    }
    default:
      return { result: 'unattempted', awarded: 0, maxMarks: max }
  }
}

export function isCorrectAnswer(question: Question, selected: number[], matrix?: Record<number, number>): boolean {
  const r = evaluateAnswer(question, selected, matrix)
  return r.result === 'correct'
}

function defaultSection(question: Question): SectionConfig {
  return {
    id: question.subject,
    type: question.subject,
    subject: question.subject,
    questionIds: [],
    marksPerCorrect: question.type === 'integer' ? 4 : 4,
    marksPerWrong: question.exam === 'jee-main' && question.type === 'single' ? -1 : 0,
    marksPerUnattempted: 0,
    durationSeconds: 0,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Score a full test result set */
export interface ScoreBreakdown {
  scores: Record<string, number>
  totalMarks: number
  maxMarks: number
  correct: number
  wrong: number
  partial: number
  unattempted: number
  accuracy: number
  attemptRate: number
}

export function scoreTest(
  questions: Record<string, Question>,
  sections: SectionConfig[],
  answers: Record<string, { selected: number[]; matrix?: Record<number, number> }>,
): ScoreBreakdown {
  const scores: Record<string, number> = {}
  let total = 0
  let max = 0
  let correct = 0
  let wrong = 0
  let partial = 0
  let unattempted = 0

  for (const section of sections) {
    let secScore = 0
    let secMax = 0
    for (const qid of section.questionIds) {
      const q = questions[qid]
      if (!q) continue
      const ans = answers[qid]
      const r = evaluateAnswer(q, ans?.selected ?? [], ans?.matrix, section)
      secScore += r.awarded
      secMax += r.maxMarks
      if (r.result === 'correct') correct++
      else if (r.result === 'wrong') wrong++
      else if (r.result === 'partial') partial++
      else unattempted++
    }
    scores[section.id] = round2(secScore)
    total += secScore
    max += secMax
  }

  const attempted = correct + wrong + partial
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0
  const attemptRate = max / 4 > 0 ? (attempted / (max / 4)) * 100 : 0

  return {
    scores,
    totalMarks: round2(total),
    maxMarks: max,
    correct,
    wrong,
    partial,
    unattempted,
    accuracy: round2(accuracy),
    attemptRate: round2(attemptRate),
  }
}

export const typeToScheme: Record<QuestionTypeId, { correct: number; wrong: number }> = {
  single: { correct: 4, wrong: -1 },
  multiple: { correct: 4, wrong: 0 },
  integer: { correct: 4, wrong: 0 },
  numerical: { correct: 4, wrong: -1 },
  matrix: { correct: 4, wrong: 0 },
  paragraph: { correct: 4, wrong: -1 },
  'assertion-reason': { correct: 4, wrong: -1 },
  'match-columns': { correct: 4, wrong: 0 },
}

export function validateMatrixAnswer(a: MatrixAnswer): boolean {
  const matches = a.matches
  const values = Object.values(matches)
  return values.length > 0 && values.every((v) => v >= 0)
}
