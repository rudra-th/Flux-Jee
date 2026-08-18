import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardHeader, Button, Select, Input, Field, Icon } from '@/components/ui'
import { SUBJECTS, type Subject } from '@/constants/syllabus'
import type { SubjectId } from '@/types/core'
import { buildTest } from '@/engines/testBuilder'
import { useTestStore } from '@/stores/testStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import { PageHeader } from '@/components/layout/AppShell'

export default function PracticePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const startTest = useTestStore((s) => s.startTest)
  const pushToast = useUIStore((s) => s.pushToast)

  const rawMode = params.get('mode') ?? 'chapter'
  const mode = (rawMode === 'subject' ? 'subject' : 'chapter') as 'chapter' | 'subject'
  const subjectId = (params.get('subject') as SubjectId) ?? 'physics'
  const [subject, setSubject] = useState<SubjectId>(subjectId)
  const [chapterId, setChapterId] = useState<string>('')
  const [count, setCount] = useState(15)
  const [minutes, setMinutes] = useState(30)
  const [difficulty, setDifficulty] = useState(3)
  const [building, setBuilding] = useState(false)

  const sub: Subject = SUBJECTS.find((s) => s.id === subject) ?? SUBJECTS[0]!
  const chapter = sub.chapters.find((c) => c.id === chapterId)

  const handleStart = async () => {
    if (mode !== 'subject' && !chapterId) {
      pushToast('Select a chapter first.', 'error')
      return
    }
    setBuilding(true)
    try {
      const config = await buildTest({
        name: `${mode === 'chapter' ? 'Chapter' : 'Subject'} Test · ${mode === 'subject' ? sub.name : chapter?.name ?? ''}`,
        mode,
        exam: 'practice',
        subjects: [subject],
        chapters: chapterId ? [chapter?.name ?? ''] : [],
        microTopics: [],
        difficulties: [difficulty as 1 | 2 | 3 | 4 | 5],
        questionTypes: ['single', 'integer'],
        totalQuestions: count,
        timeLimitSeconds: minutes * 60,
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
      pushToast(err instanceof Error ? err.message : 'Failed to build test.', 'error')
    } finally {
      setBuilding(false)
    }
  }

  const modes = [
    { id: 'chapter', label: 'Chapter Practice' },
    { id: 'subject', label: 'Subject Practice' },
  ] as const

  return (
    <div>
      <PageHeader title="Practice" subtitle="Focused practice on chapters and subjects" />

      <div className="mb-4 flex gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              navigate(`/practice?mode=${m.id}`)
              setChapterId('')
            }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              mode === m.id ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border text-text2 hover:border-border2',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Select Content" />
          <div className="space-y-4 px-5 pb-5">
            <Field label="Subject">
              <Select value={subject} onChange={(e) => { setSubject(e.target.value as SubjectId); setChapterId('') }}>
                {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>

            {mode !== 'subject' && (
              <Field label="Chapter">
                <Select value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
                  <option value="">Select chapter...</option>
                  {sub.chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Questions">
                <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} />
              </Field>
              <Field label="Minutes">
                <Input type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
              </Field>
              <Field label="Difficulty (1-5)">
                <Select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                  <option value={1}>Easy</option>
                  <option value={2}>Easy-Medium</option>
                  <option value={3}>Medium</option>
                  <option value={4}>Medium-Hard</option>
                  <option value={5}>Hard</option>
                </Select>
              </Field>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-text">Preview</p>
          <div className="space-y-2 text-xs text-text2">
            <p className="flex justify-between"><span>Subject</span><span className="font-medium text-text">{sub.name}</span></p>
            {chapter && <p className="flex justify-between"><span>Chapter</span><span className="font-medium text-text">{chapter.name}</span></p>}
            <p className="flex justify-between"><span>Questions</span><span className="font-mono text-text">{count}</span></p>
            <p className="flex justify-between"><span>Time</span><span className="font-mono text-text">{minutes} min</span></p>
            <p className="flex justify-between"><span>Difficulty</span><span className="font-mono text-text">{difficulty}/5</span></p>
            <p className="flex justify-between"><span>Marking</span><span className="font-medium text-emerald">No negative</span></p>
          </div>
          <Button onClick={() => void handleStart()} loading={building} size="lg" className="mt-4 w-full">
            <Icon name="play" size={18} /> {building ? 'Building...' : 'Start Practice'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
