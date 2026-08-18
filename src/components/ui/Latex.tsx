import { memo, useMemo, type ReactNode } from 'react'
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
        trust: false,
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
 * Renders text mixed with LaTeX using `$...$`, `$$...$$`, `\(...\)` or
 * `\[...\]` delimiters, plus light inline markdown (`**bold**`, `*italic*`).
 * Falls back to plain rendering when no delimiters are present.
 */
export const RichText = memo(function RichText({
  content,
  className,
  paragraphs = false,
}: {
  content: string
  className?: string
  /** If true, split content into paragraphs on blank lines (LaTeX blocks are kept whole) */
  paragraphs?: boolean
}) {
  const segments = useMemo(() => parseContent(content), [content])

  if (paragraphs) {
    const blocks: Segment[][] = [[]]
    for (const seg of segments) {
      if (seg.kind === 'latex') {
        blocks[blocks.length - 1]!.push(seg)
      } else {
        seg.content.split(/\n\s*\n/).forEach((part, i) => {
          if (i > 0) blocks.push([])
          if (part.trim()) blocks[blocks.length - 1]!.push({ kind: 'text', content: part, display: false })
        })
      }
    }
    const valid = blocks.filter((b) => b.length > 0)
    return (
      <div className={cn('space-y-2', className)}>
        {valid.map((b, i) => (
          <p key={i}>{renderSegments(b)}</p>
        ))}
      </div>
    )
  }

  return <span className={cn('inline text-sm leading-relaxed', className)}>{renderSegments(segments)}</span>
})

function renderSegments(segments: Segment[]): ReactNode {
  return segments.map((seg, i) =>
    seg.kind === 'latex' ? (
      <Latex key={i} latex={seg.content} display={seg.display} />
    ) : (
      <span key={i}>{renderInline(seg.content)}</span>
    ),
  )
}

/** Very light inline markdown: **bold**, *italic*, and `# heading`. */
function renderInline(text: string): ReactNode {
  let result: ReactNode = text
  const trimmed = text.trimStart()
  if (/^#{1,6}\s+/.test(trimmed)) {
    const title = trimmed.replace(/^#{1,6}\s+/, '')
    result = (
      <span className="block font-semibold text-text">
        {renderInlineMarkup(title)}
      </span>
    )
    const leading = text.slice(0, text.length - trimmed.length)
    return leading ? (
      <>
        {leading}
        {result}
      </>
    ) : (
      result
    )
  }
  return renderInlineMarkup(text)
}

const MARKUP = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g

function renderInlineMarkup(text: string): ReactNode {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  MARKUP.lastIndex = 0
  while ((m = MARKUP.exec(text)) !== null) {
    if (m.index > last) nodes.push(<span key={key++}>{text.slice(last, m.index)}</span>)
    const token = m[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>)
    }
    last = m.index + token.length
  }
  if (last < text.length) nodes.push(<span key={key++}>{text.slice(last)}</span>)
  return nodes.length ? nodes : [text]
}

interface Segment {
  kind: 'text' | 'latex'
  content: string
  display: boolean
}

interface Delim {
  open: string
  close: string
  display: boolean
}

const DELIMS: Delim[] = [
  { open: '$$', close: '$$', display: true },
  { open: '\\[', close: '\\]', display: true },
  { open: '\\(', close: '\\)', display: false },
  { open: '$', close: '$', display: false },
]

function detectOpen(input: string, i: number): Delim | null {
  const two = input.slice(i, i + 2)
  for (const d of DELIMS) {
    if (two.startsWith(d.open)) return d
  }
  return null
}

function parseContent(input: string): Segment[] {
  if (!/[$\\]/.test(input)) return [{ kind: 'text', content: input, display: false }]

  const segments: Segment[] = []
  let i = 0
  let textStart = 0

  const flushText = (end: number) => {
    if (end > textStart) {
      const t = input.slice(textStart, end)
      if (t.trim()) segments.push({ kind: 'text', content: t, display: false })
    }
  }

  while (i < input.length) {
    const d = detectOpen(input, i)
    if (!d) {
      i += 1
      continue
    }
    const closeIdx = input.indexOf(d.close, i + d.open.length)
    if (closeIdx === -1) {
      i += 1
      continue
    }
    flushText(i)
    segments.push({ kind: 'latex', content: input.slice(i + d.open.length, closeIdx), display: d.display })
    textStart = closeIdx + d.close.length
    i = textStart
  }
  flushText(input.length)

  return segments.length ? segments : [{ kind: 'text', content: input, display: false }]
}
