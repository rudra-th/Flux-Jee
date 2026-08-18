import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Badge, Icon, EmptyState, Chip, type IconName } from '@/components/ui'
import { db } from '@/db'
import { getQuestionsByIds } from '@/engines/questionEngine/selector'
import type { MistakeEntry } from '@/types/progress'
import { buildTest } from '@/engines/testBuilder'
import { useTestStore } from '@/stores/testStore'
import { useUIStore } from '@/stores/uiStore'
import { PageHeader } from '@/components/layout/AppShell'
import { QuestionViewer } from '@/components/question/QuestionViewer'

const REASON_META: Record<MistakeEntry['reason'], { label: string; icon: IconName; tone: 'danger' | 'warning' | 'info' | 'muted' }> = {
  wrong: { label: 'Wrong', icon: 'x', tone: 'danger' },
  guessed: { label: 'Guessed', icon: 'target', tone: 'warning' },
  skipped: { label: 'Skipped', icon: 'arrow-right', tone: 'muted' },
  slow: { label: 'Slow', icon: 'clock', tone: 'info' },
}

export default function MistakesPage() {
  const navigate = useNavigate()
  const startTest = useTestStore((s) => s.startTest)
  const pushToast = useUIStore((s) => s.pushToast)
  const [filter, setFilter] = useState<'all' | 'wrong' | 'guessed' | 'skipped' | 'slow'>('all')
  const [retryOnly, setRetryOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)

  const { data: mistakes = [] } = useQuery({
    queryKey: ['mistakes', filter, retryOnly],
    queryFn: async () => {
      let entries = await db.mistakes.toArray()
      entries = entries.sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt))
      if (filter !== 'all') entries = entries.filter((m) => m.reason === filter)
      if (retryOnly) entries = entries.filter((m) => m.retried)
      const seen = new Set<string>()
      return entries.filter((m) => !seen.has(m.questionId) && seen.add(m.questionId))
    },
  })

  const questionIds = useMemo(() => mistakes.map((m) => m.questionId), [mistakes])
  const { data: questions = [] } = useQuery({
    queryKey: ['mistake-questions', questionIds.join(',')],
    queryFn: () => getQuestionsByIds(questionIds),
    enabled: questionIds.length > 0,
  })

  const qMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])

  const handleRetry = async (ids: string[]) => {
    if (!ids.length) return
    setBuilding(true)
    try {
      const config = await buildTest({
        name: `Mistake Retry (${ids.length})`,
        mode: 'custom',
        exam: 'practice',
        subjects: ['physics', 'chemistry', 'mathematics'],
        onlyWrong: true,
        totalQuestions: ids.length,
        timeLimitSeconds: Math.max(10, ids.length * 2 * 60),
        negativeMarking: false,
        shuffleQuestions: true,
        shuffleOptions: true,
        allowPause: true,
        autoSubmit: true,
        seed: Date.now(),
      })
      startTest(config)
      navigate(`/run/${config.id}`)
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to start retry.', 'error')
    } finally {
      setBuilding(false)
    }
  }

  if (!mistakes.length) {
    return (
      <div>
        <PageHeader title="Mistake Notebook" subtitle="Every wrong, guessed, skipped and slow question" />
        <EmptyState icon="file" title="No mistakes yet" description="Questions you get wrong (or guess, skip, or take too long on) will appear here for revision." action={<Button onClick={() => navigate('/test')}><Icon name="play" size={16} /> Take a Test</Button>} />
      </div>
    )
  }

  const filtered = mistakes
  const counts: Record<string, number> = { all: mistakes.length }
  for (const m of mistakes) counts[m.reason] = (counts[m.reason] ?? 0) + 1

  return (
    <div>
      <PageHeader title="Mistake Notebook" subtitle="Turn mistakes into mastery" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'wrong', 'guessed', 'skipped', 'slow'] as const).map((r) => (
            <Chip key={r} selected={filter === r} onClick={() => setFilter(r)}>
              {r === 'all' ? `All (${counts.all})` : `${REASON_META[r].label} (${counts[r] ?? 0})`}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="text-xs text-text2 hover:text-text" onClick={() => setRetryOnly((v) => !v)}>
            {retryOnly ? '✓ ' : ''}Only retried
          </button>
          <Button size="sm" loading={building} onClick={() => void handleRetry(filtered.map((m) => m.questionId))}>
            <Icon name="refresh" size={14} /> Retry All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((m) => {
          const q = qMap.get(m.questionId)
          const meta = REASON_META[m.reason]
          return (
            <Card key={m.questionId} className="p-0">
              <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setSelectedId(selectedId === m.questionId ? null : m.questionId)}>
                <div className="flex min-w-0 items-center gap-3">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{q?.content.text ?? q?.microTopic ?? 'Question'}</p>
                    <p className="text-[11px] text-text3">{q ? `${q.chapter} · ${q.microTopic} · ${m.attemptedAt.slice(0, 10)}` : m.attemptedAt.slice(0, 10)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.retried && <Badge tone={m.retriedCorrect ? 'success' : 'warning'}>{m.retriedCorrect ? 'Retried ✓' : 'Retried'}</Badge>}
                  <Icon name={selectedId === m.questionId ? 'chevron-up' : 'chevron-down'} size={16} className="text-text3" />
                </div>
              </button>
              {selectedId === m.questionId && q && (
                <div className="border-t border-border px-4 py-4">
                  <QuestionViewer question={q} locked showCorrect />
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" onClick={() => void handleRetry([m.questionId])}>Practice This</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/result/${m.testId}`)}>View in Test</Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
