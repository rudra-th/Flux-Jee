import katex from 'katex'

/**
 * Render a single LaTeX string with KaTeX.
 * @returns rendered HTML string, or null if KaTeX fails to parse
 */
export function renderLatex(latex: string, displayMode = false): string | null {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: 'html',
    })
  } catch {
    return null
  }
}

/** Check whether a string contains LaTeX delimiters */
export function hasLatex(text: string): boolean {
  return /\$|\\\(|\\\[|\\frac|\\sqrt|\\sum|\\int|\\binom|\\begin/.test(text)
}

/**
 * Parse a mixed markdown-ish string into segments of text and latex.
 * Supported delimiters: $...$ and $$...$$ and \( ... \) and \[ ... \]
 */
export interface Segment {
  kind: 'text' | 'latex'
  content: string
  display: boolean
}

export function parseSegments(input: string): Segment[] {
  const segments: Segment[] = []
  let remaining = input

  const patterns: Array<{ display: boolean; regex: RegExp }> = [
    { display: true, regex: /\$\$(.+?)\$\$/s },
    { display: true, regex: /\\\[(.+?)\\\]/s },
    { display: false, regex: /\$(.+?)\$/s },
    { display: false, regex: /\\\((.+?)\\\)/s },
  ]

  while (remaining.length > 0) {
    let earliest: { index: number; pattern: { display: boolean; regex: RegExp }; match: RegExpMatchArray } | null = null

    for (const p of patterns) {
      const m = remaining.match(p.regex)
      if (m && m.index !== undefined) {
        if (!earliest || m.index < earliest.index) {
          earliest = { index: m.index, pattern: p, match: m }
        }
      }
    }

    if (!earliest || earliest.index < 0) {
      if (remaining.trim()) segments.push({ kind: 'text', content: remaining, display: false })
      break
    }

    const before = remaining.slice(0, earliest.index)
    if (before.trim()) segments.push({ kind: 'text', content: before, display: false })
    segments.push({
      kind: 'latex',
      content: earliest.match[1] ?? '',
      display: earliest.pattern.display,
    })
    remaining = remaining.slice((earliest.match[0]?.length ?? 0) + earliest.index)
  }

  return segments
}
