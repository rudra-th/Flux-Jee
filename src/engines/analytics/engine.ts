import { db } from '@/db'
import type { TestResult, QuestionPerformance } from '@/types/test'
import type { AccuracyEntry } from '@/types/analytics'
import type {
  AnalyticsBundle,
  SubjectPerformance,
  ChapterPerformance,
  TopicPerformance,
  DifficultyBreakdown,
  TypeBreakdown,
  SpeedMetric,
  GuessAnalysis,
  UserStats,
  HeatmapCell,
} from '@/types/analytics'
import type { Difficulty, QuestionTypeId, SubjectId } from '@/types/core'
import { lastNDays } from '@/utils/time'
import { round } from '@/utils/cn'

export async function saveTestResult(result: TestResult): Promise<void> {
  await db.transaction('rw', db.testResults, db.answerRecords, db.dailyActivity, db.mistakes, async () => {
    await db.testResults.put(result)

    // Update per-question answer records
    for (const p of result.performance) {
      const existing = await db.answerRecords.get(p.questionId)
      const attempted = p.visited && p.timeSpent > 0
      const correct = p.result === 'correct'
      const wrong = p.result === 'wrong'
      const guessed = p.isGuessed

      const record = existing ?? {
        questionId: p.questionId,
        everCorrect: false,
        everWrong: false,
        everGuessed: false,
        everSkipped: false,
        accuracy: 0,
        attempts: 0,
        correctAttempts: 0,
        totalTime: 0,
      }

      record.attempts += attempted ? 1 : 0
      if (attempted) {
        record.totalTime += p.timeSpent
        record.everCorrect = record.everCorrect || correct
        record.everWrong = record.everWrong || wrong
        record.everGuessed = record.everGuessed || guessed
        if (correct) record.correctAttempts += 1
        record.accuracy = record.attempts > 0 ? round(record.correctAttempts / record.attempts) : 0
        record.lastAttemptedAt = result.submittedAt
      }

      if (wrong || (attempted && !correct)) {
        const reason = wrong ? 'wrong' : guessed ? 'guessed' : 'slow'
        await db.mistakes.add({
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          questionId: p.questionId,
          reason,
          testId: result.id,
          attemptedAt: result.submittedAt,
          retried: false,
        })
      }

      record.lastResult = p.result === 'not-visited' ? record.lastResult : p.result

      await db.answerRecords.put(record)
    }

    // Update daily activity
    const day = result.submittedAt.slice(0, 10)
    const existingDay = await db.dailyActivity.get(day)
    const correct = result.performance.filter((p) => p.result === 'correct').length
    const wrong = result.performance.filter((p) => p.result === 'wrong').length
    const unattempted = result.performance.filter((p) => p.result === 'unattempted' || p.result === 'not-visited').length
    const attempted = correct + wrong

    await db.dailyActivity.put({
      date: day,
      attempted: (existingDay?.attempted ?? 0) + attempted,
      correct: (existingDay?.correct ?? 0) + correct,
      wrong: (existingDay?.wrong ?? 0) + wrong,
      unattempted: (existingDay?.unattempted ?? 0) + unattempted,
      timeSpent: (existingDay?.timeSpent ?? 0) + result.totalTimeSpent,
    }, day)
  })
}

export async function getAnalyticsBundle(): Promise<AnalyticsBundle> {
  const [results, daily] = await Promise.all([
    db.testResults.toArray(),
    db.dailyActivity.toArray(),
  ])

  const allPerf: QuestionPerformance[] = results.flatMap((r) => r.performance)
  const stats = computeStats(results, daily)
  const subjects = computeSubjects(allPerf)
  const chapters = computeChapters(allPerf)
  const topics = computeTopics(allPerf)
  const difficulty = computeDifficulty(allPerf)
  const types = computeTypes(allPerf)
  const speed = computeSpeed(allPerf)
  const guesses = computeGuesses(allPerf)

  return {
    daily,
    subjects,
    chapters,
    topics,
    difficulty,
    types,
    speed,
    guesses,
    stats,
    heatmap: computeHeatmap(daily),
  }
}

function computeStats(results: TestResult[], daily: AccuracyEntry[]): UserStats {
  const today = new Date().toDateString()
  const questionsToday = daily
    .filter((d) => new Date(`${d.date}T00:00:00`).toDateString() === today)
    .reduce((s, d) => s + d.attempted, 0)

  let streak = 0
  const daySet = new Set(daily.map((d) => d.date))
  const cursor = new Date()
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  let longest = 0
  const sorted = [...daily].map((d) => d.date).sort()
  let run = 0
  let prev: Date | null = null
  for (const date of sorted) {
    const d = new Date(`${date}T00:00:00`)
    if (prev && d.getTime() - prev.getTime() === 86400000) {
      run++
    } else {
      run = 1
    }
    longest = Math.max(longest, run)
    prev = d
  }

  const totalAttempted = results.reduce((s, r) => s + r.performance.filter((p) => p.visited).length, 0)
  const totalCorrect = results.reduce((s, r) => s + r.performance.filter((p) => p.result === 'correct').length, 0)
  const totalWrong = results.reduce((s, r) => s + r.performance.filter((p) => p.result === 'wrong').length, 0)
  const totalMarks = results.reduce((s, r) => s + r.totalMarks, 0)
  const maxMarks = results.reduce((s, r) => s + r.maxMarks, 0)
  const totalTime = results.reduce((s, r) => s + r.totalTimeSpent, 0)

  const lastTest = results.length ? [...results].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] : undefined

  return {
    totalTests: results.length,
    totalQuestionsAttempted: totalAttempted,
    totalCorrect,
    totalWrong,
    totalUnattempted: results.reduce((s, r) => s + r.performance.filter((p) => p.result === 'unattempted' || p.result === 'not-visited').length, 0),
    totalTimeSpent: totalTime,
    overallAccuracy: totalAttempted ? round((totalCorrect / totalAttempted) * 100) : 0,
    overallAttemptRate: maxMarks / 4 ? round((totalAttempted / (maxMarks / 4)) * 100) : 0,
    totalMarks: round(totalMarks),
    maxMarks,
    currentStreak: streak,
    longestStreak: longest,
    lastTestAt: lastTest?.submittedAt,
    dailyGoal: 30,
    questionsToday,
  }
}

function computeSubjects(perf: QuestionPerformance[]): SubjectPerformance[] {
  const subjects: SubjectId[] = ['physics', 'chemistry', 'mathematics']
  return subjects.map((subject) => {
    const p = perf.filter((x) => x.subject === subject && x.visited)
    const correct = p.filter((x) => x.result === 'correct').length
    const wrong = p.filter((x) => x.result === 'wrong').length
    const marks = p.reduce((s, x) => s + x.awardedMarks, 0)
    const maxMarks = p.reduce((s, x) => s + x.maxMarks, 0)
    return {
      subject,
      attempted: p.length,
      correct,
      wrong,
      accuracy: p.length ? round((correct / p.length) * 100) : 0,
      avgTime: p.length ? round(p.reduce((s, x) => s + x.timeSpent, 0) / p.length) : 0,
      marks: round(marks),
      maxMarks,
    }
  })
}

function computeChapters(perf: QuestionPerformance[]): ChapterPerformance[] {
  const map = new Map<string, ChapterPerformance>()
  for (const p of perf) {
    if (!p.visited) continue
    const key = `${p.subject}|${p.chapter}`
    const entry = map.get(key) ?? {
      subject: p.subject,
      chapter: p.chapter,
      attempted: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      avgTime: 0,
      weaknessScore: 0,
      lastAttemptedAt: undefined,
    }
    entry.attempted++
    if (p.result === 'correct') entry.correct++
    if (p.result === 'wrong') entry.wrong++
    entry.avgTime = entry.attempted === 1 ? p.timeSpent : round((entry.avgTime * (entry.attempted - 1) + p.timeSpent) / entry.attempted)
    entry.lastAttemptedAt = p.result !== 'not-visited' ? new Date().toISOString() : entry.lastAttemptedAt
    map.set(key, entry)
  }
  const out = Array.from(map.values())
  for (const c of out) {
    c.accuracy = c.attempted ? round((c.correct / c.attempted) * 100) : 0
    // weakness = high wrong rate + slow time
    const wrongRate = c.attempted ? c.wrong / c.attempted : 0
    const timeFactor = Math.min(1, c.avgTime / 120)
    c.weaknessScore = round((wrongRate * 70 + (1 - c.accuracy / 100) * 30) + timeFactor * 10, 0)
  }
  return out.sort((a, b) => b.weaknessScore - a.weaknessScore)
}

function computeTopics(perf: QuestionPerformance[]): TopicPerformance[] {
  const map = new Map<string, TopicPerformance>()
  for (const p of perf) {
    if (!p.visited) continue
    const key = `${p.subject}|${p.chapter}|${p.microTopic}`
    const entry = map.get(key) ?? {
      subject: p.subject,
      chapter: p.chapter,
      microTopic: p.microTopic,
      attempted: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      avgTime: 0,
      weaknessScore: 0,
    }
    entry.attempted++
    if (p.result === 'correct') entry.correct++
    if (p.result === 'wrong') entry.wrong++
    entry.avgTime = entry.attempted === 1 ? p.timeSpent : round((entry.avgTime * (entry.attempted - 1) + p.timeSpent) / entry.attempted)
    map.set(key, entry)
  }
  const out = Array.from(map.values())
  for (const c of out) {
    c.accuracy = c.attempted ? round((c.correct / c.attempted) * 100) : 0
    const wrongRate = c.attempted ? c.wrong / c.attempted : 0
    c.weaknessScore = round(wrongRate * 70 + (1 - c.accuracy / 100) * 30, 0)
  }
  return out.sort((a, b) => b.weaknessScore - a.weaknessScore)
}

function computeDifficulty(perf: QuestionPerformance[]): DifficultyBreakdown[] {
  const all: Difficulty[] = [1, 2, 3, 4, 5]
  return all.map((difficulty) => {
    const p = perf.filter((x) => x.difficulty === difficulty && x.visited)
    const correct = p.filter((x) => x.result === 'correct').length
    return {
      difficulty,
      attempted: p.length,
      correct,
      accuracy: p.length ? round((correct / p.length) * 100) : 0,
    }
  })
}

function computeTypes(perf: QuestionPerformance[]): TypeBreakdown[] {
  const all: QuestionTypeId[] = ['single', 'multiple', 'integer', 'numerical', 'matrix', 'paragraph', 'assertion-reason', 'match-columns']
  return all
    .map((type) => {
      const p = perf.filter((x) => x.type === type && x.visited)
      const correct = p.filter((x) => x.result === 'correct').length
      return {
        type,
        attempted: p.length,
        correct,
        accuracy: p.length ? round((correct / p.length) * 100) : 0,
      }
    })
    .filter((t) => t.attempted > 0)
}

function computeSpeed(perf: QuestionPerformance[]): SpeedMetric {
  const attempted = perf.filter((p) => p.visited && p.timeSpent > 0)
  if (!attempted.length) {
    return { avgSecondsPerQuestion: 0, avgSecondsPerCorrectQuestion: 0, efficiency: 0, percentile: 0 }
  }
  const avg = round(attempted.reduce((s, p) => s + p.timeSpent, 0) / attempted.length)
  const correct = attempted.filter((p) => p.result === 'correct')
  const avgCorrect = correct.length ? round(correct.reduce((s, p) => s + p.timeSpent, 0) / correct.length) : 0
  const est = attempted.reduce((s, p) => s + p.estimatedTime, 0)
  const actual = attempted.reduce((s, p) => s + p.timeSpent, 0)
  const efficiency = est ? round((est / actual) * 100) : 0
  return { avgSecondsPerQuestion: avg, avgSecondsPerCorrectQuestion: avgCorrect, efficiency, percentile: round(Math.min(99, efficiency * 0.9)) }
}

function computeGuesses(perf: QuestionPerformance[]): GuessAnalysis {
  const guessed = perf.filter((p) => p.isGuessed)
  const correct = guessed.filter((p) => p.result === 'correct').length
  return {
    totalGuesses: guessed.length,
    correctGuesses: correct,
    wrongGuesses: guessed.length - correct,
    guessAccuracy: guessed.length ? round((correct / guessed.length) * 100) : 0,
    expectedRandom: 25,
  }
}

function computeHeatmap(daily: AccuracyEntry[]): HeatmapCell[] {
  const byDate = new Map(daily.map((d) => [d.date, d]))
  return lastNDays(56).map((date) => {
    const d = byDate.get(date)
    return {
      date,
      count: d?.attempted ?? 0,
      accuracy: d && d.attempted ? round((d.correct / d.attempted) * 100) : 0,
    }
  })
}

export async function getRecentResults(limit = 10): Promise<TestResult[]> {
  return db.testResults.orderBy('submittedAt').reverse().limit(limit).toArray()
}

export async function getLastResult(): Promise<TestResult | undefined> {
  return db.testResults.orderBy('submittedAt').last()
}

export async function getResultById(id: string): Promise<TestResult | undefined> {
  return db.testResults.get(id)
}

export async function getStreakInfo(): Promise<{ current: number; today: number }> {
  const daily = await db.dailyActivity.toArray()
  const daySet = new Set(daily.map((d) => d.date))
  let streak = 0
  const cursor = new Date()
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  const today = daily.find((d) => d.date === new Date().toISOString().slice(0, 10))
  return { current: streak, today: today?.attempted ?? 0 }
}

export async function countCompletedTests(): Promise<number> {
  return db.testResults.count()
}

export async function getQuestionAccuracy(questionId: string): Promise<number> {
  const rec = await db.answerRecords.get(questionId)
  return rec?.accuracy ?? 0
}
