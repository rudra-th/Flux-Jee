export type MockTestType = 'minor' | 'semi-major' | 'major'

export interface MockTestChapters {
  physics: string[]
  chemistry: string[]
  mathematics: string[]
}

export interface MockTestEntry {
  id: string
  name: string
  series: 'main' | 'advanced'
  type: MockTestType
  recommendedDate: string
  chapters: MockTestChapters
  questionCount: number
  durationMinutes: number
  /** JEE Main: MCQ+Integer, JEE Advanced: MCQ+MSQ+Integer+Numerical+Matrix */
  format: 'main' | 'advanced'
}

export interface MockTestSeriesConfig {
  id: string
  name: string
  description: string
  series: 'main' | 'advanced'
  tests: MockTestEntry[]
}

export interface MockTestAttempt {
  id: string
  testId: string
  series: 'main' | 'advanced'
  startedAt: string
  submittedAt?: string
  totalMarks: number
  maxMarks: number
  accuracy: number
  attemptRate: number
  totalTimeSpent: number
}
