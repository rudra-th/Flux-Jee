import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Icon, EmptyState, Modal, Textarea } from '@/components/ui'
import { db } from '@/db'
import { getQuestionsByIds } from '@/engines/questionEngine/selector'
import { QuestionViewer } from '@/components/question/QuestionViewer'
import { buildTest } from '@/engines/testBuilder'
import { useTestStore } from '@/stores/testStore'
import { useUIStore } from '@/stores/uiStore'
import { PageHeader } from '@/components/layout/AppShell'

export default function BookmarksPage() {
  const navigate = useNavigate()
  const startTest = useTestStore((s) => s.startTest)
  const pushToast = useUIStore((s) => s.pushToast)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const { data: bookmarks = [], refetch } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const all = await db.bookmarks.toArray()
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
  })

  const ids = useMemo(() => bookmarks.map((b) => b.questionId), [bookmarks])
  const { data: questions = [] } = useQuery({
    queryKey: ['bookmark-questions', ids.join(',')],
    queryFn: () => getQuestionsByIds(ids),
    enabled: ids.length > 0,
  })
  const qMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])

  const handlePractice = async (qids: string[]) => {
    if (!qids.length) return
    setBuilding(true)
    try {
      const config = await buildTest({
        name: `Bookmark Practice (${qids.length})`,
        mode: 'custom',
        exam: 'practice',
        subjects: ['physics', 'chemistry', 'mathematics'],
        onlyBookmarked: true,
        totalQuestions: qids.length,
        timeLimitSeconds: Math.max(10, qids.length * 2 * 60),
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
      pushToast(err instanceof Error ? err.message : 'Failed to start practice.', 'error')
    } finally {
      setBuilding(false)
    }
  }

  const removeBookmark = async (questionId: string) => {
    await db.bookmarks.where('questionId').equals(questionId).delete()
    await refetch()
  }

  const saveNote = async () => {
    if (!noteFor) return
    const bm = bookmarks.find((b) => b.questionId === noteFor)
    if (bm) {
      await db.bookmarks.put({ ...bm, note: noteText })
    }
    setNoteFor(null)
    await refetch()
  }

  if (!bookmarks.length) {
    return (
      <div>
        <PageHeader title="Bookmarks" subtitle="Questions you saved for later" />
        <EmptyState icon="bookmark-off" title="No bookmarks yet" description="Bookmark important questions while reviewing tests to build your revision list." action={<Button onClick={() => navigate('/test')}><Icon name="play" size={16} /> Take a Test</Button>} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Bookmarks"
        subtitle={`${bookmarks.length} saved question${bookmarks.length === 1 ? '' : 's'}`}
        action={<Button loading={building} onClick={() => void handlePractice(ids)}><Icon name="play" size={16} /> Practice All</Button>}
      />

      <div className="space-y-2">
        {bookmarks.map((bm) => {
          const q = qMap.get(bm.questionId)
          const isOpen = selectedId === bm.questionId
          return (
            <Card key={bm.questionId} className="p-0">
              <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setSelectedId(isOpen ? null : bm.questionId)}>
                <div className="flex min-w-0 items-center gap-3">
                  <Icon name="bookmark" size={16} className="shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{q?.content.text ?? q?.microTopic ?? 'Bookmarked question'}</p>
                    <p className="text-[11px] text-text3">{q ? `${q.chapter} · ${q.microTopic} · ${q.type}` : bm.createdAt.slice(0, 10)}</p>
                  </div>
                </div>
                <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} className="shrink-0 text-text3" />
              </button>
              {isOpen && q && (
                <div className="border-t border-border px-4 py-4">
                  <QuestionViewer question={q} locked showCorrect />
                  {bm.note && (
                    <div className="mt-3 rounded-lg bg-surface2 px-3 py-2 text-sm text-text2">
                      <span className="mr-1 font-semibold text-text3">Note:</span>{bm.note}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => void handlePractice([q.id])}>Practice</Button>
                    <Button size="sm" variant="outline" onClick={() => { setNoteFor(q.id); setNoteText(bm.note ?? '') }}>Edit Note</Button>
                    <Button size="sm" variant="ghost" onClick={() => void removeBookmark(q.id)}><Icon name="trash" size={14} /></Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Modal open={noteFor !== null} onClose={() => setNoteFor(null)} title="Bookmark Note">
        <div className="space-y-3">
          <Textarea rows={4} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Why did you save this question?" />
          <Button onClick={() => void saveNote()} className="w-full">Save Note</Button>
        </div>
      </Modal>
    </div>
  )
}
