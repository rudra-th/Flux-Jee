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
} from 'framer-motion'
import { Icon, type IconName } from '@/components/ui'
import { TEST_MODES } from '@/constants/modes'
import { cn } from '@/utils/cn'

const EASE = [0.22, 1, 0.36, 1] as const

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

const HERO_WORDS = ['real JEE.', 'exact NTA screen.', 'real exam day.']

function RotatingWords() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(() => setI((x) => (x + 1) % HERO_WORDS.length), 2600)
    return () => window.clearInterval(t)
  }, [reduce])

  const word = HERO_WORDS[i]!
  return (
    <span className="inline-block whitespace-nowrap text-left">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={word}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="inline-block bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#fbbf24] bg-clip-text text-transparent"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
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
      <Icon name="sparkles" size={12} />
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

function TutorChatMockup() {
  return (
    <div className="relative w-full rounded-2xl border border-border bg-surface p-5 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.55)]">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary2">
          <Icon name="brain" size={16} className="text-white" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-text">AI Tutor</p>
          <p className="text-[10px] text-success">● online</p>
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-surface2 px-3.5 py-2.5 text-[12px] leading-relaxed text-text">
          Why did I lose a mark here? I applied the right formula but still got it wrong.
        </div>
        <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-primary/15 px-3.5 py-2.5 text-[12px] leading-relaxed text-text">
          You used τ = Iα, but this rod isn&apos;t fixed — it rotates about its centre of mass.
          That changes the moment of inertia to ML²/12, not ML²/3. Here&apos;s the corrected setup…
        </div>
        <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-surface2 px-3.5 py-2.5 w-fit">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text3 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text3 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text3 [animation-delay:240ms]" />
        </div>
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
        to the <RotatingWords />
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
          className="absolute inset-x-0 top-0 z-40 h-[2px] origin-left bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#fbbf24]"
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
                  <Icon name="brain" size={14} />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-text">AI Tutor</p>
                  <p className="text-[10px] text-success">● online, on your mistakes</p>
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
  'AI Tutor',
  'Mistake notebook',
  'Speed tests & marathons',
]

function Marquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="relative overflow-hidden border-y border-border bg-surface/50 py-5">
      <div className="flex w-max animate-marquee items-center gap-10">
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

/* ------------------------------- HOW IT WORKS ----------------------------- */

const HOW_STEPS: Array<{
  n: string
  icon: IconName
  title: string
  desc: string
  accent: string
}> = [
  {
    n: '01',
    icon: 'grid',
    title: 'Pick your mode',
    desc: 'Full NTA replica, chapter drills, daily sprints — or let the engine build your test from the chapters you keep getting wrong.',
    accent: '#60a5fa',
  },
  {
    n: '02',
    icon: 'keyboard',
    title: 'Solve like exam day',
    desc: 'The exact NTA screen: palette, timer, marking scheme and keyboard shortcuts. When the real paper opens, nothing feels new.',
    accent: '#a78bfa',
  },
  {
    n: '03',
    icon: 'line-chart',
    title: 'Get your battle plan',
    desc: 'Every answer is scored in real time. Analytics find your weak points, and flashcards plus the AI tutor turn them into tomorrow\'s plan.',
    accent: '#fbbf24',
  },
]

function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Three steps"
        title={
          <>
            From question to rank —
            <br />
            <span className="bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#fbbf24] bg-clip-text text-transparent">
              in three moves.
            </span>
          </>
        }
        sub="No setup, no account, no studying the app instead of studying. Open it and start."
      />

      <div className="relative mt-14 grid gap-5 md:grid-cols-3">
        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 md:block"
        />
        {HOW_STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.12}>
            <TiltCard className="h-full" intensity={5}>
              <div className="group relative flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-primary/35">
                <span className="absolute right-5 top-4 font-mono text-[42px] font-bold leading-none text-surface3 transition-colors duration-200 group-hover:text-primary/25">
                  {step.n}
                </span>
                <div
                  className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `${step.accent}1f`, color: step.accent }}
                >
                  <Icon name={step.icon} size={23} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-[17px] font-bold text-text">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-text2">{step.desc}</p>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        ))}
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
            <span className="bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#fbbf24] bg-clip-text text-transparent">
              Every way to practice.
            </span>
          </>
        }
        sub="From a full NTA replica paper to a 10-question daily sprint — the mode you need, exactly when you need it."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEST_MODES.map((m, i) => (
          <Reveal key={m.id} delay={Math.min(i * 0.05, 0.4)}>
            <TiltCard className="h-full">
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex h-full w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-colors duration-200 hover:border-primary/35 hover:bg-surface2/60"
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
            </TiltCard>
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
                <span className="bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#fbbf24] bg-clip-text text-transparent">
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
              <span className="bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#fbbf24] bg-clip-text text-transparent">
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
    icon: 'brain',
    title: 'AI Tutor',
    desc: 'Stuck on a solution? Get a step-by-step explanation tuned to the mistake you actually made — not a generic YouTube link to a different question.',
    accent: '#f5a524',
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
            <TiltCard className="h-full" intensity={5}>
              <div className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-primary/35">
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
            </TiltCard>
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
                <span className="bg-gradient-to-r from-[#2fd87f] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
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
              <span className="bg-gradient-to-r from-[#b06bf5] via-[#60a5fa] to-[#38bdf8] bg-clip-text text-transparent">
                remembering.
              </span>
            </>
          }
          sub="Flashcards that adapt to what you forget, and an AI tutor that explains exactly the step you missed — not the whole solution you already know."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal delay={0.05}>
            <motion.div style={{ y: cardY, rotate: cardRotate }}>
              <FlashcardMockup />
            </motion.div>
          </Reveal>
          <Reveal delay={0.15}>
            <motion.div style={{ y: cardY, rotate: cardRotate }}>
              <TutorChatMockup />
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ AI TUTOR FEATURE --------------------------- */

const TUTOR_ROUNDS: Array<Array<{ from: 'user' | 'ai'; text: string }>> = [
  [
    {
      from: 'user',
      text: 'Why did I lose a mark on Q23? I used Kc = [P] / [R].',
    },
    {
      from: 'ai',
      text: 'Because H₂O is a liquid — it never enters Kc. Kc = [CO₂][H₂] / [CO] = (0.4 × 0.5) / (0.1 × 0.2) = 10. You forgot to omit pure liquids and solids.',
    },
  ],
  [
    { from: 'user', text: 'What should I revise tonight?' },
    {
      from: 'ai',
      text: 'From today\'s test: Equilibrium 38%, Electrochemistry 44% — plus 2 questions marked for review in Maths. I built you a 20-question focused set.',
    },
  ],
  [
    { from: 'user', text: 'Why do I keep losing marks in the last 10 questions?' },
    {
      from: 'ai',
      text: '62% of your errors are sign mistakes (Mistake Notebook), and you slow down after Q60 — avg 142s vs 90s target. I added a 12-question speed drill for tomorrow.',
    },
  ],
]

function AnimatedTutorMockup() {
  const reduce = useReducedMotion()
  const [round, setRound] = useState(0)
  const [typing, setTyping] = useState(true)
  const messages = TUTOR_ROUNDS[round]!

  useEffect(() => {
    if (reduce) return
    setTyping(true)
    const t1 = window.setTimeout(() => setTyping(false), 900)
    const t2 = window.setTimeout(() => setRound((r) => (r + 1) % TUTOR_ROUNDS.length), 6800)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [round, reduce])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_90px_-20px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-2.5 border-b border-border bg-surface2/70 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary2">
          <Icon name="brain" size={16} className="text-white" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-text">AI Tutor</p>
          <p className="flex items-center gap-1 text-[10px] text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> online · trained
            on your attempts
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-text3">
          <Icon name="sparkles" size={12} /> Mistake-aware
        </span>
      </div>

      <div className="flex min-h-[210px] flex-col gap-2.5 p-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex flex-col gap-2.5"
          >
            {messages.map((m, i) =>
              m.from === 'user' ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm border border-border bg-surface2 px-3.5 py-2.5 text-[12px] leading-relaxed text-text"
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={i}
                  className="max-w-[92%] rounded-2xl rounded-tl-sm bg-primary/12 px-3.5 py-2.5 text-[12px] leading-relaxed text-text"
                >
                  {m.text}
                </div>
              ),
            )}
          </motion.div>
        </AnimatePresence>
        {typing ? (
          <div className="flex items-center gap-1 w-fit rounded-2xl rounded-tl-sm border border-border bg-surface2 px-3.5 py-2.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text3 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text3 [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text3 [animation-delay:240ms]" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-surface2/50 px-4 py-3">
        <div className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-[12px] text-text3">
          Ask a doubt from your last test…
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30">
          <Icon name="arrow-up-right" size={15} />
        </span>
      </div>
    </div>
  )
}

function AiTutorFeature() {
  return (
    <section id="ai" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            center={false}
            eyebrow="AI Tutor"
            title={
              <>
                Stuck on a question?
                <br />
                <span className="bg-gradient-to-r from-[#f5a524] via-[#fbbf24] to-[#60a5fa] bg-clip-text text-transparent">
                  Ask your mistake.
                </span>
              </>
            }
            sub="The AI tutor reads your actual attempt — the option you picked, the time you took, the formula you used — and explains exactly the step that cost you the mark."
          />
          <Reveal delay={0.15}>
            <div className="mt-8 space-y-3">
              {[
                'Explains the mistake you actually made — not the whole solution',
                'Runs offline: your doubts never leave your device',
                'Instantly converts weak points into a revision set',
                'Solves a related question to confirm you got it',
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
          <TiltCard intensity={4}>
            <AnimatedTutorMockup />
          </TiltCard>
        </Reveal>
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
  { label: 'AI Tutor', us: 'Trained on your mistakes', them: 'Static solutions' },
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
              <span className="bg-gradient-to-r from-[#2fd87f] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
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
        {BIG_NUMBERS.map((n, i) => (
          <div key={n.label} className="flex flex-col items-center gap-1 bg-surface px-4 py-10">
            <span
              className={cn(
                'bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl',
                i % 2 === 0
                  ? 'from-[#60a5fa] to-[#a78bfa]'
                  : 'from-[#a78bfa] to-[#fbbf24]',
              )}
            >
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
    a: 'Yes. Every mode, every question, every feature — including the AI Tutor and analytics — is completely free with no ads and no premium wall. There is no paid tier, and there never will be one.',
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
            <span className="bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#fbbf24] bg-clip-text text-transparent">
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

const FOOTER_LINKS: Array<{ title: string; links: Array<{ label: string; href?: string }> }> = [
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
      { label: 'Question Bank' },
      { label: 'Flashcards' },
      { label: 'AI Tutor' },
      { label: 'Mistake Notebook' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Made by Rudra', href: 'https://github.com/rudra-th' },
      { label: 'GitHub', href: 'https://github.com/rudra-th' },
      { label: 'Open Source' },
    ],
  },
  {
    title: 'Legal',
    links: [{ label: 'Terms of Use' }, { label: 'Privacy Policy' }, { label: 'Disclaimer' }],
  },
]

function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary2 shadow-lg shadow-primary/30">
                <Icon name="target" size={19} className="text-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-text">JEE Arena</span>
            </div>
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
                {col.links.map((l) =>
                  l.href ? (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        {...(l.href.startsWith('http')
                          ? { target: '_blank', rel: 'noreferrer' }
                          : {})}
                        className="text-[13px] text-text2 transition-colors hover:text-text"
                      >
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.label} className="cursor-pointer text-[13px] text-text2 transition-colors hover:text-text">
                      {l.label}
                    </li>
                  ),
                )}
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
    </footer>
  )
}

/* ------------------------------- LANDING PAGE ------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <ModesGrid />
        <SubjectsCoverage />
        <FullTestFeature />
        <FeaturesGrid />
        <AnalyticsFeature />
        <RevisionFeature />
        <AiTutorFeature />
        <Compare />
        <BigNumbers />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
