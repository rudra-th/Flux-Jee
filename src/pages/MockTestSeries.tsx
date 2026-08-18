import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Badge, Icon, Tabs, EmptyState } from '@/components/ui'
import { MOCK_TEST_SERIES, MOCK_TEST_TYPE_CONFIG } from '@/constants/mockTestSeries'
import type { MockTestEntry, MockTestType } from '@/types/mockTest'
import { db } from '@/db'
import { cn } from '@/utils/cn'
import { PageHeader } from '@/components/layout/AppShell'

export default function MockTestSeries() {
  const navigate = useNavigate()
  const { series: seriesParam } = useParams()
  const [activeSeries, setActiveSeries] = useState<'main' | 'advanced'>(
    seriesParam === 'advanced' ? 'advanced' : 'main'
  )
  const [filter, setFilter] = useState<MockTestType | 'all'>('all')

  const seriesConfig = MOCK_TEST_SERIES.find((s) => s.series === activeSeries)!
  const allTests = seriesConfig.tests

  const { data: results } = useQuery({
    queryKey: ['mock-test-results', activeSeries],
    queryFn: async () => {
      const all = await db.testResults.toArray()
      return all.filter((r) => r.configId.startsWith('mock-'))
    },
  })

  const filteredTests = useMemo(() => {
    if (filter === 'all') return allTests
    return allTests.filter((t) => t.type === filter)
  }, [allTests, filter])

  const completedCount = useMemo(() => {
    if (!results) return 0
    return new Set(results.map((r) => r.configId)).size
  }, [results])

  const getBestScore = (testId: string) => {
    if (!results) return null
    const testResults = results.filter((r) => r.configId.includes(testId.replace('mock-', '')))
    if (testResults.length === 0) return null
    const first = testResults[0]!
    return testResults.reduce((best, r) => r.totalMarks > best.totalMarks ? r : best, first)
  }

  return (
    <div>
      <PageHeader
        title="Mock Test Series"
        subtitle={`${seriesConfig.name} — ${allTests.length} tests`}
      />

      {/* Series tabs */}
      <div className="mb-5">
        <Tabs
          tabs={MOCK_TEST_SERIES.map((s) => ({
            id: s.series,
            label: s.series === 'main' ? 'JEE Main Series' : 'JEE Advanced Series',
          }))}
          value={activeSeries}
          onChange={(v) => {
            setActiveSeries(v as 'main' | 'advanced')
            setFilter('all')
            navigate(v === 'advanced' ? '/mock-tests/advanced' : '/mock-tests/main', { replace: true })
          }}
        />
      </div>

      {/* Progress + filters */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text3">Progress</p>
            <p className="text-lg font-bold text-text">
              {completedCount}<span className="text-sm text-text3">/{allTests.length}</span>
            </p>
          </div>
          <div className="hidden h-10 w-px bg-border sm:block" />
          <div className="hidden gap-1.5 sm:flex">
            {(['all', 'minor', 'semi-major', 'major'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === f
                    ? 'bg-primary/15 text-primary'
                    : 'text-text2 hover:bg-surface2',
                )}
              >
                {f === 'all' ? 'All Tests' : MOCK_TEST_TYPE_CONFIG[f]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile filter */}
      <div className="mb-4 flex gap-1.5 sm:hidden">
        {(['all', 'minor', 'semi-major', 'major'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f
                ? 'bg-primary/15 text-primary'
                : 'text-text2 hover:bg-surface2',
            )}
          >
            {f === 'all' ? 'All' : MOCK_TEST_TYPE_CONFIG[f]?.label}
          </button>
        ))}
      </div>

      {/* Test cards */}
      {filteredTests.length === 0 ? (
        <EmptyState
          icon="test"
          title="No tests found"
          description="No tests match the selected filter."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTests.map((test, i) => (
            <MockTestCard
              key={test.id}
              test={test}
              index={i}
              bestScore={getBestScore(test.id) ?? null}
              onClick={() => navigate(`/mock-tests/${activeSeries}/${test.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MockTestCard({
  test,
  index,
  bestScore,
  onClick,
}: {
  test: MockTestEntry
  index: number
  bestScore: { totalMarks: number; maxMarks: number; accuracy: number } | null
  onClick: () => void
}) {
  const typeConfig = MOCK_TEST_TYPE_CONFIG[test.type]!
  const totalChapters = test.chapters.physics.length + test.chapters.chemistry.length + test.chapters.mathematics.length
  const isFullSyllabus = test.type === 'major' && totalChapters === 0
  const date = new Date(test.recommendedDate)
  const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <button
        onClick={onClick}
        className="group w-full text-left rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-6 items-center rounded-md px-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
            >
              {typeConfig.label}
            </span>
            {isFullSyllabus && (
              <Badge tone="warning" icon="target">Full Syllabus</Badge>
            )}
          </div>
          {bestScore && (
            <div className="text-right">
              <p className="text-sm font-bold text-success">{bestScore.totalMarks}/{bestScore.maxMarks}</p>
              <p className="text-[10px] text-text3">{bestScore.accuracy}% acc</p>
            </div>
          )}
        </div>

        <h3 className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
          {test.name}
        </h3>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-text3">
          <span className="flex items-center gap-1">
            <Icon name="question" size={12} />
            {test.questionCount}Q
          </span>
          <span className="flex items-center gap-1">
            <Icon name="clock" size={12} />
            {test.durationMinutes >= 60 ? `${Math.floor(test.durationMinutes / 60)}h ${test.durationMinutes % 60 ? `${test.durationMinutes % 60}m` : ''}` : `${test.durationMinutes}m`}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="calendar" size={12} />
            {formattedDate}
          </span>
        </div>

        {!isFullSyllabus && totalChapters > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {test.chapters.physics.slice(0, 2).map((ch) => (
              <span key={ch} className="rounded bg-[#4f8cff]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#4f8cff]">
                {ch.length > 20 ? ch.slice(0, 20) + '...' : ch}
              </span>
            ))}
            {test.chapters.chemistry.slice(0, 2).map((ch) => (
              <span key={ch} className="rounded bg-[#2fd87f]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#2fd87f]">
                {ch.length > 20 ? ch.slice(0, 20) + '...' : ch}
              </span>
            ))}
            {test.chapters.mathematics.slice(0, 2).map((ch) => (
              <span key={ch} className="rounded bg-[#f5a524]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#f5a524]">
                {ch.length > 20 ? ch.slice(0, 20) + '...' : ch}
              </span>
            ))}
            {totalChapters > 6 && (
              <span className="rounded bg-surface2 px-1.5 py-0.5 text-[9px] font-medium text-text3">
                +{totalChapters - 6} more
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {bestScore ? 'View Details' : 'Start Test'}
          <Icon name="arrow-right" size={14} />
        </div>
      </button>
    </motion.div>
  )
}
