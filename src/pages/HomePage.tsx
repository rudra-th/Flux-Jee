import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, Badge, Button, Icon, ProgressBar, Skeleton, type IconName } from '@/components/ui'
import { getAnalyticsBundle, getRecentResults } from '@/engines/analytics/engine'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatDuration, relativeTime } from '@/utils/time'
import { MOCK_TEST_SERIES } from '@/constants/mockTestSeries'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

export default function HomePage() {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const { data: analytics } = useQuery({ queryKey: ['home-analytics'], queryFn: getAnalyticsBundle })
  const { data: recentResults } = useQuery({ queryKey: ['recent-results'], queryFn: () => getRecentResults(4) })

  const stats = analytics?.stats
  const seriesKey = settings.examTarget === 'jee-main' ? 'main' : 'advanced' as const
  const activeSeries = MOCK_TEST_SERIES.find((s) => s.series === seriesKey) ?? MOCK_TEST_SERIES[0]!

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div className="relative flex flex-wrap items-center gap-6 px-6 py-8 sm:px-8">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="primary" icon="target">JEE {settings.examTarget === 'jee-main' ? 'Main' : 'Advanced'} {settings.targetYear}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Welcome back, {settings.userName || 'Aspirant'}.
            </h1>
            <p className="mt-1 text-sm text-text2">
              Your daily target: <span className="font-semibold text-primary">{stats?.questionsToday ?? 0}/{settings.dailyGoal}</span> questions. Keep the streak alive.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate('/mock-tests/main')}>
                <Icon name="test" size={16} /> View Test Series
              </Button>
              <Button variant="outline" onClick={() => navigate('/test/custom')}>
                <Icon name="custom" size={16} /> Custom Test
              </Button>
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            <div className="rounded-xl border border-border bg-surface2/80 px-5 py-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text3">Streak</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <Icon name="flame" size={22} className="text-accent" />
                <span className="text-3xl font-bold text-text">{stats?.currentStreak ?? 0}</span>
              </div>
              <p className="mt-1 text-[11px] text-text3">days in a row</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* STATS */}
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard icon="test" label="Tests" value={stats.totalTests} />
          <StatCard icon="check-circle" label="Accuracy" value={`${stats.overallAccuracy}%`} tone="success" />
          <StatCard icon="target" label="Attempt Rate" value={`${stats.overallAttemptRate}%`} tone="info" />
          <StatCard icon="question" label="Attempted" value={stats.totalQuestionsAttempted} />
          <StatCard icon="clock" label="Time Spent" value={formatDuration(stats.totalTimeSpent)} />
          <StatCard icon="award" label="Marks Scored" value={stats.totalMarks.toLocaleString()} tone="warning" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {/* MOCK TEST SERIES PROMPT */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text">{activeSeries.name}</h3>
            <p className="text-xs text-text2">{activeSeries.tests.length} tests · {activeSeries.description}</p>
          </div>
          <Button onClick={() => navigate(`/mock-tests/${activeSeries.series}`)}>
            <Icon name="test" size={16} /> Open Series
          </Button>
        </div>
      </Card>

      {/* RECENT TESTS + WEAK CHAPTERS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent tests */}
        <Card>
          <CardHeader
            title="Recent Tests"
            action={<Link to="/analytics" className="text-xs font-medium text-primary hover:underline">View all</Link>}
          />
          <div className="px-5 pb-4">
            {recentResults && recentResults.length > 0 ? (
              <div className="space-y-2.5">
                {recentResults.map((r) => (
                  <Link
                    key={r.id}
                    to={`/result/${r.id}`}
                    className="block rounded-lg border border-border bg-surface2 p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-text">Test · {relativeTime(r.submittedAt)}</span>
                      <span className={cn('font-mono text-sm font-bold', r.totalMarks >= 0 ? 'text-success' : 'text-danger')}>
                        {r.totalMarks > 0 ? `+${r.totalMarks}` : r.totalMarks}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-text3">
                      <span>{r.accuracy}% accuracy</span>
                      <span>{r.attemptRate}% attempted</span>
                      <span>{formatDuration(r.totalTimeSpent)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Icon name="test" size={22} className="text-text3" />
                <p className="text-sm text-text2">No tests taken yet</p>
                <Button size="sm" variant="outline" onClick={() => navigate('/mock-tests/main')}>Take your first mock test</Button>
              </div>
            )}
          </div>
        </Card>

        {/* Weak chapters */}
        <Card>
          <CardHeader
            title="Weak Chapters"
            subtitle="Based on your recent attempts"
            action={<Link to="/analytics" className="text-xs font-medium text-primary hover:underline">Improve</Link>}
          />
          <div className="px-5 pb-4">
            {analytics?.chapters && analytics.chapters.length > 0 ? (
              <div className="space-y-3">
                {analytics.chapters.slice(0, 5).map((c) => (
                  <button
                    key={`${c.subject}-${c.chapter}`}
                    onClick={() => navigate(`/test/chapter?subject=${c.subject}&chapter=${encodeURIComponent(c.chapter)}`)}
                    className="block w-full text-left"
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-text">{c.chapter}</span>
                      <span className={cn('font-mono font-bold', c.accuracy < 50 ? 'text-danger' : 'text-warning')}>
                        {c.accuracy}%
                      </span>
                    </div>
                    <ProgressBar value={c.accuracy} max={100} color={c.accuracy < 50 ? 'var(--danger)' : 'var(--warning)'} size="sm" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Icon name="weak" size={22} className="text-text3" />
                <p className="text-sm text-text2">Take tests to reveal weak chapters</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* QUICK ACCESS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => navigate('/mock-tests/main')}
          className="group rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon name="test" size={20} />
          </div>
          <p className="text-sm font-semibold text-text">JEE Main Series</p>
          <p className="mt-0.5 text-xs text-text2">20 mock tests</p>
        </button>
        <button
          onClick={() => navigate('/mock-tests/advanced')}
          className="group rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <Icon name="award" size={20} />
          </div>
          <p className="text-sm font-semibold text-text">JEE Advanced Series</p>
          <p className="mt-0.5 text-xs text-text2">15 extreme-level tests</p>
        </button>
        <button
          onClick={() => navigate('/practice/pyq')}
          className="group rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-info/15 text-info">
            <Icon name="pyq" size={20} />
          </div>
          <p className="text-sm font-semibold text-text">PYQ Papers</p>
          <p className="mt-0.5 text-xs text-text2">Real past papers</p>
        </button>
        <button
          onClick={() => navigate('/flashcards')}
          className="group rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Icon name="flashcard" size={20} />
          </div>
          <p className="text-sm font-semibold text-text">Flashcards</p>
          <p className="mt-0.5 text-xs text-text2">Formula recall</p>
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, tone }: { icon: IconName; label: string; value: string | number; tone?: 'success' | 'info' | 'warning' }) {
  const color = tone === 'success' ? 'var(--success)' : tone === 'info' ? 'var(--info)' : tone === 'warning' ? 'var(--warning)' : 'var(--primary)'
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-text3">
        <Icon name={icon} size={15} style={{ color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-text">{value}</p>
    </Card>
  )
}
