import Fuse from 'fuse.js'
import type { IFuseOptions } from 'fuse.js'
import { db } from '@/db'
import type { Question } from '@/types/question'

interface IndexedQuestion {
  id: string
  text: string
  chapter: string
  microTopic: string
  subject: string
  year: number
  type: string
  tags: string
  concept: string
}

let fuse: Fuse<IndexedQuestion> | null = null
let cache: IndexedQuestion[] = []
let buildPromise: Promise<Fuse<IndexedQuestion>> | null = null

const options: IFuseOptions<IndexedQuestion> = {
  keys: [
    { name: 'text', weight: 0.4 },
    { name: 'chapter', weight: 0.2 },
    { name: 'microTopic', weight: 0.15 },
    { name: 'tags', weight: 0.15 },
    { name: 'concept', weight: 0.1 },
  ],
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

export async function buildSearchIndex(): Promise<Fuse<IndexedQuestion>> {
  if (fuse) return fuse
  if (buildPromise) return buildPromise

  buildPromise = (async () => {
    const questions = await db.questions.toArray()
    cache = questions.map((q) => ({
      id: q.id,
      text: q.content.text ?? '',
      chapter: q.chapter,
      microTopic: q.microTopic,
      subject: q.subject,
      year: q.year,
      type: q.type,
      tags: q.tags.join(' '),
      concept: q.solution.concept ?? '',
    }))
    fuse = new Fuse(cache, options)
    return fuse
  })()

  return buildPromise
}

export async function searchQuestions(
  query: string,
  limit = 50,
): Promise<Question[]> {
  if (!query.trim()) return []
  const index = await buildSearchIndex()
  const results = index.search(query, { limit })
  const ids = results.map((r) => r.item.id)
  return getByIdsOrdered(ids, limit)
}

async function getByIdsOrdered(ids: string[], limit: number): Promise<Question[]> {
  const out: Question[] = []
  for (const id of ids.slice(0, limit)) {
    const q = await db.questions.get(id)
    if (q) out.push(q)
  }
  return out
}

export async function getSearchSuggestions(query: string): Promise<Array<{ id: string; label: string; meta: string }>> {
  if (!query.trim()) return []
  const index = await buildSearchIndex()
  const results = index.search(query, { limit: 8 })
  return results.map((r) => ({
    id: r.item.id,
    label: r.item.text.slice(0, 80),
    meta: `${r.item.chapter} · ${r.item.year}`,
  }))
}

export async function searchCount(): Promise<number> {
  return db.questions.count()
}

/** Build index lazily when the app boots */
export function warmSearchIndex(): void {
  void buildSearchIndex()
}
