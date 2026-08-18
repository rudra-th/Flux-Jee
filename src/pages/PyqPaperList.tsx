import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Icon, Badge } from '@/components/ui'
import { PYQ_MAIN_PAPERS, PYQ_ADVANCED_PAPERS, type PyqYearGroup, type PyqPaper } from '@/constants/pyqPapers'
import { PageHeader } from '@/components/layout/AppShell'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export default function PyqPaperList() {
  const navigate = useNavigate()
  const { exam: examParam } = useParams()
  const exam = examParam === 'advanced' ? 'advanced' : 'main'
  const groups = exam === 'main' ? PYQ_MAIN_PAPERS : PYQ_ADVANCED_PAPERS

  return (
    <div>
      <PageHeader
        title="PYQ Papers"
        subtitle={`Solve real ${exam === 'main' ? 'JEE Main' : 'JEE Advanced'} papers from past years`}
      />

      <div className="mb-4 flex gap-2">
        {(['main', 'advanced'] as const).map((e) => (
          <button
            key={e}
            onClick={() => navigate(`/pyq/${e}`)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              exam === e ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border text-text2 hover:border-border2',
            )}
          >
            JEE {e === 'main' ? 'Main' : 'Advanced'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {groups.map((group, gi) => (
          <YearGroup
            key={group.year}
            group={group}
            index={gi}
            onSelect={(paper) => navigate(`/test/pyq?paperId=${paper.id}`)}
          />
        ))}
      </div>
    </div>
  )
}

function YearGroup({
  group,
  index,
  onSelect,
}: {
  group: PyqYearGroup
  index: number
  onSelect: (paper: PyqPaper) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg font-bold text-text">{group.year}</span>
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium text-text3">{group.papers.length} papers</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {group.papers.map((paper) => (
          <Card
            key={paper.id}
            className="cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
            onClick={() => onSelect(paper)}
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text">{paper.label}</p>
                  <Badge tone="primary" icon="pyq">
                    {paper.questionCount}Q
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-text2">
                  {paper.durationMinutes / 60} hours · {paper.questionCount} questions
                </p>
              </div>
              <Button size="sm" variant="outline">
                <Icon name="play" size={14} /> Start
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
