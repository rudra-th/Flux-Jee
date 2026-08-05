import { db } from '@/db'
import type { Flashcard, FlashcardType } from '@/types/progress'
import type { SubjectId } from '@/types/core'
import { randomId } from '@/utils/cn'

export interface NewFlashcardInput {
  type: FlashcardType
  subject: SubjectId
  chapter?: string
  front: string
  back: string
  tags?: string[]
}

/** Persists a manually created flashcard, due immediately in box 1. */
export async function createFlashcard(input: NewFlashcardInput): Promise<string> {
  const now = new Date().toISOString()
  const id = randomId('fc-')
  const row: Flashcard = {
    id,
    type: input.type,
    subject: input.subject,
    chapter: input.chapter,
    front: input.front,
    back: input.back,
    tags: input.tags ?? [],
    box: 1,
    nextReviewAt: now,
    repetitions: 0,
    createdAt: now,
  }
  await db.flashcards.put(row)
  return id
}

export async function generateFlashcardsFromQuestions(questionIds: string[]): Promise<number> {
  let created = 0
  for (const id of questionIds) {
    const q = await db.questions.get(id)
    if (!q) continue
    if (await db.flashcards.filter((c) => c.questionId === id).count()) continue

    const cards: Omit<Flashcard, 'id' | 'createdAt'>[] = []

    if (q.solution.concept) {
      cards.push({
        type: 'concept',
        questionId: id,
        subject: q.subject,
        chapter: q.chapter,
        front: `What is the core concept behind: ${q.content.text?.slice(0, 100) ?? 'this question'}?`,
        back: q.solution.concept,
        tags: [q.chapter, q.microTopic],
        box: 1,
        nextReviewAt: new Date().toISOString(),
        repetitions: 0,
      })
      created++
    }

    if (q.solution.short) {
      cards.push({
        type: 'formula',
        questionId: id,
        subject: q.subject,
        chapter: q.chapter,
        front: `Key idea / formula: ${q.content.text?.slice(0, 100) ?? 'this question'}`,
        back: q.solution.short,
        tags: [q.chapter, q.microTopic],
        box: 1,
        nextReviewAt: new Date().toISOString(),
        repetitions: 0,
      })
      created++
    }

    for (const card of cards) {
      await db.flashcards.put({
        ...card,
        id: randomId('fc-'),
        createdAt: new Date().toISOString(),
      })
    }
  }
  return created
}

export async function generateFormulaCards(subject: 'physics' | 'chemistry' | 'mathematics'): Promise<number> {
  const questions = await db.questions.where('subject').equals(subject).limit(200).toArray()
  const qs = questions.filter((q) => q.solution.short)
  let created = 0
  for (const q of qs) {
    const existing = await db.flashcards.filter((c) => c.questionId === q.id).count()
    if (existing) continue
    await db.flashcards.put({
      id: randomId('fc-'),
      type: 'formula',
      questionId: q.id,
      subject,
      chapter: q.chapter,
      front: `Formula flashcard · ${q.chapter}`,
      back: q.solution.short ?? '',
      tags: [q.chapter, q.microTopic],
      box: 1,
      nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
      repetitions: 0,
      createdAt: new Date().toISOString(),
    })
    created++
  }
  return created
}

export async function getDueFlashcards(limit = 30): Promise<Flashcard[]> {
  const now = new Date().toISOString()
  return db.flashcards.where('nextReviewAt').belowOrEqual(now).limit(limit).toArray()
}

export async function reviewFlashcard(id: string, quality: 'again' | 'good' | 'easy'): Promise<void> {
  const card = await db.flashcards.get(id)
  if (!card) return

  const intervals = [1, 3, 7, 15, 30]
  let box = card.box
  if (quality === 'again') {
    box = 1
  } else if (quality === 'good') {
    box = Math.min(5, box + 1)
  } else {
    box = Math.min(5, box + 2)
  }

  const days = quality === 'again' ? 1 : intervals[box - 1] ?? 1
  await db.flashcards.put({
    ...card,
    box,
    repetitions: card.repetitions + 1,
    lastReviewedAt: new Date().toISOString(),
    nextReviewAt: new Date(Date.now() + days * 86400000).toISOString(),
  })
}

export async function getFlashcardStats(): Promise<{ total: number; due: number; boxes: number[] }> {
  const all = await db.flashcards.toArray()
  const now = new Date().toISOString()
  const boxes = [0, 0, 0, 0, 0]
  for (const c of all) boxes[c.box - 1] = (boxes[c.box - 1] ?? 0) + 1
  return {
    total: all.length,
    due: all.filter((c) => c.nextReviewAt <= now).length,
    boxes,
  }
}
