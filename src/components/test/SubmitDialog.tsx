import { useMemo } from 'react'
import { Modal, Button } from '@/components/ui'
import { useTestStore } from '@/stores/testStore'

export interface SubmitSummary {
  answered: number
  notAnswered: number
  markedOnly: number
  markedAnswered: number
  notVisited: number
  total: number
}

export function SubmitDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const config = useTestStore((s) => s.config)
  const answers = useTestStore((s) => s.answers)

  const summary = useMemo<SubmitSummary>(() => {
    const s: SubmitSummary = {
      answered: 0,
      notAnswered: 0,
      markedOnly: 0,
      markedAnswered: 0,
      notVisited: 0,
      total: 0,
    }
    if (!config) return s
    for (const section of config.sections) {
      for (const qid of section.questionIds) {
        s.total++
        const ans = answers[qid]
        const has = ans ? ans.selected.length > 0 || (ans.matrix && Object.keys(ans.matrix).length > 0) : false
        if (!ans?.visited) s.notVisited++
        else if (has && ans.markedForReview) s.markedAnswered++
        else if (!has && ans.markedForReview) s.markedOnly++
        else if (has) s.answered++
        else s.notAnswered++
      }
    }
    return s
  }, [config, answers])

  const rows = [
    { label: 'Answered', value: summary.answered, color: 'var(--palette-answered)' },
    { label: 'Not Answered', value: summary.notAnswered, color: 'var(--surface-3)' },
    { label: 'Marked for Review', value: summary.markedOnly, color: 'var(--palette-marked)' },
    { label: 'Marked + Answered', value: summary.markedAnswered, color: 'var(--palette-answeredmarked)' },
    { label: 'Not Visited', value: summary.notVisited, color: 'var(--palette-notvisited)' },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit Test"
      subtitle="Are you sure you want to submit the test?"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Continue Test</Button>
          <Button variant="danger" onClick={onConfirm}>Submit Test</Button>
        </>
      }
    >
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 rounded-lg border border-border bg-surface2 px-3 py-2">
            <span className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: r.color }} />
            <span className="flex-1 text-sm text-text2">{r.label}</span>
            <span className="font-mono text-sm font-bold text-text">{r.value}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="flex-1 text-sm font-semibold text-text">Total Questions</span>
          <span className="font-mono text-sm font-bold text-primary">{summary.total}</span>
        </div>
        <p className="pt-1 text-xs text-text3">
          {summary.notAnswered + summary.markedOnly + summary.notVisited > 0
            ? `You still have ${summary.notAnswered + summary.markedOnly + summary.notVisited} unattempted questions.`
            : 'All questions have been addressed.'}
        </p>
      </div>
    </Modal>
  )
}
