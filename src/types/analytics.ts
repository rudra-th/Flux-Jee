import type { SubjectId } from './core'
import type { Difficulty, QuestionTypeId } from './core'

export interface AccuracyEntry {
  date: string
  attempted: number
  correct: number
  wrong: number
  unattempted: number
  timeSpent: number
}

export interface SubjectPerformance {
  subject: SubjectId
  attempted: number
  correct: number
  wrong: number
  accuracy: number
  avgTime: number
  marks: number
  maxMarks: number
}

export interface ChapterPerformance {
  subject: SubjectId
  chapter: string
  attempted: number
  correct: number
  wrong: number
  accuracy: number
  avgTime: number
  /** Composite weakness score 0-100 (higher = weaker) */
  weaknessScore: number
  lastAttemptedAt?: string
}

export interface TopicPerformance extends ChapterPerformance {
  microTopic: string
}

export interface DifficultyBreakdown {
  difficulty: Difficulty
  attempted: number
  correct: number
  accuracy: number
}

export interface TypeBreakdown {
  type: QuestionTypeId
  attempted: number
  correct: number
  accuracy: number
}

export interface SpeedMetric {
  avgSecondsPerQuestion: number
  avgSecondsPerCorrectQuestion: number
  /** ideal vs actual time ratio */
  efficiency: number
  percentile: number
}

export interface GuessAnalysis {
  totalGuesses: number
  correctGuesses: number
  wrongGuesses: number
  guessAccuracy: number
  expectedRandom: number
}

export interface UserStats {
  totalTests: number
  totalQuestionsAttempted: number
  totalCorrect: number
  totalWrong: number
  totalUnattempted: number
  totalTimeSpent: number
  overallAccuracy: number
  overallAttemptRate: number
  totalMarks: number
  maxMarks: number
  currentStreak: number
  longestStreak: number
  lastTestAt?: string
  dailyGoal: number
  questionsToday: number
}

export interface HeatmapCell {
  date: string
  count: number
  accuracy: number
}

export interface AnalyticsBundle {
  daily: AccuracyEntry[]
  subjects: SubjectPerformance[]
  chapters: ChapterPerformance[]
  topics: TopicPerformance[]
  difficulty: DifficultyBreakdown[]
  types: TypeBreakdown[]
  speed: SpeedMetric
  guesses: GuessAnalysis
  stats: UserStats
  heatmap: HeatmapCell[]
}
