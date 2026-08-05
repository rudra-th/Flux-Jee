import { db } from '@/db'

export { importRealQuestions, PYQ_SOURCE } from './importPyq'
export {
  importMainBank,
  importAdvBank,
  BANK_SOURCE,
  ADV_SOURCE,
  BANK_VERSION,
  ADV_VERSION,
} from './importBank'
export {
  import2025Questions,
  importMmjeeQuestions,
  J2025_SOURCE,
  MMJEE_SOURCE,
  J2025_VERSION,
  MMJEE_VERSION,
} from './import2025'

/**
 * Returns the list of available years in the database (for PYQ mode filters).
 */
export async function getAvailableYears(): Promise<number[]> {
  const years = new Set<number>()
  await db.questions.each((q) => years.add(q.year))
  return Array.from(years).sort((a, b) => b - a)
}

/** Get a count breakdown by subject for display */
export async function getSubjectCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = { physics: 0, chemistry: 0, mathematics: 0 }
  await db.questions.each((q) => {
    counts[q.subject] = (counts[q.subject] ?? 0) + 1
  })
  return counts
}

export async function ensureSeeded(): Promise<boolean> {
  const count = await db.questions.count()
  return count > 0
}
