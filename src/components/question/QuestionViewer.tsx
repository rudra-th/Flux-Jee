import { useMemo } from 'react'
import type { Question } from '@/types/question'
import { RichText, Latex, Badge, Icon } from '@/components/ui'
import { cn } from '@/utils/cn'

export interface AnswerState {
  selected: number[]
  matrix?: Record<number, number>
}

export interface QuestionViewerProps {
  question: Question
  answer?: AnswerState
  showAnswer?: boolean
  onSelectOption?: (index: number) => void
  onToggleMultiple?: (index: number) => void
  onIntegerInput?: (value: number | null) => void
  onMatrixInput?: (row: number, col: number) => void
  disabled?: boolean
  /** Alias for disabled */
  locked?: boolean
  /** Alias for showAnswer */
  showCorrect?: boolean
  showMeta?: boolean
}

export function QuestionViewer({
  question,
  answer,
  showAnswer,
  onSelectOption,
  onToggleMultiple,
  onIntegerInput,
  onMatrixInput,
  disabled,
  locked,
  showCorrect,
  showMeta = true,
}: QuestionViewerProps) {
  const { content, options, type, answer: correctAnswer } = question
  const isLocked = disabled || locked
  const isShowAnswer = showAnswer || showCorrect
  const selected = answer?.selected ?? []
  const matrix = answer?.matrix ?? {}

  const isMultiple = type === 'multiple'
  const isSingle = type === 'single' || type === 'assertion-reason'
  const isInteger = type === 'integer' || type === 'numerical'
  const isMatrix = type === 'matrix' || type === 'match-columns'

  const correctIndices = useMemo(() => {
    switch (correctAnswer.type) {
      case 'single':
      case 'assertion-reason':
        return [correctAnswer.correctIndex]
      case 'multiple':
        return correctAnswer.correctIndices
      default:
        return []
    }
  }, [correctAnswer])

  const matrixRowCount = isMatrix && correctAnswer.type === 'matrix' || isMatrix && correctAnswer.type === 'match-columns'
    ? Object.keys(correctAnswer.correct.matches).length
    : 0
  const matrixColCount = isMatrix && correctAnswer.type === 'matrix' || isMatrix && correctAnswer.type === 'match-columns'
    ? Math.max(0, ...Object.values(correctAnswer.correct.matches)) + 1
    : 0

  const optionStyle = (idx: number): string => {
    const isSelected = selected.includes(idx)
    const isCorrect = correctIndices.includes(idx)
    const base = 'group flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-150'
    if (isShowAnswer) {
      if (isCorrect) return cn(base, 'border-success/50 bg-success/10 text-text')
      if (isSelected) return cn(base, 'border-danger/50 bg-danger/10 text-text')
      return cn(base, 'border-border bg-surface2 text-text2 opacity-70')
    }
    if (isSelected) return cn(base, 'border-primary bg-primary/10 text-text shadow-sm')
    return cn(base, 'border-border bg-surface2 text-text2 hover:border-primary/40 hover:bg-surface3')
  }

  const handleOptionClick = (idx: number) => {
    if (isLocked) return
    if (isMultiple) onToggleMultiple?.(idx)
    else if (isSingle) onSelectOption?.(idx)
  }

  const matrixColLabel = (col: number): string =>
    matrixColCount <= 4 ? 'ABCD'[col] ?? `${col + 1}` : `C${col + 1}`

  return (
    <div className="space-y-5">
      {/* Meta row */}
      {showMeta && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{question.exam === 'jee-main' ? 'JEE Main' : question.exam === 'jee-advanced' ? 'JEE Advanced' : 'Practice'}</Badge>
          <Badge tone="info">{question.year}</Badge>
          <Badge tone="warning">{question.difficulty}/5</Badge>
          <Badge>{question.chapter}</Badge>
          <Badge tone="muted">{question.microTopic}</Badge>
          <span className="ml-auto font-mono text-[11px] text-text3">Q ID: {question.id.slice(-8)}</span>
        </div>
      )}

      {/* Paragraph (comprehension) */}
      {content.paragraph && (
        <div className="rounded-lg border border-border bg-surface2/60 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text3">Comprehension</p>
          <RichText content={content.paragraph} paragraphs />
          {content.paragraphLatex?.map((l, i) => <Latex key={i} latex={l} display className="my-2 block" />)}
        </div>
      )}

      {/* Statement */}
      {content.text && <RichText content={content.text} className="block text-base" />}
      {content.latex?.map((l, i) => <Latex key={i} latex={l} display className="my-2 block" />)}

      {/* Assertion-Reason split */}
      {type === 'assertion-reason' && (content.assertion || content.reason) && (
        <div className="space-y-3 rounded-lg border border-border bg-surface2/50 p-4">
          <div className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-xs font-bold text-primary">A:</span>
            <div className="flex-1">
              <RichText content={content.assertion ?? ''} />
              {content.assertionLatex ? <Latex latex={content.assertionLatex} /> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-xs font-bold text-primary">R:</span>
            <div className="flex-1">
              <RichText content={content.reason ?? ''} />
              {content.reasonLatex ? <Latex latex={content.reasonLatex} /> : null}
            </div>
          </div>
        </div>
      )}

      {/* Image */}
      {content.image && (
        <img src={content.image} alt="Diagram" className="max-h-56 rounded-lg border border-border" />
      )}

      {/* Options for MCQ types */}
      {!isInteger && !isMatrix && options.length > 0 && (
        <div className="space-y-2.5">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={isLocked}
              className={cn(optionStyle(idx), isLocked && 'cursor-default')}
              role="option"
              aria-selected={selected.includes(idx)}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                  selected.includes(idx)
                    ? 'border-primary bg-primary text-white'
                    : 'border-border2 bg-surface text-text2 group-hover:border-primary/40',
                )}
              >
                {opt.key}
              </span>
              <span className="flex-1">
                {opt.text ? <RichText content={opt.text} /> : null}
                {opt.latex ? <Latex latex={opt.latex} display /> : null}
                {opt.image ? (
                  <img src={opt.image} alt={`Option ${opt.key}`} className="mt-1 max-h-32 rounded" />
                ) : null}
              </span>
              {isShowAnswer && correctIndices.includes(idx) ? (
                <Icon name="check" size={16} className="shrink-0 text-success" />
              ) : isMultiple && selected.includes(idx) ? (
                <Icon name="check" size={16} className="shrink-0 text-primary" />
              ) : null}
            </button>
          ))}
        </div>
      )}

      {/* Integer / Numerical input */}
      {isInteger && (
        <div className="rounded-lg border border-border bg-surface2 p-5">
          <p className="mb-3 text-xs font-medium text-text2">
            Enter your answer as a number:
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              disabled={isLocked}
              value={selected.length ? selected[0] : ''}
              onChange={(e) => {
                const v = e.target.value === '' ? null : Number(e.target.value)
                if (v !== null && !Number.isNaN(v)) onIntegerInput?.(v)
                else onIntegerInput?.(null)
              }}
              placeholder="__"
              className="focus-ring w-36 rounded-lg border border-border bg-surface px-4 py-3 text-center font-mono text-2xl text-text"
              aria-label="Numeric answer input"
            />
            {isShowAnswer && (correctAnswer.type === 'integer' || correctAnswer.type === 'numerical') && (
              <span className="text-sm text-success">
                Correct answer: {correctAnswer.correctValue}
                {correctAnswer.range && correctAnswer.range[0] !== correctAnswer.correctValue
                  ? ` (${correctAnswer.range[0]}–${correctAnswer.range[1]})`
                  : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Matrix / Match columns */}
      {isMatrix && matrixRowCount > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface2 p-4">
          <p className="mb-3 text-xs font-medium text-text2">
            Match each row to the correct column:
          </p>
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-text3">
                  Row
                </th>
                {Array.from({ length: matrixColCount }, (_, c) => (
                  <th key={c} className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-text3">
                    {matrixColLabel(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: matrixRowCount }, (_, r) => (
                <tr key={r} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-text">Row {r + 1}</td>
                  {Array.from({ length: matrixColCount }, (_, c) => {
                    const isActive = matrix[r] === c
                    return (
                      <td key={c} className="px-2 py-1.5 text-center">
                        <button
                          disabled={isLocked}
                          onClick={() => onMatrixInput?.(r, c)}
                          className={cn(
                            'focus-ring h-8 w-8 rounded-md border text-xs font-bold transition-all',
                            isActive
                              ? 'border-primary bg-primary text-white'
                              : 'border-border2 bg-surface text-text2 hover:border-primary/40',
                          )}
                        >
                          {matrixColLabel(c)}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
