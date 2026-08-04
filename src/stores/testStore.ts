import { create } from 'zustand'
import type { TestConfig, TestDraft, AnsweredOption } from '@/types/test'

export type TestPhase = 'instructions' | 'running' | 'paused' | 'submitted'

interface TestState {
  config: TestConfig | null
  phase: TestPhase
  draft: TestDraft | null
  currentSectionId: string
  currentQuestionIndex: number
  timeRemaining: number
  startedAt: number
  answers: Record<string, AnsweredOption>
  submitPayload: TestDraft | null

  startTest: (config: TestConfig) => void
  loadDraft: (draft: TestDraft) => void
  resumeDraft: () => void
  setPhase: (p: TestPhase) => void
  setCurrentQuestion: (sectionId: string, index: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
  jumpToSection: (sectionId: string) => void
  selectOption: (questionId: string, optionIndex: number) => void
  toggleMultipleOption: (questionId: string, optionIndex: number) => void
  setIntegerAnswer: (questionId: string, value: number | null) => void
  setMatrixAnswer: (questionId: string, row: number, col: number) => void
  clearAnswer: (questionId: string) => void
  toggleMarkReview: (questionId: string) => void
  markVisited: (questionId: string) => void
  tick: () => void
  saveAndNext: () => void
  markAndNext: () => void
  pause: () => void
  resume: () => void
  updateTimeRemaining: (t: number) => void
  reset: () => void
  syncToDraft: (draft: TestDraft) => void
}

const emptyAnswer = (questionId: string): AnsweredOption => ({
  questionId,
  sectionId: '',
  selected: [],
  markedForReview: false,
  timeSpent: 0,
  visited: false,
})

export const useTestStore = create<TestState>((set, get) => ({
  config: null,
  phase: 'instructions',
  draft: null,
  currentSectionId: '',
  currentQuestionIndex: 0,
  timeRemaining: 0,
  startedAt: Date.now(),
  answers: {},
  submitPayload: null,

  startTest: (config) => {
    const firstSection = config.sections[0]
    if (!firstSection) return
    set({
      config,
      phase: 'instructions',
      draft: null,
      currentSectionId: firstSection.id,
      currentQuestionIndex: 0,
      timeRemaining: config.durationSeconds,
      startedAt: Date.now(),
      answers: {},
      submitPayload: null,
    })
  },

  loadDraft: (draft) => {
    set({
      config: draft.config,
      phase: 'running',
      draft,
      currentSectionId: draft.currentSectionId,
      currentQuestionIndex: draft.currentQuestionIndex,
      timeRemaining: draft.timeRemaining,
      startedAt: Date.parse(draft.startedAt),
      answers: draft.answers,
      submitPayload: null,
    })
  },

  resumeDraft: () => {
    set({ phase: 'running' })
  },

  setPhase: (phase) => set({ phase }),

  setCurrentQuestion: (sectionId, index) =>
    set({ currentSectionId: sectionId, currentQuestionIndex: index }),

  jumpToSection: (sectionId) => set({ currentSectionId: sectionId }),

  nextQuestion: () => {
    const { config, currentSectionId, currentQuestionIndex } = get()
    if (!config) return
    const section = config.sections.find((s) => s.id === currentSectionId)
    if (!section) return
    const next = currentQuestionIndex + 1
    if (next < section.questionIds.length) {
      set({ currentQuestionIndex: next })
    } else {
      const idx = config.sections.findIndex((s) => s.id === currentSectionId)
      const nextSection = config.sections[idx + 1]
      if (nextSection) {
        set({ currentSectionId: nextSection.id, currentQuestionIndex: 0 })
      }
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 })
    }
  },

  selectOption: (questionId, optionIndex) => {
    const { answers, currentSectionId } = get()
    const existing = answers[questionId] ?? emptyAnswer(questionId)
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...existing,
          sectionId: existing.sectionId || currentSectionId,
          selected: [optionIndex],
          answeredAt: Date.now(),
          visited: true,
        },
      },
    })
  },

  toggleMultipleOption: (questionId, optionIndex) => {
    const { answers, currentSectionId } = get()
    const existing = answers[questionId] ?? emptyAnswer(questionId)
    const selected = existing.selected.includes(optionIndex)
      ? existing.selected.filter((i) => i !== optionIndex)
      : [...existing.selected, optionIndex]
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...existing,
          sectionId: existing.sectionId || currentSectionId,
          selected,
          answeredAt: selected.length ? Date.now() : undefined,
          visited: true,
        },
      },
    })
  },

  setIntegerAnswer: (questionId, value) => {
    const { answers, currentSectionId } = get()
    const existing = answers[questionId] ?? emptyAnswer(questionId)
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...existing,
          sectionId: existing.sectionId || currentSectionId,
          selected: value === null ? [] : [value],
          answeredAt: value === null ? undefined : Date.now(),
          visited: true,
        },
      },
    })
  },

  setMatrixAnswer: (questionId, row, col) => {
    const { answers, currentSectionId } = get()
    const existing = answers[questionId] ?? emptyAnswer(questionId)
    const matrix = { ...(existing.matrix ?? {}) }
    matrix[row] = col
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...existing,
          sectionId: existing.sectionId || currentSectionId,
          matrix,
          answeredAt: Date.now(),
          visited: true,
        },
      },
    })
  },

  clearAnswer: (questionId) => {
    const { answers } = get()
    const existing = answers[questionId]
    if (!existing) return
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...existing,
          selected: [],
          matrix: undefined,
          answeredAt: undefined,
        },
      },
    })
  },

  toggleMarkReview: (questionId) => {
    const { answers } = get()
    const existing = answers[questionId] ?? emptyAnswer(questionId)
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...existing,
          markedForReview: !existing.markedForReview,
          visited: true,
        },
      },
    })
  },

  markVisited: (questionId) => {
    const { answers } = get()
    const existing = answers[questionId]
    if (existing?.visited) return
    set({
      answers: {
        ...answers,
        [questionId]: { ...(existing ?? emptyAnswer(questionId)), visited: true },
      },
    })
  },

  tick: () => {
    const { phase, timeRemaining } = get()
    if (phase !== 'running') return
    if (timeRemaining <= 0) {
      set({ timeRemaining: 0 })
      return
    }
    set({ timeRemaining: timeRemaining - 1 })
  },

  saveAndNext: () => {
    const { nextQuestion } = get()
    nextQuestion()
  },

  markAndNext: () => {
    const { config, currentSectionId, currentQuestionIndex, toggleMarkReview, nextQuestion } = get()
    if (!config) return
    const section = config.sections.find((s) => s.id === currentSectionId)
    const qid = section?.questionIds[currentQuestionIndex]
    if (qid) toggleMarkReview(qid)
    nextQuestion()
  },

  pause: () => {
    set({ phase: 'paused' })
  },

  resume: () => {
    set({ phase: 'running' })
  },

  updateTimeRemaining: (t) => set({ timeRemaining: t }),

  syncToDraft: (draft) => set({ draft }),

  reset: () =>
    set({
      config: null,
      phase: 'instructions',
      draft: null,
      currentSectionId: '',
      currentQuestionIndex: 0,
      timeRemaining: 0,
      answers: {},
      submitPayload: null,
    }),
}))

/** Build a draft object from current store state */
export function buildDraft(state: TestState): TestDraft | null {
  if (!state.config) return null
  const sectionCounts: Record<string, number> = {}
  for (const section of state.config.sections) {
    sectionCounts[section.id] = section.questionIds.filter(
      (qid) => state.answers[qid]?.selected.length || state.answers[qid]?.matrix,
    ).length
  }
  return {
    id: state.config.id,
    config: state.config,
    answers: state.answers,
    currentSectionId: state.currentSectionId,
    currentQuestionIndex: state.currentQuestionIndex,
    timeRemaining: state.timeRemaining,
    lastSavedAt: new Date().toISOString(),
    startedAt: new Date(state.startedAt).toISOString(),
    sectionsAnsweredCount: sectionCounts,
  }
}
