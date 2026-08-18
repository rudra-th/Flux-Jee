import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, Button, Badge, Icon, EmptyState, ProgressBar, CircularProgress, Tabs, RichText, Latex, type IconName } from '@/components/ui'
import { getResultById } from '@/engines/analytics/engine'
import { getQuestionsByIds } from '@/engines/questionEngine/selector'
import { QuestionViewer } from '@/components/question/QuestionViewer'
import type { TestResult } from '@/types/test'
import { SUBJECTS } from '@/constants/syllabus'
import { cn, formatNumber } from '@/utils/cn'
import { formatDuration } from '@/utils/time'
import { useUIStore } from '@/stores/uiStore'
import { db } from '@/db'
import type { Question } from '@/types/question'

const RESULT_TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'analysis', label: 'Analysis' },
] as const

export default function TestResult() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'summary' | 'solutions' | 'analysis'>('summary')
  const [reviewIdx, setReviewIdx] = useState(0)
  const pushToast = useUIStore((s) => s.pushToast)

  const { data: result, isLoading } = useQuery({
    queryKey: ['result', id],
    queryFn: async () => (id ? await getResultById(id) : undefined),
  })

  const questionIds = useMemo(
    () => result?.performance.map((p) => p.questionId) ?? [],
    [result],
  )

  const { data: questions = [] } = useQuery({
    queryKey: ['result-questions', id],
    queryFn: () => getQuestionsByIds(questionIds),
    enabled: questionIds.length > 0,
  })

  useEffect(() => {
    if (!isLoading && !result) {
      pushToast('Result not found.', 'error')
    }
  }, [isLoading, result, pushToast])

  if (isLoading) return <LoadingState />
  if (!result) return <EmptyState icon="file" title="No result found" description="This result does not exist." action={<Link to="/analytics"><Button>Go to Analytics</Button></Link>} />

  const totalCorrect = result.performance.filter((p) => p.result === 'correct').length
  const totalWrong = result.performance.filter((p) => p.result === 'wrong').length
  const totalUnattempted = result.performance.filter((p) => p.result === 'unattempted' || p.result === 'not-visited').length
  const partial = result.performance.filter((p) => p.result === 'partial').length
  const pct = result.maxMarks ? (result.totalMarks / result.maxMarks) * 100 : 0
  const pctColor = pct >= 75 ? 'text-emerald' : pct >= 50 ? 'text-primary' : pct >= 30 ? 'text-amber' : 'text-danger'

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-text3">
            <span className="font-mono">{result.submittedAt.slice(0, 16).replace('T', ' ')}</span>
            <Badge tone={result.autoSubmitted ? 'warning' : 'success'}>{result.autoSubmitted ? 'Auto-submitted' : 'Submitted'}</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-text">{result.performance.length}-Question Test</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/analytics')}>
            <Icon name="analytics" size={16} /> Analytics
          </Button>
          <Button onClick={() => navigate('/test')}>
            <Icon name="plus" size={16} /> New Test
          </Button>
        </div>
      </div>

      {/* Score hero */}
      <Card className="mb-4 overflow-hidden">
        <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex flex-col items-center">
            <CircularProgress value={pct} size={150} strokeWidth={12} label={`${pct.toFixed(1)}%`} />
          </div>
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <span className={cn('text-4xl font-bold tabular-nums', pctColor)}>{formatNumber(result.totalMarks)}</span>
              <span className="pb-1 text-sm text-text3">/ {formatNumber(result.maxMarks)} marks</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <StatChip icon="check" label="Correct" value={totalCorrect} tone="text-emerald" />
              <StatChip icon="x" label="Wrong" value={totalWrong} tone="text-danger" />
              <StatChip icon="minus" label="Unattempted" value={totalUnattempted} tone="text-text3" />
              <StatChip icon="circle" label="Partial" value={partial} tone="text-amber" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-text2 sm:grid-cols-4">
              <span>Accuracy <b className="ml-1 text-text">{result.accuracy}%</b></span>
              <span>Attempt rate <b className="ml-1 text-text">{result.attemptRate}%</b></span>
              <span>Time spent <b className="ml-1 text-text">{formatDuration(result.totalTimeSpent)}</b></span>
              <span>Speed <b className="ml-1 text-text">{result.speed}s/q</b></span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={RESULT_TABS.map((t) => ({ id: t.id, label: t.label }))}
        value={tab}
        onChange={(t) => setTab(t)}
        className="mb-4"
      />

      {tab === 'summary' && (
        <div className="space-y-4">
          {/* Section-wise */}
          <Card>
            <CardHeader title="Section-wise Performance" />
            <div className="space-y-4 px-5 pb-5">
              {result.sections.map((sec) => {
                const sw = result.sectionWise[sec.id]
                if (!sw) return null
                const maxPct = sw.maxMarks ? (sw.marks / sw.maxMarks) * 100 : 0
                return (
                  <div key={sec.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-text">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subjectColor(sec.subject) }} />
                        {sec.type === 'mathematics' ? 'Mathematics' : subjectName(sec.subject)} — Section
                      </span>
                      <span className="text-text2">{formatNumber(sw.marks)} / {formatNumber(sw.maxMarks)}</span>
                    </div>
                    <ProgressBar value={maxPct} color={maxPct >= 60 ? 'emerald' : maxPct >= 30 ? 'primary' : 'danger'} />
                    <div className="mt-1 text-[11px] text-text3">
                      {sw.correct} correct · {sw.wrong} wrong · {sw.partial} partial · {sw.unattempted} unattempted · accuracy {sw.accuracy}%
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Difficulty & types */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="By Difficulty" />
              <div className="space-y-2.5 px-5 pb-5">
                {[1, 2, 3, 4, 5].map((d) => {
                  const items = result.performance.filter((p) => p.difficulty === d)
                  if (!items.length) return null
                  const correct = items.filter((p) => p.result === 'correct').length
                  const p = items.length ? (correct / items.length) * 100 : 0
                  return (
                    <div key={d} className="flex items-center gap-3 text-xs">
                      <span className="w-20 text-text2">{['E', 'E-M', 'M', 'M-H', 'H'][d - 1]}</span>
                      <ProgressBar value={p} className="flex-1" />
                      <span className="w-16 text-right font-mono text-text">{correct}/{items.length}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card>
              <CardHeader title="By Question Type" />
              <div className="space-y-2.5 px-5 pb-5">
                {result.performance.map((p) => p.type).filter((t, i, a) => a.indexOf(t) === i).map((t) => {
                  const items = result.performance.filter((p) => p.type === t)
                  const correct = items.filter((p) => p.result === 'correct').length
                  const p = items.length ? (correct / items.length) * 100 : 0
                  return (
                    <div key={t} className="flex items-center gap-3 text-xs">
                      <span className="w-28 capitalize text-text2">{t.replace('-', ' ')}</span>
                      <ProgressBar value={p} className="flex-1" />
                      <span className="w-16 text-right font-mono text-text">{correct}/{items.length}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'solutions' && questions.length > 0 && (
        <ReviewSection
          result={result}
          questions={questions}
          idx={reviewIdx}
          setIdx={setReviewIdx}
        />
      )}

      {tab === 'analysis' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Time Management" />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MetricBox label="Total time" value={formatDuration(result.totalTimeSpent)} />
                <MetricBox label="Avg / question" value={`${result.speed}s`} />
                <MetricBox label="Correct avg" value={`${result.performance.filter((p) => p.result === 'correct' && p.timeSpent > 0).reduce((s, p) => s + p.timeSpent, 0) / Math.max(1, totalCorrect)}s`} />
                <MetricBox label="Guesses" value={String(result.totalGuesses)} sub={`${result.guessedCorrect} right`} />
              </div>
            </div>
          </Card>

          {/* Concept Gaps */}
          <Card>
            <CardHeader title="Concept Gaps" subtitle="Chapters where you lost the most marks" />
            <div className="px-5 pb-5">
              {(() => {
                const chapterMap = new Map<string, { correct: number; wrong: number; total: number; subject: string }>()
                for (const p of result.performance) {
                  if (!p.visited) continue
                  const key = p.chapter
                  const entry = chapterMap.get(key) ?? { correct: 0, wrong: 0, total: 0, subject: p.subject }
                  entry.total++
                  if (p.result === 'correct') entry.correct++
                  if (p.result === 'wrong') entry.wrong++
                  chapterMap.set(key, entry)
                }
                const gaps = Array.from(chapterMap.entries())
                  .map(([chapter, data]) => ({
                    chapter,
                    subject: data.subject,
                    accuracy: data.total ? Math.round((data.correct / data.total) * 100) : 0,
                    wrong: data.wrong,
                    total: data.total,
                  }))
                  .filter((g) => g.wrong > 0)
                  .sort((a, b) => a.accuracy - b.accuracy)

                if (gaps.length === 0) {
                  return <p className="py-4 text-center text-text3">No concept gaps — great performance!</p>
                }

                return (
                  <div className="space-y-2">
                    {gaps.slice(0, 6).map((g) => (
                      <div key={g.chapter} className="flex items-center gap-3 text-xs">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subjectColor(g.subject) }} />
                        <span className="w-36 truncate text-text2">{g.chapter}</span>
                        <div className="flex-1">
                          <div className="h-2 overflow-hidden rounded-full bg-surface3">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${g.accuracy}%`,
                                backgroundColor: g.accuracy >= 70 ? '#10b981' : g.accuracy >= 40 ? '#6366f1' : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                        <span className="w-20 text-right font-mono text-text">{g.accuracy}%</span>
                        <span className="w-16 text-right text-text3">{g.wrong}/{g.total} wrong</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </Card>

          <Card>
            <CardHeader title="Accuracy Insight" subtitle="Estimated time is the ideal time for this question type" />
            <div className="space-y-2 px-5 pb-5 text-sm">
              {result.performance
                .filter((p) => p.visited && p.result === 'wrong')
                .slice(0, 5)
                .map((p) => (
                  <div key={p.questionId} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
                    <span className="truncate text-text2">{p.chapter} · {p.microTopic}</span>
                    <span className="shrink-0 font-mono text-xs text-danger">{p.timeSpent}s / {p.estimatedTime}s</span>
                  </div>
                ))}
              {!result.performance.some((p) => p.visited && p.result === 'wrong') && (
                <p className="py-4 text-center text-text3">No wrong answers. Excellent!</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function ReviewSection({
  result,
  questions,
  idx,
  setIdx,
}: {
  result: TestResult
  questions: Question[]
  idx: number
  setIdx: (i: number) => void
}) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const perfs = result.performance
  const perf = perfs[idx]
  const q = questions[idx]

  useEffect(() => {
    if (!q) return
    setShowAnswer(false)
    let active = true
    void db.bookmarks.where('questionId').equals(q.id).count().then((c) => {
      if (active) setIsBookmarked(c > 0)
    })
    return () => { active = false }
  }, [q?.id])

  if (!perf || !q) return null

  const total = perfs.length
  const status = perf.result
  const statusStyle: Record<string, { tone: 'success' | 'danger' | 'warning' | 'muted'; label: string }> = {
    correct: { tone: 'success', label: 'Correct' },
    wrong: { tone: 'danger', label: 'Wrong' },
    partial: { tone: 'warning', label: 'Partial' },
    unattempted: { tone: 'muted', label: 'Unattempted' },
    'not-visited': { tone: 'muted', label: 'Not visited' },
  }
  const st = statusStyle[status] ?? { tone: 'muted', label: 'Unattempted' }

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setIdx((idx - 1 + total) % total)} disabled={idx === 0}>
            <Icon name="chevron-left" size={16} />
          </Button>
          <span className="text-sm font-semibold text-text">Q{idx + 1} of {total}</span>
          <Badge tone={st.tone}>{st.label}</Badge>
          <span className="text-xs text-text3">
            {perf.awardedMarks.toFixed(1)} / {perf.maxMarks} marks · {formatDuration(perf.timeSpent)}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIdx((idx + 1) % total)} disabled={idx === total - 1}>
            <Icon name="chevron-right" size={16} />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void toggleBookmark(q.id, isBookmarked, setIsBookmarked)}>
            <Icon name={isBookmarked ? 'bookmark' : 'bookmark-off'} size={15} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAnswer((s) => !s)}>
            <Icon name="book" size={15} /> {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </Button>
        </div>
      </div>
      <div className="p-5">
        <QuestionViewer
          question={q}
          answer={{ selected: perf.selected, matrix: perf.matrix }}
          locked
          showCorrect
        />
        {showAnswer && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="mb-2 text-sm font-semibold text-primary">Solution</p>
            {q.solution?.detailed ? (
              <RichText content={q.solution.detailed} paragraphs className="text-text2" />
            ) : (
              <p className="text-sm text-text3">No solution available.</p>
            )}
            {q.solution?.detailedLatex?.map((l, i) => <Latex key={i} latex={l} display className="my-2 block" />)}
            {q.solution?.images?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {q.solution.images.map((src, i) => (
                  <img key={i} src={src} alt={`Solution diagram ${i + 1}`} className="max-h-48 rounded border border-border" />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  )
}

async function toggleBookmark(questionId: string, current: boolean, setState: (v: boolean) => void) {
  if (current) {
    await db.bookmarks.where('questionId').equals(questionId).delete()
    setState(false)
  } else {
    await db.bookmarks.add({ id: `bm-${Date.now()}`, questionId, tags: [], createdAt: new Date().toISOString() })
    setState(true)
  }
}

function subjectColor(subject?: string): string {
  return SUBJECTS.find((s) => s.id === subject)?.color ?? '#888'
}

function subjectName(subject?: string): string {
  return SUBJECTS.find((s) => s.id === subject)?.name ?? 'Subject'
}

function StatChip({ icon, label, value, tone }: { icon: IconName; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} size={16} className={tone} />
      <div>
        <p className="text-base font-bold tabular-nums text-text">{value}</p>
        <p className="text-[11px] text-text3">{label}</p>
      </div>
    </div>
  )
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-surface2 p-3 text-center">
      <p className="text-lg font-bold tabular-nums text-text">{value}</p>
      <p className="text-[11px] text-text3">{label}</p>
      {sub && <p className="text-[10px] text-text3">{sub}</p>}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-text3">Loading result…</p>
    </div>
  )
}
