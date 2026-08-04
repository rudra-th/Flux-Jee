import type { Question } from '@/types/question'

/**
 * Shuffle question options while preserving the correct answer index.
 * Options that can't be shuffled (integer/numerical) return unchanged.
 */
export function shuffleOptions(
  question: Question,
  rng: () => number,
): Question {
  const type = question.type
  if (type === 'integer' || type === 'numerical' || type === 'matrix' || type === 'match-columns') {
    return question
  }

  const n = question.options.length
  if (n < 2) return question

  const indices = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j] as number, indices[i] as number]
  }

  const correctIndex = getCorrectIndex(question)
  const newCorrectIndex = indices.indexOf(correctIndex)

  const newOptions = indices.map((oldIndex) => question.options[oldIndex] as NonNullable<(typeof question.options)[number]>)
  const newOptionsWithKeys = newOptions.map((opt, i) => ({
    ...opt,
    key: optionKeyForPosition(i, n),
  }))

  return {
    ...question,
    options: newOptionsWithKeys,
    answer: mapAnswer(question, newCorrectIndex, indices),
  }
}

function optionKeyForPosition(pos: number, n: number): string {
  if (n <= 4) return 'ABCD'[pos] ?? `${pos + 1}`
  return `${pos + 1}`
}

export function getCorrectIndex(question: Question): number {
  switch (question.answer.type) {
    case 'single':
    case 'assertion-reason':
      return question.answer.correctIndex
    default:
      return -1
  }
}

function mapAnswer(question: Question, newCorrectIndex: number, mapping: number[]): Question['answer'] {
  switch (question.answer.type) {
    case 'single':
    case 'assertion-reason':
      return { ...question.answer, correctIndex: newCorrectIndex }
    case 'multiple':
      return {
        ...question.answer,
        correctIndices: question.answer.correctIndices.map(
          (old) => mapping.indexOf(old),
        ),
      }
    default:
      return question.answer
  }
}
