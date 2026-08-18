import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardHeader, Button, Switch, Tabs, Chip, Select, Field, Input, Icon, Badge, type IconName } from '@/components/ui'
import { SUBJECTS } from '@/constants/syllabus'
import { EXAMS } from '@/constants/exams'
import { QUESTION_TYPES } from '@/constants/exams'
import type { Difficulty, ExamId, QuestionTypeId, SubjectId } from '@/types/core'
import type { TestModeId } from '@/types/core'
import type { TestConfig } from '@/types/test'
import { buildTest } from '@/engines/testBuilder'
import { buildAdaptiveTest } from '@/engines/adaptive/engine'
import { useTestStore } from '@/stores/testStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import { TEST_MODES, resolveModePath } from '@/constants/modes'
import { PageHeader } from '@/components/layout/AppShell'

const DIFFICULTIES: Array<{ value: Difficulty; label: string }> = [
  { value: 1, label: 'Easy' },
  { value: 2, label: 'Easy-Medium' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Medium-Hard' },
  { value: 5, label: 'Hard' },
]

interface BuilderState {
  name: string
  mode: TestModeId
  exam: ExamId
  subjects: SubjectId[]
  selectedChapters: string[]
  selectedTopics: string[]
  difficulties: Difficulty[]
  questionTypes: QuestionTypeId[]
  totalQuestions: number
  timeLimitMinutes: number
  negativeMarking: boolean
  shuffleQuestions: boolean
  shuffleOptions: boolean
  allowPause: boolean
  years: number[]
}

function initialState(mode: TestModeId): BuilderState {
  const practiceExam =
    mode === 'chapter' ||
    mode === 'topic' ||
    mode === 'mixed-practice' ||
    mode === 'revision' ||
    mode === 'weak-chapter'
  const allTypes: QuestionTypeId[] = [
    'single',
    'multiple',
    'integer',
    'numerical',
    'matrix',
    'paragraph',
    'assertion-reason',
    'match-columns',
  ]
  return {
    name: TEST_MODES.find((m) => m.id === mode)?.name ?? 'Custom Test',
    mode,
    exam: practiceExam ? 'practice' : 'jee-main',
    subjects: ['physics', 'chemistry', 'mathematics'],
    selectedChapters: [],
    selectedTopics: [],
    difficulties: [1, 2, 3, 4, 5],
    questionTypes: practiceExam ? allTypes : ['single', 'integer'],
    totalQuestions: mode === 'daily-challenge' ? 10 : mode === 'marathon' ? 60 : mode === 'speed' ? 20 : 30,
    timeLimitMinutes: mode === 'daily-challenge' ? 15 : mode === 'marathon' ? 120 : mode === 'speed' ? 10 : 180,
    negativeMarking: mode !== 'revision',
    shuffleQuestions: true,
    shuffleOptions: true,
    allowPause: mode !== 'speed',
    years: [2019, 2020, 2021, 2022, 2023, 2024],
  }
}

export default function TestBuilder() {
  const { mode: modeParam } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const pushToast = useUIStore((s) => s.pushToast)
  const startTest = useTestStore((s) => s.startTest)

  const modeFromUrl = resolveModePath(params.get('mode') ?? modeParam)
  const [mode, setMode] = useState<TestModeId>(modeFromUrl)
  const [state, setState] = useState<BuilderState>(() => {
    const s = initialState(modeFromUrl)
    const subjectParam = params.get('subject') as SubjectId | null
    if (subjectParam && SUBJECTS.some((sub) => sub.id === subjectParam)) {
      s.subjects = [subjectParam]
    }
    const chapterParam = params.get('chapter')
    if (chapterParam) {
      const sub = SUBJECTS.find((x) => x.id === (subjectParam ?? s.subjects[0]))
      const ch = sub?.chapters.find((c) => c.name === chapterParam)
      if (ch) s.selectedChapters = [ch.id]
    }
    return s
  })
  const [activeTab, setActiveTab] = useState<'subjects' | 'chapters' | 'options'>('subjects')
  const [building, setBuilding] = useState(false)

  const update = (patch: Partial<BuilderState>) => setState((s) => ({ ...s, ...patch }))

  useEffect(() => {
    if (modeFromUrl !== mode) {
      setMode(modeFromUrl)
      setState((s) => ({ ...initialState(modeFromUrl), subjects: s.subjects }))
    }
  }, [modeFromUrl])

  const selectedSubject = useMemo(
    () => SUBJECTS.find((s) => s.id === state.subjects[0]) ?? SUBJECTS[0]!,
    [state.subjects],
  )

  const toggleSubject = (id: SubjectId) => {
    update({
      subjects: state.subjects.includes(id)
        ? state.subjects.filter((s) => s !== id)
        : [...state.subjects, id],
    })
  }

  const toggleChapter = (chapterId: string) => {
    update({
      selectedChapters: state.selectedChapters.includes(chapterId)
        ? state.selectedChapters.filter((c) => c !== chapterId)
        : [...state.selectedChapters, chapterId],
    })
  }

  const toggleDifficulty = (d: Difficulty) => {
    update({
      difficulties: state.difficulties.includes(d)
        ? state.difficulties.filter((x) => x !== d)
        : [...state.difficulties, d],
    })
  }

  const toggleType = (t: QuestionTypeId) => {
    update({
      questionTypes: state.questionTypes.includes(t)
        ? state.questionTypes.filter((x) => x !== t)
        : [...state.questionTypes, t],
    })
  }

  const handleStart = async () => {
    if (!state.subjects.length) {
      pushToast('Select at least one subject.', 'error')
      return
    }
    if (state.totalQuestions < 1 || state.timeLimitMinutes < 5) {
      pushToast('Please enter valid question count (≥1) and time limit (≥5 min).', 'error')
      return
    }
    setBuilding(true)
    try {
      let config: TestConfig
      if (state.mode === 'adaptive') {
        config = await buildAdaptiveTest(state.totalQuestions)
      } else {
        const chapterNames = state.selectedChapters
          .map((id) => selectedSubject?.chapters.find((c) => c.id === id)?.name)
          .filter(Boolean) as string[]
        config = await buildTest({
          name: state.name,
          mode: state.mode,
          exam: state.exam,
          subjects: state.subjects,
          chapters: chapterNames,
          microTopics: state.selectedTopics,
          difficulties: state.difficulties,
          questionTypes: state.questionTypes,
          totalQuestions: state.totalQuestions,
          timeLimitSeconds: state.timeLimitMinutes * 60,
          negativeMarking: state.negativeMarking,
          shuffleQuestions: state.shuffleQuestions,
          shuffleOptions: state.shuffleOptions,
          allowPause: state.allowPause,
          years: state.years,
          autoSubmit: true,
          seed: Date.now(),
        })
      }
      startTest(config)
      navigate(`/run/${config.id}`)
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to build test.', 'error')
    } finally {
      setBuilding(false)
    }
  }

  const quickPresets = [
    { mode: 'full' as const, label: 'Full Test', icon: 'full' as IconName },
    { mode: 'subject' as const, label: 'Subject Test', icon: 'subject' as IconName },
    { mode: 'chapter' as const, label: 'Chapter Test', icon: 'chapter' as IconName },
    { mode: 'topic' as const, label: 'Topic Test', icon: 'topic' as IconName },
    { mode: 'pyq' as const, label: 'PYQ Mode', icon: 'pyq' as IconName },
    { mode: 'speed' as const, label: 'Speed Test', icon: 'speed' as IconName },
    { mode: 'marathon' as const, label: 'Marathon', icon: 'marathon' as IconName },
    { mode: 'revision' as const, label: 'Revision', icon: 'revision' as IconName },
    { mode: 'adaptive' as const, label: 'Adaptive', icon: 'adaptive' as IconName },
  ]

  const selectPreset = (m: TestModeId) => {
    setMode(m)
    setState((s) => ({
      ...initialState(m),
      subjects: s.subjects,
    }))
    const meta = TEST_MODES.find((x) => x.id === m)
    if (meta) navigate(meta.path, { replace: true })
  }

  const modeMeta = useMemo(() => TEST_MODES.find((m) => m.id === mode) ?? TEST_MODES[0]!, [mode])

  return (
    <div>
      <motion.div
        key={modeMeta.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <PageHeader
          title={modeMeta.name}
          subtitle={modeMeta.description}
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface2 px-3 py-1.5 text-xs font-semibold text-text2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: modeMeta.color }} />
              <Icon name={modeMeta.icon as IconName} size={14} />
              {modeMeta.badge ?? 'Mode'}
            </div>
          }
        />
      </motion.div>

      {/* Mode presets */}
      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {quickPresets.map((p) => (
          <button
            key={p.mode}
            onClick={() => selectPreset(p.mode)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all',
              mode === p.mode
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-border bg-surface text-text2 hover:border-border2',
            )}
          >
            <Icon name={p.icon} size={18} />
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Configuration */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Test Configuration" subtitle="Core settings for your test" />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="Test Name">
                <Input value={state.name} onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field label="Exam Mode">
                <Select
                  value={state.exam}
                  onChange={(e) => {
                    const exam = e.target.value as ExamId
                    if (exam === 'jee-advanced') {
                      update({
                        exam,
                        questionTypes: [
                          'single',
                          'multiple',
                          'integer',
                          'numerical',
                          'matrix',
                          'paragraph',
                          'assertion-reason',
                          'match-columns',
                        ],
                      })
                    } else if (exam === 'jee-main') {
                      update({ exam, questionTypes: ['single', 'integer'] })
                    } else {
                      update({ exam })
                    }
                  }}
                >
                  {EXAMS.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Total Questions">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={state.totalQuestions}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isNaN(v) && v >= 1) update({ totalQuestions: Math.min(120, Math.max(1, v)) })
                  }}
                />
              </Field>
              <Field label="Time Limit (minutes)">
                <Input
                  type="number"
                  min={5}
                  value={state.timeLimitMinutes}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isNaN(v) && v >= 5) update({ timeLimitMinutes: Math.max(5, v) })
                  }}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Choose Content"
              action={
                <Tabs
                  tabs={[
                    { id: 'subjects', label: 'Subjects' },
                    { id: 'chapters', label: 'Chapters' },
                    { id: 'options', label: 'Options' },
                  ]}
                  value={activeTab}
                  onChange={(t) => setActiveTab(t)}
                />
              }
            />
            <div className="px-5 pb-5">
              {activeTab === 'subjects' && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-all',
                        state.subjects.includes(s.id)
                          ? 'border-primary/60 bg-primary/10'
                          : 'border-border bg-surface2 hover:border-border2',
                      )}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-sm font-semibold text-text">{s.name}</span>
                      </div>
                      <p className="text-[11px] text-text3">{s.chapters.length} chapters</p>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'chapters' && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Select
                      value={selectedSubject.id}
                      onChange={(e) => update({ subjects: [e.target.value as SubjectId, ...state.subjects.filter((s) => s !== e.target.value)] })}
                      className="w-48"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Select>
                    <Badge tone="info">{state.selectedChapters.length} selected</Badge>
                  </div>
                  <div className="grid max-h-96 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                    {selectedSubject.chapters.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => toggleChapter(c.id)}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                          state.selectedChapters.includes(c.id)
                            ? 'border-primary/60 bg-primary/10 text-text'
                            : 'border-border bg-surface2 text-text2 hover:border-border2',
                        )}
                      >
                        <span className="truncate">{c.name}</span>
                        <Icon
                          name={state.selectedChapters.includes(c.id) ? 'check-circle' : 'circle'}
                          size={15}
                          className={state.selectedChapters.includes(c.id) ? 'text-primary' : 'text-text3'}
                        />
                      </button>
                    ))}
                  </div>
                  {state.selectedChapters.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {state.selectedChapters.map((id) => {
                        const c = selectedSubject.chapters.find((ch) => ch.id === id)
                        return (
                          <Chip key={id} selected onClick={() => toggleChapter(id)}>
                            {c?.name}
                          </Chip>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'options' && (
                <div className="space-y-5">
                  {/* Difficulty */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-text2">Difficulty</p>
                    <div className="flex flex-wrap gap-2">
                      {DIFFICULTIES.map((d) => (
                        <Chip key={d.value} selected={state.difficulties.includes(d.value)} onClick={() => toggleDifficulty(d.value)}>
                          {d.label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Question types */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-text2">Question Types</p>
                    <div className="flex flex-wrap gap-2">
                      {QUESTION_TYPES.map((t) => (
                        <Chip key={t.id} selected={state.questionTypes.includes(t.id)} onClick={() => toggleType(t.id)}>
                          {t.name}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Years for PYQ */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-text2">Years (PYQ)</p>
                    <div className="flex flex-wrap gap-2">
                      {[2019, 2020, 2021, 2022, 2023, 2024].map((y) => (
                        <Chip key={y} selected={state.years.includes(y)} onClick={() => {
                          update({
                            years: state.years.includes(y) ? state.years.filter((x) => x !== y) : [...state.years, y],
                          })
                        }}>
                          {y}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Toggles + start */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Preferences" />
            <div className="space-y-3 px-5 pb-5">
              <ToggleRow
                label="Negative Marking"
                desc="−1 for wrong answers"
                checked={state.negativeMarking}
                onChange={(v) => update({ negativeMarking: v })}
              />
              <ToggleRow
                label="Shuffle Questions"
                desc="Randomize question order"
                checked={state.shuffleQuestions}
                onChange={(v) => update({ shuffleQuestions: v })}
              />
              <ToggleRow
                label="Shuffle Options"
                desc="Randomize option order"
                checked={state.shuffleOptions}
                onChange={(v) => update({ shuffleOptions: v })}
              />
              <ToggleRow
                label="Allow Pause"
                desc="Pause the timer mid-test"
                checked={state.allowPause}
                onChange={(v) => update({ allowPause: v })}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-text">Summary</span>
              <Badge tone="primary">{state.totalQuestions} Qs</Badge>
            </div>
            <div className="space-y-1.5 text-xs text-text2">
              <p className="flex justify-between"><span>Subjects</span><span className="font-mono text-text">{state.subjects.length}</span></p>
              <p className="flex justify-between"><span>Chapters</span><span className="font-mono text-text">{state.selectedChapters.length || 'All'}</span></p>
              <p className="flex justify-between"><span>Difficulty levels</span><span className="font-mono text-text">{state.difficulties.length}</span></p>
              <p className="flex justify-between"><span>Time</span><span className="font-mono text-text">{state.timeLimitMinutes} min</span></p>
            </div>
            <Button
              onClick={() => void handleStart()}
              loading={building}
              size="lg"
              className="mt-4 w-full"
            >
              <Icon name="play" size={18} />
              {building ? 'Building test...' : 'Start Test'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-[11px] text-text3">{desc}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}
