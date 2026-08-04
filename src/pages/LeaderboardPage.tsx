import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardHeader, Icon, Skeleton } from '@/components/ui'
import { db } from '@/db'
import { formatDuration, relativeTime } from '@/utils/time'
import { cn } from '@/utils/cn'
import { PageHeader } from '@/components/layout/AppShell'

const MEDAL = ['#f5a524', '#94a3b8', '#cd7f32']

export default function LeaderboardPage() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const rows = await db.testResults.toArray()
      return rows
        .sort((a, b) => b.totalMarks - a.totalMarks)
        .map((r, i) => ({ ...r, rank: i + 1 }))
        .slice(0, 20)
    },
  })

  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Your personal best tests, ranked" />
      <Card>
        <CardHeader title="Top Performances" subtitle="Offline ranking across all submitted tests" />
        <div className="divide-y divide-border px-5 pb-5">
          {isLoading && !results && (
            <div className="space-y-2 py-4">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          )}

          {results && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Icon name="award" size={24} className="text-text3" />
              <p className="text-sm text-text2">No results yet. Submit a test to claim the top spot.</p>
              <Link to="/test/full" className="text-xs font-medium text-primary hover:underline">
                Take your first test →
              </Link>
            </div>
          )}

          {results?.map((r) => (
            <Link
              key={r.id}
              to={`/result/${r.id}`}
              className="flex items-center gap-3 py-3 transition-colors hover:bg-surface2"
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  r.rank <= 3 ? 'text-white' : 'bg-surface3 text-text2',
                )}
                style={r.rank <= 3 ? { backgroundColor: MEDAL[r.rank - 1] } : undefined}
              >
                {r.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">Test · {relativeTime(r.submittedAt)}</p>
                <p className="text-[11px] text-text3">
                  {r.accuracy}% accuracy · {r.attemptRate}% attempted · {formatDuration(r.totalTimeSpent)}
                </p>
              </div>
              <span className={cn('font-mono text-base font-bold', r.totalMarks >= 0 ? 'text-success' : 'text-danger')}>
                {r.totalMarks > 0 ? `+${r.totalMarks}` : r.totalMarks}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
