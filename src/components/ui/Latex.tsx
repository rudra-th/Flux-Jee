import { memo, useMemo } from 'react'
import katex from 'katex'
import { cn } from '@/utils/cn'

/**
 * Renders a single LaTeX expression via KaTeX.
 * Falls back to the raw string in monospace if parsing fails.
 */
export const Latex = memo(function Latex({
  latex,
  display = false,
  className,
}: {
  latex: string
  display?: boolean
  className?: string
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      })
    } catch {
      return null
    }
  }, [latex, display])

  if (!html) {
    return (
      <span className={cn('font-mono text-sm text-warning', display && 'block text-center', className)}>
        {latex}
      </span>
    )
  }

  return (
    <span
      className={cn(className)}
      dangerouslySetInnerHTML={{ __html: html }}
      aria-label={`Mathematical expression: ${latex}`}
    />
  )
})

/**
 * Renders text mixed with LaTeX using $...$ delimiters.
 * Falls back to MathJax-style plain rendering when delimiters are absent.
 */
export const RichText = memo(function RichText({
  content,
  className,
  paragraphs = false,
}: {
  content: string
  className?: string
  /** If true, split content on newlines into paragraphs */
  paragraphs?: boolean
}) {
  const segments = useMemo(() => parseContent(content), [content])

  if (paragraphs) {
    const blocks = content.split(/\n+/).filter((b) => b.trim())
    return (
      <div className={cn('space-y-2', className)}>
        {blocks.map((b, i) => (
          <p key={i}>
            <RichText content={b} />
          </p>
        ))}
      </div>
    )
  }

  const first = segments[0]
  if (segments.length === 1 && first?.kind === 'text') {
    return <span className={cn('text-sm leading-relaxed', className)}>{content}</span>
  }

  return (
    <span className={cn('inline text-sm leading-relaxed', className)}>
      {segments.map((seg, i) =>
        seg.kind === 'latex' ? (
          <Latex key={i} latex={seg.content} display={seg.display} />
        ) : (
          <span key={i}>{seg.content}</span>
        ),
      )}
    </span>
  )
})

interface Segment {
  kind: 'text' | 'latex'
  content: string
  display: boolean
}

function parseContent(input: string): Segment[] {
  if (!/\$/.test(input)) return [{ kind: 'text', content: input, display: false }]
  const segments: Segment[] = []
  let rest = input
  while (rest.length > 0) {
    const displayIdx = rest.indexOf('$$')
    const inlineIdx = rest.indexOf('$')

    if (displayIdx === -1 && inlineIdx === -1) {
      if (rest.trim()) segments.push({ kind: 'text', content: rest, display: false })
      break
    }

    const useDisplay = displayIdx !== -1 && (inlineIdx === -1 || displayIdx <= inlineIdx)
    const open = useDisplay ? '$$' : '$'
    const start = useDisplay ? displayIdx : inlineIdx
    const closeIdx = rest.indexOf(open, start + open.length)

    if (start > 0) {
      const before = rest.slice(0, start)
      if (before.trim()) segments.push({ kind: 'text', content: before, display: false })
    }

    if (closeIdx === -1) {
      const restContent = rest.slice(start)
      if (restContent.trim()) segments.push({ kind: 'text', content: restContent, display: false })
      break
    }

    segments.push({
      kind: 'latex',
      content: rest.slice(start + open.length, closeIdx),
      display: useDisplay,
    })
    rest = rest.slice(closeIdx + open.length)
  }
  return segments
}
