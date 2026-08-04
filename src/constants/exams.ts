import type { AnswerScheme, ExamId, QuestionTypeId } from '@/types/core'

export interface MarkingRule {
  correct: number
  wrong: number
  unattempted: number
  partial?: 'all-or-nothing' | 'proportional'
}

export interface ExamConfig {
  id: ExamId
  name: string
  shortName: string
  negativeMarking: boolean
  defaultScheme: AnswerScheme
  sections: string[]
}

export interface QuestionTypeMeta {
  id: QuestionTypeId
  name: string
  short: string
  /** Default marks */
  marks: number
  /** Negative marks per wrong */
  negative: number
  /** Applicable exam modes */
  exams: ExamId[]
  /** Whether options can be shuffled */
  shuffleable: boolean
}

export const EXAMS: ExamConfig[] = [
  {
    id: 'jee-main',
    name: 'JEE Main',
    shortName: 'Main',
    negativeMarking: true,
    defaultScheme: 'correct-negative',
    sections: ['Physics', 'Chemistry', 'Mathematics'],
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    shortName: 'Advanced',
    negativeMarking: true,
    defaultScheme: 'partial',
    sections: ['Paper 1', 'Paper 2'],
  },
  {
    id: 'practice',
    name: 'Practice',
    shortName: 'Practice',
    negativeMarking: false,
    defaultScheme: 'correct-only',
    sections: ['Physics', 'Chemistry', 'Mathematics'],
  },
]

export const QUESTION_TYPES: QuestionTypeMeta[] = [
  {
    id: 'single',
    name: 'Single Correct',
    short: 'MCQ',
    marks: 4,
    negative: 1,
    exams: ['jee-main', 'jee-advanced', 'practice'],
    shuffleable: true,
  },
  {
    id: 'multiple',
    name: 'Multiple Correct',
    short: 'MSQ',
    marks: 4,
    negative: 0,
    exams: ['jee-advanced', 'practice'],
    shuffleable: true,
  },
  {
    id: 'integer',
    name: 'Integer Type',
    short: 'INT',
    marks: 4,
    negative: 0,
    exams: ['jee-main', 'jee-advanced', 'practice'],
    shuffleable: false,
  },
  {
    id: 'numerical',
    name: 'Numerical',
    short: 'NUM',
    marks: 4,
    negative: 1,
    exams: ['practice'],
    shuffleable: false,
  },
  {
    id: 'matrix',
    name: 'Matrix Match',
    short: 'MAT',
    marks: 4,
    negative: 0,
    exams: ['jee-advanced', 'practice'],
    shuffleable: false,
  },
  {
    id: 'paragraph',
    name: 'Paragraph Based',
    short: 'PARA',
    marks: 4,
    negative: 1,
    exams: ['jee-advanced', 'practice'],
    shuffleable: true,
  },
  {
    id: 'assertion-reason',
    name: 'Assertion-Reason',
    short: 'A-R',
    marks: 4,
    negative: 1,
    exams: ['practice'],
    shuffleable: false,
  },
  {
    id: 'match-columns',
    name: 'Match the Columns',
    short: 'MTC',
    marks: 4,
    negative: 0,
    exams: ['jee-advanced', 'practice'],
    shuffleable: false,
  },
]

export const JEE_MAIN_MARKING = {
  single: { correct: 4, wrong: -1, unattempted: 0 },
  integer: { correct: 4, wrong: 0, unattempted: 0 },
} as const

export const JEE_ADVANCED_PARTIAL_SCHEME = {
  multiple: {
    full: 4,
    // partial credit for partially correct multiple-correct answers
    partial: true,
  },
} as const

export const MAX_MARKS = {
  'jee-main': 300,
  'jee-advanced': 360,
} as const

export const NTA_INSTRUCTIONS = {
  'jee-main': [
    'This paper consists of 3 sections: Physics, Chemistry and Mathematics.',
    'Each question carries 4 marks. For each correct answer you will be awarded 4 marks.',
    'For each wrong answer, 1 mark will be deducted.',
    'Unattempted questions carry no marks.',
    'You can Mark for Review and change your answer any time before submission.',
    'The timer will display the remaining time. The test auto-submits when time runs out.',
    'Do not refresh or close the browser window during the test.',
  ],
  'jee-advanced': [
    'This paper consists of 2 papers, each with sections.',
    'Multiple correct questions carry partial marking for partially correct answers.',
    'Integer type questions have no negative marking.',
    'Questions marked for review may be answered later.',
  ],
} as Record<string, string[]>

export const WARNING_TIMES = [600, 300, 120, 60, 30, 10] as const
