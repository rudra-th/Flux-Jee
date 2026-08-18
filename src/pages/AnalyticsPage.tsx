import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Line,
  Bar,
  Doughnut,
  Radar,
} from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { Card, CardHeader, Button, Icon, EmptyState, ProgressBar, type IconName } from '@/components/ui'
import { getAnalyticsBundle, getRecentResults } from '@/engines/analytics/engine'
import { SUBJECTS } from '@/constants/syllabus'
import { formatDuration } from '@/utils/time'
import { cn, formatNumber } from '@/utils/cn'
import { useSettingsStore } from '@/stores/settingsStore'
import { PageHeader } from '@/components/layout/AppShell'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
)

const DIFF_COLORS = ['#10b981', '#14b8a6', '#6366f1', '#f59e0b', '#ef4444']
const TYPE_LABELS: Record<string, string> = {
  single: 'MCQ',
  multiple: 'Multi',
  integer: 'Integer',
  numerical: 'Numerical',
  matrix: 'Matrix',
  paragraph: 'Paragraph',
  'assertion-reason': 'A-R',
  'match-columns': 'Match',
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const theme = useSettingsStore((s) => s.settings.theme)
  const chartColors = useMemo(() => {
    const isDark = theme === 'dark' || theme === 'oled'
    return {
      grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      text: isDark ? '#94a3b8' : '#64748b',
      primary: '#6366f1',
      emerald: '#10b981',
      danger: '#ef4444',
      amber: '#f59e0b',
      sky: '#0ea5e9',
    }
  }, [theme])

  const { data: bundle, isLoading } = useQuery({
    queryKey: ['analytics', theme],
    queryFn: getAnalyticsBundle,
  })

  const { data: recent = [] } = useQuery({
    queryKey: ['recent-results'],
    queryFn: () => getRecentResults(8),
  })

  if (isLoading) return <LoadingState />

  if (!bundle || bundle.stats.totalTests === 0) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Your performance insights" />
        <EmptyState
          icon="analytics"
          title="No data yet"
          description="Complete your first test to unlock detailed analytics, streaks, and accuracy trends."
          action={<Button onClick={() => navigate('/test')}><Icon name="play" size={16} /> Start a Test</Button>}
        />
      </div>
    )
  }

  const s = bundle.stats
  const dailyAttempted = bundle.daily.map((d) => d.attempted)
  const dailyCorrect = bundle.daily.map((d) => d.correct)
  const dailyLabels = bundle.daily.map((d) => d.date.slice(5))

  const lineData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Attempted',
        data: dailyAttempted,
        borderColor: chartColors.sky,
        backgroundColor: 'rgba(14,165,233,0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
      },
      {
        label: 'Correct',
        data: dailyCorrect,
        borderColor: chartColors.emerald,
        backgroundColor: 'rgba(16,185,129,0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
      },
    ],
  }

  const accuracyByDay = bundle.daily.map((d) => d.attempted ? Math.round((d.correct / d.attempted) * 100) : 0)
  const barData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Accuracy %',
        data: accuracyByDay,
        backgroundColor: accuracyByDay.map((a) => a >= 70 ? chartColors.emerald : a >= 40 ? chartColors.primary : chartColors.danger),
        borderRadius: 4,
      },
    ],
  }

  const doughnutData = {
    labels: ['Correct', 'Wrong', 'Unattempted'],
    datasets: [
      {
        data: [s.totalCorrect, s.totalWrong, s.totalUnattempted],
        backgroundColor: [chartColors.emerald, chartColors.danger, 'rgba(148,163,184,0.5)'],
        borderWidth: 0,
      },
    ],
  }

  const radarData = {
    labels: SUBJECTS.map((sub) => sub.name),
    datasets: [
      {
        label: 'Accuracy %',
        data: bundle.subjects.map((p) => p.accuracy),
        backgroundColor: 'rgba(99,102,241,0.25)',
        borderColor: chartColors.primary,
        pointBackgroundColor: chartColors.primary,
      },
    ],
  }

  const typeData = {
    labels: bundle.types.map((t) => TYPE_LABELS[t.type] ?? t.type),
    datasets: [
      {
        label: 'Attempted',
        data: bundle.types.map((t) => t.attempted),
        backgroundColor: bundle.types.map((_, i) => DIFF_COLORS[i % DIFF_COLORS.length]),
        borderRadius: 4,
      },
    ],
  }

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: chartColors.text, boxWidth: 10 } } },
    scales: {
      x: { grid: { color: chartColors.grid }, ticks: { color: chartColors.text, maxTicksLimit: 8, font: { size: 10 } } },
      y: { grid: { color: chartColors.grid }, ticks: { color: chartColors.text, font: { size: 10 } } },
    },
  }

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: chartColors.grid }, ticks: { color: chartColors.text, maxTicksLimit: 8, font: { size: 10 } } },
      y: { grid: { color: chartColors.grid }, max: 100, ticks: { color: chartColors.text, font: { size: 10 } } },
    },
  }

  const donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { color: chartColors.text, boxWidth: 10, font: { size: 11 } } },
    },
  }

  const radarOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: { color: chartColors.grid },
        angleLines: { color: chartColors.grid },
        ticks: { color: chartColors.text, stepSize: 25, backdropColor: 'transparent', font: { size: 9 } },
        pointLabels: { color: chartColors.text, font: { size: 11 } },
      },
    },
  }

  const typeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartColors.text, font: { size: 10 } } },
      y: { grid: { color: chartColors.grid }, ticks: { color: chartColors.text, font: { size: 10 } } },
    },
  }

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Deep insights into your JEE preparation" />

      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon="flame" label="Current Streak" value={`${s.currentStreak}d`} sub={`Best ${s.longestStreak}d`} />
        <StatCard icon="target" label="Accuracy" value={`${s.overallAccuracy}%`} sub={`${s.totalCorrect}/${s.totalQuestionsAttempted} correct`} />
        <StatCard icon="trending-up" label="Attempt Rate" value={`${s.overallAttemptRate}%`} sub={`${s.totalQuestionsAttempted} attempted`} />
        <StatCard icon="trophy" label="Total Marks" value={formatNumber(s.totalMarks)} sub={`of ${formatNumber(s.maxMarks)}`} />
        <StatCard icon="clock" label="Time Invested" value={formatDuration(s.totalTimeSpent)} />
        <StatCard icon="check" label="Today" value={String(s.questionsToday)} sub={`Goal ${s.dailyGoal}/day`} />
      </div>

      {/* Charts row 1 */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Daily Activity" subtitle="Attempts vs correct answers" />
          <div className="h-64 px-4 pb-4"><Line data={lineData} options={lineOptions} /></div>
        </Card>
        <Card>
          <CardHeader title="Daily Accuracy" />
          <div className="h-64 px-4 pb-4"><Bar data={barData} options={barOptions} /></div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Result Mix" />
          <div className="h-56 px-4 pb-4"><Doughnut data={doughnutData} options={donutOptions} /></div>
        </Card>
        <Card>
          <CardHeader title="Subject Accuracy" subtitle="Radar across Physics / Chemistry / Maths" />
          <div className="h-56 px-4 pb-4"><Radar data={radarData} options={radarOptions} /></div>
        </Card>
        <Card>
          <CardHeader title="Question Types" subtitle="Attempts by type" />
          <div className="h-56 px-4 pb-4"><Bar data={typeData} options={typeOptions} /></div>
        </Card>
      </div>

      {/* Weakness */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Weakest Chapters" subtitle="Sorted by weakness score" action={<Link to="/mistakes" className="text-xs text-primary hover:underline">Mistake notebook →</Link>} />
          <div className="space-y-2.5 px-5 pb-5">
            {bundle.chapters.slice(0, 6).map((c) => (
              <div key={`${c.subject}-${c.chapter}`} className="flex items-center gap-3 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subjectColor(c.subject) }} />
                <span className="w-36 truncate text-text2">{c.chapter}</span>
                <ProgressBar value={c.weaknessScore} color={c.weaknessScore >= 60 ? 'danger' : c.weaknessScore >= 35 ? 'amber' : 'emerald'} className="flex-1" />
                <span className="w-14 text-right font-mono text-text">{c.accuracy}%</span>
              </div>
            ))}
            {bundle.chapters.length === 0 && <p className="py-4 text-center text-text3">No chapter data yet.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent Tests" action={<Link to="/analytics" className="text-xs text-primary hover:underline">View all →</Link>} />
          <div className="space-y-1 px-5 pb-5">
            {recent.map((r) => {
              const pct = r.maxMarks ? Math.round((r.totalMarks / r.maxMarks) * 100) : 0
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/result/${r.id}`)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-surface2"
                >
                  <div>
                    <p className="font-medium text-text">{r.performance.length}Q · {r.sections.length} sections</p>
                    <p className="text-[10px] text-text3">{r.submittedAt.slice(0, 16).replace('T', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('font-mono font-semibold', pct >= 75 ? 'text-emerald' : pct >= 50 ? 'text-primary' : 'text-danger')}>
                      {r.totalMarks.toFixed(1)} / {r.maxMarks.toFixed(0)}
                    </span>
                    <span className="rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-text3">{r.accuracy}%</span>
                  </div>
                </button>
              )
            })}
            {recent.length === 0 && <p className="py-4 text-center text-text3">No tests yet.</p>}
          </div>
        </Card>
      </div>

      {/* Speed + guesses + difficulty */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Speed Profile" subtitle="Time efficiency" />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 text-center">
            <MetricBox label="Avg / question" value={`${bundle.speed.avgSecondsPerQuestion}s`} />
            <MetricBox label="Avg / correct" value={`${bundle.speed.avgSecondsPerCorrectQuestion}s`} />
            <MetricBox label="Efficiency" value={`${bundle.speed.efficiency}%`} sub={`p${bundle.speed.percentile}`} />
            <MetricBox label="Time invested" value={formatDuration(s.totalTimeSpent)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Difficulty Breakdown" subtitle="Accuracy by difficulty" />
          <div className="space-y-2.5 px-5 pb-5">
            {bundle.difficulty.filter((d) => d.attempted > 0).map((d) => (
              <div key={d.difficulty} className="flex items-center gap-3 text-xs">
                <span className="w-16 text-text2">Level {d.difficulty}</span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-surface3">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.accuracy}%`,
                        backgroundColor: d.accuracy >= 70 ? '#10b981' : d.accuracy >= 40 ? '#6366f1' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
                <span className="w-20 text-right font-mono text-text">{d.accuracy}%</span>
                <span className="w-12 text-right text-text3">{d.attempted}Q</span>
              </div>
            ))}
            {bundle.difficulty.filter((d) => d.attempted > 0).length === 0 && (
              <p className="py-4 text-center text-text3">No data yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Guess Analysis" subtitle="Smart guessing vs random" />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 text-center">
            <MetricBox label="Total guesses" value={String(bundle.guesses.totalGuesses)} />
            <MetricBox label="Correct" value={String(bundle.guesses.correctGuesses)} />
            <MetricBox label="Wrong" value={String(bundle.guesses.wrongGuesses)} />
            <MetricBox label="Accuracy" value={`${bundle.guesses.guessAccuracy}%`} sub={`Random ~${bundle.guesses.expectedRandom}%`} />
          </div>
        </Card>
      </div>

      {/* Improvement trend */}
      {recent.length >= 3 && (
        <Card className="mb-4">
          <CardHeader title="Improvement Trend" subtitle="Marks scored in recent tests" />
          <div className="h-48 px-4 pb-4">
            <Line
              data={{
                labels: recent.slice(0, 8).reverse().map((r, i) => `Test ${i + 1}`),
                datasets: [{
                  label: 'Marks %',
                  data: recent.slice(0, 8).reverse().map((r) => r.maxMarks ? Math.round((r.totalMarks / r.maxMarks) * 100) : 0),
                  borderColor: chartColors.primary,
                  backgroundColor: 'rgba(99,102,241,0.12)',
                  tension: 0.35,
                  fill: true,
                  pointRadius: 4,
                  pointBackgroundColor: chartColors.primary,
                }],
              }}
              options={{
                ...lineOptions,
                plugins: { legend: { display: false } },
                scales: {
                  ...lineOptions.scales,
                  y: { ...lineOptions.scales?.y, min: 0, max: 100, ticks: { ...lineOptions.scales?.y?.ticks, callback: (v) => `${v}%` } },
                },
              }}
            />
          </div>
        </Card>
      )}

      {/* Subject-wise detail */}
      <Card className="mb-4">
        <CardHeader title="Subject Performance" subtitle="Detailed per-subject breakdown" />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
          {bundle.subjects.map((sub) => (
            <div key={sub.subject} className="rounded-xl border border-border bg-surface2 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subjectColor(sub.subject) }} />
                <span className="text-sm font-semibold text-text capitalize">{sub.subject}</span>
              </div>
              <div className="space-y-1.5 text-xs text-text2">
                <div className="flex justify-between"><span>Attempted</span><span className="font-mono text-text">{sub.attempted}</span></div>
                <div className="flex justify-between"><span>Correct</span><span className="font-mono text-success">{sub.correct}</span></div>
                <div className="flex justify-between"><span>Wrong</span><span className="font-mono text-danger">{sub.wrong}</span></div>
                <div className="flex justify-between"><span>Accuracy</span><span className="font-mono font-semibold text-text">{sub.accuracy}%</span></div>
                <div className="flex justify-between"><span>Avg time</span><span className="font-mono text-text">{sub.avgTime}s</span></div>
                <div className="flex justify-between"><span>Marks</span><span className="font-mono text-text">{sub.marks}/{sub.maxMarks}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: IconName; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-text3">
        <Icon name={icon} size={13} />
        {label}
      </div>
      <p className="text-xl font-bold tabular-nums text-text">{value}</p>
      {sub && <p className="truncate text-[10px] text-text3">{sub}</p>}
    </div>
  )
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-surface2 p-3">
      <p className="text-lg font-bold tabular-nums text-text">{value}</p>
      <p className="text-[11px] text-text3">{label}</p>
      {sub && <p className="text-[10px] text-text3">{sub}</p>}
    </div>
  )
}

function subjectColor(subject?: string): string {
  return SUBJECTS.find((s) => s.id === subject)?.color ?? '#888'
}

function LoadingState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-text3">Crunching your numbers…</p>
    </div>
  )
}
