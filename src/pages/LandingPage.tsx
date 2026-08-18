import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion'
import { Icon, Modal, type IconName } from '@/components/ui'
import { TEST_MODES } from '@/constants/modes'
import { cn } from '@/utils/cn'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * The single brand accent used for emphasized phrases across sections.
 * One consistent treatment — not a different rainbow per section.
 */
const ACCENT = 'bg-gradient-to-r from-primary to-info bg-clip-text text-transparent'

function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
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

function TiltCard({
  children,
  className,
  intensity = 7,
}: {
  children: ReactNode
  className?: string
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [style, setStyle] = useState<CSSProperties>({})

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setStyle({
      transform: `perspective(1000px) rotateX(${(-py * intensity).toFixed(2)}deg) rotateY(${(px * intensity).toFixed(2)}deg) translateZ(0)`,
    })
  }
  const onLeave = () => setStyle({})

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.25s ease-out', ...style }}
      className={className}
    >
      {children}
    </div>
  )
}

function CountUp({
  to,
  suffix = '',
  decimals = 0,
  className,
}: {
  to: number
  suffix?: string
  decimals?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const duration = 1800
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString('en-IN', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

function MagneticButton({
  children,
  className,
  onClick,
  strength = 0.22,
  type = 'button',
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  strength?: number
  type?: 'button' | 'submit'
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()
  const [style, setStyle] = useState<CSSProperties>({})

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduce) return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    setStyle({ transform: `translate(${dx * strength}px, ${dy * strength}px)` })
  }
  const onLeave = () => setStyle({})

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
        ...style,
      }}
      className={className}
    >
      {children}
    </button>
  )
}

function FloatingBadge({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -9, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay }}
      className={cn('pointer-events-none absolute z-10 hidden lg:block', className)}
    >
      {children}
    </motion.div>
  )
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: IconName
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface/70 px-4 py-2 backdrop-blur">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Icon name={icon} size={13} />
      </span>
      <span className="text-[12px] font-semibold text-text">
        {value}
        <span className="ml-1 font-medium text-text3">{label}</span>
      </span>
    </div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </span>
  )
}

function SectionHeading({
  eyebrow,
  title,
  sub,
  center = true,
}: {
  eyebrow: string
  title: ReactNode
  sub?: string
  center?: boolean
}) {
  return (
    <Reveal className={cn('max-w-3xl', center && 'mx-auto text-center')}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-3xl font-bold leading-[1.08] tracking-tight text-text sm:text-5xl">
        {title}
      </h2>
      {sub ? <p className="mt-5 text-base leading-relaxed text-text2 sm:text-lg">{sub}</p> : null}
    </Reveal>
  )
}

/* ---------------------------------- NAV ---------------------------------- */

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
    { label: 'Modes', href: '#modes' },
    { label: 'Features', href: '#features' },
    { label: 'Why us', href: '#compare' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-border bg-bg/70 backdrop-blur-xl' : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="focus-ring flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary2 shadow-lg shadow-primary/30">
            <Icon name="target" size={19} className="text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-text">JEE Arena</span>
        </button>

        <nav className="hidden items-center gap-8 text-[13px] font-medium text-text2 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-text">
              {l.label}
            </a>
          ))}
        </nav>

        <button
          onClick={() => navigate('/dashboard')}
          className="focus-ring rounded-full bg-primary px-4.5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary2 hover:shadow-primary/40 active:scale-[0.97]"
        >
          Open App
        </button>
      </div>
    </motion.header>
  )
}

/* ------------------------------ TEST MOCKUP ------------------------------ */

const PALETTE_CELLS = Array.from({ length: 60 }, (_, i) => {
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
    <div className="relative w-[min(1000px,94vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 border-b border-border bg-surface2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-surface3 px-3 py-1 text-[11px] text-text3">
          <Icon name="shield" size={11} />
          jeearena.app/test/full
        </div>
        <span className="w-14" />
      </div>

      <div className="flex">
        <div className="min-w-0 flex-1 p-4 text-left sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text3">
              Physics · Mechanics · Q18 of 75
            </span>
            <span className="rounded-md bg-danger/15 px-2 py-0.5 font-mono text-[11px] font-bold text-danger">
              12:42
            </span>
          </div>
          <p className="text-[13px] font-medium leading-relaxed text-text">
            A block of mass 2 kg is released from rest on a frictionless incline of 30°. Find the
            speed of the block after it has moved 5 m down the incline. (g = 10 m/s²)
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {options.map((opt, i) => {
              const active = i === 1
              return (
                <div
                  key={opt}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface2 text-text2',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold',
                      active ? 'border-primary bg-primary text-white' : 'border-border2 text-text3',
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {active ? <Icon name="check" size={13} className="ml-auto" /> : null}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-text3">
            <span>
              Marked for review: <span className="font-semibold text-warning">2</span> · Answered:{' '}
              <span className="font-semibold text-success">43</span>
            </span>
            <span className="hidden font-mono sm:inline">K · M · S · P shortcuts</span>
          </div>
        </div>

        <div className="hidden w-44 shrink-0 border-l border-border bg-surface2/50 p-3 sm:block">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text3">Palette</p>
          <div className="grid grid-cols-5 gap-1">
            {PALETTE_CELLS.map((c, i) => (
              <span
                key={i}
                className="flex h-5 items-center justify-center rounded text-[9px] font-semibold text-white"
                style={{ backgroundColor: CELL_COLOR[c] }}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 text-[10px] text-text2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-answered)]" /> Answered
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-marked)]" /> Marked
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-current)]" /> Current
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsMockup({ animated = false }: { animated?: boolean }) {
  const bars = [42, 58, 47, 66, 61, 74, 70, 82, 79, 91]
  const last = bars.length - 1
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.55)]">
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
        {bars.map((h, i) => {
          const cls = cn(
            'flex-1 rounded-t-md',
            i === last ? 'bg-gradient-to-t from-primary to-[#8ab6ff]' : 'bg-surface3',
          )
          return animated ? (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: EASE }}
              className={cls}
            />
          ) : (
            <div key={i} className={cls} style={{ height: `${h}%` }} />
          )
        })}
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

function FlashcardMockup() {
  return (
    <div className="relative w-full rounded-2xl border border-border bg-surface p-5 text-center shadow-[0_30px_90px_-20px_rgba(0,0,0,0.55)]">
      <div className="mb-3 flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-text3">
        <Icon name="flashcard" size={12} /> Physics · Rotational Motion
      </div>
      <p className="font-serif text-2xl font-semibold tracking-tight text-text">τ = I α</p>
      <p className="mt-1 text-xs text-text2">Torque = Moment of inertia × Angular acceleration</p>
      <div className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
        <Icon name="refresh" size={12} /> Tap to flip
      </div>
    </div>
  )
}

/* ------------------------------ HERO DEMO DATA ------------------------------ */

const HERO_QUESTIONS: Array<{
  subject: string
  text: string
  options: string[]
  answer: number
  hint: string
}> = [
  {
    subject: 'Physics · Mechanics',
    text: 'A 2 kg block slides from rest down a frictionless 30° incline. Its speed after moving 5 m is… (g = 10 m/s²)',
    options: ['5 m/s', '7 m/s', '√50 m/s', '10 m/s'],
    answer: 2,
    hint: 'a = g·sin30° → v² = 2as',
  },
  {
    subject: 'Chemistry · Equilibrium',
    text: 'For CO(g) + H₂O(g) ⇌ CO₂(g) + H₂(g), at equilibrium [CO]=0.1 M, [H₂O]=0.2 M, [CO₂]=0.4 M, [H₂]=0.5 M. Kc = ?',
    options: ['4', '10', '20', '100'],
    answer: 1,
    hint: 'Kc = [CO₂][H₂] / [CO][H₂O]',
  },
  {
    subject: 'Maths · Calculus',
    text: 'How many local maxima does f(x) = x³ − 3x² + 2 have?',
    options: ['1', '0', '2', '3'],
    answer: 0,
    hint: 'f′(x) = 3x(x − 2) → sign change at x = 0',
  },
  {
    subject: 'Physics · Momentum',
    text: 'A 2 kg ball moving at 4 m/s hits a stationary 2 kg ball dead-centre elastically. The first stops. The second now moves at…',
    options: ['2 m/s', '4 m/s', '8 m/s', '0 m/s'],
    answer: 1,
    hint: 'Equal masses, elastic collision → velocities swap',
  },
]

function DemoTestView() {
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const q = HERO_QUESTIONS[qIndex]!
  const answered = selected !== null
  const correct = answered && selected === q.answer

  useEffect(() => {
    if (paused || answered) return
    const t = window.setTimeout(
      () => setQIndex((i) => (i + 1) % HERO_QUESTIONS.length),
      3600,
    )
    return () => window.clearTimeout(t)
  }, [paused, answered, qIndex])

  const choose = (i: number) => {
    if (answered) return
    setSelected(i)
    window.setTimeout(() => {
      setSelected(null)
      setQIndex((prev) => (prev + 1) % HERO_QUESTIONS.length)
    }, 1500)
  }

  const palette = Array.from({ length: 15 }, (_, i) =>
    i === qIndex ? 'current' : i < qIndex ? 'answered' : 'notvisited',
  ) as Array<'current' | 'answered' | 'marked' | 'notvisited'>

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="flex"
    >
      <div className="min-w-0 flex-1 p-4 text-left sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text3">
            {q.subject} · Q{String(qIndex + 1).padStart(2, '0')} of {HERO_QUESTIONS.length}
          </span>
          <span className="rounded-md bg-danger/15 px-2 py-0.5 font-mono text-[11px] font-bold text-danger">
            12:42
          </span>
        </div>

        <div className="min-h-[3.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={qIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="text-[13px] font-medium leading-relaxed text-text"
            >
              {q.text}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer
            const isPicked = i === selected
            const state = answered
              ? isAnswer
                ? 'correct'
                : isPicked
                  ? 'wrong'
                  : 'idle'
              : 'idle'
            return (
              <button
                key={opt}
                onClick={() => choose(i)}
                disabled={answered}
                aria-pressed={isPicked}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors',
                  state === 'correct' && 'border-success bg-success/10 text-success',
                  state === 'wrong' && 'border-danger bg-danger/10 text-danger',
                  state === 'idle' &&
                    'cursor-pointer border-border bg-surface2 text-text2 hover:border-primary/40 hover:text-text',
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
                {state === 'correct' ? <Icon name="check" size={13} className="ml-auto" /> : null}
                {state === 'wrong' ? <Icon name="x" size={13} className="ml-auto" /> : null}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-text3">
          <span
            className={cn(
              'transition-colors',
              answered && (correct ? 'text-success' : 'text-danger'),
            )}
          >
            {answered ? (correct ? 'Correct — ' : 'Not quite — ') : 'K · M · S shortcuts · '}
            {answered ? q.hint : 'Marked 2 · Answered 43'}
          </span>
        </div>
      </div>

      <div className="hidden w-36 shrink-0 border-l border-border bg-surface2/50 p-3 sm:block">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text3">Palette</p>
        <div className="grid grid-cols-5 gap-1">
          {palette.map((c, i) => (
            <span
              key={i}
              className="flex h-5 items-center justify-center rounded text-[9px] font-semibold text-white"
              style={{ backgroundColor: CELL_COLOR[c] }}
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 text-[10px] text-text2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-answered)]" /> Answered
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-marked)]" /> Marked
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--palette-current)]" /> Current
          </div>
        </div>
      </div>
    </div>
  )
}

const HERO_CARDS = [
  { front: 'τ = I α', back: 'Torque = Moment of inertia × Angular acceleration' },
  { front: 'E = h f', back: 'Photon energy = Planck constant × Frequency' },
  { front: 'F = m a', back: 'Force = Mass × Acceleration' },
]

function DemoFlashcardView() {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = HERO_CARDS[idx]!

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!flipped) setFlipped(true)
      else {
        setFlipped(false)
        setIdx((i) => (i + 1) % HERO_CARDS.length)
      }
    }, flipped ? 2600 : 2200)
    return () => window.clearTimeout(t)
  }, [flipped, idx])

  return (
    <div className="flex flex-col items-center justify-center p-5" style={{ perspective: '1000px' }}>
      <button
        onClick={() => setFlipped((f) => !f)}
        aria-label="Flashcard preview — flip"
        className="w-full max-w-sm focus-ring"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative h-44 w-full rounded-2xl border border-border bg-surface text-center shadow-[0_30px_90px_-20px_rgba(0,0,0,0.55)]"
        >
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl p-5"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-text3">
              Physics · Rotational Motion
            </span>
            <span className="font-serif text-3xl font-semibold tracking-tight text-text">
              {card.front}
            </span>
            <span className="text-[11px] text-text3">Tap to reveal</span>
          </div>
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary/10 to-primary2/10 p-5"
          >
            <span className="text-[12px] leading-relaxed text-text">{card.back}</span>
          </div>
        </motion.div>
      </button>
      <div className="mt-4 flex items-center gap-1.5">
        {HERO_CARDS.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === idx ? 'w-5 bg-primary' : 'w-1.5 bg-surface3',
            )}
          />
        ))}
      </div>
    </div>
  )
}

function DemoAnalyticsView() {
  return (
    <div className="p-4 sm:p-5">
      <AnalyticsMockup animated />
    </div>
  )
}

const HERO_TABS = [
  { id: 'test', label: 'Test', icon: 'test' as IconName },
  { id: 'analytics', label: 'Analytics', icon: 'line-chart' as IconName },
  { id: 'flashcards', label: 'Flashcards', icon: 'flashcard' as IconName },
]
type HeroTab = (typeof HERO_TABS)[number]['id']
const HERO_TAB_IDS = HERO_TABS.map((t) => t.id) as HeroTab[]

function HeroMockup() {
  const [tab, setTab] = useState<HeroTab>('test')
  const [interacted, setInteracted] = useState(false)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-10% 0px -10% 0px' })

  const autoRotate = inView && !hovered && !interacted

  useEffect(() => {
    if (!autoRotate) return
    const next = HERO_TAB_IDS[(HERO_TAB_IDS.indexOf(tab) + 1) % HERO_TAB_IDS.length]!
    const t = window.setTimeout(() => setTab(next), 6500)
    return () => window.clearTimeout(t)
  }, [autoRotate, tab])

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative w-[min(840px,94vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-surface3 px-3 py-1 text-[11px] text-text3">
          <Icon name="shield" size={11} />
          jeearena.app
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          Live demo
        </span>
      </div>

      <div className="flex items-end gap-1 border-b border-border bg-surface2/60 px-3">
        {HERO_TAB_IDS.map((t) => {
          const meta = HERO_TABS.find((x) => x.id === t)!
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setInteracted(true)
              }}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3.5 pb-2 pt-2.5 text-[11px] font-semibold transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text3 hover:text-text2',
              )}
            >
              <Icon name={meta.icon} size={13} />
              {meta.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="min-h-[290px]"
        >
          {tab === 'test' ? (
            <DemoTestView />
          ) : tab === 'analytics' ? (
            <DemoAnalyticsView />
          ) : (
            <DemoFlashcardView />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* --------------------------------- HERO COPY -------------------------------- */

function HeroCopy() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-4xl text-center">
      <Reveal y={16}>
        <Eyebrow>Built for JEE Main & Advanced</Eyebrow>
      </Reveal>
      <motion.h1
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
        className="mt-6 text-5xl font-bold leading-[1.04] tracking-tighter text-text sm:text-7xl md:text-[80px]"
      >
        The closest thing
        <br />
        to the <span className={ACCENT}>real JEE.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
        className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text2 sm:text-lg"
      >
        Every real PYQ since 2014. The exact NTA interface. An adaptive engine that learns your
        weak points. Analytics that tell you what to fix. All of it — free, offline, forever.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
        className="mt-7 flex flex-wrap items-center justify-center gap-2.5"
      >
        <StatChip icon="file" label="real PYQs" value={<CountUp to={14600} suffix="+" />} />
        <StatChip icon="book" label="chapters covered" value={<CountUp to={64} />} />
        <StatChip icon="battery" label="offline" value={<CountUp to={100} suffix="%" />} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <MagneticButton
          onClick={() => navigate('/dashboard')}
          className="focus-ring rounded-full bg-primary px-7 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-primary/30 transition-colors duration-200 hover:bg-primary2 hover:shadow-primary/45"
        >
          Start Practicing — Free
        </MagneticButton>
        <a
          href="#how"
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-border2 px-7 py-3.5 text-[15px] font-semibold text-text transition-all duration-200 hover:border-primary/40 hover:bg-surface2"
        >
          See how it works
          <Icon name="arrow-right" size={16} />
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
  )
}

function HeroStatic() {
  return (
    <section className="relative overflow-hidden px-5 pb-28 pt-32 sm:pb-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 45% at 50% -5%, var(--primary) 0%, transparent 55%), radial-gradient(ellipse 50% 35% at 85% 20%, var(--accent) 0%, transparent 55%), radial-gradient(ellipse 55% 40% at 12% 25%, var(--info) 0%, transparent 55%)',
          filter: 'blur(90px)',
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <HeroCopy />
        <div className="mt-16 flex justify-center">
          <HeroMockup />
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------- HERO --------------------------------- */

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28 })

  const textY = useTransform(smooth, [0, 0.22], [0, -110])
  const textOpacity = useTransform(smooth, [0, 0.16], [1, 0])
  const hintOpacity = useTransform(smooth, [0, 0.05], [1, 0])
  const mockY = useTransform(smooth, [0, 0.5, 0.85, 1], [220, 0, -70, -130])
  const mockScale = useTransform(smooth, [0, 0.55, 1], [0.85, 1, 1.5])
  const mockOpacity = useTransform(smooth, [0.04, 0.16, 0.75, 0.92], [0, 1, 1, 0])

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = glowRef.current
    const r = ref.current?.getBoundingClientRect()
    if (!el || !r) return
    el.style.background = `radial-gradient(560px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 65%)`
  }

  if (reduce) return <HeroStatic />

  return (
    <section ref={ref} onMouseMove={onMouseMove} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-5 pt-16">
        <motion.div
          style={{ scaleX: smooth }}
          className="absolute inset-x-0 top-0 z-40 h-[2px] origin-left bg-gradient-to-r from-primary to-info"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 45% at 50% -5%, var(--primary) 0%, transparent 55%), radial-gradient(ellipse 50% 35% at 85% 20%, var(--accent) 0%, transparent 55%), radial-gradient(ellipse 55% 40% at 12% 25%, var(--info) 0%, transparent 55%)',
            filter: 'blur(90px)',
          }}
        />
        <div aria-hidden ref={glowRef} className="pointer-events-none absolute inset-0 opacity-70" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: 'radial-gradient(var(--border-2) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(ellipse 60% 55% at 50% 40%, black 0%, transparent 70%)',
          }}
        />

        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10">
          <HeroCopy />
        </motion.div>

        <motion.div
          style={{ y: mockY, scale: mockScale, opacity: mockOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex origin-bottom justify-center pb-6"
        >
          <div className="relative w-full max-w-[920px]">
            <div className="pointer-events-auto mx-auto w-full max-w-[840px]">
              <TiltCard intensity={3}>
                <HeroMockup />
              </TiltCard>
            </div>
            <FloatingBadge className="left-0 top-[18%]" delay={0.3}>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/85 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success">
                  <Icon name="trending-up" size={14} />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-text">Accuracy 86.4%</p>
                  <p className="text-[10px] text-text3">+11.2% this week</p>
                </div>
              </div>
            </FloatingBadge>
            <FloatingBadge className="right-0 top-[8%]" delay={0.9}>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/85 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <Icon name="flame" size={14} />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-text">12-day streak</p>
                  <p className="text-[10px] text-text3">Practice daily</p>
                </div>
              </div>
            </FloatingBadge>
            <FloatingBadge className="right-[7%] bottom-[10%]" delay={1.5}>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/85 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon name="flashcard" size={14} />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-text">Flashcards</p>
                  <p className="text-[10px] text-success">● spaced repetition</p>
                </div>
              </div>
            </FloatingBadge>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 sm:block"
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-[11px] font-semibold text-text2 backdrop-blur">
            <Icon name="chevron-down" size={13} className="animate-bounce text-primary" />
            Scroll to explore
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* --------------------------------- MARQUEE -------------------------------- */

const MARQUEE_ITEMS = [
  'NTA-replica interface',
  'Real PYQs since 2014',
  'Works fully offline',
  'Adaptive difficulty engine',
  'Free forever — no ads',
  'Mistake notebook',
  'Speed tests & marathons',
]

function Marquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="group relative overflow-hidden border-y border-border bg-surface/50 py-5">
      <div className="flex w-max animate-marquee items-center gap-10 group-hover:[animation-play-state:paused]">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10 text-[13px] font-semibold text-text3">
            {item}
            <Icon name="sparkles" size={13} className="text-primary" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------ SCROLL JACK ------------------------------ */

const JOURNEY_STEPS: Array<{
  n: string
  tag: string
  headline: ReactNode
  desc: string
  accent: string
  bullets: Array<{ icon: IconName; label: string }>
  visual: 'test' | 'detect' | 'fix' | 'master'
}> = [
  {
    n: '01',
    tag: 'Practice',
    headline: (
      <>
        Every real question.
        <br />
        <span className="text-[#60a5fa]">Every single mode.</span>
      </>
    ),
    desc: 'Full NTA-replica papers, chapter drills, PYQs since 2014, marathons and speed runs. The mode you need is already here — pick one and go.',
    accent: '#60a5fa',
    bullets: [
      { icon: 'pyq', label: 'Real PYQs — every shift since 2014' },
      { icon: 'keyboard', label: 'Pixel-faithful NTA interface' },
      { icon: 'layers', label: '15 practice modes, one tap away' },
    ],
    visual: 'test',
  },
  {
    n: '02',
    tag: 'Detect',
    headline: (
      <>
        Analytics find
        <br />
        <span className="text-[#a78bfa]">the exact gap.</span>
      </>
    ),
    desc: 'Every answer is scored live. Accuracy, speed, attempt rate, chapter heatmaps — the engine knows precisely what is costing you marks.',
    accent: '#a78bfa',
    bullets: [
      { icon: 'line-chart', label: 'Chapter-level accuracy heatmaps' },
      { icon: 'percent', label: 'Why you lose marks, in plain data' },
      { icon: 'trending-up', label: 'Progress you can actually see' },
    ],
    visual: 'detect',
  },
  {
    n: '03',
    tag: 'Fix',
    headline: (
      <>
        Revise exactly
        <br />
        <span className="text-[#fbbf24]">what you missed.</span>
      </>
    ),
    desc: 'Mistakes become flashcards. Weak chapters become tests. The platform helps you revise exactly what you missed — nothing else.',
    accent: '#fbbf24',
    bullets: [
      { icon: 'mistake', label: 'Mistake notebook, built automatically' },
      { icon: 'flashcard', label: 'Spaced repetition on your weak spots' },
      { icon: 'refresh', label: 'Auto re-attempt of weak chapters' },
    ],
    visual: 'fix',
  },
  {
    n: '04',
    tag: 'Master',
    headline: (
      <>
        Watch the line
        <br />
        <span className="text-[#2fd87f]">keep going up.</span>
      </>
    ),
    desc: 'Streaks, daily goals, smart re-attempts. The loop closes on itself — every day the engine has a sharper picture of what you need.',
    accent: '#2fd87f',
    bullets: [
      { icon: 'flame', label: 'Streaks and daily targets' },
      { icon: 'refresh', label: 'Auto re-attempt of weak chapters' },
      { icon: 'award', label: 'Rank-ready by exam day' },
    ],
    visual: 'master',
  },
]

function JourneyTestVisual() {
  const options = ['5 m/s', '7 m/s', '√50 m/s', '10 m/s']
  const cells = Array.from({ length: 15 }, (_, i) =>
    i === 7 ? 'current' : i % 3 === 0 ? 'answered' : i % 5 === 1 ? 'marked' : 'notvisited',
  ) as Array<'current' | 'answered' | 'marked' | 'notvisited'>
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface/80 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text3">
            Physics · Mechanics
          </p>
          <p className="mt-1 text-[11px] text-text3">Q08 of 75</p>
        </div>
        <span className="rounded-md bg-danger/15 px-2 py-0.5 font-mono text-[11px] font-bold text-danger">
          12:42
        </span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {cells.map((c, i) => (
          <span
            key={i}
            className="flex h-6 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: CELL_COLOR[c] }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {options.map((opt, i) => {
          const active = i === 1
          return (
            <div
              key={opt}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] font-medium',
                active
                  ? 'border-[#60a5fa] bg-[#60a5fa]/10 text-text'
                  : 'border-border bg-surface2 text-text2',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold',
                  active
                    ? 'border-[#60a5fa] bg-[#60a5fa] text-white'
                    : 'border-border2 text-text3',
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {active ? <Icon name="check" size={12} className="ml-auto text-[#60a5fa]" /> : null}
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] text-text3">
        <span>Answered 43 · Marked 2</span>
        <span className="font-mono">K · M · S shortcuts</span>
      </div>
    </div>
  )
}

function JourneyDetectVisual() {
  const bars = [42, 58, 47, 66, 61, 74, 70, 82, 79, 91]
  const last = bars.length - 1
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface/80 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text3">Accuracy</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-text">86.4%</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#a78bfa]/15 px-2.5 py-1 text-[11px] font-bold text-[#a78bfa]">
          <Icon name="trending-up" size={13} /> +11.2%
        </span>
      </div>
      <div className="mt-4 flex h-24 items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: EASE }}
            className={cn('flex-1 rounded-t-md', i === last ? 'bg-[#a78bfa]' : 'bg-surface3')}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Attempt rate', value: '94%' },
          { label: 'Time/q', value: '68s' },
          { label: 'Weakest', value: 'Thermo' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface2 p-2.5 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-text3">{s.label}</p>
            <p className="mt-0.5 text-[13px] font-bold text-text">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function JourneyFixVisual() {
  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <div className="rounded-2xl border border-border bg-surface/80 p-5 text-center shadow-2xl backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text3">
          Flashcard · Rotational Motion
        </p>
        <p className="mt-3 font-serif text-3xl font-semibold tracking-tight text-text">τ = I α</p>
        <p className="mt-1 text-xs text-text2">
          Torque = Moment of inertia × Angular acceleration
        </p>
        <div className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full bg-[#fbbf24]/10 px-3 py-1 text-[11px] font-semibold text-[#fbbf24]">
          <Icon name="refresh" size={12} /> Tap to flip
        </div>
      </div>
    </div>
  )
}

function JourneyMasterVisual() {
  const navigate = useNavigate()
  const bars = [38, 45, 52, 58, 64, 71, 78, 86]
  const last = bars.length - 1
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface/80 p-5 text-center shadow-2xl backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text3">
        Accuracy trajectory
      </p>
      <div className="mt-4 flex h-28 items-end justify-center gap-1.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: EASE }}
            className="w-7 rounded-t-md"
            style={{
              background: i === last ? 'linear-gradient(180deg, #2fd87f, #179b55)' : 'var(--surface-3)',
            }}
          />
        ))}
      </div>
      <p className="mt-4 text-4xl font-bold tracking-tight text-text">
        86<span className="text-[#2fd87f]">.4%</span>
        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#2fd87f]/15 px-2.5 py-1 align-middle text-[11px] font-bold text-[#2fd87f]">
          <Icon name="trending-up" size={12} /> +11.2%
        </span>
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="focus-ring mt-5 w-full rounded-full bg-[#2fd87f] px-6 py-3 text-sm font-bold text-black transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
      >
        Start the method — free
      </button>
      <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-text3">
        No account · No install · No ads
      </p>
    </div>
  )
}

function JourneyPanel({
  step,
  index,
  progress,
  active,
  children,
}: {
  step: (typeof JOURNEY_STEPS)[number]
  index: number
  progress: MotionValue<number>
  active: boolean
  children: ReactNode
}) {
  const isFirst = index === 0
  const isLast = index === JOURNEY_STEPS.length - 1
  const input = isFirst
    ? [0, 0.5]
    : isLast
      ? [JOURNEY_STEPS.length - 1.5, JOURNEY_STEPS.length - 1]
      : [index - 0.5, index, index + 0.5]
  const opacity = useTransform(
    progress,
    input,
    isFirst ? [1, 0] : isLast ? [0, 1] : [0, 1, 0],
  )
  const y = useTransform(
    progress,
    input,
    isFirst ? [0, -64] : isLast ? [64, 0] : [64, 0, -64],
  )
  const scale = useTransform(
    progress,
    input,
    isFirst ? [1, 0.95] : isLast ? [0.95, 1] : [0.95, 1, 0.95],
  )

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        data-journey-panel
        style={{ opacity, y, scale }}
        className={cn('flex h-full items-center', active && 'pointer-events-auto')}
      >
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold" style={{ color: step.accent }}>
                {step.n}
              </span>
              <span className="h-px w-10" style={{ backgroundColor: step.accent }} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: step.accent }}
              >
                {step.tag}
              </span>
            </div>
            <h2 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-text sm:text-5xl md:text-6xl">
              {step.headline}
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-text2 sm:text-base">
              {step.desc}
            </p>
            <ul className="mt-7 space-y-3">
              {step.bullets.map((b) => (
                <li key={b.label} className="flex items-center gap-3 text-sm font-medium text-text">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: step.accent, boxShadow: `0 6px 16px -4px ${step.accent}88` }}
                  >
                    <Icon name={b.icon} size={12} />
                  </span>
                  {b.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden lg:block">{children}</div>
        </div>
      </motion.div>
    </div>
  )
}

function JourneyRail({
  active,
  progress,
}: {
  active: number
  progress: MotionValue<number>
}) {
  const fill = useTransform(progress, [0, 1], ['0%', '100%'])
  return (
    <div
      data-journey-rail
      className="pointer-events-none absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 sm:block lg:left-7"
    >
      <div className="relative h-64 w-px overflow-hidden rounded-full bg-surface3">
        <motion.div
          style={{
            height: fill,
            background: 'linear-gradient(180deg, #60a5fa, #a78bfa, #fbbf24, #2fd87f)',
          }}
          className="absolute inset-x-0 top-0 rounded-full"
        />
      </div>
      <div className="absolute -left-[5px] top-0 flex h-64 flex-col justify-between">
        {JOURNEY_STEPS.map((s, i) => (
          <span
            key={s.n}
            className={cn(
              'h-3 w-3 rounded-full ring-4 ring-bg transition-all duration-300',
              active === i && 'scale-125',
            )}
            style={{ backgroundColor: active === i ? s.accent : 'var(--surface-3)' }}
          />
        ))}
      </div>
    </div>
  )
}

function ScrollJourney() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const raw = useTransform(scrollYProgress, (v) =>
    Math.min(JOURNEY_STEPS.length, Math.max(0, v * JOURNEY_STEPS.length)),
  )
  const smooth = useSpring(raw, { stiffness: 110, damping: 26, mass: 0.5 })
  const [active, setActive] = useState(0)
  const hintOpacity = useTransform(smooth, [0, 0.3], [1, 0])

  useMotionValueEvent(smooth, 'change', (v) => {
    const next = Math.max(0, Math.min(JOURNEY_STEPS.length - 1, Math.round(v - 0.5)))
    setActive((prev) => (prev === next ? prev : next))
  })

  if (reduce) {
    return (
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:py-32">
        <SectionHeading
          eyebrow="The method"
          title={
            <>
              Practice. Detect. Fix. Repeat.
              <br />
              <span className={ACCENT}>
                until the paper feels easy.
              </span>
            </>
          }
          sub="Four steps that loop until exam day — every one of them automated inside the app."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {JOURNEY_STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold" style={{ color: s.accent }}>
                  {s.n}
                </span>
                <span className="h-px w-10" style={{ backgroundColor: s.accent }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: s.accent }}
                >
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-text">{s.headline}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-text2">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} id="how" className="relative" style={{ height: '520vh' }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-5">
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-[11px] font-semibold text-text2 backdrop-blur">
            The method — scroll to move through it
            <Icon name="chevron-down" size={12} className="animate-bounce text-primary" />
          </div>
        </motion.div>

        <JourneyRail active={active} progress={smooth} />

        <div className="relative mx-auto h-full w-full max-w-6xl lg:pl-16">
          {JOURNEY_STEPS.map((s, i) => (
            <JourneyPanel key={s.n} step={s} index={i} progress={smooth} active={active === i}>
              {s.visual === 'test' ? (
                <JourneyTestVisual />
              ) : s.visual === 'detect' ? (
                <JourneyDetectVisual />
              ) : s.visual === 'fix' ? (
                <JourneyFixVisual />
              ) : (
                <JourneyMasterVisual />
              )}
            </JourneyPanel>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-surface3">
          <motion.div
            style={{
              scaleX: scrollYProgress,
              transformOrigin: 'left',
              background: 'linear-gradient(90deg, var(--primary), var(--info))',
            }}
            className="h-full"
          />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- MODES GRID ------------------------------- */

function ModesGrid() {
  const navigate = useNavigate()
  return (
    <section id="modes" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:py-32">
      <SectionHeading
        eyebrow="15 ways to train"
        title={
          <>
            One platform.
            <br />
            <span className={ACCENT}>
              Every way to practice.
            </span>
          </>
        }
        sub="From a full NTA replica paper to a 10-question daily sprint — the mode you need, exactly when you need it."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEST_MODES.map((m, i) => (
          <Reveal key={m.id} delay={Math.min(i * 0.05, 0.4)}>
            <button
              onClick={() => navigate(m.path)}
              className="group flex h-full w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface2/60 hover:shadow-lg hover:shadow-black/20"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: `${m.color}1f`, color: m.color }}
              >
                <Icon name={m.icon as IconName} size={21} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-text">{m.name}</p>
                  {m.badge ? (
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                      {m.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text2">{m.description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Try it <Icon name="arrow-right" size={13} />
              </span>
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------- SUBJECT COVERAGE ---------------------------- */

const SUBJECTS: Array<{
  name: string
  count: number
  chapters: number
  pct: number
  color: string
  topics: string[]
}> = [
  {
    name: 'Physics',
    count: 5200,
    chapters: 22,
    pct: 92,
    color: '#60a5fa',
    topics: ['Mechanics', 'Thermo', 'Optics', 'Modern'],
  },
  {
    name: 'Chemistry',
    count: 4800,
    chapters: 20,
    pct: 88,
    color: '#a78bfa',
    topics: ['Physical', 'Organic', 'Inorganic'],
  },
  {
    name: 'Mathematics',
    count: 4600,
    chapters: 22,
    pct: 95,
    color: '#fbbf24',
    topics: ['Algebra', 'Calculus', 'Vectors', 'Coordinate'],
  },
]

function SubjectBar({ s, index }: { s: (typeof SUBJECTS)[number]; index: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-primary/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          <p className="text-[15px] font-bold text-text">{s.name}</p>
        </div>
        <p className="text-[13px] font-semibold text-text2">
          <span className="text-text">
            <CountUp to={s.count} />
          </span>{' '}
          questions
        </p>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface3">
        <motion.div
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width: `${s.pct}%` }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 1.1, ease: EASE, delay: index * 0.12 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${s.color}, #8ab6ff)` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {s.topics.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-text3"
            >
              {t}
            </span>
          ))}
        </div>
        <span className="text-[11px] font-medium text-text3">
          {s.chapters} chapters · {s.pct}% of syllabus
        </span>
      </div>
    </div>
  )
}

function SubjectsCoverage() {
  return (
    <section className="border-y border-border bg-surface/30 px-5 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading
            center={false}
            eyebrow="Full syllabus"
            title={
              <>
                Every chapter.
                <br />
                <span className={ACCENT}>
                  Every micro-topic.
                </span>
              </>
            }
            sub="64 chapters and 186 micro-topics across Physics, Chemistry and Mathematics — every NTA topic with real questions, not approximations."
          />
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: 'check-circle' as IconName, label: 'Organised by NTA syllabus' },
                { icon: 'refresh' as IconName, label: 'Updated with every shift' },
                { icon: 'calculator' as IconName, label: 'Every answer solved' },
              ].map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[12px] font-semibold text-text2"
                >
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
              <SubjectBar s={s} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- FULL TEST FEATURE --------------------------- */

function FullTestFeature() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.6], [reduce ? 1 : 0.78, reduce ? 1 : 1.15])
  const rotateX = useTransform(scrollYProgress, [0, 0.6], [reduce ? 0 : 18, 0])
  const y = useTransform(scrollYProgress, [0, 1], [60, -40])

  return (
    <section
      ref={ref}
      id="features"
      className="relative scroll-mt-24 overflow-hidden px-5 py-24 sm:py-36"
      style={{ perspective: '1500px' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, var(--primary) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
      />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Full-length tests"
          title={
            <>
              Walk into the exam
              <br />
              <span className={ACCENT}>
                before the exam.
              </span>
            </>
          }
          sub="Every interface element — the palette, the marking scheme, the shortcuts, the timer — is rebuilt to match the real NTA screen. When you sit for the actual paper, you'll have already taken it."
        />

        <motion.div
          style={{ scale, rotateX, y }}
          className="mx-auto mt-14 w-fit origin-top"
        >
          <TestRunnerMockup />
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------ FEATURES GRID ------------------------------ */

const FEATURES: Array<{
  icon: IconName
  title: string
  desc: string
  accent: string
}> = [
  {
    icon: 'wifi-off',
    title: 'Offline-first engine',
    desc: 'The entire question bank lives in your browser. Full tests, flashcards and notebooks run at full speed with zero internet — even on a train or in a hostel with no Wi-Fi.',
    accent: '#38bdf8',
  },
  {
    icon: 'adaptive',
    title: 'Adaptive engine',
    desc: 'Every answer you give is scored in real time. The engine re-targets the exact chapters and difficulty you need next — no more random practice sets.',
    accent: '#8b5cf6',
  },
  {
    icon: 'flashcard',
    title: 'Flashcards that stick',
    desc: 'Formula and concept recall built around spaced repetition and your own weak chapters. Flip, rate yourself, and watch memory hold.',
    accent: '#b06bf5',
  },
  {
    icon: 'mistake',
    title: 'Mistake notebook',
    desc: 'Every wrong, slow or guessed answer is logged automatically — then becomes a targeted re-attempt test. Your errors become your syllabus.',
    accent: '#f43f5e',
  },
  {
    icon: 'line-chart',
    title: 'Analytics that matter',
    desc: 'Accuracy, attempt rate, time per question, chapter-level heatmaps. You always know exactly what to fix next — no guesswork.',
    accent: '#2fd87f',
  },
]

function FeaturesGrid() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 sm:pb-32">
      <SectionHeading
        eyebrow="Everything built-in"
        title="Not a question bank. A training system."
        sub="Most apps give you questions. JEE Arena closes the loop — practice, detect, explain, revise, repeat."
      />
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={Math.min(i * 0.06, 0.4)}>
            <div className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/20">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: `${f.accent}1f`, color: f.accent }}
              >
                <Icon name={f.icon} size={23} />
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

/* ---------------------------- ANALYTICS FEATURE --------------------------- */

function AnalyticsFeature() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const mockY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 70, reduce ? 0 : -70])
  const mockRotate = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 8, reduce ? 0 : -4])

  return (
    <section
      ref={ref}
      id="analytics"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24 sm:pb-32"
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            center={false}
            eyebrow="Know everything"
            title={
              <>
                Your rank is a
                <br />
                <span className={ACCENT}>
                  data problem.
                </span>
              </>
            }
            sub="Stop guessing where you stand. JEE Arena tracks accuracy, speed, attempt rate and chapter mastery across every session — then turns it into a precise, prioritized plan for tomorrow."
          />
          <Reveal delay={0.15}>
            <div className="mt-8 space-y-3">
              {[
                'Chapter-level accuracy heatmaps',
                'Weakness-ranked automatic test builder',
                'Progress streaks and daily goals',
                'Mistake patterns — why you lose marks',
              ].map((item) => (
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
          <motion.div style={{ y: mockY, rotate: mockRotate }}>
            <AnalyticsMockup />
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------ REVISION FEATURE --------------------------- */

function RevisionFeature() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const cardY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 60, reduce ? 0 : -60])
  const cardRotate = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -5, reduce ? 0 : 3])

  return (
    <section
      ref={ref}
      className="relative scroll-mt-24 overflow-hidden border-t border-border bg-surface/40 px-5 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Learn & revise"
          title={
          <>
            The gap between practice
            <br />
            and{' '}
            <span className={ACCENT}>
              remembering.
            </span>
          </>
          }
          sub="Flashcards that adapt to what you forget, and detailed explanations that show exactly the step you missed — not the whole solution you already know."
        />
        <div className="mt-14">
          <Reveal delay={0.05}>
            <motion.div style={{ y: cardY, rotate: cardRotate }} className="mx-auto max-w-md">
              <FlashcardMockup />
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------- COMPARE -------------------------------- */

const COMPARE_ROWS: Array<{ label: string; us: string; them: string }> = [
  { label: 'Real PYQs since 2014', us: 'Every paper, every shift', them: 'A few sample sets' },
  { label: 'NTA-exact interface', us: 'Pixel-faithful replica', them: 'Rough approximations' },
  { label: 'Works offline', us: '100% — no internet needed', them: 'Requires connection' },
  { label: 'Adaptive difficulty', us: 'Real-time, per chapter', them: 'Fixed random sets' },
  { label: 'Price', us: '₹0 · free forever · no ads', them: '₹3,000 – ₹50,000 / yr' },
]

function Compare() {
  return (
    <section id="compare" className="relative scroll-mt-24 border-y border-border bg-surface/40 px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Built different"
          title={
          <>
            Everything they charge for.
            <br />
            <span className={ACCENT}>
              Ours is free.
            </span>
          </>
          }
          sub="We compared ourselves to every serious prep platform so you don't have to."
        />

        <Reveal delay={0.15}>
          <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-border bg-surface2/60 text-[11px] font-bold uppercase tracking-wider text-text3">
              <div className="px-5 py-4" />
              <div className="flex items-center gap-2 px-5 py-4 text-primary">
                <Icon name="target" size={14} /> JEE Arena
              </div>
              <div className="px-5 py-4">Other apps</div>
            </div>
            {COMPARE_ROWS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-border text-[13px] last:border-0"
              >
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

/* ------------------------------- BIG NUMBERS ------------------------------- */

const BIG_NUMBERS: Array<{ to: number; suffix: string; label: string }> = [
  { to: 14600, suffix: '+', label: 'Real questions' },
  { to: 64, suffix: '', label: 'Chapters covered' },
  { to: 186, suffix: '', label: 'Micro-topics' },
  { to: TEST_MODES.length, suffix: '', label: 'Practice modes' },
  { to: 100, suffix: '%', label: 'Offline' },
]

function BigNumbers() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-5">
        {BIG_NUMBERS.map((n) => (
          <div key={n.label} className="flex flex-col items-center gap-1 bg-surface px-4 py-10">
            <span className={cn(ACCENT, 'text-4xl font-bold tracking-tight sm:text-5xl')}>
              <CountUp to={n.to} suffix={n.suffix} />
            </span>
            <span className="text-center text-[12px] font-medium text-text3">{n.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ TESTIMONIALS ------------------------------ */

const TESTIMONIALS = [
  {
    quote:
      'The interface is exactly like the real exam. I walked into the centre and felt like I had already taken the paper that day.',
    name: 'Ananya S.',
    role: 'JEE Main 2025 · 99.2 %ile',
    initials: 'AS',
    color: '#60a5fa',
  },
  {
    quote:
      'It found my weak chapters within a week and rebuilt my entire revision plan around them. Nothing else has ever done that for me.',
    name: 'Rohit K.',
    role: 'JEE Advanced qualified',
    initials: 'RK',
    color: '#a78bfa',
  },
  {
    quote:
      'No internet in my hostel, but this still works — full tests, flashcards, analytics, everything. That alone makes it the best.',
    name: 'Priya M.',
    role: 'Dropper · targeting 2026',
    initials: 'PM',
    color: '#fbbf24',
  },
]

function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 sm:pb-32">
      <SectionHeading
        eyebrow="From the arena"
        title="Aspirants like you."
        sub="No actors, no paid reviews — just people who showed up every day with this app."
      />
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1}>
            <figure className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-surface p-6">
              <div className="flex gap-1 text-warning">
                {Array.from({ length: 5 }, (_, s) => (
                  <Icon key={s} name="star" size={15} />
                ))}
              </div>
              <blockquote className="text-[14px] leading-relaxed text-text">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="text-[13px] font-bold text-text">{t.name}</p>
                  <p className="text-[11px] text-text3">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------------- FAQ ---------------------------------- */

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Is JEE Arena really free?',
    a: 'Yes. Every mode, every question, every feature — including analytics — is completely free with no ads and no premium wall. There is no paid tier, and there never will be one.',
  },
  {
    q: 'Does it need internet?',
    a: 'No. The full question bank installs directly into your browser on first launch. After that, full tests, practice, flashcards and analytics all run 100% offline.',
  },
  {
    q: 'Which exams does it cover?',
    a: 'JEE Main and JEE Advanced — including real previous-year papers since 2014 plus a large practice bank across Physics, Chemistry and Mathematics, organized into 64 chapters and 186 micro-topics.',
  },
  {
    q: 'How do I start?',
    a: 'Open the app and pick a mode. That is it — no account, no installation, no card details. Your progress is saved automatically on your device.',
  },
  {
    q: 'Are you affiliated with NTA?',
    a: 'No. JEE Arena is an independent practice platform. JEE, JEE Main and JEE Advanced are trademarks of their respective examination authorities, with whom we are not affiliated, endorsed by, or associated.',
  },
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

/* -------------------------------- FINAL CTA -------------------------------- */

function FinalCta() {
  const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden border-t border-border px-5 py-28 text-center sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 100%, var(--primary) 0%, transparent 60%)',
          filter: 'blur(90px)',
        }}
      />
      <div className="relative mx-auto max-w-3xl">
        <Reveal>
          <Eyebrow>Free forever</Eyebrow>
          <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tighter text-text sm:text-6xl md:text-7xl">
            Tomorrow&apos;s rank
            <br />
            <span className={ACCENT}>
              is built today.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-text2 sm:text-lg">
            The paper is fixed. Your preparation isn&apos;t. Open JEE Arena and take the closest
            thing to the real exam — right now, on any device, with no internet.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <button
            onClick={() => navigate('/dashboard')}
            className="focus-ring mt-9 rounded-full bg-primary px-9 py-4 text-[16px] font-semibold text-white shadow-2xl shadow-primary/40 transition-all duration-200 hover:bg-primary2 hover:shadow-primary/55 active:scale-[0.97]"
          >
            Start Practicing — Free
          </button>
          <p className="mt-4 text-xs font-medium text-text3">
            No account · No install · No ads · No fees · Ever
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------- FOOTER --------------------------------- */

const LEGAL_DOCS = {
  terms: {
    title: 'Terms of Use',
    body: [
      'JEE Arena is provided free of charge, on an "as-is" and "as-available" basis, for personal, non-commercial practice and study purposes.',
      'By using JEE Arena you agree not to resell, redistribute or claim ownership of the questions, content or code, and not to use the platform in any way that violates applicable laws.',
      'Your progress data is stored locally on your own device. We do not collect, store or transmit personal information.',
      'We may update these terms at any time. Continued use of the app after changes means you accept the revised terms.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'JEE Arena is designed to work fully offline. Your test results, mistakes, flashcards and analytics are stored exclusively in your browser via IndexedDB and never leave your device.',
      'No tracking cookies, no analytics scripts, no third-party advertising and no account registration are used.',
      'If you voluntarily reach out via the public GitHub repository, only the information you choose to share is used, solely to respond to you.',
      'This policy may be updated as the app evolves; the latest version will always be shown here.',
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    body: [
      'JEE Arena is an independent, non-commercial practice platform and is not affiliated with, endorsed by, or connected to the National Testing Agency (NTA) or any examination authority.',
      '"JEE", "JEE Main" and "JEE Advanced" are trademarks of their respective owners, used here solely for identification and educational practice.',
      'Previous-year questions are compiled from publicly available sources and are used for practice purposes only.',
      'No guarantee of marks, ranks or selection is expressed or implied. All usage is at your own discretion.',
    ],
  },
} as const

type LegalKey = keyof typeof LEGAL_DOCS

const FOOTER_LINKS: Array<{
  title: string
  links: Array<{ label: string; href?: string; path?: string; legal?: LegalKey }>
}> = [
  {
    title: 'Product',
    links: [
      { label: 'Modes', href: '#modes' },
      { label: 'Features', href: '#features' },
      { label: 'Why us', href: '#compare' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Question Bank', path: '/question-bank' },
      { label: 'Flashcards', path: '/flashcards' },
      { label: 'Mistake Notebook', path: '/mistakes' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Made by Rudra', href: 'https://github.com/rudra-th' },
      { label: 'GitHub', href: 'https://github.com/rudra-th' },
      { label: 'Open Source', href: 'https://github.com/rudra-th' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Use', legal: 'terms' },
      { label: 'Privacy Policy', legal: 'privacy' },
      { label: 'Disclaimer', legal: 'disclaimer' },
    ],
  },
]

function Footer() {
  const navigate = useNavigate()
  const [legal, setLegal] = useState<LegalKey | null>(null)

  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="focus-ring flex items-center gap-2.5 text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary2 shadow-lg shadow-primary/30">
                <Icon name="target" size={19} className="text-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-text">JEE Arena</span>
            </button>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-text2">
              The closest experience to the real JEE. Offline-first, free forever, built for
              aspirants who don&apos;t give themselves excuses.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com/rudra-th"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text2 transition-colors hover:border-primary/40 hover:text-text"
                aria-label="GitHub"
              >
                <Icon name="github" size={16} />
              </a>
            </div>
          </div>
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-text3">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <a
                        href={l.href}
                        {...(l.href.startsWith('http')
                          ? { target: '_blank', rel: 'noreferrer' }
                          : {})}
                        className="text-[13px] text-text2 transition-colors hover:text-text"
                      >
                        {l.label}
                      </a>
                    ) : l.path ? (
                      <button
                        onClick={() => navigate(l.path!)}
                        className="focus-ring text-[13px] text-text2 transition-colors hover:text-text"
                      >
                        {l.label}
                      </button>
                    ) : l.legal ? (
                      <button
                        onClick={() => setLegal(l.legal!)}
                        className="focus-ring text-[13px] text-text2 transition-colors hover:text-text"
                      >
                        {l.label}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-surface2/50 p-5">
          <p className="text-[11px] leading-relaxed text-text3">
            <span className="font-bold uppercase tracking-wider text-text2">Legal disclaimer · </span>
            JEE Arena is an independent, non-commercial practice platform. It is not affiliated
            with, endorsed by, or connected to the National Testing Agency (NTA) or any examination
            authority. &ldquo;JEE&rdquo;, &ldquo;JEE Main&rdquo; and &ldquo;JEE Advanced&rdquo; are
            trademarks of their respective owners, used here solely for identification and
            educational practice. Previous-year questions are compiled from publicly available
            papers and are used for practice purposes only. No guarantee of marks, ranks or
            selection is expressed or implied. All usage is at the user&apos;s own discretion.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-[11px] text-text3">
          <span>
            © {new Date().getFullYear()} JEE Arena. All rights reserved.
          </span>
          <span className="flex items-center gap-1.5">
            Built offline-first · Works on any device · Made with care in India
          </span>
        </div>
      </div>

      <Modal
        open={legal !== null}
        onClose={() => setLegal(null)}
        title={legal ? LEGAL_DOCS[legal].title : ''}
        size="lg"
      >
        <div className="space-y-4 text-sm leading-relaxed text-text2">
          {legal ? LEGAL_DOCS[legal].body.map((p) => <p key={p}>{p}</p>) : null}
        </div>
      </Modal>
    </footer>
  )
}

/* ------------------------------ SCROLL CHROME ----------------------------- */

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[80] h-[3px] origin-left bg-gradient-to-r from-primary to-info"
    />
  )
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
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.2, ease: EASE }}
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

/* ------------------------------- LANDING PAGE ------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <ScrollJourney />
        <ModesGrid />
        <SubjectsCoverage />
        <FullTestFeature />
        <FeaturesGrid />
        <AnalyticsFeature />
        <RevisionFeature />
        <Compare />
        <BigNumbers />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}
