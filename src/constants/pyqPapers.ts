import type { ExamId } from '@/types/core'

export interface PyqPaper {
  id: string
  exam: ExamId
  year: number
  shift: 1 | 2
  label: string
  questionCount: number
  durationMinutes: number
}

export interface PyqYearGroup {
  year: number
  papers: PyqPaper[]
}

function mainPaper(year: number, shift: 1 | 2): PyqPaper {
  return {
    id: `main-${year}-s${shift}`,
    exam: 'jee-main',
    year,
    shift,
    label: `JEE Main ${year} Shift ${shift}`,
    questionCount: 75,
    durationMinutes: 180,
  }
}

function advancedPaper(year: number, shift: 1 | 2): PyqPaper {
  return {
    id: `advanced-${year}-s${shift}`,
    exam: 'jee-advanced',
    year,
    shift,
    label: `JEE Advanced ${year} Paper ${shift}`,
    questionCount: 54,
    durationMinutes: 180,
  }
}

const MAIN_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014]
const ADVANCED_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014]

export const PYQ_MAIN_PAPERS: PyqYearGroup[] = MAIN_YEARS.map((year) => ({
  year,
  papers: [mainPaper(year, 1), mainPaper(year, 2)],
}))

export const PYQ_ADVANCED_PAPERS: PyqYearGroup[] = ADVANCED_YEARS.map((year) => ({
  year,
  papers: [advancedPaper(year, 1), advancedPaper(year, 2)],
}))

export const ALL_PYQ_PAPERS: PyqPaper[] = [
  ...PYQ_MAIN_PAPERS.flatMap((g) => g.papers),
  ...PYQ_ADVANCED_PAPERS.flatMap((g) => g.papers),
]

export function getPyqPaperById(id: string): PyqPaper | undefined {
  return ALL_PYQ_PAPERS.find((p) => p.id === id)
}

export function getPyqPapersByExam(exam: ExamId): PyqYearGroup[] {
  return exam === 'jee-main' ? PYQ_MAIN_PAPERS : PYQ_ADVANCED_PAPERS
}
