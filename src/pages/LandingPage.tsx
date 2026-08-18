import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon, Modal, type IconName } from '@/components/ui'
import { cn } from '@/utils/cn'

const EASE = [0.22, 1, 0.36, 1] as const

/* ─── Reusable ─── */

function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SectionHeading({ eyebrow, title, sub, center = true }: { eyebrow: string; title: ReactNode; sub?: string; center?: boolean }) {
  return (
    <Reveal className={cn('max-w-3xl', center && 'mx-auto text-center')}>
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-bold leading-[1.08] tracking-tight text-text sm:text-5xl">{title}</h2>
      {sub ? <p className="mt-5 text-base leading-relaxed text-text2 sm:text-lg">{sub}</p> : null}
    </Reveal>
  )
}

function CountUp({ to, suffix = '', decimals = 0, className }: { to: number; suffix?: string; decimals?: number; className?: string }) {
  const [ref, setRef] = useState<HTMLSpanElement | null>(null)
  const [inView, setInView] = useState(false)
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!ref) return
    const obs = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold: 0.4 })
    obs.observe(ref)
    return () => obs.disconnect()
  }, [ref])

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const duration = 1800
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setVal(to * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])

  return (
    <span ref={setRef} className={className}>
      {val.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}

/* ─── NAV ─── */

function Nav() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'How it works', href: '#how' },
    { label: 'Test Series', href: '#series' },
    { label: 'Features', href: '#features' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-border bg-bg/80 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="focus-ring flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
            <Icon name="target" size={19} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-text">JEE Arena</span>
        </button>

        <nav className="hidden items-center gap-8 text-[13px] font-medium text-text2 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-text">{l.label}</a>
          ))}
        </nav>

        <button
          onClick={() => navigate('/dashboard')}
          className="focus-ring rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary2 active:scale-[0.97]"
        >
          Get Started
        </button>
      </div>
    </header>
  )
}

/* ─── DEMO QUESTIONS (Interactive) ─── */

const DEMO_QUESTIONS = [
  {
    subject: 'Physics · Mechanics',
    text: 'A 2 kg block slides from rest down a frictionless 30° incline. Its speed after moving 5 m is… (g = 10 m/s²)',
    options: ['5 m/s', '7 m/s', '√50 m/s', '10 m/s'],
    answer: 2,
    hint: 'Use v² = 2as, where a = g·sin30° = 5 m/s²',
  },
  {
    subject: 'Chemistry · Equilibrium',
    text: 'For CO(g) + H₂O(g) ⇌ CO₂(g) + H₂(g), Kc = ?\n[CO]=0.1 M, [H₂O]=0.2 M, [CO₂]=0.4 M, [H₂]=0.5 M',
    options: ['4', '10', '20', '100'],
    answer: 1,
    hint: 'Kc = [CO₂][H₂] / [CO][H₂O] = (0.4)(0.5) / (0.1)(0.2)',
  },
  {
    subject: 'Maths · Calculus',
    text: 'How many local maxima does f(x) = x³ − 3x² + 2 have?',
    options: ['1', '0', '2', '3'],
    answer: 0,
    hint: "f'(x) = 3x(x − 2), sign changes from + to − at x = 0 only",
  },
]

function InteractiveDemo() {
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const q = DEMO_QUESTIONS[qIdx]!
  const answered = selected !== null
  const correct = answered && selected === q.answer

  const choose = (i: number) => {
    if (answered) return
    setSelected(i)
  }

  const next = () => {
    setSelected(null)
    setQIdx((i) => (i + 1) % DEMO_QUESTIONS.length)
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-surface2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-surface3 px-3 py-1 text-[11px] text-text3">
          <Icon name="shield" size={11} />
          jeearena.app/test
        </div>
        <span className="w-14" />
      </div>

      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text3">
            {q.subject} · Q{qIdx + 1} of {DEMO_QUESTIONS.length}
          </span>
          <span className="rounded-md bg-danger/15 px-2 py-0.5 font-mono text-[11px] font-bold text-danger">12:42</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={qIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="text-[13px] font-medium leading-relaxed text-text whitespace-pre-line"
          >
            {q.text}
          </motion.p>
        </AnimatePresence>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer
            const isPicked = i === selected
            const state = answered ? (isAnswer ? 'correct' : isPicked ? 'wrong' : 'idle') : 'idle'
            return (
              <button
                key={opt}
                onClick={() => choose(i)}
                disabled={answered}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-colors text-left',
                  state === 'correct' && 'border-success bg-success/10 text-success',
                  state === 'wrong' && 'border-danger bg-danger/10 text-danger',
                  state === 'idle' && 'cursor-pointer border-border bg-surface2 text-text2 hover:border-primary/40 hover:text-text',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold',
                    state === 'correct' && 'border-success bg-success text-white',
                    state === 'wrong' && 'border-danger bg-danger text-white',
                    state === 'idle' && 'border-border2 text-text3',
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
                {state === 'correct' && <Icon name="check" size={13} className="ml-auto" />}
                {state === 'wrong' && <Icon name="x" size={13} className="ml-auto" />}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-text3">
          <span className={cn('transition-colors', answered && (correct ? 'text-success' : 'text-danger'))}>
            {answered ? (correct ? 'Correct — ' : 'Not quite — ') + q.hint : 'Click an answer to try it'}
          </span>
          {answered && (
            <button onClick={next} className="font-semibold text-primary hover:underline">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── FLIP CARD (Interactive) ─── */

const FLIP_CARDS = [
  { front: 'τ = I α', back: 'Torque = Moment of inertia × Angular acceleration', subject: 'Physics · Rotational Motion' },
  { front: 'E = h f', back: 'Photon energy = Planck constant × Frequency', subject: 'Physics · Modern' },
  { front: 'F = m a', back: 'Force = Mass × Acceleration', subject: 'Physics · Mechanics' },
]

function FlipCardDemo() {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = FLIP_CARDS[idx]!

  return (
    <div className="flex flex-col items-center p-5" style={{ perspective: '1000px' }}>
      <button onClick={() => setFlipped((f) => !f)} className="w-full max-w-sm focus-ring" aria-label="Flip card">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative h-44 w-full rounded-2xl border border-border bg-surface text-center shadow-xl"
        >
          <div style={{ backfaceVisibility: 'hidden' }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text3">{card.subject}</span>
            <span className="font-serif text-3xl font-semibold tracking-tight text-text">{card.front}</span>
            <span className="text-[11px] text-text3">Click to reveal</span>
          </div>
          <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-primary/5 p-5">
            <span className="text-[12px] leading-relaxed text-text">{card.back}</span>
          </div>
        </motion.div>
      </button>
      <div className="mt-4 flex items-center gap-2">
        {FLIP_CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setFlipped(false) }}
            className={cn('h-1.5 rounded-full transition-all duration-300', i === idx ? 'w-5 bg-primary' : 'w-1.5 bg-surface3')}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── ANALYTICS CHART (Hoverable) ─── */

function AnalyticsChartDemo() {
  const [hovered, setHovered] = useState<number | null>(null)
  const bars = [
    { label: 'W1', value: 42 },
    { label: 'W2', value: 58 },
    { label: 'W3', value: 47 },
    { label: 'W4', value: 66 },
    { label: 'W5', value: 61 },
    { label: 'W6', value: 74 },
    { label: 'W7', value: 70 },
    { label: 'W8', value: 82 },
    { label: 'W9', value: 79 },
    { label: 'W10', value: 91 },
  ]

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text3">Accuracy</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-text">86.4%</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold text-success">
          <Icon name="trending-up" size={13} /> +11.2%
        </span>
      </div>
      <div className="flex h-28 items-end gap-1.5">
        {bars.map((b, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="relative flex-1 cursor-default"
          >
            <div
              className={cn('rounded-t-md transition-colors duration-150', i === bars.length - 1 || hovered === i ? 'bg-primary' : 'bg-surface3')}
              style={{ height: `${b.value}%` }}
            />
            {hovered === i && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-bg border border-border px-2 py-1 text-[10px] font-bold text-text shadow-lg">
                {b.value}%
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Attempt rate', value: '94%' },
          { label: 'Time/question', value: '68s' },
          { label: 'Weakest', value: 'Thermo' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface2 p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-text3">{s.label}</p>
            <p className="mt-0.5 text-[13px] font-bold text-text">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── TEST MOCKUP (Static) ─── */

const PALETTE = Array.from({ length: 60 }, (_, i) => {
  if (i === 17) return 'current'
  if (i % 7 === 0) return 'answered'
  if (i % 11 === 3) return 'marked'
  return 'notvisited'
}) as Array<'current' | 'answered' | 'marked' | 'notvisited'>

const CELL_COLOR: Record<string, string> = {
  current: 'var(--palette-current)',
  answered: 'var(--palette-answered)',
  marked: 'var(--palette-marked)',
  notvisited: 'var(--palette-notvisited)',
}

function TestRunnerMockup() {
  const options = ['5 m/s', '10 m/s', '√50 m/s', '20 m/s']
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border bg-surface2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-surface3 px-3 py-1 text-[11px] text-text3">
          <Icon name="shield" size={11} /> jeearena.app/test/full
        </div>
        <span className="w-14" />
      </div>
      <div className="flex">
        <div className="min-w-0 flex-1 p-5 text-left">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text3">Physics · Mechanics · Q18 of 75</span>
            <span className="rounded-md bg-danger/15 px-2 py-0.5 font-mono text-[11px] font-bold text-danger">12:42</span>
          </div>
          <p className="text-[13px] font-medium leading-relaxed text-text">
            A block of mass 2 kg is released from rest on a frictionless incline of 30°. Find the speed after it has moved 5 m. (g = 10 m/s²)
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {options.map((opt, i) => {
              const active = i === 1
              return (
                <div key={opt} className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] font-medium', active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface2 text-text2')}>
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold', active ? 'border-primary bg-primary text-white' : 'border-border2 text-text3')}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {active && <Icon name="check" size={13} className="ml-auto" />}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-text3">
            <span>Marked for review: <span className="font-semibold text-warning">2</span> · Answered: <span className="font-semibold text-success">43</span></span>
            <span className="hidden font-mono sm:inline">K · M · S · P shortcuts</span>
          </div>
        </div>
        <div className="hidden w-44 shrink-0 border-l border-border bg-surface2/50 p-3 sm:block">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text3">Palette</p>
          <div className="grid grid-cols-5 gap-1">
            {PALETTE.map((c, i) => (
              <span key={i} className="flex h-5 items-center justify-center rounded text-[9px] font-semibold text-white" style={{ backgroundColor: CELL_COLOR[c] }}>{i + 1}</span>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 text-[10px] text-text2">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-answered)]" /> Answered</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-marked)]" /> Marked</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-current)]" /> Current</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── SERIES DATA ─── */

const SERIES = [
  { id: 'main', name: 'JEE Main', tests: 20, desc: 'High-level handpicked tests. Minor, Semi-Major, and Major pattern.', accent: 'var(--primary)', icon: 'test' as IconName },
  { id: 'advanced', name: 'JEE Advanced', tests: 15, desc: 'Extreme-level Sectional, Partial, and Full syllabus tests.', accent: 'var(--warning)', icon: 'award' as IconName },
]

/* ─── HERO ─── */

function Hero() {
  const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:pb-28 sm:pt-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse 70% 45% at 50% -5%, var(--primary) 0%, transparent 55%)', filter: 'blur(90px)' }} />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal y={16}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Built for JEE Main & Advanced
            </span>
          </Reveal>
          <motion.h1
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
            className="mt-6 text-5xl font-bold leading-[1.04] tracking-tighter text-text sm:text-7xl md:text-[80px]"
          >
            The closest thing
            <br />
            to the real JEE.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text2 sm:text-lg"
          >
            Mock test series modelled on the real exam. Real PYQs, exact NTA interface, analytics that tell you what to fix. Free, offline, forever.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { icon: 'file' as IconName, label: 'real PYQs', value: '14,600+' },
              { icon: 'book' as IconName, label: 'chapters', value: '64' },
              { icon: 'battery' as IconName, label: 'offline', value: '100%' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 rounded-full border border-border bg-surface/70 px-4 py-2 backdrop-blur">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon name={s.icon} size={13} />
                </span>
                <span className="text-[12px] font-semibold text-text">
                  {s.value} <span className="ml-1 font-medium text-text3">{s.label}</span>
                </span>
              </div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="focus-ring rounded-full bg-primary px-7 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-primary/30 transition-colors duration-200 hover:bg-primary2"
            >
              Get Started — Free
            </button>
            <a
              href="#how"
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-border2 px-7 py-3.5 text-[15px] font-semibold text-text transition-all duration-200 hover:border-primary/40 hover:bg-surface2"
            >
              See how it works <Icon name="arrow-right" size={16} />
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-5 text-xs font-medium uppercase tracking-wider text-text3"
          >
            No account · No install · No fees
          </motion.p>
        </div>

        <div className="mt-16 flex justify-center">
          <InteractiveDemo />
        </div>
      </div>
    </section>
  )
}

/* ─── HOW IT WORKS ─── */

const STEPS = [
  { n: '01', tag: 'Practice', title: 'Pick a mode. Start.', desc: 'Full mock tests, chapter drills, PYQs, custom sets — choose what you need and go.', icon: 'test' as IconName },
  { n: '02', tag: 'Detect', title: 'Analytics find the gap.', desc: 'Accuracy, speed, attempt rate, chapter heatmaps — you see exactly where marks are lost.', icon: 'line-chart' as IconName },
  { n: '03', tag: 'Fix', title: 'Revise what you missed.', desc: 'Mistakes become flashcards. Weak chapters get targeted. Nothing wasted, nothing repeated.', icon: 'refresh' as IconName },
  { n: '04', tag: 'Master', title: 'Watch the line go up.', desc: 'Streaks, daily goals, smart re-attempts. The engine sharpens its picture of you every day.', icon: 'trending-up' as IconName },
]

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:py-32">
      <SectionHeading
        eyebrow="The method"
        title="Practice. Detect. Fix. Repeat."
        sub="Four steps that loop until exam day — each one automated inside the app."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={Math.min(i * 0.08, 0.3)}>
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Icon name={s.icon} size={21} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{s.n}</span>
                  <span className="h-px w-6 bg-border" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text3">{s.tag}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-text">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text2">{s.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── TEST SERIES ─── */

function TestSeries() {
  const navigate = useNavigate()
  return (
    <section id="series" className="border-y border-border bg-surface/30 px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Mock test series"
          title="Two series. 35 tests."
          sub="JEE Main series: 20 tests (Minor + Semi-Major + Major). JEE Advanced series: 15 tests (Sectional + Partial + Full)."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {SERIES.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.1}>
              <div
                className="group flex h-full flex-col gap-5 rounded-2xl border border-border bg-surface p-7 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon name={s.icon} size={23} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text">{s.name}</p>
                    <p className="text-[13px] text-text2">{s.tests} tests</p>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-text2">{s.desc}</p>
                <button
                  onClick={() => navigate(`/mock-tests/${s.id}`)}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary2"
                >
                  View series <Icon name="arrow-right" size={14} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12">
          <TestRunnerMockup />
        </div>
      </div>
    </section>
  )
}

/* ─── SUBJECTS ─── */

const SUBJECTS = [
  { name: 'Physics', count: 5200, chapters: 22, pct: 92, color: '#60a5fa', topics: ['Mechanics', 'Thermo', 'Optics', 'Modern'] },
  { name: 'Chemistry', count: 4800, chapters: 20, pct: 88, color: '#a78bfa', topics: ['Physical', 'Organic', 'Inorganic'] },
  { name: 'Mathematics', count: 4600, chapters: 22, pct: 95, color: '#fbbf24', topics: ['Algebra', 'Calculus', 'Vectors', 'Coordinate'] },
]

function SubjectsCoverage() {
  return (
    <section className="px-5 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading
            center={false}
            eyebrow="Full syllabus"
            title="Every chapter. Every micro-topic."
            sub="64 chapters across Physics, Chemistry and Mathematics — every NTA topic with real questions."
          />
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: 'check-circle' as IconName, label: 'Organised by NTA syllabus' },
                { icon: 'refresh' as IconName, label: 'Updated with every shift' },
                { icon: 'calculator' as IconName, label: 'Every answer solved' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[12px] font-semibold text-text2">
                  <Icon name={b.icon} size={14} className="text-success" />
                  {b.label}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <div className="space-y-4">
          {SUBJECTS.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.1}>
              <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/30">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <p className="text-[15px] font-bold text-text">{s.name}</p>
                  </div>
                  <p className="text-[13px] font-semibold text-text2">
                    <span className="text-text"><CountUp to={s.count} /></span> questions
                  </p>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface3">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.color}, #8ab6ff)` }} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {s.topics.map((t) => (
                      <span key={t} className="rounded-md border border-border bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-text3">{t}</span>
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-text3">{s.chapters} chapters · {s.pct}% of syllabus</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FEATURES ─── */

const FEATURES = [
  { icon: 'wifi-off', title: 'Offline-first', desc: 'The entire question bank lives in your browser. Full tests run at full speed with zero internet.' },
  { icon: 'flashcard', title: 'Flashcards', desc: 'Formula and concept recall built around spaced repetition and your own weak chapters.' },
  { icon: 'mistake', title: 'Mistake notebook', desc: 'Every wrong answer is logged automatically — then becomes a targeted re-attempt test.' },
  { icon: 'line-chart', title: 'Analytics that matter', desc: 'Accuracy, speed, chapter heatmaps. You always know exactly what to fix next.' },
  { icon: 'pyq', title: 'PYQ papers', desc: 'Every real JEE paper since 2014, grouped shift-wise, with full solutions.' },
  { icon: 'custom', title: 'Custom tests', desc: 'Build your own tests by chapter, difficulty, question type and time limit.' },
]

function FeaturesGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 pb-24 sm:pb-32">
      <SectionHeading
        eyebrow="Everything built-in"
        title="Not a question bank. A training system."
        sub="Practice, detect, explain, revise, repeat — all inside one app."
      />
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={Math.min(i * 0.06, 0.4)}>
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Icon name={f.icon as IconName} size={23} />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-text">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text2">{f.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── ANALYTICS SECTION ─── */

function AnalyticsSection() {
  return (
    <section className="border-y border-border bg-surface/30 px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              center={false}
              eyebrow="Know everything"
              title="Your rank is a data problem."
              sub="Stop guessing. Track accuracy, speed, attempt rate and chapter mastery — then turn it into a plan."
            />
            <Reveal delay={0.15}>
              <div className="mt-8 space-y-3">
                {['Chapter-level accuracy heatmaps', 'Weakness-ranked test builder', 'Progress streaks and daily goals', 'Mistake patterns — why you lose marks'].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Icon name="check" size={12} />
                    </span>
                    <span className="text-sm font-medium text-text">{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <AnalyticsChartDemo />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ─── FLASHCARD SECTION ─── */

function FlashcardSection() {
  return (
    <section className="px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <FlipCardDemo />
          </Reveal>
          <div>
            <SectionHeading
              center={false}
              eyebrow="Learn & revise"
              title="The gap between practice and remembering."
              sub="Flashcards that adapt to what you forget. Click to flip, rate yourself, watch memory hold."
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── COMPARE ─── */

const COMPARE_ROWS = [
  { label: 'Real PYQs since 2014', us: 'Every paper, every shift', them: 'A few sample sets' },
  { label: 'NTA-exact interface', us: 'Pixel-faithful replica', them: 'Rough approximations' },
  { label: 'Works offline', us: '100% — no internet needed', them: 'Requires connection' },
  { label: 'Mock test series', us: '35 curated tests (Main + Advanced)', them: 'Generic sets' },
  { label: 'Price', us: '₹0 · free forever · no ads', them: '₹3,000 – ₹50,000 / yr' },
]

function Compare() {
  return (
    <section className="border-y border-border bg-surface/30 px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Built different"
          title="Everything they charge for. Ours is free."
        />
        <Reveal delay={0.15}>
          <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-border bg-surface2/60 text-[11px] font-bold uppercase tracking-wider text-text3">
              <div className="px-5 py-4" />
              <div className="flex items-center gap-2 px-5 py-4 text-primary"><Icon name="target" size={14} /> JEE Arena</div>
              <div className="px-5 py-4">Other apps</div>
            </div>
            {COMPARE_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-border text-[13px] last:border-0">
                <div className="px-5 py-4 font-semibold text-text">{row.label}</div>
                <div className="flex items-start gap-2 px-5 py-4 text-text2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Icon name="check" size={10} />
                  </span>
                  {row.us}
                </div>
                <div className="flex items-start gap-2 px-5 py-4 text-text3">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
                    <Icon name="x" size={10} />
                  </span>
                  {row.them}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── BIG NUMBERS ─── */

function BigNumbers() {
  const nums = [
    { to: 14600, suffix: '+', label: 'Real questions' },
    { to: 35, suffix: '', label: 'Mock tests' },
    { to: 64, suffix: '', label: 'Chapters' },
    { to: 186, suffix: '', label: 'Micro-topics' },
    { to: 100, suffix: '%', label: 'Offline' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-5">
        {nums.map((n) => (
          <div key={n.label} className="flex flex-col items-center gap-1 bg-surface px-4 py-10">
            <span className="text-4xl font-bold tracking-tight text-text sm:text-5xl">
              <CountUp to={n.to} suffix={n.suffix} />
            </span>
            <span className="text-center text-[12px] font-medium text-text3">{n.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── FAQ ─── */

const FAQ_ITEMS = [
  { q: 'Is JEE Arena really free?', a: 'Yes. Every mode, every question, every feature — completely free with no ads and no premium wall.' },
  { q: 'Does it need internet?', a: 'No. The full question bank installs into your browser on first launch. After that, everything runs 100% offline.' },
  { q: 'Which exams does it cover?', a: 'JEE Main and JEE Advanced — real papers since 2014 plus a large practice bank across 64 chapters.' },
  { q: 'How do I start?', a: 'Open the app and pick a mode. No account, no installation, no card details. Progress is saved on your device.' },
  { q: 'What is the mock test series?', a: '35 curated mock tests — 20 for JEE Main (Minor, Semi-Major, Major) and 15 for JEE Advanced (Sectional, Partial, Full).' },
  { q: 'Are you affiliated with NTA?', a: 'No. JEE Arena is an independent practice platform. JEE trademarks belong to their respective owners.' },
]

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 pb-24 sm:pb-32">
      <SectionHeading eyebrow="Questions" title="Answers, fast." />
      <div className="mt-12 space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <Reveal key={item.q} delay={Math.min(i * 0.06, 0.3)}>
            <details className="group rounded-2xl border border-border bg-surface transition-colors open:border-primary/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold text-text">
                {item.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-text3 transition-transform duration-300 group-open:rotate-45 group-open:border-primary group-open:text-primary">
                  <Icon name="plus" size={14} />
                </span>
              </summary>
              <p className="px-5 pb-5 text-[13px] leading-relaxed text-text2">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── FINAL CTA ─── */

function FinalCta() {
  const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden border-t border-border px-5 py-28 text-center sm:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, var(--primary) 0%, transparent 60%)', filter: 'blur(90px)' }} />
      <div className="relative mx-auto max-w-3xl">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Free forever
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tighter text-text sm:text-6xl md:text-7xl">
            Tomorrow&apos;s rank is built today.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-text2 sm:text-lg">
            The paper is fixed. Your preparation isn&apos;t. Open JEE Arena and take the closest thing to the real exam — right now.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <button
            onClick={() => navigate('/dashboard')}
            className="focus-ring mt-9 rounded-full bg-primary px-9 py-4 text-[16px] font-semibold text-white shadow-2xl shadow-primary/40 transition-all duration-200 hover:bg-primary2 active:scale-[0.97]"
          >
            Get Started — Free
          </button>
          <p className="mt-4 text-xs font-medium text-text3">No account · No install · No ads · No fees · Ever</p>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── FOOTER ─── */

type LegalKey = 'terms' | 'privacy' | 'disclaimer'

const LEGAL_DOCS = {
  terms: {
    title: 'Terms of Use',
    body: [
      'JEE Arena is provided free of charge, on an "as-is" and "as-available" basis, for personal, non-commercial practice and study purposes.',
      'By using JEE Arena you agree not to resell, redistribute or claim ownership of the questions, content or code.',
      'Your progress data is stored locally on your own device. We do not collect, store or transmit personal information.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'JEE Arena works fully offline. Your data is stored exclusively in your browser via IndexedDB and never leaves your device.',
      'No tracking cookies, no analytics scripts, no third-party advertising and no account registration are used.',
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    body: [
      'JEE Arena is an independent, non-commercial practice platform not affiliated with the National Testing Agency (NTA).',
      '"JEE", "JEE Main" and "JEE Advanced" are trademarks of their respective owners, used here solely for educational practice.',
      'No guarantee of marks, ranks or selection is expressed or implied.',
    ],
  },
}

function Footer() {
  const navigate = useNavigate()
  const [legal, setLegal] = useState<LegalKey | null>(null)

  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="focus-ring flex items-center gap-2.5 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
                <Icon name="target" size={19} />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-text">JEE Arena</span>
            </button>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-text2">
              The closest experience to the real JEE. Offline-first, free forever, built for aspirants who don&apos;t give themselves excuses.
            </p>
          </div>
          {[
            { title: 'Product', links: [{ label: 'Test Series', href: '#series' }, { label: 'Features', href: '#features' }, { label: 'FAQ', href: '#faq' }] },
            { title: 'Resources', links: [{ label: 'Flashcards', path: '/flashcards' }, { label: 'Mistake Notebook', path: '/mistakes' }] },
            { title: 'Legal', links: [{ label: 'Terms', legal: 'terms' as LegalKey }, { label: 'Privacy', legal: 'privacy' as LegalKey }, { label: 'Disclaimer', legal: 'disclaimer' as LegalKey }] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-text3">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {'href' in l ? (
                      <a href={l.href} className="text-[13px] text-text2 transition-colors hover:text-text">{l.label}</a>
                    ) : 'path' in l ? (
                      <button onClick={() => navigate(l.path)} className="focus-ring text-[13px] text-text2 transition-colors hover:text-text">{l.label}</button>
                    ) : (
                      <button onClick={() => setLegal(l.legal)} className="focus-ring text-[13px] text-text2 transition-colors hover:text-text">{l.label}</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-[11px] text-text3">
          <span>© {new Date().getFullYear()} JEE Arena. All rights reserved.</span>
          <span>Built offline-first · Works on any device · Made in India</span>
        </div>
      </div>
      <Modal open={legal !== null} onClose={() => setLegal(null)} title={legal ? LEGAL_DOCS[legal].title : ''} size="lg">
        <div className="space-y-4 text-sm leading-relaxed text-text2">
          {legal ? LEGAL_DOCS[legal].body.map((p) => <p key={p}>{p}</p>) : null}
        </div>
      </Modal>
    </footer>
  )
}

/* ─── SCROLL CHROME ─── */

function ScrollProgress() {
  const [scaleX, setScaleX] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setScaleX(h > 0 ? window.scrollY / h : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <div className="fixed inset-x-0 top-0 z-[80] h-[3px] origin-left bg-gradient-to-r from-primary to-info" style={{ transform: `scaleX(${scaleX})` }} />
}

function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="focus-ring fixed bottom-6 right-6 z-[80] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/90 text-text shadow-2xl backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
          aria-label="Back to top"
        >
          <Icon name="chevron-up" size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/* ─── LANDING PAGE ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <TestSeries />
        <SubjectsCoverage />
        <FeaturesGrid />
        <AnalyticsSection />
        <FlashcardSection />
        <Compare />
        <BigNumbers />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}
