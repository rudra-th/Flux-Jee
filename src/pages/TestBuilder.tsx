import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, Button, Switch, Tabs, Chip, Select, Field, Input, Icon, Badge, type IconName } from '@/components/ui'
import { SUBJECTS, type Subject } from '@/constants/syllabus'
import { EXAMS } from '@/constants/exams'
import { QUESTION_TYPES } from '@/constants/exams'
import type { Difficulty, ExamId, QuestionTypeId, SubjectId } from '@/types/core'
import type { TestModeId } from '@/types/core'
import type { TestConfig } from '@/types/test'
import { buildTest } from '@/engines/testBuilder'
import { buildDailyChallengeTest } from '@/engines/testBuilder/dailyChallenge'
import { buildWeakChapterTest } from '@/engines/testBuilder/weakChapter'
import { useTestStore } from '@/stores/testStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import { TEST_MODES, resolveModePath } from '@/constants/modes'
import { PageHeader } from '@/components/layout/AppShell'

const DIFFICULTIES: Array<{ value: Difficulty; label: string; color: string }> = [
  { value: 1, label: 'Easy', color: '#2fd87f' },
  { value: 2, label: 'Easy-Med', color: '#38bdf8' },
  { value: 3, label: 'Medium', color: '#f5a524' },
  { value: 4, label: 'Med-Hard', color: '#f97316' },
  { value: 5, label: 'Hard', color: '#ef4444' },
]

const WIZARD_STEPS = ['Type', 'Content', 'Rules', 'Review'] as const

type WizardType = 'full' | 'chapter' | 'subject' | 'mixed' | 'pyq'

const TEST_TYPES: Array<{ id: WizardType; name: string; icon: IconName; description: string; color: string }> = [
  { id: 'full', name: 'Full Test', icon: 'full', description: 'Complete JEE Main mock with all 3 subjects, NTA interface, and negative marking.', color: '#4f8cff' },
  { id: 'chapter', name: 'Chapter Focus', icon: 'chapter', description: 'Drill into specific chapters. Pick exactly what you want to study.', color: '#2fd87f' },
  { id: 'subject', name: 'Subject Focus', icon: 'subject', description: 'Deep dive into one subject at a time.', color: '#f5a524' },
  { id: 'mixed', name: 'Mixed Practice', icon: 'mixed', description: 'Random questions across all subjects. Quick warm-up session.', color: '#f97316' },
  { id: 'pyq', name: 'PYQ Papers', icon: 'pyq', description: 'Real previous year questions filtered by year.', color: '#3b82f6' },
]

interface BuilderState {
  name: string
  mode: TestModeId
  wizardType: WizardType
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

function getDefaultsForWizardType(type: WizardType): Partial<BuilderState> {
  switch (type) {
    case 'full':
      return {
        exam: 'jee-main',
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionTypes: ['single', 'integer'],
        totalQuestions: 30,
        timeLimitMinutes: 180,
        negativeMarking: true,
        allowPause: true,
      }
    case 'chapter':
      return {
        exam: 'practice',
        subjects: ['physics'],
        questionTypes: ['single', 'multiple', 'integer', 'numerical', 'matrix', 'paragraph', 'assertion-reason', 'match-columns'],
        totalQuestions: 30,
        timeLimitMinutes: 30,
        negativeMarking: false,
        allowPause: true,
      }
    case 'subject':
      return {
        exam: 'practice',
        subjects: ['physics'],
        questionTypes: ['single', 'multiple', 'integer', 'numerical', 'matrix', 'paragraph', 'assertion-reason', 'match-columns'],
        totalQuestions: 30,
        timeLimitMinutes: 60,
        negativeMarking: false,
        allowPause: true,
      }
    case 'mixed':
      return {
        exam: 'practice',
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionTypes: ['single', 'multiple', 'integer', 'numerical', 'matrix', 'paragraph', 'assertion-reason', 'match-columns'],
        totalQuestions: 30,
        timeLimitMinutes: 30,
        negativeMarking: false,
        allowPause: true,
      }
    case 'pyq':
      return {
        exam: 'jee-main',
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionTypes: ['single', 'integer'],
        totalQuestions: 30,
        timeLimitMinutes: 180,
        negativeMarking: true,
        allowPause: true,
      }
  }
}

function getModeForWizardType(type: WizardType): TestModeId {
  switch (type) {
    case 'full': return 'full'
    case 'chapter': return 'chapter'
    case 'subject': return 'subject'
    case 'mixed': return 'mixed-practice'
    case 'pyq': return 'pyq'
  }
}

function initialState(mode: TestModeId): BuilderState {
  const allTypes: QuestionTypeId[] = [
    'single', 'multiple', 'integer', 'numerical', 'matrix', 'paragraph', 'assertion-reason', 'match-columns',
  ]

  if (mode === 'daily-challenge') {
    return {
      name: 'Daily Challenge',
      mode: 'daily-challenge',
      wizardType: 'mixed',
      exam: 'practice',
      subjects: ['physics', 'chemistry', 'mathematics'],
      selectedChapters: [],
      selectedTopics: [],
      difficulties: [1, 2, 3, 4, 5],
      questionTypes: allTypes,
      totalQuestions: 10,
      timeLimitMinutes: 15,
      negativeMarking: false,
      shuffleQuestions: false,
      shuffleOptions: true,
      allowPause: false,
      years: [2019, 2020, 2021, 2022, 2023, 2024],
    }
  }
  if (mode === 'weak-chapter') {
    return {
      name: 'Weak Chapter Test',
      mode: 'weak-chapter',
      wizardType: 'mixed',
      exam: 'practice',
      subjects: ['physics', 'chemistry', 'mathematics'],
      selectedChapters: [],
      selectedTopics: [],
      difficulties: [1, 2, 3, 4, 5],
      questionTypes: allTypes,
      totalQuestions: 30,
      timeLimitMinutes: 30,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowPause: true,
      years: [2019, 2020, 2021, 2022, 2023, 2024],
    }
  }
  if (mode === 'marathon') {
    return {
      name: 'Marathon Mode',
      mode: 'marathon',
      wizardType: 'mixed',
      exam: 'practice',
      subjects: ['physics', 'chemistry', 'mathematics'],
      selectedChapters: [],
      selectedTopics: [],
      difficulties: [1, 2, 3, 4, 5],
      questionTypes: allTypes,
      totalQuestions: 60,
      timeLimitMinutes: 120,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowPause: true,
      years: [2019, 2020, 2021, 2022, 2023, 2024],
    }
  }
  if (mode === 'speed') {
    return {
      name: 'Speed Test',
      mode: 'speed',
      wizardType: 'mixed',
      exam: 'practice',
      subjects: ['physics', 'chemistry', 'mathematics'],
      selectedChapters: [],
      selectedTopics: [],
      difficulties: [1, 2, 3, 4, 5],
      questionTypes: allTypes,
      totalQuestions: 20,
      timeLimitMinutes: 10,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowPause: false,
      years: [2019, 2020, 2021, 2022, 2023, 2024],
    }
  }
  if (mode === 'revision') {
    return {
      name: 'Revision Mode',
      mode: 'revision',
      wizardType: 'mixed',
      exam: 'practice',
      subjects: ['physics', 'chemistry', 'mathematics'],
      selectedChapters: [],
      selectedTopics: [],
      difficulties: [1, 2, 3, 4, 5],
      questionTypes: allTypes,
      totalQuestions: 30,
      timeLimitMinutes: 60,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowPause: true,
      years: [2019, 2020, 2021, 2022, 2023, 2024],
    }
  }

  const wizardType: WizardType = mode === 'full' ? 'full' : mode === 'chapter' ? 'chapter' : mode === 'subject' ? 'subject' : mode === 'pyq' ? 'pyq' : 'mixed'
  const defaults = getDefaultsForWizardType(wizardType)

  return {
    name: TEST_MODES.find((m) => m.id === mode)?.name ?? 'Custom Test',
    mode,
    wizardType,
    exam: defaults.exam ?? 'practice',
    subjects: defaults.subjects ?? ['physics', 'chemistry', 'mathematics'],
    selectedChapters: [],
    selectedTopics: [],
    difficulties: defaults.difficulties ?? [1, 2, 3, 4, 5],
    questionTypes: defaults.questionTypes ?? ['single', 'multiple', 'integer', 'numerical', 'matrix', 'paragraph', 'assertion-reason', 'match-columns'],
    totalQuestions: defaults.totalQuestions ?? 30,
    timeLimitMinutes: defaults.timeLimitMinutes ?? 180,
    negativeMarking: defaults.negativeMarking ?? false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowPause: defaults.allowPause ?? true,
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
  const isCustomWizard = modeFromUrl === 'custom'

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
  const [wizardStep, setWizardStep] = useState<number>(isCustomWizard ? 0 : -1)
  const [building, setBuilding] = useState(false)

  const update = (patch: Partial<BuilderState>) => setState((s) => ({ ...s, ...patch }))

  useEffect(() => {
    if (modeFromUrl !== mode) {
      setMode(modeFromUrl)
      setState(initialState(modeFromUrl))
      setWizardStep(modeFromUrl === 'custom' ? 0 : -1)
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

  const selectWizardType = (type: WizardType) => {
    const defaults = getDefaultsForWizardType(type)
    const newMode = getModeForWizardType(type)
    update({
      wizardType: type,
      mode: newMode,
      name: TEST_TYPES.find((t) => t.id === type)?.name ?? 'Custom Test',
      ...defaults,
      selectedChapters: [],
      selectedTopics: [],
    })
  }

  const handleStart = async () => {
    if (!state.subjects.length) {
      pushToast('Select at least one subject.', 'error')
      return
    }
    setBuilding(true)
    try {
      let config: TestConfig

      if (state.mode === 'daily-challenge') {
        config = await buildDailyChallengeTest()
      } else if (state.mode === 'weak-chapter') {
        config = await buildWeakChapterTest(state.totalQuestions)
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
          onlyPreviouslyAttempted: state.mode === 'revision',
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

  const modeMeta = useMemo(() => TEST_MODES.find((m) => m.id === mode) ?? TEST_MODES[0]!, [mode])

  // --- Direct mode pages (not wizard) ---
  if (!isCustomWizard && wizardStep === -1) {
    return (
      <div>
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
        <DirectModeBody state={state} update={update} selectedSubject={selectedSubject} toggleSubject={toggleSubject} toggleChapter={toggleChapter} toggleDifficulty={toggleDifficulty} toggleType={toggleType} handleStart={handleStart} building={building} mode={mode} />
      </div>
    )
  }

  // --- Custom Test Wizard ---
  return (
    <div>
      <PageHeader title="Custom Test" subtitle="Build your perfect test in a few steps" />

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-1">
        {WIZARD_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <button
              onClick={() => i <= wizardStep && setWizardStep(i)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                i === wizardStep
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : i < wizardStep
                    ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                    : 'bg-surface2 text-text3',
              )}
            >
              {i < wizardStep ? <Icon name="check-circle" size={14} /> : i + 1}
            </button>
            <span className={cn('text-xs font-medium', i === wizardStep ? 'text-text' : 'text-text3')}>
              {step}
            </span>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={cn('mx-1 h-px w-6', i < wizardStep ? 'bg-primary/40' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={wizardStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {wizardStep === 0 && (
            <WizardStepType selected={state.wizardType} onSelect={selectWizardType} />
          )}
          {wizardStep === 1 && (
            <WizardStepContent state={state} update={update} selectedSubject={selectedSubject} toggleSubject={toggleSubject} toggleChapter={toggleChapter} />
          )}
          {wizardStep === 2 && (
            <WizardStepRules state={state} update={update} toggleDifficulty={toggleDifficulty} toggleType={toggleType} />
          )}
          {wizardStep === 3 && (
            <WizardStepReview state={state} update={update} building={building} onStart={handleStart} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => wizardStep > 0 ? setWizardStep(wizardStep - 1) : navigate('/dashboard')}
        >
          <Icon name="chevron-left" size={16} />
          {wizardStep > 0 ? 'Back' : 'Dashboard'}
        </Button>
        {wizardStep < 3 && (
          <Button
            onClick={() => {
              if (wizardStep === 0 && !state.wizardType) {
                pushToast('Pick a test type first.', 'error')
                return
              }
              if (wizardStep === 1 && state.wizardType === 'chapter' && !state.selectedChapters.length) {
                pushToast('Select at least one chapter.', 'error')
                return
              }
              setWizardStep(wizardStep + 1)
            }}
          >
            Next
            <Icon name="chevron-right" size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}

// ============ WIZARD STEP COMPONENTS ============

function WizardStepType({ selected, onSelect }: { selected: WizardType; onSelect: (t: WizardType) => void }) {
  return (
    <Card>
      <CardHeader title="What type of test do you want?" subtitle="This sets smart defaults you can customize later" />
      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEST_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cn(
              'group relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all',
              selected === t.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-border bg-surface2 hover:border-border2 hover:bg-surface3',
            )}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${t.color}18`, color: t.color }}
            >
              <Icon name={t.icon} size={22} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-text">{t.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-text2">{t.description}</p>
            </div>
            {selected === t.id && (
              <div className="absolute right-3 top-3">
                <Icon name="check-circle" size={18} className="text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
    </Card>
  )
}

function WizardStepContent({ state, update, selectedSubject, toggleSubject, toggleChapter }: {
  state: BuilderState
  update: (p: Partial<BuilderState>) => void
  selectedSubject: Subject
  toggleSubject: (id: SubjectId) => void
  toggleChapter: (id: string) => void
}) {
  const showChapters = state.wizardType === 'chapter'
  const showSubjectSelect = state.wizardType === 'subject'
  const showYears = state.wizardType === 'pyq'

  return (
    <div className="space-y-4">
      {/* Subjects */}
      <Card>
        <CardHeader title="Subjects" subtitle={showSubjectSelect ? 'Pick one subject for deep practice' : 'Which subjects to include?'} />
        <div className="grid gap-2 px-5 pb-5 sm:grid-cols-3">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                if (showSubjectSelect) {
                  update({ subjects: [s.id] })
                } else {
                  toggleSubject(s.id)
                }
              }}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all',
                state.subjects.includes(s.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface2 hover:border-border2',
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-display text-sm font-bold text-text">{s.name}</span>
              </div>
              <p className="text-[11px] text-text3">{s.chapters.length} chapters</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Chapters */}
      {showChapters && (
        <Card>
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-text">Chapters</h3>
              <p className="mt-0.5 text-xs text-text2">Pick chapters from {selectedSubject.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedSubject.id}
                onChange={(e) => update({ subjects: [e.target.value as SubjectId, ...state.subjects.filter((s) => s !== e.target.value)], selectedChapters: [] })}
                className="w-40 text-xs"
              >
                {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Badge tone="info">{state.selectedChapters.length} selected</Badge>
            </div>
          </div>
          <div className="grid max-h-[28rem] gap-1.5 overflow-y-auto px-5 pb-5 sm:grid-cols-2">
            {selectedSubject.chapters.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleChapter(c.id)}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                  state.selectedChapters.includes(c.id)
                    ? 'border-primary/60 bg-primary/10 text-text'
                    : 'border-border bg-surface2 text-text2 hover:border-border2',
                )}
              >
                <span className="font-display text-sm font-semibold truncate">{c.name}</span>
                <Icon
                  name={state.selectedChapters.includes(c.id) ? 'check-circle' : 'circle'}
                  size={15}
                  className={state.selectedChapters.includes(c.id) ? 'text-primary' : 'text-text3'}
                />
              </button>
            ))}
          </div>
          {state.selectedChapters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-4">
              {state.selectedChapters.map((id) => {
                const c = selectedSubject.chapters.find((ch) => ch.id === id)
                return (
                  <Chip key={id} selected onClick={() => toggleChapter(id)}>
                    <span className="font-display">{c?.name}</span>
                  </Chip>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Years for PYQ */}
      {showYears && (
        <Card>
          <CardHeader title="Filter by Year" subtitle="Select which years to pull questions from" />
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            {[2019, 2020, 2021, 2022, 2023, 2024].map((y) => (
              <Chip
                key={y}
                selected={state.years.includes(y)}
                onClick={() => update({
                  years: state.years.includes(y) ? state.years.filter((x) => x !== y) : [...state.years, y],
                })}
              >
                {y}
              </Chip>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function WizardStepRules({ state, update, toggleDifficulty, toggleType }: {
  state: BuilderState
  update: (p: Partial<BuilderState>) => void
  toggleDifficulty: (d: Difficulty) => void
  toggleType: (t: QuestionTypeId) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Questions & Time" subtitle="How many questions and how long?" />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
          <Field label="Test Name">
            <Input value={state.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Total Questions">
            <Input type="number" min={1} max={120} value={state.totalQuestions} onChange={(e) => update({ totalQuestions: Number(e.target.value) })} />
          </Field>
          <Field label="Time Limit (minutes)">
            <Input type="number" min={5} value={state.timeLimitMinutes} onChange={(e) => update({ timeLimitMinutes: Number(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Difficulty" subtitle="Which difficulty levels to include?" />
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => toggleDifficulty(d.value)}
              className={cn(
                'flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all',
                state.difficulties.includes(d.value)
                  ? 'border-transparent text-white'
                  : 'border-border bg-surface2 text-text2 hover:border-border2',
              )}
              style={state.difficulties.includes(d.value) ? { backgroundColor: d.color } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Question Types" subtitle="Which formats to include?" />
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {QUESTION_TYPES.map((t) => (
            <Chip key={t.id} selected={state.questionTypes.includes(t.id)} onClick={() => toggleType(t.id)}>
              {t.name}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Preferences" />
        <div className="space-y-3 px-5 pb-5">
          <ToggleRow label="Negative Marking" desc="-1 for wrong answers" checked={state.negativeMarking} onChange={(v) => update({ negativeMarking: v })} />
          <ToggleRow label="Shuffle Questions" desc="Randomize question order" checked={state.shuffleQuestions} onChange={(v) => update({ shuffleQuestions: v })} />
          <ToggleRow label="Shuffle Options" desc="Randomize option order" checked={state.shuffleOptions} onChange={(v) => update({ shuffleOptions: v })} />
          <ToggleRow label="Allow Pause" desc="Pause the timer mid-test" checked={state.allowPause} onChange={(v) => update({ allowPause: v })} />
        </div>
      </Card>
    </div>
  )
}

function WizardStepReview({ state, update, building, onStart }: {
  state: BuilderState
  update: (p: Partial<BuilderState>) => void
  building: boolean
  onStart: () => void
}) {
  const selectedSubject = SUBJECTS.find((s) => s.id === state.subjects[0]) ?? SUBJECTS[0]!
  const chapterNames = state.selectedChapters
    .map((id) => selectedSubject.chapters.find((c) => c.id === id)?.name)
    .filter(Boolean)

  return (
    <Card>
      <CardHeader title="Review your test" subtitle="Double-check everything before you start" />
      <div className="px-5 pb-5">
        <div className="rounded-xl border border-border bg-surface2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-text">{state.name}</h3>
            <Badge tone="primary">{state.totalQuestions} Qs</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <InfoRow label="Exam Mode" value={state.exam === 'jee-main' ? 'JEE Main' : state.exam === 'jee-advanced' ? 'JEE Advanced' : 'Practice'} />
              <InfoRow label="Subjects" value={state.subjects.map((s) => SUBJECTS.find((sub) => sub.id === s)?.name).join(', ')} />
              {chapterNames.length > 0 && (
                <InfoRow label="Chapters" value={`${chapterNames.length} selected`} />
              )}
              <InfoRow label="Time" value={`${state.timeLimitMinutes} minutes`} />
            </div>
            <div className="space-y-2 text-sm">
              <InfoRow label="Negative Marking" value={state.negativeMarking ? 'Yes (-1)' : 'No'} />
              <InfoRow label="Difficulty" value={`${state.difficulties.length} level${state.difficulties.length !== 1 ? 's' : ''}`} />
              <InfoRow label="Question Types" value={`${state.questionTypes.length} type${state.questionTypes.length !== 1 ? 's' : ''}`} />
              <InfoRow label="Shuffle" value={state.shuffleQuestions ? 'Questions + Options' : state.shuffleOptions ? 'Options only' : 'Off'} />
            </div>
          </div>

          {chapterNames.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {chapterNames.map((name) => (
                <span key={name} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary font-display">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button onClick={onStart} loading={building} size="lg" className="mt-4 w-full">
          <Icon name="play" size={18} />
          {building ? 'Building test...' : 'Start Test'}
        </Button>
      </div>
    </Card>
  )
}

// ============ DIRECT MODE BODY (non-wizard modes) ============

function DirectModeBody({ state, update, selectedSubject, toggleSubject, toggleChapter, toggleDifficulty, toggleType, handleStart, building, mode }: {
  state: BuilderState
  update: (p: Partial<BuilderState>) => void
  selectedSubject: Subject
  toggleSubject: (id: SubjectId) => void
  toggleChapter: (id: string) => void
  toggleDifficulty: (d: Difficulty) => void
  toggleType: (t: QuestionTypeId) => void
  handleStart: () => void
  building: boolean
  mode: TestModeId
}) {
  const [activeTab, setActiveTab] = useState<'subjects' | 'chapters' | 'options'>('subjects')

  return (
    <div className="grid gap-4 lg:grid-cols-3">
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
                      questionTypes: ['single', 'multiple', 'integer', 'numerical', 'matrix', 'paragraph', 'assertion-reason', 'match-columns'],
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
              <Input type="number" min={1} max={120} value={state.totalQuestions} onChange={(e) => update({ totalQuestions: Number(e.target.value) })} />
            </Field>
            <Field label="Time Limit (minutes)">
              <Input type="number" min={5} value={state.timeLimitMinutes} onChange={(e) => update({ timeLimitMinutes: Number(e.target.value) })} />
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
                      <span className="font-display text-sm font-bold text-text">{s.name}</span>
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
                        'flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors',
                        state.selectedChapters.includes(c.id)
                          ? 'border-primary/60 bg-primary/10 text-text'
                          : 'border-border bg-surface2 text-text2 hover:border-border2',
                      )}
                    >
                      <span className="font-display text-sm font-semibold truncate">{c.name}</span>
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
                          <span className="font-display">{c?.name}</span>
                        </Chip>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'options' && (
              <div className="space-y-5">
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
                {mode === 'pyq' && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-text2">Years</p>
                    <div className="flex flex-wrap gap-2">
                      {[2019, 2020, 2021, 2022, 2023, 2024].map((y) => (
                        <Chip key={y} selected={state.years.includes(y)} onClick={() => {
                          update({ years: state.years.includes(y) ? state.years.filter((x) => x !== y) : [...state.years, y] })
                        }}>
                          {y}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Preferences" />
          <div className="space-y-3 px-5 pb-5">
            <ToggleRow label="Negative Marking" desc="-1 for wrong answers" checked={state.negativeMarking} onChange={(v) => update({ negativeMarking: v })} />
            <ToggleRow label="Shuffle Questions" desc="Randomize question order" checked={state.shuffleQuestions} onChange={(v) => update({ shuffleQuestions: v })} />
            <ToggleRow label="Shuffle Options" desc="Randomize option order" checked={state.shuffleOptions} onChange={(v) => update({ shuffleOptions: v })} />
            <ToggleRow label="Allow Pause" desc="Pause the timer mid-test" checked={state.allowPause} onChange={(v) => update({ allowPause: v })} />
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
          <Button onClick={handleStart} loading={building} size="lg" className="mt-4 w-full">
            <Icon name="play" size={18} />
            {building ? 'Building test...' : 'Start Test'}
          </Button>
        </Card>
      </div>
    </div>
  )
}

// ============ SHARED ============

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text2">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  )
}
