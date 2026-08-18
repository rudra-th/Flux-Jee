import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, Badge, Button, Icon, ProgressBar, Skeleton, type IconName } from '@/components/ui'
import { getAnalyticsBundle, getRecentResults } from '@/engines/analytics/engine'
import { useDailyChallenge } from '@/api/questionApi'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatDuration, relativeTime, todayKey } from '@/utils/time'
import { db } from '@/db'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

const QUOTES = [
  { text: 'The harder you work for something, the greater you will feel when you achieve it.', author: 'Anonymous' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
]

interface ModeCard {
  icon: IconName
  title: string
  subtitle: string
  path: string
  color: string
  badge?: string
}

const EXAM_SIMULATION: ModeCard[] = [
  { icon: 'full', title: 'Full Test', subtitle: 'Complete JEE Main mock, NTA interface', path: '/test/full', color: '#4f8cff', badge: 'NTA Replica' },
  { icon: 'pyq', title: 'PYQ Papers', subtitle: 'Real past papers, 2019-2024', path: '/practice/pyq', color: '#3b82f6', badge: 'Real Papers' },
]

const CUSTOM_PRACTICE: ModeCard[] = [
  { icon: 'custom', title: 'Custom Test', subtitle: 'Build your perfect test step by step', path: '/test/custom', color: '#38bdf8' },
]

const FOCUSED_PRACTICE: ModeCard[] = [
  { icon: 'daily', title: 'Daily Challenge', subtitle: 'Same 10 questions for everyone today', path: '/practice/daily', color: '#ef4444', badge: 'Daily' },
  { icon: 'weak', title: 'Weak Chapters', subtitle: 'Auto-target your weakest topics', path: '/practice/weak', color: '#f43f5e' },
  { icon: 'revision', title: 'Revision', subtitle: 'Re-attempt questions you have solved', path: '/practice/revision', color: '#14b8a6' },
]

const CHALLENGE_MODES: ModeCard[] = [
  { icon: 'marathon', title: 'Marathon', subtitle: '60 questions, 2 hours, endurance test', path: '/practice/marathon', color: '#dc2626' },
  { icon: 'speed', title: 'Speed Test', subtitle: '20 questions in 10 minutes, no pause', path: '/practice/speed', color: '#eab308' },
]

const REVIEW: ModeCard[] = [
  { icon: 'mistake', title: 'Mistake Notebook', subtitle: 'Review your errors', path: '/mistakes', color: '#ef4444' },
  { icon: 'bookmark', title: 'Bookmarks', subtitle: 'Practice saved questions', path: '/practice/bookmarked', color: '#f59e0b' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const { data: analytics } = useQuery({ queryKey: ['home-analytics'], queryFn: getAnalyticsBundle })
  const { data: recentResults } = useQuery({ queryKey: ['recent-results'], queryFn: () => getRecentResults(4) })
  const { data: dailyQuestions } = useDailyChallenge()
  const { data: draftCount } = useQuery({ queryKey: ['draft-count'], queryFn: () => db.testDrafts.count() })

  const quote = QUOTES[new Date().getDate() % QUOTES.length] ?? QUOTES[0]!
  const stats = analytics?.stats

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, var(--primary) 0, transparent 40%), radial-gradient(circle at 80% 0%, var(--accent) 0, transparent 35%)',
          }}
        />
        <div className="relative flex flex-wrap items-center gap-6 px-6 py-8 sm:px-8">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="primary" icon="target">JEE {settings.examTarget === 'jee-main' ? 'Main' : 'Advanced'} {settings.targetYear}</Badge>
              {draftCount != null && draftCount > 0 && (
                <Badge tone="warning" icon="refresh">
                  <button onClick={() => navigate('/test/custom')} className="underline underline-offset-2">
                    Resume test in progress
                  </button>
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Welcome back, {settings.userName}.
            </h1>
            <p className="mt-1 text-sm text-text2">
              Your daily target: <span className="font-semibold text-primary">{stats?.questionsToday ?? 0}/{settings.dailyGoal}</span> questions. Keep the streak alive.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate('/test/full')}>
                <Icon name="play" size={16} /> Start Full Test
              </Button>
              <Button variant="outline" onClick={() => navigate('/practice/daily')}>
                <Icon name="daily" size={16} /> Daily Challenge
              </Button>
              <Button variant="ghost" onClick={() => navigate('/test/custom')}>
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

      {/* QUOTE */}
      <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-5 py-3">
        <p className="text-sm italic text-text2">&ldquo;{quote.text}&rdquo;</p>
        <p className="mt-1 text-right text-[11px] font-medium text-text3">— {quote.author}</p>
      </div>

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

      {/* DAILY GOAL */}
      {stats && (
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text">Today's Goal</h3>
              <p className="text-xs text-text2">{stats.questionsToday} of {settings.dailyGoal} questions done</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/practice/mixed')}>
              Practice now
            </Button>
          </div>
          <ProgressBar value={stats.questionsToday} max={settings.dailyGoal} size="lg" />
        </Card>
      )}

      {/* RECENT + WEAK + MISTAKES */}
      <div className="grid gap-4 lg:grid-cols-3">
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
                <Button size="sm" variant="outline" onClick={() => navigate('/test/full')}>Take your first test</Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Weak Chapters"
            subtitle="Based on your recent attempts"
            action={<Link to="/analytics" className="text-xs font-medium text-primary hover:underline">Improve</Link>}
          />
          <div className="px-5 pb-4">
            {analytics?.chapters && analytics.chapters.length > 0 ? (
              <div className="space-y-3">
                {analytics.chapters.slice(0, 4).map((c) => (
                  <button
                    key={`${c.subject}-${c.chapter}`}
                    onClick={() => navigate(`/test/chapter?subject=${c.subject}&chapter=${encodeURIComponent(c.chapter)}`)}
                    className="block w-full text-left"
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-display font-semibold text-text">{c.chapter}</span>
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
                <Button size="sm" variant="outline" onClick={() => navigate('/practice/weak')}>Weak Chapter Mode</Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Mistakes" action={<Link to="/mistakes" className="text-xs font-medium text-primary hover:underline">Notebook</Link>} />
          <div className="px-5 pb-4">
            <RecentMistakes />
          </div>
        </Card>
      </div>

      {/* DAILY CHALLENGE PROMPT */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-danger/10">
            <Icon name="daily" size={24} className="text-danger" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-bold text-text">Daily Challenge · {todayKey()}</h3>
            <p className="text-xs text-text2">10 questions, same for everyone. Beat the crowd!</p>
          </div>
          {dailyQuestions && dailyQuestions.length > 0 && (
            <Badge tone="info">{dailyQuestions.length} questions ready</Badge>
          )}
          <Button variant="success" onClick={() => navigate('/practice/daily')}>
            <Icon name="daily" size={16} /> Attempt Challenge
          </Button>
        </div>
      </Card>

      {/* MODE SECTIONS */}
      <ModeSection title="Exam Simulation" subtitle="Full-length tests that replicate the real exam" cards={EXAM_SIMULATION} onNavigate={navigate} />
      <ModeSection title="Custom Practice" subtitle="Build exactly the test you need" cards={CUSTOM_PRACTICE} onNavigate={navigate} />
      <ModeSection title="Focused Practice" subtitle="Target specific areas that need work" cards={FOCUSED_PRACTICE} onNavigate={navigate} />
      <ModeSection title="Challenge Modes" subtitle="Push your limits with timed challenges" cards={CHALLENGE_MODES} onNavigate={navigate} />
      <ModeSection title="Review" subtitle="Revisit mistakes and saved questions" cards={REVIEW} onNavigate={navigate} />
    </div>
  )
}

function ModeSection({ title, subtitle, cards, onNavigate }: { title: string; subtitle: string; cards: ModeCard[]; onNavigate: (path: string) => void }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={() => onNavigate(c.path)}
            className="group flex items-start gap-4 rounded-xl border border-border bg-surface2 p-4 text-left transition-all duration-200 hover:border-primary/40 hover:bg-surface3 hover:shadow-md"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${c.color}15`, color: c.color }}
            >
              <Icon name={c.icon} size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-sm font-bold text-text">{c.title}</p>
                {c.badge && (
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                    {c.badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-text2">{c.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
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

function RecentMistakes() {
  const { data: mistakes } = useQuery({
    queryKey: ['recent-mistakes-home'],
    queryFn: async () => db.mistakes.orderBy('attemptedAt').reverse().limit(4).toArray(),
  })
  if (!mistakes || mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Icon name="check-circle" size={22} className="text-success" />
        <p className="text-sm text-text2">No mistakes recorded. Great work!</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {mistakes.map((m) => (
        <Link
          key={m.id}
          to={`/mistakes?q=${m.questionId}`}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface2 px-3 py-2 transition-colors hover:border-danger/40"
        >
          <Badge tone={m.reason === 'wrong' ? 'danger' : m.reason === 'slow' ? 'warning' : 'info'}>
            {m.reason}
          </Badge>
          <span className="flex-1 truncate text-xs text-text2">{relativeTime(m.attemptedAt)}</span>
          <Icon name="chevron-right" size={14} className="text-text3" />
        </Link>
      ))}
    </div>
  )
}
