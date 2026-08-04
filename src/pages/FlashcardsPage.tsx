import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Badge, Icon, EmptyState, ProgressBar } from '@/components/ui'
import { db } from '@/db'
import { getDueFlashcards, reviewFlashcard, generateFlashcardsFromQuestions, getFlashcardStats } from '@/engines/flashcards/engine'
import { Latex } from '@/components/ui'
import type { Flashcard } from '@/types/progress'
import { PageHeader } from '@/components/layout/AppShell'

const TYPE_TONE: Record<Flashcard['type'], 'info' | 'success' | 'warning' | 'danger' | 'muted'> = {
  formula: 'info',
  reaction: 'success',
  concept: 'warning',
  mistake: 'danger',
  custom: 'muted',
}

export default function FlashcardsPage() {
  const [deck, setDeck] = useState<Flashcard[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { data: stats } = useQuery({ queryKey: ['fc-stats'], queryFn: getFlashcardStats })

  const loadDeck = async () => {
    const due = await getDueFlashcards(30)
    setDeck(due)
    setIdx(0)
    setFlipped(false)
  }

  useEffect(() => { void loadDeck() }, [])

  const card = deck[idx]

  const handleReview = async (quality: 'again' | 'good' | 'easy') => {
    if (!card) return
    await reviewFlashcard(card.id, quality)
    const next = [...deck]
    next.splice(idx, 1)
    setDeck(next)
    setFlipped(false)
    if (idx >= next.length) setIdx(Math.max(0, next.length - 1))
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const wrong = await db.answerRecords.toArray()
      const wrongIds = wrong.filter((r) => r.everWrong && !r.everCorrect).map((r) => r.questionId).slice(0, 50)
      await generateFlashcardsFromQuestions(wrongIds)
      await loadDeck()
    } finally {
      setGenerating(false)
    }
  }

  const boxColors = ['bg-danger', 'bg-amber', 'bg-primary', 'bg-sky', 'bg-emerald']

  return (
    <div>
      <PageHeader
        title="Flashcards"
        subtitle="Spaced repetition for concepts and formulas"
        action={<Button size="sm" variant="outline" loading={generating} onClick={() => void generate()}><Icon name="sparkles" size={15} /> Generate from mistakes</Button>}
      />

      {stats && (
        <Card className="mb-4 p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-text">{stats.total} cards · {stats.due} due now</span>
            <span className="text-xs text-text3">Leitner boxes</span>
          </div>
          <div className="flex gap-1">
            {boxColors.map((c, i) => (
              <div key={i} className="flex-1">
                <ProgressBar value={stats.boxes[i] ? (stats.boxes[i] / stats.total) * 100 : 0} color={i === 0 ? 'danger' : i === 1 ? 'amber' : 'primary'} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {!card ? (
        <EmptyState
          icon="layers"
          title={deck.length ? 'Deck complete!' : 'No cards due'}
          description={deck.length ? 'All due cards reviewed. Come back tomorrow for more.' : 'Cards become due based on your spaced repetition schedule. Generate cards from your mistakes to get started.'}
          action={deck.length ? undefined : <Button onClick={() => void generate()} loading={generating}><Icon name="sparkles" size={16} /> Generate from mistakes</Button>}
        />
      ) : (
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-center justify-between text-xs text-text3">
            <Badge tone={TYPE_TONE[card.type]}>{card.type}</Badge>
            <span>{idx + 1} / {deck.length}</span>
            <Badge tone="muted">Box {card.box}</Badge>
          </div>

          <button
            onClick={() => setFlipped((f) => !f)}
            className="focus-ring block w-full rounded-2xl border border-border bg-surface text-left transition-transform duration-300"
            style={{ minHeight: 260, perspective: 1000 }}
          >
            <div className="p-8">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-primary">{flipped ? 'Back' : 'Question'}</p>
              <div className="text-lg text-text">
                <Latex latex={card.front} />
              </div>
              {flipped && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-emerald">Answer</p>
                  <div className="text-base text-text2">
                    <Latex latex={card.back} />
                  </div>
                </div>
              )}
            </div>
          </button>

          <div className="mt-4">
            {!flipped ? (
              <Button onClick={() => setFlipped(true)} className="w-full" size="lg">
                <Icon name="eye" size={18} /> Show Answer
              </Button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="border-danger/40 text-danger" onClick={() => void handleReview('again')}>
                  <Icon name="refresh" size={16} /> Again
                </Button>
                <Button className="bg-amber text-white hover:bg-amber/90" onClick={() => void handleReview('good')}>
                  <Icon name="check" size={16} /> Good
                </Button>
                <Button className="bg-emerald text-white hover:bg-emerald/90" onClick={() => void handleReview('easy')}>
                  <Icon name="check-circle" size={16} /> Easy
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
