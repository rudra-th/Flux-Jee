import type {
  Difficulty,
  ExamId,
  PaperId,
  QuestionTypeId,
  SubjectId,
} from './core'

export interface QuestionOption {
  /** Rendered label, e.g. "1", "A", "S1-P1" */
  key: string
  /** Plain text / markdown statement */
  text?: string
  /** LaTeX expression of the option */
  latex?: string
  /** Optional image URL (or data blob id) */
  image?: string
}

export interface QuestionContent {
  /** Plain text / markdown preamble */
  text?: string
  /** LaTeX expression(s) of the statement */
  latex?: string[]
  /** Optional diagram image */
  image?: string
  /** Paragraph for paragraph-based / comprehension questions */
  paragraph?: string
  /** Paragraph latex for comprehension */
  paragraphLatex?: string[]
  /** Statement pair for assertion-reason */
  assertion?: string
  assertionLatex?: string
  reason?: string
  reasonLatex?: string
}

export interface QuestionSolution {
  /** Full detailed step-by-step solution (markdown + latex) */
  detailed: string
  detailedLatex?: string[]
  /** One-line short solution */
  short?: string
  /** Array of hints, revealed progressively */
  hints: string[]
  /** Core concept tag */
  concept?: string
  /** Sub concept tag */
  subconcept?: string
  /** Optional solution diagram(s) */
  images?: string[]
}

export type IntegerAnswer = number

export interface MatrixAnswer {
  /** Row index -> selected column index (-1 if unset) */
  matches: Record<number, number>
}

export type QuestionAnswer =
  | { type: 'single'; correctIndex: number }
  | { type: 'multiple'; correctIndices: number[] }
  | { type: 'integer'; correctValue: IntegerAnswer; range?: [number, number] }
  | { type: 'numerical'; correctValue: number; range: [number, number] }
  | { type: 'matrix'; correct: MatrixAnswer }
  | { type: 'assertion-reason'; correctIndex: number }
  | { type: 'match-columns'; correct: MatrixAnswer }

export interface Question {
  id: string
  exam: ExamId
  year: number
  shift?: number
  paper: PaperId
  session?: number
  subject: SubjectId
  chapter: string
  /** Micro topic within the chapter */
  microTopic: string
  difficulty: Difficulty
  /** Estimated time in seconds */
  estimatedTime: number
  type: QuestionTypeId
  content: QuestionContent
  options: QuestionOption[]
  answer: QuestionAnswer
  solution: QuestionSolution
  tags: string[]
  /** ISO timestamp of creation */
  createdAt: string
}

export interface QuestionMetadata {
  id: string
  /** Average accuracy 0-1 across all users */
  averageAccuracy: number
  /** Average time in seconds */
  averageTime: number
  attempts: number
  bookmarks: number
}

export interface QuestionImportRow {
  question: Question
  metadata?: Partial<QuestionMetadata>
}

export interface QuestionFilters {
  subject?: SubjectId
  chapter?: string
  microTopic?: string
  difficulty?: Difficulty
  year?: number
  type?: QuestionTypeId
  exam?: ExamId
  tags?: string[]
  time?: { min?: number; max?: number }
  concept?: string
  onlyWrong?: boolean
  onlyUnattempted?: boolean
  onlyBookmarked?: boolean
  onlyGuessed?: boolean
  onlyPreviouslyAttempted?: boolean
  search?: string
}
