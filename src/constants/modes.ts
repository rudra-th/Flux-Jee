import type { TestModeId } from '@/types/core'

export interface TestModeMeta {
  id: TestModeId
  name: string
  description: string
  icon: string
  /** Route path */
  path: string
  /** Accent color */
  color: string
  /** Badge shown on card */
  badge?: string
}

export const TEST_MODES: TestModeMeta[] = [
  {
    id: 'full',
    name: 'Full Test',
    description: 'Complete JEE Main mock with all sections and the real NTA interface.',
    icon: 'full',
    path: '/test/full',
    color: '#4f8cff',
    badge: 'NTA Replica',
  },
  {
    id: 'custom',
    name: 'Custom Test',
    description: 'Build your own test. Choose subjects, chapters, difficulty, question types and more.',
    icon: 'custom',
    path: '/test/custom',
    color: '#38bdf8',
  },
  {
    id: 'chapter',
    name: 'Chapter Test',
    description: 'Focused practice on specific chapters. Pick exactly what you want to study.',
    icon: 'chapter',
    path: '/test/chapter',
    color: '#2fd87f',
  },
  {
    id: 'subject',
    name: 'Subject Test',
    description: 'Full-length tests for a single subject to build depth.',
    icon: 'subject',
    path: '/test/subject',
    color: '#f5a524',
  },
  {
    id: 'mixed-practice',
    name: 'Mixed Practice',
    description: 'Random questions across all subjects for a quick daily warm-up.',
    icon: 'mixed',
    path: '/practice/mixed',
    color: '#f97316',
  },
  {
    id: 'daily-challenge',
    name: 'Daily Challenge',
    description: 'The same 10 questions for everyone today. Beat the crowd.',
    icon: 'daily',
    path: '/practice/daily',
    color: '#ef4444',
    badge: 'Daily',
  },
  {
    id: 'marathon',
    name: 'Marathon Mode',
    description: 'Extended 60-question session to build stamina and endurance.',
    icon: 'marathon',
    path: '/practice/marathon',
    color: '#dc2626',
  },
  {
    id: 'speed',
    name: 'Speed Test',
    description: '20 questions in 10 minutes. No pause. Pure speed.',
    icon: 'speed',
    path: '/practice/speed',
    color: '#eab308',
  },
  {
    id: 'revision',
    name: 'Revision Mode',
    description: 'Re-attempt questions you have already solved. No negative marking.',
    icon: 'revision',
    path: '/practice/revision',
    color: '#14b8a6',
  },
  {
    id: 'pyq',
    name: 'PYQ Mode',
    description: 'Real previous year questions from 2019-2024, filtered by year.',
    icon: 'pyq',
    path: '/practice/pyq',
    color: '#3b82f6',
    badge: 'Real Papers',
  },
  {
    id: 'weak-chapter',
    name: 'Weak Chapter Mode',
    description: 'Auto-generated test targeting your weakest chapters based on past performance.',
    icon: 'weak',
    path: '/practice/weak',
    color: '#f43f5e',
  },
  {
    id: 'wrong-questions',
    name: 'Wrong Questions',
    description: 'Re-attempt all questions you got wrong across previous tests.',
    icon: 'wrong',
    path: '/practice/wrong',
    color: '#ef4444',
  },
  {
    id: 'bookmarked',
    name: 'Bookmarked',
    description: 'Practice only the questions you have bookmarked for review.',
    icon: 'bookmark',
    path: '/practice/bookmarked',
    color: '#f59e0b',
  },
]

/** Short URL path segments mapped to their canonical TestModeId. */
const MODE_PATH_ALIASES: Record<string, TestModeId> = {
  mixed: 'mixed-practice',
  daily: 'daily-challenge',
  weak: 'weak-chapter',
  wrong: 'wrong-questions',
}

/** Resolve a URL path segment (e.g. "daily") into a valid TestModeId. */
export function resolveModePath(raw: string | null | undefined): TestModeId {
  if (!raw) return 'custom'
  const candidate = (MODE_PATH_ALIASES[raw] ?? raw) as TestModeId
  return TEST_MODES.some((m) => m.id === candidate) ? candidate : 'custom'
}

export const CHAPTER_COUNT = 64
export const TOTAL_TOPICS = 186

export const KEYBOARD_SHORTCUTS = [
  { keys: ['1', '2', '3', '4'], action: 'Choose option' },
  { keys: ['A', 'B', 'C', 'D'], action: 'Alternative option selection' },
  { keys: ['N'], action: 'Next question' },
  { keys: ['P'], action: 'Previous question' },
  { keys: ['M'], action: 'Mark for review' },
  { keys: ['S'], action: 'Save & next' },
  { keys: ['Ctrl+Enter'], action: 'Submit test' },
] as const
