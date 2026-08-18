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
    description: 'Complete JEE mock with all sections and real NTA interface.',
    icon: 'full',
    path: '/test/full',
    color: '#4f8cff',
    badge: 'NTA Replica',
  },
  {
    id: 'custom',
    name: 'Custom Test',
    description: 'Build your own test. Choose subjects, chapters, topics, difficulty and more.',
    icon: 'custom',
    path: '/test/custom',
    color: '#38bdf8',
  },
  {
    id: 'chapter',
    name: 'Chapter Test',
    description: 'Master one chapter at a time with focused tests.',
    icon: 'chapter',
    path: '/test/chapter',
    color: '#2fd87f',
  },
  {
    id: 'subject',
    name: 'Subject Test',
    description: 'Full-length subject-wise tests for targeted practice.',
    icon: 'subject',
    path: '/test/subject',
    color: '#f5a524',
  },
  {
    id: 'mixed-practice',
    name: 'Mixed Practice',
    description: 'Random questions across all subjects, quick practice session.',
    icon: 'mixed',
    path: '/practice/mixed',
    color: '#f97316',
  },
  {
    id: 'daily-challenge',
    name: 'Daily Challenge',
    description: 'A fresh set of 10 questions every day. Beat yesterday.',
    icon: 'daily',
    path: '/practice/daily',
    color: '#ef4444',
    badge: 'Daily',
  },
  {
    id: 'pyq',
    name: 'PYQ Mode',
    description: 'Solve real previous year questions filtered by year and shift.',
    icon: 'pyq',
    path: '/practice/pyq',
    color: '#3b82f6',
    badge: 'Real Papers',
  },
]

/** Short URL path segments mapped to their canonical TestModeId. */
const MODE_PATH_ALIASES: Record<string, TestModeId> = {
  mixed: 'mixed-practice',
  daily: 'daily-challenge',
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
