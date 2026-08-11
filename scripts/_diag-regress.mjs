import fs from 'node:fs'
import path from 'node:path'
import katex from 'katex'

const ROOT = 'C:/Users/Asus/Documents/Codes/TPJEESIM'
const FILES = ['jee-bank.json', 'jee-pyp.json', 'jee-2025.json', 'jee-adv.json', 'jee-mmjee.json']

const { cleanString } = await import('file:///' + path.join(ROOT, 'scripts', 'clean-latex.mjs').replace(/\\/g, '/'))

const DELIM_RE = /\$\$(.+?)\$\$|\$(.+?)\$|\\\((.+?)\\\)|\\\[(.+?)\\\]/gs
function mathSpans(s) {
  const spans = []
  let m
  const re = new RegExp(DELIM_RE.source, 'gs')
  while ((m = re.exec(s)) !== null) spans.push(m[1] ?? m[2] ?? m[3] ?? m[4] ?? '')
  return spans
}
function allSpans(str) {
  return /\$|\\\(|\\\[/.test(str) ? mathSpans(str) : /\\[a-zA-Z]/.test(str) ? [str] : []
}

// warn-char detection
const warnings = []
const origWarn = console.warn
console.warn = (m) => warnings.push(String(m))
const warnSet = new Set()
const checked = new Set()
function isWarnChar(ch) {
  if (ch.charCodeAt(0) <= 127) return false
  if (checked.has(ch)) return warnSet.has(ch)
  checked.add(ch)
  const n = warnings.length
  try { katex.renderToString(`x${ch}y`, { throwOnError: true, strict: false }) } catch { /* */ }
  for (const w of warnings.slice(n)) {
    const m = w.match(/No character metrics for '([^']+)'/)
    if (m && m[1] === ch) { warnSet.add(ch); return true }
  }
  return false
}

for (const f of FILES) {
  const arr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', f), 'utf8'))
  const byMsg = new Map()
  const samples = new Map()
  const warnChars = new Map()
  const warnSamples = new Map()
  const collect = (o, qid) => {
    if (o == null) return
    if (typeof o === 'string') {
      const cleaned = cleanString(o)
      for (const sp of allSpans(cleaned)) {
        try { katex.renderToString(sp, { throwOnError: true, strict: false }) }
        catch (e) {
          const msg = e.message.replace(/^KaTeX parse error: /, '').slice(0, 52)
          byMsg.set(msg, (byMsg.get(msg) || 0) + 1)
          if (!samples.has(msg)) samples.set(msg, { id: qid, sp: sp.slice(0, 110) })
        }
        for (const ch of sp) {
          if (isWarnChar(ch)) {
            warnChars.set(ch, (warnChars.get(ch) || 0) + 1)
            if (!warnSamples.has(ch)) {
              const i = sp.indexOf(ch)
              warnSamples.set(ch, { id: qid, ctx: sp.slice(Math.max(0, i - 22), i + 22) })
            }
          }
        }
      }
      return
    }
    if (Array.isArray(o)) return o.forEach((x) => collect(x, qid))
    if (typeof o === 'object') return Object.values(o).forEach((v) => collect(v, qid))
  }
  arr.forEach((q) => collect(q, q.id))
  console.warn = origWarn

  let total = 0
  for (const n of byMsg.values()) total += n
  let wTotal = 0
  for (const n of warnChars.values()) wTotal += n
  console.log(`\n===== ${f} =====  residual parse failures: ${total}   warn-chars: ${wTotal}`)
  const top = [...byMsg.entries()].sort((a, b) => b[1] - a[1])
  for (const [msg, n] of top.slice(0, 12)) {
    const s = samples.get(msg)
    console.log(`  ${n}x ${msg}`)
    if (s) console.log(`       e.g. [${s.id}] ${JSON.stringify(s.sp)}`)
  }
  const wt = [...warnChars.entries()].sort((a, b) => b[1] - a[1])
  for (const [ch, n] of wt.slice(0, 8)) {
    const s = warnSamples.get(ch)
    console.log(`  WARN ${JSON.stringify(ch)} U+${ch.codePointAt(0).toString(16).toUpperCase()} x${n}  e.g. [${s.id}] ${JSON.stringify(s.ctx)}`)
  }
}
