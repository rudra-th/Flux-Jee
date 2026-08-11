#!/usr/bin/env node
/**
 * Clean the bundled JEE question JSON files so their LaTeX renders cleanly in KaTeX.
 *
 * Fixes, per string:
 *  - KaTeX-unsupported commands: \buildrel -> \overset, \matrix{/ -> \begin{matrix},
 *    \eqalign(no) -> \begin{aligned}, \root n \of x -> \sqrt[n]{x},
 *    \mspace -> thin space, \raise/\lower \hbox stacked fractions -> \frac,
 *    \cr -> \\, {equation} -> {gathered}
 *  - delimiter noise: $$$ -> $$, stray/unbalanced $ and $$, stray & in inline math
 *  - embedded `.tg {...}` CSS, HTML tags, literal backslash-n, dash-only lines,
 *    raw {tabular}/{center} blocks (converted to readable text), leftover
 *    \begin{align*} / \end{align*} fragments split across options
 *
 * Run: node scripts/clean-latex.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'public', 'data')
const FILES = ['jee-bank.json', 'jee-pyp.json', 'jee-2025.json', 'jee-adv.json', 'jee-mmjee.json']

/* ------------------------------------------------------------------ */
/* HTML entities                                                       */
/* ------------------------------------------------------------------ */
const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&#39;': "'", '&nbsp;': ' ', '&#160;': ' ',
  '&times;': '\u00d7', '&minus;': '\u2212', '&ndash;': '\u2013', '&mdash;': '\u2014',
  '&deg;': '\u00b0', '&plusmn;': '\u00b1',
  '&le;': '\u2264', '&ge;': '\u2265', '&ne;': '\u2260', '&asymp;': '\u2248',
  '&sim;': '\u223c', '&radic;': '\u221a', '&infin;': '\u221e', '&int;': '\u222b',
  '&sum;': '\u2211', '&prod;': '\u220f', '&pi;': '\u03c0', '&alpha;': '\u03b1',
  '&beta;': '\u03b2', '&gamma;': '\u03b3', '&theta;': '\u03b8', '&mu;': '\u03bc',
  '&phi;': '\u03c6', '&Delta;': '\u0394',
  '&rarr;': '\u2192', '&larr;': '\u2190', '&harr;': '\u2194', '&uarr;': '\u2191', '&darr;': '\u2193',
  '&lang;': '\u27e8', '&rang;': '\u27e9',
  '&frac12;': '\u00bd', '&frac14;': '\u00bc', '&frac34;': '\u00be',
  '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&ldquo;': '\u201c', '&rdquo;': '\u201d',
  '&hellip;': '\u2026', '&bull;': '\u2022', '&middot;': '\u00b7',
}
const ENTITY_RE = new RegExp(
  Object.keys(ENTITIES)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'g',
)

function decodeHtml(s) {
  let prev
  do {
    prev = s
    s = s.replace(ENTITY_RE, (m) => ENTITIES[m] ?? m)
    s = s.replace(/&#(\d+);/g, (_, d) => {
      const n = Number(d)
      return n > 0 && n < 0xffff ? String.fromCharCode(n) : '?'
    })
    s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, d) => {
      const n = parseInt(d, 16)
      return n > 0 && n < 0xffff ? String.fromCharCode(n) : '?'
    })
  } while (s !== prev)
  return s
}

/* ------------------------------------------------------------------ */
/* Dollar delimiter normalization                                      */
/* ------------------------------------------------------------------ */
export function normalizeDollars(s) {
  // $$$ -> $$ (repeat until stable; also handles $$$$...$$$$ -> $$...$$)
  let prev
  do {
    prev = s
    s = s.replace(/\$\$\$/g, '$$')
  } while (s !== prev)

  // Left-to-right balance: drop stray $ inside math, close unclosed math.
  let out = ''
  let state = 'text' // text | display | inline
  let lastDisplayOpen = -1 // index of an unclosed display opener
  let i = 0
  while (i < s.length) {
    const isDD = s.startsWith('$$', i)
    const isD = s[i] === '$'
    if (state === 'text') {
      if (isDD) {
        state = 'display'
        lastDisplayOpen = out.length
        out += '$$'
        i += 2
        continue
      }
      if (isD) {
        state = 'inline'
        out += '$'
        i += 1
        continue
      }
      out += s[i]
      i += 1
      continue
    }
    if (state === 'display') {
      if (isDD) {
        state = 'text'
        out += '$$'
        i += 2
        continue
      }
      if (isD) {
        i += 1 // stray $ inside display math
        continue
      }
      out += s[i]
      i += 1
      continue
    }
    // inline
    if (isDD) {
      i += 2 // stray $$ inside inline math
      continue
    }
    if (isD) {
      state = 'text'
      out += '$'
      i += 1
      continue
    }
    out += s[i]
    i += 1
  }
  if (state === 'display') {
    // Unclosed display at EOF: a lone trailing "$$" is almost always a stray
    // artifact (e.g. "= 2$$$$"); dropping the opener keeps the text clean.
    out = out.slice(0, lastDisplayOpen)
  } else if (state === 'inline') out += '$'
  return out
}

/* ------------------------------------------------------------------ */
/* Math / text splitting                                               */
/* ------------------------------------------------------------------ */
const DELIM_RE = /\$\$(.+?)\$\$|\$(.+?)\$|\\\((.+?)\\\)|\\\[(.+?)\\\]/gs

export function splitMixed(s) {
  const segs = []
  let last = 0
  let m
  while ((m = DELIM_RE.exec(s)) !== null) {
    if (m.index > last) segs.push({ math: false, s: s.slice(last, m.index) })
    segs.push({ math: true, s: m[1] ?? m[2] ?? m[3] ?? m[4] ?? '' })
    last = m.index + m[0].length
  }
  if (last < s.length) segs.push({ math: false, s: s.slice(last) })
  return segs
}

/* ------------------------------------------------------------------ */
/* Math transforms                                                     */
/* ------------------------------------------------------------------ */
function fixBuildrel(s) {
  // \buildrel {LABEL} \over \longrightarrow  ->  \overset{LABEL}{\longrightarrow}
  return s.replace(/\\buildrel\s*(.*?)\s*\\over\s*(\\[a-zA-Z]+)/g, (_, label, arrow) =>
    `\\overset{${label}}{${arrow}}`,
  )
}

const RAISE_LOWER_PAIR_RE =
  /\\raise[\d.]*ex\\hbox\{\$\\scriptstyle\s+([^$]+?)\$\}\s*\\kern[\d.-]*em\/\\kern[\d.-]*em\s*\\lower[\d.]*ex\\hbox\{\$\\scriptstyle\s+([^$]+?)\$\}/g
const RAISE_LOWER_SINGLE_RE = /\\raise[\d.]*ex\\hbox\{\$\\scriptstyle\s+([^$]+?)\$\}/g
const LOWER_SINGLE_RE = /\\lower[\d.]*ex\\hbox\{\$\\scriptstyle\s+([^$]+?)\$\}/g

function fixRaiseLower(s) {
  s = s.replace(RAISE_LOWER_PAIR_RE, (_, a, b) => `\\frac{${a.trim()}}{${b.trim()}}`)
  s = s.replace(RAISE_LOWER_SINGLE_RE, (_, a) => a.trim())
  s = s.replace(LOWER_SINGLE_RE, (_, a) => a.trim())
  return s
}

function consumeBraceGroup(s, i) {
  if (s[i] !== '{') return null
  let d = 0
  for (let k = i; k < s.length; k++) {
    if (s[k] === '{') d++
    else if (s[k] === '}') {
      d--
      if (d === 0) return { content: s.slice(i + 1, k), end: k + 1 }
    }
  }
  return null
}

function fixRoot(s) {
  // \root 8 \of 5  ->  \sqrt[8]{5}
  let out = ''
  let i = 0
  while (i < s.length) {
    if (s.startsWith('\\root', i) && /\s/.test(s[i + 5] ?? '')) {
      let j = i + 5
      while (j < s.length && /\s/.test(s[j])) j++
      let n = ''
      while (j < s.length && /[0-9.]/.test(s[j])) {
        n += s[j]
        j++
      }
      while (j < s.length && /\s/.test(s[j])) j++
      if (n && s.startsWith('\\of', j)) {
        j += 3
        while (j < s.length && /\s/.test(s[j])) j++
        const arg = consumeBraceGroup(s, j)
        if (arg) {
          out += `\\sqrt[${n}]{${arg.content}}`
          i = arg.end
          continue
        }
        const token = s.slice(j).match(/^\\[a-zA-Z]+|^[^\\\s{}]/)
        if (token) {
          out += `\\sqrt[${n}]{${token[0]}}`
          i = j + token[0].length
          continue
        }
      }
    }
    out += s[i]
    i += 1
  }
  return out
}

function fixMspace(s) {
  return s.replace(/\\mspace\s*\{[^}]*\}/g, '\\,')
}

function fixPlainEnvs(s) {
  // \matrix{...} -> \begin{matrix}...\end{matrix}, \eqalign(no){...} -> \begin{aligned}...\end{aligned}
  let out = ''
  let i = 0
  while (i < s.length) {
    let env = null
    let cmdLen = 0
    if (s.startsWith('\\matrix', i) && !/[a-zA-Z]/.test(s[i + 7] ?? '')) {
      env = 'matrix'
      cmdLen = 7
    } else if (s.startsWith('\\eqalign', i)) {
      env = 'aligned'
      cmdLen = s.slice(i).match(/\\eqalign(?:no)?/)[0].length
    }
    if (env) {
      let j = i + cmdLen
      while (j < s.length && /\s/.test(s[j])) j++
      const g = consumeBraceGroup(s, j)
      if (g) {
        out += `\\begin{${env}}${g.content}\\end{${env}}`
        i = g.end
        continue
      }
    }
    out += s[i]
    i += 1
  }
  return out
}

const ALIGN_ENVS = new Set([
  'array', 'aligned', 'alignedat', 'gathered', 'matrix', 'pmatrix', 'bmatrix',
  'vmatrix', 'Vmatrix', 'cases', 'split', 'align', 'align*',
])

function fixAmpersands(s) {
  // Replace & outside alignment environments (invalid inline math) with \quad
  let out = ''
  let i = 0
  const stack = []
  while (i < s.length) {
    const b = s.slice(i).match(/^\\begin\{([^}]*)\}/)
    if (b) {
      stack.push(b[1])
      out += b[0]
      i += b[0].length
      continue
    }
    const e = s.slice(i).match(/^\\end\{([^}]*)\}/)
    if (e) {
      stack.pop()
      out += e[0]
      i += e[0].length
      continue
    }
    if (s[i] === '&') {
      const innermost = stack[stack.length - 1]
      out += innermost && ALIGN_ENVS.has(innermost) ? '&' : '\\quad'
      i += 1
      continue
    }
    out += s[i]
    i += 1
  }
  return out
}

function balanceBraces(s) {
  let out = ''
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '{') {
      depth++
      out += c
    } else if (c === '}') {
      if (depth > 0) {
        depth--
        out += c
      }
      // else: drop stray closing brace
    } else {
      out += c
    }
  }
  while (depth > 0) {
    out += '}'
    depth--
  }
  return out
}

export /* ------------------------------------------------------------------ */
/* Command / unicode normalization                                     */
/* ------------------------------------------------------------------ */
const PARSE_CACHE = new Map()
function cmdParses(tok) {
  if (PARSE_CACHE.has(tok)) return PARSE_CACHE.get(tok)
  let ok = true
  try {
    katex.renderToString(tok, { throwOnError: true, strict: false })
  } catch {
    ok = false
  }
  PARSE_CACHE.set(tok, ok)
  return ok
}

function fixCommandBoundaries(s) {
  // \command directly followed by letters ("\Rightarrowx", "\DeltaABC", "\alphaand")
  // is a missing-space artifact. Insert a space after the longest prefix that
  // KaTeX accepts as a command. Tokens whose whole letter-run parses as a command
  // (e.g. \overleftarrow) are left untouched, as are tokens with no parseable prefix
  // (e.g. \begin{matrix} — \begin alone is not parseable either).
  let out = ''
  let i = 0
  while (i < s.length) {
    if (s[i] === '\\' && /[a-zA-Z]/.test(s[i + 1] ?? '')) {
      let j = i + 1
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++
      const full = s.slice(i, j)
      if (cmdParses(full)) {
        out += full
        i = j
        continue
      }
      let best = -1
      for (let p = j - 1; p > i + 1; p--) {
        if (cmdParses(s.slice(i, p))) {
          best = p
          break
        }
      }
      if (best > 0) {
        out += s.slice(i, best) + ' '
        i = best
        continue
      }
    }
    out += s[i]
    i += 1
  }
  return out
}

function fixUnicode(s) {
  s = s.replace(/[\u00a0\u202f]/g, ' ') // NBSP / narrow NBSP -> space
  s = s.replace(/[\u2061\u00ad]/g, '') // function application / soft hyphen
  s = s.replace(/º/g, '^{\\circ}') // masculine ordinal (degree) -> superscript
  s = s.replace(/¯/g, '\\bar{}') // macron
  s = s.replace(/∆/g, '\\Delta')
  s = s.replace(/▢/g, '\\square')
  s = s.replace(/\u{1d703}/gu, '\\theta') // mathematical italic small theta
  s = s.replace(/µ/g, '\\mu')
  return s
}

function cleanMath(s) {
  s = s.replace(/\\n(?![a-zA-Z])/g, ' ') // literal \n -> space
  s = s.replace(/\r/g, ' ')
  s = fixUnicode(s)
  s = fixCommandBoundaries(s)
  s = fixBuildrel(s)
  s = fixRaiseLower(s)
  s = fixRoot(s)
  s = fixMspace(s)
  s = fixPlainEnvs(s)
  s = s.replace(/\\cr/g, '\\\\') // old row separator -> \\ row separator
  s = s.replace(/\\begin\{equation\*\}/g, '\\begin{gathered}')
  s = s.replace(/\\end\{equation\*\}/g, '\\end{gathered}')
  s = s.replace(/\\begin\{equation\}/g, '\\begin{gathered}')
  s = s.replace(/\\end\{equation\}/g, '\\end{gathered}')
  s = s.replace(/\\\[|\\\]/g, '') // leftover display-math bracket fragments
  s = s.replace(/\\right\.\s*\}\s*and\s*\\left\./gi, '\\right\\}\\ \\text{and}\\ \\left\\{')
  s = s.replace(/_{2,}/g, (m) => `\\underline{\\hspace{${(m.length * 0.3).toFixed(1)}em}}`)
  s = s.replace(/\\=/g, '=') // legacy accent \= -> plain equals
  s = fixAmpersands(s)
  s = balanceBraces(s)
  s = s.replace(/[ \t]{2,}/g, ' ')
  return s.trim()
}

/* ------------------------------------------------------------------ */
/* Text transforms                                                     */
/* ------------------------------------------------------------------ */
const CSS_RULE_RE =
  /(?:\.tg[\w.\s-]*|(?<![a-zA-Z])(?:table|th|td|tr)(?:\s*,\s*(?<![a-zA-Z])(?:table|th|td|tr))*)\s*\{[^}]*\}/g

function deTexTable(s) {
  // Convert \begin{tabular}...\end{tabular} (and \begin{center}) to plain text rows.
  let out = ''
  let i = 0
  while (i < s.length) {
    const start = s.indexOf('\\begin{tabular}', i)
    if (start === -1) {
      out += s.slice(i)
      break
    }
    const end = s.indexOf('\\end{tabular}', start)
    if (end === -1) {
      out += s.slice(i)
      break
    }
    out += s.slice(i, start)
    let j = start + '\\begin{tabular}'.length
    const spec = consumeBraceGroup(s, j)
    if (spec) j = spec.end
    out += tabularRegionToText(s.slice(j, end))
    i = end + '\\end{tabular}'.length
  }
  return out
}

function tabularRegionToText(region) {
  let out = ''
  let i = 0
  while (i < region.length) {
    if (region.startsWith('\\begin{center}', i) || region.startsWith('\\end{center}', i)) {
      const m = region.slice(i).match(/\\[a-zA-Z]+\{[^}]*\}/)
      i += m ? m[0].length : 1
      continue
    }
    if (region.startsWith('\\hline', i)) {
      const m = region.slice(i).match(/\\[a-zA-Z]+/)
      i += m ? m[0].length : 1
      continue
    }
    if (region.startsWith('\\cline', i)) {
      const m = region.slice(i).match(/\\cline\s*\{[^}]*\}/)
      i += m ? m[0].length : 8
      continue
    }
    if (region.startsWith('\\multicolumn', i)) {
      let j = i + '\\multicolumn'.length
      const args = []
      for (let k = 0; k < 3; k++) {
        while (j < region.length && /\s/.test(region[j])) j++
        const g = consumeBraceGroup(region, j)
        if (!g) break
        args.push(g.content)
        j = g.end
      }
      if (args.length === 3) {
        out += args[2]
        i = j
        continue
      }
    }
    if (region[i] === '\\' && region[i + 1] === '\\') {
      out += '\n'
      i += 2
      continue
    }
    if (region[i] === '&') {
      out += ' | '
      i += 1
      continue
    }
    out += region[i]
    i += 1
  }
  return out
}

export function cleanText(s) {
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(CSS_RULE_RE, ' ')
  s = s.replace(/<[a-zA-Z/][^>]*>/g, ' ')
  s = s.replace(/\\\[|\\\]/g, '') // leftover display-math bracket fragments
  s = deTexTable(s)
  s = s.replace(/\\n(?![a-zA-Z])/g, '\n') // literal \n -> real newline
  s = s.replace(/\r/g, '')
  s = s
    .split('\n')
    .map((line) => (/^[-=_·•\s]{4,}$/.test(line) ? '' : line.replace(/\s+$/, '')))
    .join('\n')
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
  return s.trim()
}

/* ------------------------------------------------------------------ */
/* String pipeline                                                     */
/* ------------------------------------------------------------------ */
export function cleanString(s) {
  s = decodeHtml(s)
  s = normalizeDollars(s)

  const hasDelim = /\$|\\\(|\\\[/.test(s)
  const looksLatex = /\\[a-zA-Z]/.test(s)

  if (hasDelim) {
    const segs = splitMixed(s)
    const out = segs
      .map((seg) => {
        if (seg.math) return cleanMath(seg.s)
        let t = cleanText(seg.s)
        // leftover align* fragments split across fields
        t = t.replace(/\\begin\{align\*\}/g, '').replace(/\\end\{align\*\}/g, '')
        t = t.replace(/^\\\s+/, '')
        return t
      })
      .join('')
    return normalizeDollars(out)
  }

  if (looksLatex) {
    let t = cleanMath(s)
    t = t.replace(/\\begin\{align\*\}/g, '').replace(/\\end\{align\*\}/g, '')
    t = t.replace(/^\\\s+/, '')
    return t
  }

  return cleanText(s)
}

/* ------------------------------------------------------------------ */
/* Verification (KaTeX parse)                                          */
/* ------------------------------------------------------------------ */
import katex from 'katex'

function getMathSpans(s) {
  const spans = []
  let m
  const re = new RegExp(DELIM_RE.source, 'gs')
  while ((m = re.exec(s)) !== null) spans.push(m[1] ?? m[2] ?? m[3] ?? m[4] ?? '')
  return spans
}

export function countFailures(arr) {
  let total = 0
  const byMsg = {}
  const samples = {}
  const walk = (o, qid) => {
    if (o == null) return
    if (typeof o === 'string') {
      const spans = /\$|\\\(|\\\[/.test(o) ? getMathSpans(o) : /\\[a-zA-Z]/.test(o) ? [o] : []
      for (const sp of spans) {
        try {
          katex.renderToString(sp, { throwOnError: true, strict: false })
        } catch (e) {
          total++
          const msg = e.message.replace(/^KaTeX parse error: /, '').slice(0, 52)
          byMsg[msg] = (byMsg[msg] || 0) + 1
          if (!(msg in samples)) samples[msg] = { id: qid, sp: sp.slice(0, 110) }
        }
      }
    } else if (Array.isArray(o)) o.forEach((x) => walk(x, qid))
    else if (typeof o === 'object') Object.values(o).forEach((v) => walk(v, qid))
  }
  arr.forEach((q) => walk(q, q.id))
  return { total, byMsg, samples }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (!isMain) {
  // Imported for testing — do not touch any files.
} else {
let totalFixed = 0
for (const f of FILES) {
  const file = path.join(DATA_DIR, f)
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'))
  const before = countFailures(arr)

  let changedStrings = 0
  const walkFix = (o) => {
    if (o == null) return
    if (typeof o === 'string') {
      const cleaned = cleanString(o)
      if (cleaned !== o) {
        totalFixed++
        changedStrings++
        return cleaned
      }
      return o
    }
    if (Array.isArray(o)) return o.map(walkFix)
    if (typeof o === 'object') {
      for (const k of Object.keys(o)) o[k] = walkFix(o[k])
      return o
    }
    return o
  }
  const cleaned = arr.map(walkFix)
  const after = countFailures(cleaned)

  fs.writeFileSync(file, JSON.stringify(cleaned, null, 2))

  console.log(`\n### ${f}`)
  console.log(`  strings changed: ${changedStrings}`)
  console.log(`  KaTeX parse failures: ${before.total} -> ${after.total}`)
  const top = Object.entries(after.byMsg).sort((a, b) => b[1] - a[1])
  for (const [msg, n] of top.slice(0, 10)) {
    const s = after.samples[msg]
    console.log(`    ${n}x ${msg}`)
    if (s) console.log(`       e.g. [${s.id}] ${JSON.stringify(s.sp)}`)
  }
}
console.log(`\ntotal strings modified: ${totalFixed}`)
}
