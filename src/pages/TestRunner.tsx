import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTestStore } from '@/stores/testStore'
import { useQuestion } from '@/api/questionApi'
import { QuestionViewer } from '@/components/question/QuestionViewer'
import { QuestionPalette, PaletteLegend } from '@/components/question/QuestionPalette'
import { Timer } from '@/components/test/Timer'
import { SubmitDialog } from '@/components/test/SubmitDialog'
import { InstructionsScreen } from '@/components/test/InstructionsScreen'
import { Button, Icon } from '@/components/ui'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useDraftPersistence, getSavedDraft, deleteDraft } from '@/hooks/useDraft'
import { useSectionStatuses } from '@/hooks/useTestStatus'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/utils/cn'
import { saveTestResult } from '@/engines/analytics/engine'
import { scoreTestRun } from '@/engines/scoring'
import { formatDuration } from '@/utils/time'
import { useUIStore } from '@/stores/uiStore'

export default function TestRunner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pushToast = useUIStore((s) => s.pushToast)
  const { settings } = useSettingsStore()

  const {
    config,
    phase,
    draft,
    currentSectionId,
    currentQuestionIndex,
    timeRemaining,
    answers,
    loadDraft,
    resumeDraft,
    nextQuestion,
    prevQuestion,
    jumpToSection,
    setCurrentQuestion,
    selectOption,
    toggleMultipleOption,
    setIntegerAnswer,
    setMatrixAnswer,
    toggleMarkReview,
    markVisited,
    updateTimeRemaining,
    pause,
    resume,
    reset,
  } = useTestStore()

  const [submitOpen, setSubmitOpen] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(true)
  const [showPauseOverlay, setShowPauseOverlay] = useState(false)
  const [resumeCountdown, setResumeCountdown] = useState(0)
  const submittedRef = useRef(false)
  const doSubmitRef = useRef<(() => Promise<void>) | null>(null)

  useDraftPersistence(4000)

  // Load draft if navigating directly to a run URL
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (useTestStore.getState().config) {
        setLoadingDraft(false)
        return
      }
      const saved = await getSavedDraft(id)
      if (cancelled) return
      if (saved && saved.config.id === id) {
        loadDraft(saved)
      } else {
        pushToast('No saved test found for this session.', 'warning')
        navigate('/test/custom')
      }
      setLoadingDraft(false)
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const section = config?.sections.find((s) => s.id === currentSectionId)
  const currentQid = section?.questionIds[currentQuestionIndex]
  const { data: question } = useQuestion(currentQid)
  const statuses = useSectionStatuses(currentSectionId)
  const currentAnswer = currentQid ? answers[currentQid] : undefined

  // Track per-question time spent
  const timeSpentRef = useRef<Record<string, number>>({})
  useEffect(() => {
    if (!currentQid || phase !== 'running') return
    const started = Date.now()
    return () => {
      timeSpentRef.current[currentQid] =
        (timeSpentRef.current[currentQid] ?? 0) + Math.round((Date.now() - started) / 1000)
    }
  }, [currentQid, phase])

  // Mark question visited
  useEffect(() => {
    if (currentQid && phase === 'running' && question) {
      markVisited(currentQid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQid, phase, question])

  // Main countdown tied to startedAt (so it survives re-renders)
  useEffect(() => {
    if (phase !== 'running') return
    const startedAtMs = useTestStore.getState().startedAt
    const base = useTestStore.getState().timeRemaining
    void base
    const idInterval = setInterval(() => {
      const state = useTestStore.getState()
      if (state.phase !== 'running') return
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000)
      const remaining = Math.max(0, state.config!.durationSeconds - elapsed)
      updateTimeRemaining(remaining)
      if (remaining <= 0) {
        clearInterval(idInterval)
        void doSubmitRef.current?.()
      }
    }, 500)
    return () => clearInterval(idInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, config?.id])

  const doSubmit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current || !config) return
      submittedRef.current = true
      // Attach timeSpent to answers before scoring
      const finalAnswers = { ...answers }
      for (const [qid, spent] of Object.entries(timeSpentRef.current)) {
        if (finalAnswers[qid]) {
          finalAnswers[qid] = { ...finalAnswers[qid], timeSpent: spent }
        }
      }
      try {
        const result = await scoreTestRun(
          config,
          finalAnswers,
          auto,
          new Date(useTestStore.getState().startedAt).toISOString(),
        )
        await saveTestResult(result)
        await deleteDraft(config.id)
        reset()
        navigate(`/result/${result.id}`, { state: { result } })
      } catch (err) {
        submittedRef.current = false
        pushToast('Failed to submit test. Please try again.', 'error')
        console.error(err)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, answers],
  )

  const handleAutoSubmit = useCallback(() => {
    pushToast('Time is up! The test is being submitted automatically.', 'warning')
    return doSubmit(true)
  }, [doSubmit, pushToast])

  doSubmitRef.current = handleAutoSubmit

  // Pause overlay countdown
  const handlePause = () => {
    pause()
    setShowPauseOverlay(true)
    setResumeCountdown(5)
  }

  useEffect(() => {
    if (!showPauseOverlay) return
    if (resumeCountdown <= 0) {
      resume()
      setShowPauseOverlay(false)
      return
    }
    const t = setTimeout(() => setResumeCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [showPauseOverlay, resumeCountdown, resume])

  // Keyboard shortcuts
  useKeyboard(
    {
      '1': () => handleOptionKey(0),
      '2': () => handleOptionKey(1),
      '3': () => handleOptionKey(2),
      '4': () => handleOptionKey(3),
      a: () => handleOptionKey(0),
      b: () => handleOptionKey(1),
      c: () => handleOptionKey(2),
      d: () => handleOptionKey(3),
      n: () => nextQuestion(),
      p: () => prevQuestion(),
      m: () => {
        if (currentQid) {
          toggleMarkReview(currentQid)
          nextQuestion()
        }
      },
      s: () => {
        if (currentQid) markVisited(currentQid)
        nextQuestion()
      },
      'ctrl+enter': () => setSubmitOpen(true),
      Escape: () => {
        if (phase === 'running') handlePause()
      },
    },
    phase === 'running',
    [currentQid],
  )

  function handleOptionKey(idx: number) {
    if (!question || idx >= question.options.length) return
    if (question.type === 'multiple') toggleMultipleOption(question.id, idx)
    else if (question.type === 'single' || question.type === 'assertion-reason') {
      selectOption(question.id, idx)
    }
  }

  if (loadingDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!config) return null

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-bg">
        <InstructionsScreen
          config={config}
          hasDraft={!!draft}
          timeLeft={draft?.timeRemaining}
          onResume={() => resumeDraft()}
          onStart={() => {
            useTestStore.setState({ startedAt: Date.now() })
            resumeDraft()
          }}
        />
      </div>
    )
  }

  const sectionName =
    section?.type === 'physics' ? 'Physics' : section?.type === 'chemistry' ? 'Chemistry' : section?.type === 'mathematics' ? 'Mathematics' : section?.type

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* TOP BAR */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface3 font-bold text-primary">
            {settings.userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-text">{settings.userName}</p>
            <p className="text-[10px] text-text3">{config.name}</p>
          </div>
        </div>

        <div className="mx-auto flex items-center gap-3">
          <span className="hidden rounded-md bg-surface2 px-2 py-1 text-[11px] font-semibold text-text2 md:inline">
            {sectionName}
          </span>
          <Timer
            remaining={timeRemaining}
            total={config.durationSeconds}
            running={phase === 'running'}
            paused={phase === 'paused'}
          />
        </div>

        <div className="flex items-center gap-2">
          {config.allowPause && phase === 'running' && (
            <Button variant="outline" size="sm" onClick={handlePause} className="hidden sm:inline-flex">
              <Icon name="pause" size={15} /> Pause
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setSubmitOpen(true)}>
            Submit
          </Button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT: question */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {question ? (
            <div className="mx-auto max-w-3xl space-y-5">
              <div className="flex items-center gap-2 text-[11px] text-text3">
                <span className="font-mono">
                  Question {currentQuestionIndex + 1} / {section?.questionIds.length}
                </span>
                <span>·</span>
                <span>{question.chapter}</span>
                <span>·</span>
                <span>{question.microTopic}</span>
                <span className="ml-auto font-mono">
                  {formatDuration(timeSpentRef.current[currentQid ?? ''] ?? 0)}
                </span>
              </div>

              <QuestionViewer
                question={question}
                answer={currentAnswer}
                onSelectOption={(i) => selectOption(question.id, i)}
                onToggleMultiple={(i) => toggleMultipleOption(question.id, i)}
                onIntegerInput={(v) => setIntegerAnswer(question.id, v)}
                onMatrixInput={(r, c) => setMatrixAnswer(question.id, r, c)}
              />

              {/* ACTION BAR */}
              <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
                  <Button variant="secondary" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
                    <Icon name="chevron-left" size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={currentAnswer?.markedForReview ? 'danger' : 'outline'}
                      size="sm"
                      onClick={() => currentQid && toggleMarkReview(currentQid)}
                    >
                      <Icon name="flag" size={15} />
                      Mark Review
                    </Button>
                    <Button variant="success" size="sm" onClick={() => { if (currentQid) { markVisited(currentQid); nextQuestion() } }}>
                      <Icon name="save" size={15} />
                      Save & Next
                    </Button>
                  </div>

                  <Button variant="secondary" onClick={nextQuestion}>
                    <span className="hidden sm:inline">Next</span>
                    <Icon name="chevron-right" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </main>

        {/* RIGHT: palette */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-4 lg:flex">
          <QuestionPalette
            items={statuses}
            onSelect={(i) => setCurrentQuestion(currentSectionId, i)}
            sectionLabel={`${sectionName} Section`}
            answeredCount={statuses.filter((s) => s.status === 'answered' || s.status === 'answered-marked').length}
            totalCount={statuses.length}
          />
          <div className="rounded-lg border border-border bg-surface2 p-3">
            <PaletteLegend />
          </div>

          {config.sections.length > 1 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text3">Sections</p>
              <div className="space-y-1">
                {config.sections.map((s) => {
                  const answered = s.questionIds.filter((qid) => {
                    const a = answers[qid]
                    return a ? a.selected.length > 0 || (a.matrix && Object.keys(a.matrix).length > 0) : false
                  }).length
                  const active = s.id === currentSectionId
                  return (
                    <button
                      key={s.id}
                      onClick={() => jumpToSection(s.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                        active ? 'border-primary/50 bg-primary/10 text-text' : 'border-border bg-surface2 text-text2 hover:border-border2',
                      )}
                    >
                      <span className="font-medium">
                        {s.subject === 'physics' ? 'Physics' : s.subject === 'chemistry' ? 'Chemistry' : 'Mathematics'}
                      </span>
                      <span className="font-mono text-xs text-text3">
                        {answered}/{s.questionIds.length}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      <SubmitDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onConfirm={() => {
          setSubmitOpen(false)
          void doSubmit(false)
        }}
      />

      {/* Pause overlay */}
      {showPauseOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface2">
              <Icon name="pause" size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-text">Test Paused</h2>
            <p className="mt-1 text-sm text-text2">Resuming in {resumeCountdown}s...</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => { resume(); setShowPauseOverlay(false) }}>
                Resume Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
