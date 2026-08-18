import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, Button, Badge, Icon } from '@/components/ui'
import { getMockTestById, MOCK_TEST_TYPE_CONFIG } from '@/constants/mockTestSeries'
import { buildMockTest } from '@/constants/mockTestBuilder'
import { useTestStore } from '@/stores/testStore'
import { useUIStore } from '@/stores/uiStore'
import { db } from '@/db'
import { SUBJECTS } from '@/constants/syllabus'
import { cn } from '@/utils/cn'
import { PageHeader } from '@/components/layout/AppShell'
import { formatDuration } from '@/utils/time'

export default function MockTestDetail() {
  const navigate = useNavigate()
  const { testId } = useParams()
  const startTest = useTestStore((s) => s.startTest)
  const pushToast = useUIStore((s) => s.pushToast)
  const [building, setBuilding] = useState(false)

  const mockTest = testId ? getMockTestById(testId) : undefined

  const { data: previousResults } = useQuery({
    queryKey: ['mock-test-detail-results', testId],
    queryFn: async () => {
      if (!testId) return []
      const all = await db.testResults.toArray()
      return all
        .filter((r) => r.configId.includes(testId.replace('mock-', '')))
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    },
    enabled: !!testId,
  })

  if (!mockTest) {
    return (
      <div>
        <PageHeader title="Test Not Found" subtitle="This mock test doesn't exist." />
        <Button variant="outline" onClick={() => navigate('/mock-tests/main')}>
          <Icon name="arrow-left" size={16} /> Back to Series
        </Button>
      </div>
    )
  }

  const typeConfig = MOCK_TEST_TYPE_CONFIG[mockTest.type]!
  const date = new Date(mockTest.recommendedDate)
  const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleStart = async () => {
    setBuilding(true)
    try {
      const config = await buildMockTest(mockTest.id)
      startTest(config)
      navigate(`/run/${config.id}`)
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to build test. Try importing question banks in Settings.', 'error')
    } finally {
      setBuilding(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/mock-tests/main')}
          className="flex items-center gap-1.5 text-sm text-text2 hover:text-text transition-colors"
        >
          <Icon name="arrow-left" size={16} />
          Back to Series
        </button>
      </div>

      <PageHeader
        title={mockTest.name}
        subtitle={`${mockTest.series === 'main' ? 'JEE Main' : 'JEE Advanced'} Mock Series`}
        action={
          <span
            className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
          >
            {typeConfig.label}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-4 lg:col-span-2">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <Icon name="question" size={18} className="mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold text-text">{mockTest.questionCount}</p>
              <p className="text-[10px] text-text3">Questions</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <Icon name="clock" size={18} className="mx-auto mb-1 text-warning" />
              <p className="text-lg font-bold text-text">{Math.floor(mockTest.durationMinutes / 60)}h</p>
              <p className="text-[10px] text-text3">Duration</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <Icon name="target" size={18} className="mx-auto mb-1 text-success" />
              <p className="text-lg font-bold text-text">{mockTest.questionCount * 4}</p>
              <p className="text-[10px] text-text3">Max Marks</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <Icon name="calendar" size={18} className="mx-auto mb-1 text-info" />
              <p className="text-sm font-bold text-text">{formattedDate}</p>
              <p className="text-[10px] text-text3">Recommended</p>
            </div>
          </div>

          {/* Chapter breakdown */}
          <Card>
            <CardHeader title="Syllabus Coverage" />
            <div className="space-y-4 px-5 pb-5">
              {mockTest.type === 'major' && mockTest.chapters.physics.length === 0 ? (
                <p className="text-sm text-text2">Full syllabus — all chapters included.</p>
              ) : (
                SUBJECTS.map((subject) => {
                  const chapters = mockTest.chapters[subject.id as keyof typeof mockTest.chapters] ?? []
                  if (chapters.length === 0) return null
                  return (
                    <div key={subject.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />
                        <span className="text-xs font-semibold text-text">{subject.name}</span>
                        <Badge tone="info">{chapters.length} chapters</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {chapters.map((ch) => (
                          <span
                            key={ch}
                            className="rounded-md border border-border bg-surface2 px-2 py-1 text-[11px] text-text2"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Exam format */}
          <Card>
            <CardHeader title="Exam Format" />
            <div className="px-5 pb-5">
              {mockTest.format === 'main' ? (
                <div className="space-y-2 text-sm text-text2">
                  <p>3 sections: Physics, Chemistry, Mathematics</p>
                  <p>20 MCQ (single correct) + 5 Integer per section</p>
                  <p>MCQ: +4 correct, -1 wrong | Integer: +4 correct, no negative</p>
                  <p>Total: {mockTest.questionCount} questions, {mockTest.questionCount * 4} marks</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-text2">
                  <p>2 papers, each with 3 sections</p>
                  <p>MCQ, Multiple Correct, Integer, Numerical, Matrix Match</p>
                  <p>MCQ: +4 correct, -1 wrong | Multiple Correct: partial credit</p>
                  <p>Integer/Numerical: +4 correct, no negative</p>
                  <p>Total: {mockTest.questionCount} questions per paper</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Start button */}
          <Card className="p-5">
            <Button
              onClick={() => void handleStart()}
              loading={building}
              size="lg"
              className="w-full"
            >
              <Icon name="play" size={18} />
              {building ? 'Building test...' : 'Start Test'}
            </Button>
            <p className="mt-2 text-center text-[11px] text-text3">
              Questions will be selected from the bank based on this test's criteria
            </p>
          </Card>

          {/* Previous attempts */}
          <Card>
            <CardHeader
              title="Previous Attempts"
              subtitle={previousResults ? `${previousResults.length} attempt${previousResults.length !== 1 ? 's' : ''}` : undefined}
            />
            <div className="px-5 pb-5">
              {previousResults && previousResults.length > 0 ? (
                <div className="space-y-2">
                  {previousResults.slice(0, 5).map((r) => {
                    const pct = r.maxMarks ? Math.round((r.totalMarks / r.maxMarks) * 100) : 0
                    return (
                      <button
                        key={r.id}
                        onClick={() => navigate(`/result/${r.id}`)}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface2 px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                      >
                        <div>
                          <p className="text-xs font-medium text-text">
                            {r.totalMarks}/{r.maxMarks}
                          </p>
                          <p className="text-[10px] text-text3">
                            {new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            'text-sm font-bold',
                            pct >= 75 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger',
                          )}>
                            {pct}%
                          </p>
                          <p className="text-[10px] text-text3">{formatDuration(r.totalTimeSpent)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Icon name="test" size={20} className="mx-auto mb-2 text-text3" />
                  <p className="text-xs text-text2">No attempts yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recommended date */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/15">
                <Icon name="calendar" size={20} className="text-info" />
              </div>
              <div>
                <p className="text-xs font-medium text-text">Recommended Date</p>
                <p className="text-sm font-bold text-text">{formattedDate}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
