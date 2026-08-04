import type { Difficulty, QuestionTypeId, SubjectId } from '@/types/core'
import type { Question, QuestionAnswer, QuestionContent, QuestionOption } from '@/types/question'
import { randomId } from '@/utils/cn'
import { getSubject } from '@/constants/syllabus'
import { mulberry32 } from '@/utils/cn'

export interface GenerateParams {
  subject: SubjectId
  chapterId: string
  topicId: string
  difficulty: Difficulty
  type?: QuestionTypeId
  year?: number
  exam?: Question['exam']
  rng?: () => number
  seed?: number
}

export interface TemplateOutput {
  content: QuestionContent
  options?: QuestionOption[]
  answer: QuestionAnswer
  solution: QuestionSolution
  tags?: string[]
  estimatedTime?: number
}

export interface QuestionSolution {
  detailed: string
  short?: string
  hints: string[]
  concept?: string
  subconcept?: string
}

const DIFF_LEVELS: Record<Difficulty, string> = {
  1: 'Easy',
  2: 'Easy-Medium',
  3: 'Medium',
  4: 'Medium-Hard',
  5: 'Hard',
}

const Y = (year: number | undefined): number => year ?? 2023

export function generateQuestion(params: GenerateParams): Question {
  const { subject, chapterId, topicId, difficulty } = params
  const rng = params.rng ?? mulberry32(params.seed ?? Math.floor(Math.random() * 1e9))
  const rand = (min: number, max: number) => min + rng() * (max - min)
  const ri = (min: number, max: number) => Math.floor(rand(min, max + 1))

  const topic = getSubject(subject).chapters.find((c) => c.id === chapterId)?.topics.find(
    (t) => t.id === topicId,
  )
  const chapterName =
    getSubject(subject).chapters.find((c) => c.id === chapterId)?.name ?? chapterId
  const topicName = topic?.name ?? topicId

  const template = getTemplate(subject, chapterId, topicId)
  const out = template({ rng, rand, ri, difficulty, subject, chapterId, topicId })

  const type = params.type ?? out.answer.type

  return {
    id: randomId('q-'),
    exam: params.exam ?? 'jee-main',
    year: Y(params.year),
    shift: ri(1, 3),
    paper: params.exam === 'jee-advanced' ? (rng() > 0.5 ? 'paper-1' : 'paper-2') : 'session-1',
    session: params.exam === 'jee-advanced' ? undefined : ri(1, 2),
    subject,
    chapter: chapterName,
    microTopic: topicName,
    difficulty,
    estimatedTime: out.estimatedTime ?? Math.round(60 + difficulty * 30),
    type,
    content: out.content,
    options: out.options ?? [],
    answer: out.answer,
    solution: out.solution,
    tags: [...(out.tags ?? []), chapterName, topicName, DIFF_LEVELS[difficulty]],
    createdAt: new Date().toISOString(),
  }
}

type TemplateCtx = {
  rng: () => number
  rand: (min: number, max: number) => number
  ri: (min: number, max: number) => number
  difficulty: Difficulty
  subject: SubjectId
  chapterId: string
  topicId: string
}

type Template = (ctx: TemplateCtx) => TemplateOutput

function getTemplate(subject: SubjectId, _chapterId: string, topicId: string): Template {
  const lib = subject === 'physics' ? PHYSICS_TEMPLATES : subject === 'chemistry' ? CHEM_TEMPLATES : MATH_TEMPLATES
  const t = lib[topicId]
  if (t) return t
  return genericTemplate(subject, topicId)
}

function genericTemplate(subject: SubjectId, topicId: string): Template {
  return ({ difficulty, rng, ri }) => {
    const a = 2 + ri(1, 3) * difficulty
    const b = ri(2, 6)
    const correct = a + b
    const wrongs = [a * b, Math.abs(a - b), Math.floor(a / b), a + b + b].filter(
      (w, i, arr) => w !== correct && arr.indexOf(w) === i,
    )
    const distractors = wrongs.slice(0, 3)
    while (distractors.length < 3) distractors.push(correct + distractors.length + 1)

    const options: QuestionOption[] = [correct, ...distractors]
      .sort(() => rng() - 0.5)
      .map((v, i) => ({ key: 'ABCD'[i] ?? `${i + 1}`, text: `${v}` }))

    return {
      content: { text: `Consider a problem based on ${topicId}. Determine the required value.` },
      options,
      answer: { type: 'single', correctIndex: options.findIndex((o) => o.text === `${correct}`) },
      solution: {
        detailed: `Using the standard approach for ${topicId}, compute the required quantity step by step to arrive at the final value.`,
        hints: [`Relate the given data using the governing equation for ${topicId}.`],
        concept: topicId,
      },
      estimatedTime: 60 + difficulty * 30,
    }
  }
}

// ============================================================
// PHYSICS
// ============================================================

const PHYSICS_TEMPLATES: Record<string, Template> = {
  units: (ctx) => {
    return singleCtx(
      `The dimensional formula of a physical quantity is M${ctx.ri(1, 2)}L${ctx.ri(1, 3)}T^{${-ctx.ri(1, 3)}}. This represents:`,
      ['Force', 'Energy', 'Power', 'Pressure'],
      2 + (ctx.rng() > 0.5 ? 1 : 0),
      'Compare the dimensional formula of each option with the standard MLT expressions.',
    )
  },
  dimensions: (ctx) => {
    const opts = ['$[MLT^{-2}]$', '$[ML^2T^{-2}]$', '$[ML^2T^{-3}]$', '$[ML^{-1}T^{-2}]$']
    const correct = ctx.rng() > 0.5 ? 'work' : 'power'
    const ansIdx = correct === 'work' ? 1 : 2
    return singleCtx(
      `The dimensional formula of ${correct === 'work' ? 'work' : 'power'} is:`,
      opts,
      ansIdx,
      `Work = force × distance = $[MLT^{-2}][L] = [ML^2T^{-2}]$. Power = work / time.`,
    )
  },
  'error-analysis': (ctx) => {
    const pctErr = ctx.ri(2, 5)
    return numericCtx(
      `A quantity $y = a^2 b$ is measured with percentage errors in $a$ and $b$ of ${pctErr}% and ${2}% respectively. The maximum percentage error in $y$ is:`,
      `${2 * pctErr + 2}`,
      `${2 * pctErr + 2}`,
      `$\\frac{\\Delta y}{y} = 2\\frac{\\Delta a}{a} + \\frac{\\Delta b}{b}$.`,
    )
  },
  'significant-figures': (ctx) => {
    const v = `0.0${ctx.ri(1, 8)}${ctx.ri(1, 9)}${ctx.ri(1, 9)}`
    return singleCtx(
      `The number of significant figures in ${v} is:`,
      ['2', '3', '4', '5'],
      2,
      'Leading zeros are not significant; the nonzero digits are.',
    )
  },
  vectors: (ctx) => {
    const a = ctx.ri(3, 6)
    const b = ctx.ri(4, 8)
    const correct = Math.sqrt(a * a + b * b)
    const dist = [a + b, Math.abs(a - b), a * b / 2, a + b + 1]
    return numericOptionCtx(
      `Two vectors of magnitudes ${a} and ${b} act at right angles. The magnitude of their resultant is:`,
      roundN(correct, 1),
      dist.map((d) => roundN(d, 1)),
      `$R = \\sqrt{A^2 + B^2}$.`,
    )
  },
  'kinematics-1d': (ctx) => {
    const u = ctx.ri(10, 20)
    const t = ctx.ri(2, 5)
    const a = ctx.ri(2, 4)
    const s = u * t + 0.5 * a * t * t
    const dist = [u * t, u * t + a * t * t, u * t - 0.5 * a * t * t, (u + a) * t]
    return numericOptionCtx(
      `A body starts from rest with initial velocity $u = ${u}\\,\\text{m/s}$ and accelerates uniformly at $a = ${a}\\,\\text{m/s}^2$. The distance covered in $t = ${t}\\,\\text{s}$ is:`,
      s,
      dist.map((d) => Math.max(0, d)),
      `$s = ut + \\frac{1}{2}at^2$.`,
    )
  },
  'relative-motion': (ctx) => {
    const v = ctx.ri(20, 60)
    const rel = ctx.ri(5, 15)
    const t = roundN(100 / rel, 1)
    return numericOptionCtx(
      `Car A moves at ${v} m/s and car B at ${v + rel} m/s in the same direction. Time taken for B to gain 100 m on A:`,
      t,
      [roundN(100 / v, 1), roundN(100 / (v - rel), 1), roundN(200 / rel, 1), roundN(100 / rel + 1, 1)],
      `Relative speed = ${rel} m/s. Time = 100 / ${rel}.`,
    )
  },
  projectile: (ctx) => {
    const u = ctx.ri(20, 50)
    const g = 10
    const R = (u * u) / g
    return numericOptionCtx(
      `A projectile is launched at ${u} m/s at 45°. Its horizontal range is:`,
      R,
      [(u * u) / (2 * g), (u * u) / g * 0.5, u * u / g * 2, u * u / g / 3].map((v) => roundN(v, 1)),
      `$R = \\frac{u^2\\sin 2\\theta}{g} = \\frac{u^2}{g}$ at 45°.`,
    )
  },
  'river-boat': (ctx) => {
    const v = ctx.ri(3, 8)
    const u = ctx.ri(1, 4)
    const d = ctx.ri(30, 80)
    const t = roundN(d / Math.sqrt(v * v - u * u), 1)
    return numericOptionCtx(
      `A boat can row at ${v} m/s in still water. River flows at ${u} m/s. Time to cross a river of width ${d} m perpendicularly:`,
      t,
      [roundN(d / v, 1), roundN(d / u, 1), roundN(d / (v + u), 1), roundN(d / (v - u), 1)],
      `Perpendicular velocity $= \\sqrt{v^2 - u^2}$.`,
    )
  },
  nlm: (ctx) => {
    const m = ctx.ri(2, 8)
    const F = ctx.ri(10, 40)
    const a = F / m
    return numericOptionCtx(
      `A force of ${F} N acts on a mass of ${m} kg. Its acceleration is:`,
      a,
      [F * m, F + m, F - m, F / m * 2].map((v) => Math.round(v * 10) / 10),
      `$F = ma \\Rightarrow a = F/m$.`,
    )
  },
  'pseudo-force': (ctx) => {
    const m = ctx.ri(2, 6)
    const a = ctx.ri(2, 6)
    const F = m * a
    return numericOptionCtx(
      `A block of mass ${m} kg is placed on a lift accelerating upward at ${a} m/s². The pseudo force on it (in the lift frame) is:`,
      F,
      [m * 10, m * (10 - a), m * (10 + a) / 2, m * a / 2].map((v) => roundN(v, 1)),
      `Pseudo force $= ma$ opposite to acceleration.`,
    )
  },
  friction: (ctx) => {
    const m = ctx.ri(2, 10)
    const mu = ctx.ri(2, 6) / 10
    const F = roundN(mu * m * 10, 1)
    return numericOptionCtx(
      `A block of ${m} kg rests on a rough surface with μ = ${mu}. The minimum horizontal force to just move it is:`,
      F,
      [roundN(m * 10, 1), roundN(mu * m * 10 * 2, 1), roundN(m / mu, 1), roundN(mu * m, 1)],
      `$f_{max} = \\mu mg$.`,
    )
  },
  pulley: (ctx) => {
    const m1 = ctx.ri(2, 4)
    const m2 = ctx.ri(1, 3)
    const a = roundN(((m1 - m2) * 10) / (m1 + m2), 1)
    const dist = [roundN((m1 + m2) * 10 / (m1 - m2), 1), roundN((m1 - m2) / (m1 + m2), 1), roundN(m1 * 10 / (m1 + m2), 1)]
    return numericOptionCtx(
      `Two masses ${m1} kg and ${m2} kg hang on a frictionless pulley. Their acceleration is:`,
      a,
      dist,
      `$a = \\frac{(m_1 - m_2)g}{m_1 + m_2}$.`,
    )
  },
  'inclined-plane': (ctx) => {
    const m = ctx.ri(2, 5)
    const angle = ctx.rng() > 0.5 ? 30 : 60
    const F = roundN(m * 10 * Math.sin((angle * Math.PI) / 180), 1)
    const cos = roundN(m * 10 * Math.cos((angle * Math.PI) / 180), 1)
    return numericOptionCtx(
      `A block of ${m} kg is placed on a frictionless incline at ${angle}°. The force acting down the plane is:`,
      F,
      [cos, m * 10, roundN(F / 2, 1), roundN(m * 10 * Math.tan((angle * Math.PI) / 180), 1)],
      `$F = mg\\sin\\theta$.`,
    )
  },
  'constraint-motion': (ctx) => {
    const v = ctx.ri(2, 6)
    return singleCtx(
      `In a standard string-pulley constraint, if one block moves up with speed ${v} m/s, the connected block on a fixed pulley moves:`,
      [`Up with ${v} m/s`, `Down with ${v} m/s`, `Up with ${2 * v} m/s`, `Down with ${2 * v} m/s`],
      1,
      'String length constant gives equal speed for the two ends of an ideal single pulley.',
    )
  },
  wpe: (ctx) => {
    const m = ctx.ri(1, 5)
    const v = ctx.ri(5, 10)
    const KE = 0.5 * m * v * v
    const dist = [m * v, m * v * v, 0.5 * m * v, m * 10 * v]
    return numericOptionCtx(
      `A body of mass ${m} kg moves at ${v} m/s. Its kinetic energy is:`,
      KE,
      dist,
      `$KE = \\frac{1}{2}mv^2$.`,
    )
  },
  power: (ctx) => {
    const m = ctx.ri(2, 5)
    const h = ctx.ri(5, 20)
    const t = ctx.ri(2, 5)
    const P = roundN((m * 10 * h) / t, 1)
    return numericOptionCtx(
      `A ${m} kg mass is lifted ${h} m in ${t} s. The average power is:`,
      P,
      [roundN(m * 10 * h * t, 1), roundN(m * 10 * t, 1), roundN(m * h / t, 1), roundN(m * 10 * h, 1)],
      `$P = \\frac{mgh}{t}$.`,
    )
  },
  'variable-force': (ctx) => {
    const k = ctx.ri(2, 5)
    const F0 = ctx.ri(3, 8)
    const x = ctx.ri(2, 5)
    const W = roundN(0.5 * k * x * x + F0 * x, 1)
    return numericOptionCtx(
      `A force $F = ${k}x + ${F0}$ N acts along x. Work done from x=0 to x=${x} m is:`,
      W,
      [roundN(k * x + F0, 1), roundN(0.5 * k * x * x, 1), roundN(k * x * x, 1), roundN(F0 * x, 1)],
      `$W = \\int F\\,dx$.`,
    )
  },
  momentum: (ctx) => {
    const m = ctx.ri(1, 4)
    const v = ctx.ri(5, 15)
    const p = m * v
    return numericOptionCtx(
      `A ${m} kg body moves at ${v} m/s. Its momentum is:`,
      p,
      [0.5 * m * v * v, m * v * v, m / v, m * 10 * v],
      `$p = mv$.`,
    )
  },
  impulse: (ctx) => {
    const F = ctx.ri(20, 100)
    const t = ctx.ri(1, 5)
    const J = F * t
    return numericOptionCtx(
      `A constant force of ${F} N acts for ${t} s. The impulse is:`,
      J,
      [F + t, F / t, F * t * t, F - t],
      `Impulse $J = F\\Delta t$.`,
    )
  },
  com: (ctx) => {
    const m1 = ctx.ri(1, 3)
    const m2 = ctx.ri(2, 5)
    const d = ctx.ri(2, 6)
    const x = roundN((m2 * d) / (m1 + m2), 2)
    const dist = [roundN((m1 * d) / (m1 + m2), 2), roundN(d / 2, 2), roundN((m1 + m2) * d / 2, 2)]
    return numericOptionCtx(
      `Masses ${m1} kg and ${m2} kg are ${d} m apart. Distance of COM from ${m1}:`,
      x,
      dist,
      `$x_{cm} = \\frac{m_2 d}{m_1 + m_2}$.`,
    )
  },
  collision: (ctx) => {
    const m = ctx.ri(2, 5)
    const v = ctx.ri(4, 8)
    const KE = roundN(0.25 * m * v * v, 1)
    const dist = [roundN(0.5 * m * v * v, 1), roundN(0.5 * m * v * v / 2, 1), roundN(m * v * v, 1), 0]
    return numericOptionCtx(
      `A ${m} kg ball moving at ${v} m/s makes an inelastic collision with an identical ball at rest. Kinetic energy lost:`,
      KE,
      dist,
      `$\\Delta KE = \\frac{1}{4}mv^2$ for equal mass inelastic collision.`,
    )
  },
  rotation: (ctx) => {
    const m = ctx.ri(2, 4)
    const R = ctx.ri(1, 3)
    const I = roundN(0.5 * m * R * R, 1)
    return numericOptionCtx(
      `The moment of inertia of a solid disc of mass ${m} kg and radius ${R} m about its center is:`,
      I,
      [roundN(m * R * R, 1), roundN(0.5 * m * R, 1), roundN((2 / 5) * m * R * R, 1), roundN(m * R * R * 2, 1)],
      `$I = \\frac{1}{2}MR^2$ for a disc.`,
    )
  },
  rolling: (ctx) => {
    return singleCtx(
      `A solid sphere rolls without slipping on a horizontal surface. The fraction of total kinetic energy that is rotational is:`,
      ['$\\frac{2}{7}$', '$\\frac{2}{5}$', '$\\frac{5}{7}$', '$\\frac{2}{3}$'],
      0,
      `For a sphere $I = \\frac{2}{5}MR^2$, $K_{rot}/K_{tot} = \\frac{2}{7}$.`,
    )
  },
  'angular-momentum': (ctx) => {
    const I = ctx.ri(1, 3)
    const w = ctx.ri(2, 6)
    const L = I * w
    return numericOptionCtx(
      `A body with moment of inertia ${I} kg·m² rotates at ${w} rad/s. Its angular momentum is:`,
      L,
      [I / w, I * w * w, 0.5 * I * w, I + w],
      `$L = I\\omega$.`,
    )
  },
  'moment-of-inertia': (ctx) => {
    const m = ctx.ri(1, 3)
    const l = ctx.ri(1, 3)
    const I = roundN((m * l * l) / 12, 2)
    return numericOptionCtx(
      `A thin rod of mass ${m} kg and length ${l} m rotates about a perpendicular axis through its centre. Its MI is:`,
      I,
      [roundN(m * l * l / 3, 2), roundN(m * l * l, 2), roundN(m * l * l / 2, 2), roundN(m * l, 2)],
      `$I = \\frac{ML^2}{12}$ for a rod about centre.`,
    )
  },
  gravitation: (ctx) => {
    const m1 = ctx.ri(1, 5)
    const m2 = ctx.ri(1, 5)
    const r = ctx.ri(1, 4)
    const F = roundN((6.67 * m1 * m2) / (r * r), 2)
    return numericOptionCtx(
      `Two masses ${m1} kg and ${m2} kg are ${r} m apart. The gravitational force (×10⁻¹¹ N) is:`,
      F,
      [roundN(F * 2, 2), roundN(F / 2, 2), roundN(F * r, 2), roundN(F / r, 2)],
      `$F = \\frac{Gm_1m_2}{r^2}$, $G = 6.67\\times10^{-11}$ SI.`,
    )
  },
  satellites: (ctx) => {
    const R = ctx.ri(1, 3)
    const v = roundN(Math.sqrt(5) * Math.sqrt(R * 10), 1)
    return numericOptionCtx(
      `A satellite orbits just above Earth's surface (radius ${R} × 6400 km, g = 10 m/s²). Its orbital speed (km/s):`,
      v,
      [roundN(Math.sqrt(2 * 6400 * 10), 1), roundN(Math.sqrt(6400 * 10), 1), roundN(Math.sqrt(5) * 6400, 1), roundN(Math.sqrt(5) * 10, 1)],
      `$v_o = \\sqrt{gR}$.`,
    )
  },
  'escape-velocity': (ctx) => {
    const R = ctx.ri(1, 3)
    const v = roundN(Math.sqrt(2 * 6400 * 10) * Math.sqrt(R), 1)
    return numericOptionCtx(
      `Escape velocity from a planet with radius ${R}×Earth's radius (same g):`,
      v,
      [roundN(Math.sqrt(6400 * 10) * Math.sqrt(R), 1), roundN(Math.sqrt(2 * 6400 * 10), 1), roundN(Math.sqrt(6400 * 10), 1), roundN(Math.sqrt(2) * 6400, 1)],
      `$v_e = \\sqrt{2gR}$.`,
    )
  },
  fluids: (ctx) => {
    const rho = ctx.ri(1, 3)
    const V = ctx.ri(2, 5)
    const F = rho * V * 10
    return numericOptionCtx(
      `A body of volume ${V} L is fully immersed in water (ρ = ${rho} × 1000 kg/m³). The buoyant force is:`,
      F,
      [rho * V, rho * V * 100, rho * V * 10 * 2, V * 10],
      `$F_b = \\rho V g$.`,
    )
  },
  'surface-tension': (ctx) => {
    const T = ctx.ri(3, 7) / 100
    const l = ctx.ri(2, 5) / 100
    const F = roundN(T * 2 * l * 1000, 2)
    return numericOptionCtx(
      `A wire of length ${Math.round(l * 100)} cm is dipped in a liquid of surface tension ${T} N/m. Force to pull it out (mN):`,
      F,
      [roundN(T * l * 1000, 2), roundN(T * l * 2, 2), roundN(T * 2, 2), roundN(T * l * 100, 2)],
      `$F = 2Tl$ (two surfaces).`,
    )
  },
  viscosity: (ctx) => {
    return singleCtx(
      `The SI unit of coefficient of viscosity is:`,
      ['$\\text{Pa·s}$', '$\\text{N·m}$', '$\\text{kg·m/s}$', '$\\text{J·s}$'],
      0,
      'Viscosity unit = Pascal-second (Pa·s).',
    )
  },
  elasticity: (ctx) => {
    const F = ctx.ri(100, 500)
    const A = ctx.ri(1, 4)
    const stress = F / A
    return numericOptionCtx(
      `A force of ${F} N acts on area ${A} cm². The stress (N/m², ×10⁵) is:`,
      roundN(stress * 10, 2),
      [roundN(stress, 2), roundN(stress * 10 / 2, 2), roundN(F * A * 10, 2), roundN(stress * 20, 2)],
      `Stress $= F/A$. Convert cm² to m².`,
    )
  },
  'thermal-expansion': (ctx) => {
    const l = ctx.ri(100, 200)
    const dT = ctx.ri(20, 60)
    const alpha = ctx.ri(1, 3) / 100000
    const dl = roundN(l * alpha * dT, 3)
    return numericOptionCtx(
      `A rod of length ${l} cm (α = ${alpha}) heats by ${dT} °C. Its expansion (cm):`,
      dl,
      [roundN(dl * 2, 3), roundN(l * dT, 3), roundN(alpha * dT, 5), roundN(dl / 2, 3)],
      `$\\Delta L = L_0\\alpha\\Delta T$.`,
    )
  },
  ktg: (ctx) => {
    const T = ctx.ri(300, 600)
    const v = roundN(Math.sqrt((3 * 8.31 * T) / 0.028), 0)
    return numericOptionCtx(
      `RMS speed of O₂ gas (M = 28 g/mol) at ${T} K (m/s):`,
      v,
      [roundN(Math.sqrt((3 * 8.31 * T) / 0.056), 0), roundN(Math.sqrt((8.31 * T) / 0.028), 0), roundN(Math.sqrt((3 * 8.31 * T) / 0.014), 0), roundN(v / 2, 0)],
      `$v_{rms} = \\sqrt{\\frac{3RT}{M}}$.`,
    )
  },
  thermodynamics: (ctx) => {
    const Q = ctx.ri(100, 300)
    const W = ctx.ri(40, 100)
    const dU = Q - W
    return numericOptionCtx(
      `A system absorbs ${Q} J of heat and does ${W} J of work. Its internal energy change is:`,
      dU,
      [Q + W, W - Q, Q, W],
      `First law: $\\Delta U = Q - W$.`,
    )
  },
  'heat-transfer': (ctx) => {
    return singleCtx(
      `The mode of heat transfer in a solid is primarily:`,
      ['Conduction', 'Convection', 'Radiation', 'All equally'],
      0,
      'Conduction dominates in solids via lattice vibration and free electrons.',
    )
  },
  calorimetry: (ctx) => {
    const m = ctx.ri(1, 5)
    const dT = ctx.ri(10, 30)
    const Q = m * 4200 * dT
    return numericOptionCtx(
      `Heat required to raise ${m} kg of water by ${dT} °C (J):`,
      Q,
      [m * 4200, m * dT, m * 4200 * dT / 1000, Q * 2],
      `$Q = mc\\Delta T$, c = 4200 J/kg·K.`,
    )
  },
  shm: (ctx) => {
    const k = ctx.ri(50, 200)
    const m = ctx.ri(1, 4)
    const T = roundN(2 * Math.PI * Math.sqrt(m / k), 2)
    return numericOptionCtx(
      `A mass-spring system has k = ${k} N/m and m = ${m} kg. Its period is:`,
      T,
      [roundN(2 * Math.PI * Math.sqrt(k / m), 2), roundN(Math.sqrt(m / k), 2), roundN(2 * Math.PI * Math.sqrt(m * k), 2), roundN(T / 2, 2)],
      `$T = 2\\pi\\sqrt{\\frac{m}{k}}$.`,
    )
  },
  pendulum: (ctx) => {
    const l = ctx.ri(0.5, 2.5)
    const T = roundN(2 * Math.PI * Math.sqrt(l / 9.8), 2)
    return numericOptionCtx(
      `A simple pendulum of length ${l} m has period (g = 9.8 m/s²):`,
      T,
      [roundN(2 * Math.PI * Math.sqrt(9.8 / l), 2), roundN(Math.PI * Math.sqrt(l), 2), roundN(T * 2, 2), roundN(T / 2, 2)],
      `$T = 2\\pi\\sqrt{\\frac{l}{g}}$.`,
    )
  },
  spring: (ctx) => {
    const k = ctx.ri(100, 500)
    const x = ctx.ri(2, 10) / 100
    const F = roundN(k * x, 1)
    return numericOptionCtx(
      `A spring (k = ${k} N/m) is stretched ${Math.round(x * 100)} cm. The restoring force is:`,
      F,
      [roundN(k * x * 2, 1), roundN(0.5 * k * x * x, 3), roundN(k * x * 10, 1), roundN(k / x, 1)],
      `$F = kx$.`,
    )
  },
  'damped-oscillation': (ctx) => {
    return singleCtx(
      `In a damped harmonic oscillator, the amplitude:`,
      ['Decreases exponentially with time', 'Increases linearly with time', 'Stays constant', 'Decreases linearly with time'],
      0,
      'Damping causes exponential decay of amplitude.',
    )
  },
  'forced-oscillation': (ctx) => {
    return singleCtx(
      `Resonance occurs when the driving frequency:`,
      ['Equals the natural frequency', 'Exceeds the natural frequency', 'Is less than natural frequency', 'Is always zero'],
      0,
      'Maximum amplitude when drive frequency = natural frequency.',
    )
  },
  'wave-motion': (ctx) => {
    const f = ctx.ri(100, 500)
    const v = ctx.ri(300, 500)
    const l = roundN(v / f, 3)
    return numericOptionCtx(
      `A wave of frequency ${f} Hz travels at ${v} m/s. Its wavelength is:`,
      l,
      [roundN(v * f, 0), roundN(f / v, 4), roundN(l * 2, 3), roundN(v / (f * 2), 3)],
      `$v = f\\lambda$.`,
    )
  },
  'standing-waves': (ctx) => {
    const l = ctx.ri(1, 3)
    return singleCtx(
      `A string of length ${l} m fixed at both ends vibrates in its ${ctx.ri(2, 4)}th harmonic. The number of nodes is:`,
      ['2', '3', `${ctx.ri(2, 4)}`, '5'],
      2,
      'For the nth harmonic, there are n+1 nodes.',
    )
  },
  doppler: (ctx) => {
    return singleCtx(
      `A source moves toward a stationary observer. The observed frequency is:`,
      ['Higher than the emitted frequency', 'Lower than the emitted frequency', 'Equal to emitted frequency', 'Zero'],
      0,
      'Approaching source → higher observed frequency.',
    )
  },
  beats: (ctx) => {
    const f1 = ctx.ri(200, 400)
    const f2 = f1 + ctx.ri(2, 8)
    return numericOptionCtx(
      `Two sources have frequencies ${f1} Hz and ${f2} Hz. The beat frequency is:`,
      f2 - f1,
      [f2 + f1, f2 - f1 + 1, f1 + f2 / 2, f1 / f2],
      `Beat frequency $= |f_1 - f_2|$.`,
    )
  },
  electrostatics: (ctx) => {
    const q1 = ctx.ri(1, 4)
    const q2 = ctx.ri(1, 4)
    const r = ctx.ri(1, 3)
    const F = roundN((9 * q1 * q2) / (r * r), 2)
    return numericOptionCtx(
      `Charges ${q1} μC and ${q2} μC are ${r} cm apart. Force (N):`,
      F,
      [roundN((9 * q1 * q2) / (r * r) * 2, 2), roundN((9 * q1 * q2) / r, 2), roundN((9 * q1 * q2) / (r * r * 2), 2), roundN(q1 * q2, 2)],
      `$F = \\frac{kq_1q_2}{r^2}$, k = 9×10⁹, r in m.`,
    )
  },
  'electric-field': (ctx) => {
    const q = ctx.ri(1, 5)
    const r = ctx.ri(1, 3)
    const E = roundN((9 * q) / (r * r), 2)
    return numericOptionCtx(
      `The electric field ${r} cm from a point charge ${q} μC is (×10⁷ N/C):`,
      E,
      [roundN((9 * q) / r, 2), roundN((9 * q) / (r * r) * 10, 2), roundN(E * 2, 2), roundN(E / 2, 2)],
      `$E = \\frac{kq}{r^2}$.`,
    )
  },
  potential: (ctx) => {
    const q = ctx.ri(1, 5)
    const r = ctx.ri(1, 3)
    const V = roundN((9 * q) / r, 1)
    return numericOptionCtx(
      `Potential at ${r} cm from charge ${q} μC is (×10⁵ V):`,
      V,
      [roundN((9 * q) / (r * r), 2), roundN(V * 10, 1), roundN(V / 2, 1), roundN((9 * q) / r * 2, 1)],
      `$V = \\frac{kq}{r}$.`,
    )
  },
  capacitance: (ctx) => {
    const A = ctx.ri(2, 6)
    const d = ctx.ri(1, 3)
    const C = roundN(8.85 * A / d, 2)
    return numericOptionCtx(
      `A parallel plate capacitor has area ${A} cm² and gap ${d} mm. Capacitance (pF):`,
      C,
      [roundN(8.85 * A * d, 2), roundN(8.85 * d / A, 4), roundN(C * 2, 2), roundN(8.85 * A, 2)],
      `$C = \\frac{\\epsilon_0 A}{d}$.`,
    )
  },
  'gauss-law': (ctx) => {
    const q = ctx.ri(2, 8)
    return singleCtx(
      `The electric flux through a closed surface enclosing ${q} μC of charge is (×10⁵ N·m²/C):`,
      ['1.13', '2.26', '3.39', '4.52'],
      1,
      `Flux $= \\frac{q_{enc}}{\\epsilon_0}$.`,
    )
  },
  current: (ctx) => {
    const V = ctx.ri(6, 24)
    const R = ctx.ri(2, 6)
    const I = roundN(V / R, 2)
    return numericOptionCtx(
      `A ${V} V battery drives current through a ${R} Ω resistor. The current is:`,
      I,
      [V * R, V + R, V - R, roundN(V / (R * 2), 2)],
      `Ohm's law: $I = V/R$.`,
    )
  },
  kirchhoff: (ctx) => {
    return singleCtx(
      `Kirchhoff's junction rule is a consequence of conservation of:`,
      ['Charge', 'Energy', 'Momentum', 'Mass'],
      0,
      'Junction rule conserves charge.',
    )
  },
  bridge: (ctx) => {
    const p = ctx.ri(2, 5)
    const q = ctx.ri(2, 5)
    const s = ctx.ri(2, 5)
    const R = roundN((p * s) / q, 2)
    return numericOptionCtx(
      `In a balanced Wheatstone bridge, P = ${p} Ω, Q = ${q} Ω, S = ${s} Ω. R is:`,
      R,
      [roundN((p * q) / s, 2), roundN(p + q + s, 0), roundN((p * s * q), 2), roundN((p * q * s) / (p + q), 2)],
      `$P/Q = R/S$.`,
    )
  },
  potentiometer: (ctx) => {
    return singleCtx(
      `A potentiometer is used to measure:`,
      ['EMF of a cell', 'Current only', 'Resistance directly', 'Power'],
      0,
      'Potentiometer measures EMF by null method without drawing current.',
    )
  },
  resistivity: (ctx) => {
    const rho = ctx.ri(1, 3) / 100000
    const l = ctx.ri(1, 3)
    const A = ctx.ri(1, 3) / 1000000
    const R = roundN((rho * l) / A, 1)
    return numericOptionCtx(
      `A wire of ρ = ${rho} Ω·m, length ${l} m, area ${A} m² has resistance:`,
      R,
      [roundN((rho * A) / l, 5), roundN((rho * l * A), 6), roundN(R * 2, 1), roundN(R / 2, 1)],
      `$R = \\rho L/A$.`,
    )
  },
  magnetism: (ctx) => {
    return singleCtx(
      `The unit of magnetic field is:`,
      ['Tesla', 'Weber', 'Henry', 'Coulomb'],
      0,
      'Magnetic field (B) measured in tesla (T).',
    )
  },
  'moving-charge': (ctx) => {
    const q = ctx.ri(1, 3)
    const v = ctx.ri(100, 500)
    const B = ctx.ri(1, 3)
    const F = q * v * B * 0.1
    return numericOptionCtx(
      `A charge of ${q} μC moves at ${v} m/s perpendicular to a field of ${B} T. Force (mN):`,
      roundN(F, 2),
      [roundN(q * v * B, 2), roundN(q * v * B * 0.01, 3), roundN(q * B * 0.1, 3), roundN(F * 10, 2)],
      `$F = qvB\\sin\\theta$, θ = 90°.`,
    )
  },
  'biot-savart': (ctx) => {
    const I = ctx.ri(2, 6)
    const d = ctx.ri(1, 3)
    const B = roundN((2 * I) / d, 2)
    return numericOptionCtx(
      `The field at the centre of a circular coil (${I} A, radius ${d} cm) is (×10⁻⁵ T):`,
      B,
      [roundN(I / d, 2), roundN(I * d, 1), roundN(B / 2, 2), roundN((2 * I * d), 2)],
      `$B = \\frac{\\mu_0 I}{2r}$.`,
    )
  },
  'amperes-law': (ctx) => {
    const I = ctx.ri(2, 5)
    const r = ctx.ri(2, 6)
    const B = roundN((2 * 1e-7 * I) / (r / 100), 1)
    return numericOptionCtx(
      `Field at ${r} cm from a long wire carrying ${I} A (μT):`,
      B,
      [roundN(B * 2, 1), roundN(B / 2, 1), roundN((2 * 1e-7 * I) * r, 2), roundN(B * 10, 1)],
      `$B = \\frac{\\mu_0 I}{2\\pi r}$.`,
    )
  },
  emi: (ctx) => {
    const N = ctx.ri(10, 50)
    const dPhi = ctx.ri(1, 5)
    const dt = ctx.ri(1, 3)
    const e = roundN((N * dPhi) / dt, 2)
    return numericOptionCtx(
      `A coil of ${N} turns has flux change ${dPhi} Wb in ${dt} s. Induced emf:`,
      e,
      [roundN(N * dPhi * dt, 2), roundN(dPhi / (N * dt), 4), roundN(e / 2, 2), roundN(N * dPhi, 2)],
      `$\\varepsilon = -N\\frac{d\\Phi}{dt}$.`,
    )
  },
  ac: (ctx) => {
    return singleCtx(
      `In an AC circuit containing only a capacitor, the current:`,
      ['Leads the voltage by 90°', 'Lags the voltage by 90°', 'Is in phase with voltage', 'Leads by 180°'],
      0,
      'In a pure capacitor, current leads voltage by 90°.',
    )
  },
  inductance: (ctx) => {
    const L = ctx.ri(1, 4)
    const dI = ctx.ri(2, 6)
    const dt = ctx.ri(1, 3)
    const e = roundN((L * dI) / dt, 2)
    return numericOptionCtx(
      `An inductor of ${L} H sees current change ${dI} A in ${dt} s. Induced emf:`,
      e,
      [roundN(L * dI * dt, 2), roundN(L * dt / dI, 2), roundN(e / 2, 2), roundN(L * dI, 2)],
      `$\\varepsilon = L\\frac{di}{dt}$.`,
    )
  },
  transformers: (ctx) => {
    const Np = ctx.ri(100, 400)
    const Ns = ctx.ri(50, 200)
    const Vp = ctx.ri(110, 240)
    const Vs = roundN((Vp * Ns) / Np, 1)
    return numericOptionCtx(
      `A transformer has ${Np} primary turns, ${Ns} secondary turns, V_p = ${Vp} V. V_s is:`,
      Vs,
      [roundN((Vp * Np) / Ns, 1), roundN(Vp * Np, 0), roundN(Vp * Ns, 0), roundN(Vs * 2, 1)],
      `$V_s/V_p = N_s/N_p$.`,
    )
  },
  'em-waves': (ctx) => {
    return singleCtx(
      `In an electromagnetic wave, the electric and magnetic fields oscillate:`,
      ['Perpendicular to each other and to propagation', 'Parallel to each other', 'In the same direction as propagation', 'Randomly'],
      0,
      'EM waves are transverse: E ⊥ B ⊥ direction of propagation.',
    )
  },
  'ray-optics': (ctx) => {
    const i = 30
    const r = roundN(Math.asin(Math.sin((i * Math.PI) / 180) / 1.5) * 180 / Math.PI, 1)
    return numericOptionCtx(
      `Light enters glass (n = 1.5) from air at 30°. The refracted angle is:`,
      r,
      [30, roundN(60 / 1.5, 1), roundN(r * 2, 1), roundN(Math.asin(Math.sin(i * Math.PI / 180) * 1.5) * 180 / Math.PI, 1)],
      `Snell's law: $n_1\\sin i = n_2\\sin r$.`,
    )
  },
  lens: (ctx) => {
    const f = ctx.ri(10, 30)
    const u = ctx.ri(40, 80)
    const v = roundN((f * u) / (u - f), 1)
    return numericOptionCtx(
      `A lens of focal length ${f} cm forms an image of an object ${u} cm away. Image distance is:`,
      v,
      [roundN((f * u) / (u + f), 1), roundN(u - f, 0), roundN(u + f, 0), roundN(v / 2, 1)],
      `$\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$ (sign conventions).`,
    )
  },
  prism: (ctx) => {
    return singleCtx(
      `For a prism of small angle A, the deviation δ is approximately:`,
      ['$(n-1)A$', '$nA$', '$A/(n-1)$', '$(n+1)A$'],
      0,
      'Small angle prism: δ = (n − 1)A.',
    )
  },
  'optical-instruments': (ctx) => {
    const f = ctx.ri(2, 5) / 100
    const M = roundN(25 / (f * 100), 0)
    return numericOptionCtx(
      `A magnifying glass of focal length ${Math.round(f * 100)} cm has angular magnification (near point 25 cm):`,
      M,
      [roundN(25 * f * 100, 0), roundN(25 / (f * 100) * 2, 0), roundN(M / 2, 0), roundN(25 * f, 0)],
      `$M = \\frac{25}{f}$ (f in cm).`,
    )
  },
  'total-internal-reflection': (ctx) => {
    const n = 1.5
    const c = roundN(Math.asin(1 / n) * 180 / Math.PI, 1)
    return numericOptionCtx(
      `The critical angle for glass (n = 1.5) in air is:`,
      c,
      [roundN(90 - c, 1), roundN(Math.asin(n) * 180 / Math.PI, 1), 30, roundN(c * 2, 1)],
      `$\\sin c = \\frac{1}{n}$.`,
    )
  },
  'wave-optics': (ctx) => {
    const lambda = ctx.ri(400, 700)
    const D = ctx.ri(100, 200) / 100
    const d = ctx.ri(1, 5) / 10000
    const beta = roundN((lambda * 1e-9 * D) / d * 1000, 2)
    return numericOptionCtx(
      `In YDSE with λ = ${lambda} nm, D = ${D} m, d = ${d} m, the fringe width is (mm):`,
      beta,
      [roundN(beta * 2, 2), roundN((lambda * 1e-9 * d) / D * 1000, 4), roundN(beta / 2, 2), roundN(lambda * D / d, 2)],
      `$\\beta = \\frac{\\lambda D}{d}$.`,
    )
  },
  diffraction: (ctx) => {
    return singleCtx(
      `For single-slit diffraction, the first dark fringe occurs when:`,
      ['$a\\sin\\theta = \\lambda$', '$a\\sin\\theta = \\lambda/2$', '$a\\cos\\theta = \\lambda$', '$\\sin\\theta = \\lambda a$'],
      0,
      'First minima: a sin θ = λ.',
    )
  },
  polarisation: (ctx) => {
    return singleCtx(
      `Brewster's angle satisfies:`,
      ['$\\tan i_B = n$', '$\\sin i_B = n$', '$\\cos i_B = n$', '$i_B = n/2$'],
      0,
      'At Brewster angle, reflected ray is fully polarised: tan i_B = n.',
    )
  },
  'young-double-slit': (ctx) => {
    return singleCtx(
      `In YDSE, if the distance between slits is halved, the fringe width:`,
      ['Doubles', 'Halves', 'Stays same', 'Becomes four times'],
      0,
      'β ∝ 1/d, so halving d doubles β.',
    )
  },
  photoelectric: (ctx) => {
    const hv = ctx.ri(3, 6)
    const phi = ctx.ri(1, 3)
    const KE = hv - phi
    return numericOptionCtx(
      `Photon energy ${hv} eV strikes a metal with work function ${phi} eV. Max KE of photoelectrons:`,
      KE,
      [hv + phi, hv, phi, KE + 1],
      `$KE_{max} = h\\nu - \\phi$.`,
    )
  },
  'de-broglie': (ctx) => {
    const v = ctx.ri(1, 5)
    const l = roundN(1240 / v, 1)
    return numericOptionCtx(
      `The de-Broglie wavelength of an electron accelerated through ${v} V is (Å):`,
      l,
      [roundN(1240 / (v * v), 1), roundN(12.27 / Math.sqrt(v), 2), roundN(1240 * v, 1), roundN(l * 2, 1)],
      `$\\lambda = \\frac{h}{\\sqrt{2meV}}$.`,
    )
  },
  radiation: (ctx) => {
    return singleCtx(
      `According to Stefan's law, the energy radiated by a black body:`,
      ['$\\propto T^4$', '$\\propto T^2$', '$\\propto T$', '$\\propto \\sqrt{T}$'],
      0,
      'Stefan-Boltzmann law: E ∝ T⁴.',
    )
  },
  atoms: (ctx) => {
    return singleCtx(
      `In Rutherford's experiment, most α-particles:`,
      ['Pass through undeflected', 'Are scattered by large angles', 'Are absorbed', 'Bounce back'],
      0,
      'Most pass through because atom is mostly empty space.',
    )
  },
  nucleus: (ctx) => {
    return singleCtx(
      `The binding energy per nucleon is highest for:`,
      ['Iron-56', 'Uranium-235', 'Hydrogen-1', 'Helium-4'],
      0,
      'Fe-56 has maximum binding energy per nucleon.',
    )
  },
  'bohr-model': (ctx) => {
    const n = ctx.ri(2, 4)
    const E = roundN(-13.6 / (n * n), 2)
    return numericOptionCtx(
      `Energy of the ${n === 1 ? 'first' : n === 2 ? 'second' : n === 3 ? 'third' : 'fourth'} Bohr orbit of hydrogen (eV):`,
      E,
      [roundN(-13.6 * n, 1), roundN(13.6 / n, 2), roundN(-13.6 * n * n, 0), roundN(E / 2, 2)],
      `$E_n = -\\frac{13.6}{n^2}$ eV.`,
    )
  },
  radioactivity: (ctx) => {
    const N0 = ctx.ri(1, 8) * 1000
    const halfLives = ctx.ri(1, 3)
    const N = N0 / Math.pow(2, halfLives)
    return numericOptionCtx(
      `A sample of ${N0} nuclei decays for ${halfLives} half-lives. Remaining nuclei:`,
      N,
      [N0 * (1 - 1 / Math.pow(2, halfLives)), N0 / halfLives, N0 - N0 / Math.pow(2, halfLives), N * 2],
      `$N = N_0(1/2)^n$.`,
    )
  },
  semiconductors: (ctx) => {
    return singleCtx(
      `A p-type semiconductor is formed by doping silicon with:`,
      ['Trivalent impurity', 'Pentavalent impurity', 'Tetravalent impurity', 'Any impurity'],
      0,
      'p-type: trivalent dopant (e.g., boron) creates holes.',
    )
  },
  diodes: (ctx) => {
    return singleCtx(
      `A forward-biased ideal diode behaves as:`,
      ['A closed switch', 'An open switch', 'A capacitor', 'A resistor of high value'],
      0,
      'Forward biased → conducts (closed switch).',
    )
  },
  'logic-gates': (ctx) => {
    return singleCtx(
      `The output of a NAND gate is LOW when:`,
      ['All inputs are HIGH', 'All inputs are LOW', 'Any input is LOW', 'At least one input HIGH'],
      0,
      'NAND: output is LOW only when all inputs are HIGH.',
    )
  },
  transistors: (ctx) => {
    return singleCtx(
      `The current gain β of a transistor in common-emitter mode is defined as:`,
      ['$\\Delta I_C/\\Delta I_B$', '$\\Delta I_B/\\Delta I_C$', '$\\Delta I_E/\\Delta I_B$', '$\\Delta I_C/\\Delta I_E$'],
      0,
      'β = ΔI_C / ΔI_B in CE configuration.',
    )
  },
  experimental: (ctx) => {
    return singleCtx(
      `The least count of a screw gauge with pitch 0.5 mm and 50 divisions is:`,
      ['0.01 mm', '0.001 mm', '0.1 mm', '0.05 mm'],
      0,
      'Least count = pitch / divisions = 0.5/50 = 0.01 mm.',
    )
  },
}

// ============================================================
// CHEMISTRY
// ============================================================

const CHEM_TEMPLATES: Record<string, Template> = {
  'mole-concept': (ctx) => {
    const g = ctx.ri(20, 80)
    const M = ctx.ri(2, 6) * 10
    const n = roundN(g / M, 2)
    return numericOptionCtx(
      `The number of moles in ${g} g of a compound with molar mass ${M} g/mol is:`,
      n,
      [roundN(g * M, 0), roundN(M / g, 3), roundN(n * 2, 2), roundN(n / 2, 2)],
      `$n = \\frac{m}{M}$.`,
    )
  },
  stoichiometry: (ctx) => {
    const a = ctx.ri(2, 4)
    const b = ctx.ri(1, 3)
    return singleCtx(
      `For the reaction $N_2 + ${b}H_2 \\rightarrow ${a}NH_3$, the missing coefficient of NH₃ is:`,
      ['2', '3', '4', '1'],
      1,
      'Balancing: N₂ + 3H₂ → 2NH₃.',
    )
  },
  'equivalent-weight': (ctx) => {
    return singleCtx(
      `Equivalent weight of H₂SO₄ (molar mass 98) is:`,
      ['49', '98', '32.6', '196'],
      0,
      'Eq wt = M/n = 98/2 = 49.',
    )
  },
  concentration: (ctx) => {
    const g = ctx.ri(5, 20)
    const V = ctx.ri(100, 500)
    const M = ctx.ri(2, 5) * 10
    const molarity = roundN((g / M) * 1000 / V, 2)
    return numericOptionCtx(
      `${g} g of solute (M = ${M}) in ${V} mL solution gives molarity:`,
      molarity,
      [roundN((g * M * 1000) / V, 2), roundN((g / M) * V / 1000, 3), roundN(molarity * 2, 2), roundN(g / V, 3)],
      `$M = \\frac{w\\times1000}{M_{mol}\\times V(mL)}$.`,
    )
  },
  'atomic-models': (ctx) => {
    return singleCtx(
      `The model that proposed that electrons revolve in fixed orbits is:`,
      ['Bohr model', 'Thomson model', 'Rutherford model', 'Dalton model'],
      0,
      'Bohr model introduced fixed circular orbits.',
    )
  },
  'quantum-numbers': (ctx) => {
    const n = ctx.ri(2, 4)
    const total = 2 * n * n
    return numericOptionCtx(
      `The maximum number of electrons in the ${n}th principal shell is:`,
      total,
      [n * n, 2 * n, n * n * 2, total / 2],
      `$2n^2$ electrons.`,
    )
  },
  'electronic-configuration': (ctx) => {
    return singleCtx(
      `The electronic configuration of ${ctx.ri(11, 20)} ... The element with configuration $1s^2 2s^2 2p^6 3s^2 3p^4$ is:`,
      ['Sulphur', 'Oxygen', 'Chlorine', 'Phosphorus'],
      0,
      '16 electrons → Sulphur (Z=16).',
    )
  },
  'de-broglie-uncertainty': (ctx) => {
    return singleCtx(
      `The Heisenberg uncertainty principle is:`,
      ['$\\Delta x \\cdot \\Delta p \\ge \\frac{h}{4\\pi}$', '$\\Delta x \\cdot \\Delta p \\le \\frac{h}{4\\pi}$', '$\\Delta E \\cdot \\Delta t = 0$', '$\\Delta x \\cdot \\Delta v \\ge h$'],
      0,
      'Heisenberg: Δx·Δp ≥ h/4π.',
    )
  },
  photoelectric: (ctx) => {
    const W = ctx.ri(2, 5)
    const v = ctx.ri(5, 10)
    const KE = v - W
    return numericOptionCtx(
      `Photon energy ${v} eV on metal with work function ${W} eV gives KE (eV):`,
      KE,
      [v + W, v, W, KE + 1],
      `$KE = h\\nu - \\phi$.`,
    )
  },
  'periodic-table': (ctx) => {
    return singleCtx(
      `The element with atomic number ${ctx.ri(11, 18)} belongs to:`,
      ['p-block', 's-block', 'd-block', 'f-block'],
      0,
      'Z = 11–18 are p-block elements (Na–Ar).',
    )
  },
  periodicity: (ctx) => {
    return singleCtx(
      `Across a period, the atomic radius generally:`,
      ['Decreases', 'Increases', 'Remains constant', 'First increases then decreases'],
      0,
      'Effective nuclear charge increases → radius decreases across a period.',
    )
  },
  'ionisation-energy': (ctx) => {
    return singleCtx(
      `The element with the highest first ionisation energy is:`,
      ['He', 'Ne', 'F', 'N'],
      0,
      'Helium has the highest first IE among all elements.',
    )
  },
  electronegativity: (ctx) => {
    return singleCtx(
      `The most electronegative element is:`,
      ['F', 'Cl', 'O', 'N'],
      0,
      'Fluorine (4.0) is the most electronegative.',
    )
  },
  'atomic-radius': (ctx) => {
    return singleCtx(
      `Which has the largest atomic radius?`,
      ['Cs', 'K', 'Na', 'Li'],
      0,
      'Atomic radius increases down the group; Cs is largest.',
    )
  },
  'ionic-bond': (ctx) => {
    return singleCtx(
      `Ionic compounds are generally:`,
      ['Soluble in water and conduct electricity when molten', 'Insoluble in water', 'Gases at room temperature', 'Poor electrical conductors when molten'],
      0,
      'Ionic compounds dissolve in polar solvents and conduct when molten/aqueous.',
    )
  },
  'covalent-bond': (ctx) => {
    return singleCtx(
      `A sigma bond is formed by:`,
      ['End-on overlap of atomic orbitals', 'Side-on overlap of p orbitals', 'Overlap of s and d orbitals sideways', 'None of these'],
      0,
      'σ bonds: end-on (head-on) overlap along the internuclear axis.',
    )
  },
  vsepr: (ctx) => {
    return singleCtx(
      `The shape of $NH_3$ according to VSEPR is:`,
      ['Trigonal pyramidal', 'Trigonal planar', 'Tetrahedral', 'Linear'],
      0,
      'NH₃: 3 bonds + 1 lone pair → trigonal pyramidal.',
    )
  },
  hybridisation: (ctx) => {
    return singleCtx(
      `The hybridisation of carbon in $CH_4$ is:`,
      ['$sp^3$', '$sp^2$', '$sp$', '$sp^3d$'],
      0,
      'Methane is tetrahedral → sp³.',
    )
  },
  'molecular-orbital-theory': (ctx) => {
    return singleCtx(
      `The bond order of $O_2$ is:`,
      ['2', '2.5', '1.5', '3'],
      0,
      'O₂ bond order = (10 − 6)/2 = 2.',
    )
  },
  'hydrogen-bonding': (ctx) => {
    return singleCtx(
      `The strongest hydrogen bonding is present in:`,
      ['$HF$', '$NH_3$', '$H_2O$', '$CH_4$'],
      0,
      'HF has the strongest hydrogen bond (F is most electronegative).',
    )
  },
  resonance: (ctx) => {
    return singleCtx(
      `Resonance in a molecule implies:`,
      ['Delocalisation of electrons over multiple structures', 'Rotation around bonds', 'Presence of double bonds only', 'Loss of electrons'],
      0,
      'Resonance = electron delocalisation across resonance structures.',
    )
  },
  'gaseous-state': (ctx) => {
    const P = ctx.ri(1, 4)
    const V = ctx.ri(10, 40)
    const n = ctx.ri(1, 4)
    const T = roundN((P * V) / (0.0821 * n), 1)
    return numericOptionCtx(
      `${n} mol of gas at ${P} atm occupies ${V} L. Its temperature is (K):`,
      T,
      [roundN((P * V * 0.0821) / n, 2), roundN((P * n) / (0.0821 * V), 2), roundN(T * 2, 1), roundN(V / (n * P), 2)],
      `$PV = nRT$.`,
    )
  },
  'ideal-gas': (ctx) => {
    return singleCtx(
      `The ideal gas equation is:`,
      ['$PV = nRT$', '$PV = n/T$', '$PV^2 = nRT$', '$P/V = nRT$'],
      0,
      'Ideal gas law: PV = nRT.',
    )
  },
  'real-gas': (ctx) => {
    return singleCtx(
      `The compressibility factor Z for a real gas at moderate pressure is:`,
      ['Less than 1 for attractive forces dominating', 'Always greater than 1', 'Always exactly 1', 'Independent of pressure'],
      0,
      'When attractive forces dominate, Z < 1.',
    )
  },
  liquids: (ctx) => {
    return singleCtx(
      `Vapour pressure of a liquid:`,
      ['Increases with temperature', 'Decreases with temperature', 'Is constant', 'Depends only on volume'],
      0,
      'Vapour pressure increases with temperature (Clausius-Clapeyron).',
    )
  },
  thermodynamics: (ctx) => {
    return singleCtx(
      `The first law of thermodynamics is expressed as:`,
      ['$\\Delta U = q + w$', '$\\Delta U = q - T$', '$\\Delta H = q + p$', '$q = \\Delta G$'],
      0,
      'First law: ΔU = q + w (with sign convention).',
    )
  },
  'first-law': (ctx) => {
    const q = ctx.ri(100, 400)
    const w = ctx.ri(50, 200)
    const dU = q - w
    return numericOptionCtx(
      `A system absorbs ${q} J and does ${w} J of work. ΔU is:`,
      dU,
      [q + w, w - q, q, w],
      `$\\Delta U = q - w$ (work done by system).`,
    )
  },
  enthalpy: (ctx) => {
    return singleCtx(
      `The enthalpy change for the reaction $H_2 + \\frac{1}{2}O_2 \\rightarrow H_2O$ is called:`,
      ['Heat of formation of water', 'Heat of combustion of hydrogen', 'Heat of atomisation', 'Bond energy'],
      0,
      'Formation of 1 mol from elements = heat of formation.',
    )
  },
  entropy: (ctx) => {
    return singleCtx(
      `For a spontaneous process at constant T and P:`,
      ['$\\Delta G < 0$', '$\\Delta G > 0$', '$\\Delta G = 0$', '$\\Delta H > 0$ always'],
      0,
      'Spontaneity: ΔG < 0.',
    )
  },
  'hess-law': (ctx) => {
    return singleCtx(
      `Hess's law states that enthalpy change:`,
      ['Depends only on initial and final states', 'Depends on the path', 'Is always positive', 'Is independent of state'],
      0,
      "Hess's law: ΔH depends only on initial and final states.",
    )
  },
  'bond-energies': (ctx) => {
    const bond = ctx.ri(100, 500)
    return singleCtx(
      `The enthalpy of atomisation of a diatomic molecule $X_2$ with bond energy ${bond} kJ/mol is:`,
      [`${bond} kJ/mol`, `${bond * 2} kJ/mol`, `${bond / 2} kJ/mol`, `0`],
      0,
      'Breaking 1 mol of X–X bonds requires bond energy value itself.',
    )
  },
  'chemical-equilibrium': (ctx) => {
    const Kc = ctx.ri(4, 9)
    return singleCtx(
      `If $K_c$ for $N_2 + 3H_2 \\rightleftharpoons 2NH_3$ is ${Kc}$, the reaction is:`,
      ['Product-favoured', 'Reactant-favoured', 'At equilibrium with equal concentrations', 'Non-spontaneous'],
      0,
      'Kc > 1 → product favoured.',
    )
  },
  'le-chatelier': (ctx) => {
    return singleCtx(
      `For $N_2 + 3H_2 \\rightleftharpoons 2NH_3$ (exothermic), increasing pressure:`,
      ['Shifts equilibrium to the right', 'Shifts equilibrium to the left', 'No effect', 'Increases Kc'],
      0,
      'Higher pressure favours fewer gas moles (2 vs 4) → forward.',
    )
  },
  'ionic-equilibrium': (ctx) => {
    return singleCtx(
      `A strong acid is one that:`,
      ['Completely dissociates in water', 'Partially dissociates', 'Does not dissociate', 'Has pH > 7'],
      0,
      'Strong acids fully dissociate in aqueous solution.',
    )
  },
  'ph-buffer': (ctx) => {
    const H = ctx.ri(1, 9) / 10000000
    const pH = roundN(-Math.log10(H), 1)
    return numericOptionCtx(
      `The pH of a solution with $[H^+] = ${H}$ M is:`,
      pH,
      [roundN(Math.log10(H), 1), roundN(14 - pH, 1), roundN(pH + 1, 1), roundN(pH * 2, 1)],
      `$pH = -\\log[H^+]$.`,
    )
  },
  'solubility-product': (ctx) => {
    const S = ctx.ri(1, 5) / 100
    const Ksp = roundN(4 * S * S * S, 5)
    return numericOptionCtx(
      `Solubility of $Ag_2CrO_4$ is ${S} M. Its Ksp is:`,
      Ksp,
      [roundN(S * S, 4), roundN(S * S * S, 5), roundN(4 * S * S, 4), roundN(2 * S * S * S, 5)],
      `$K_{sp} = 4S^3$ for A₂B type.`,
    )
  },
  'common-ion': (ctx) => {
    return singleCtx(
      `The solubility of AgCl in water decreases on adding:`,
      ['NaCl', 'NaNO₃', 'KBr', 'H₂O'],
      0,
      'Common ion Cl⁻ suppresses AgCl dissociation (common ion effect).',
    )
  },
  redox: (ctx) => {
    return singleCtx(
      `The oxidation number of Cr in $K_2Cr_2O_7$ is:`,
      ['+6', '+3', '+2', '+7'],
      0,
      '2(+1) + 2x + 7(−2) = 0 → x = +6.',
    )
  },
  'balancing-redox': (ctx) => {
    return singleCtx(
      `In the redox reaction $Fe^{3+} + e^- \\rightarrow Fe^{2+}$, iron is:`,
      ['Reduced', 'Oxidised', 'Disproportionated', 'Unchanged'],
      0,
      'Gain of electron = reduction.',
    )
  },
  'electrochemical-cells': (ctx) => {
    return singleCtx(
      `In a galvanic cell, the anode is the electrode where:`,
      ['Oxidation occurs', 'Reduction occurs', 'No reaction occurs', 'Salt bridge connects'],
      0,
      'Anode = oxidation.',
    )
  },
  'nernst-equation': (ctx) => {
    return singleCtx(
      `The Nernst equation for the cell potential at non-standard conditions is:`,
      ['$E = E^0 - \\frac{0.059}{n}\\log Q$', '$E = E^0 + \\frac{0.059}{n}\\log Q$', '$E = E^0$', '$E = -\\frac{0.059}{n}$'],
      0,
      'Nernst: E = E⁰ − (0.059/n) log Q (at 25 °C).',
    )
  },
  'faraday-laws': (ctx) => {
    const I = ctx.ri(1, 5)
    const t = ctx.ri(1, 5)
    const q = I * t
    return numericOptionCtx(
      `Charge passed by ${I} A for ${t} s is:`,
      q,
      [I + t, I * t * t, I / t, q * 2],
      `$Q = It$.`,
    )
  },
  hydrogen: (ctx) => {
    return singleCtx(
      `The most abundant isotope of hydrogen is:`,
      ['Protium', 'Deuterium', 'Tritium', 'Hydrogen-4'],
      0,
      'Protium (¹H) is most abundant (~99.98%).',
    )
  },
  water: (ctx) => {
    return singleCtx(
      `The O–H–O bond angle in water is approximately:`,
      ['104.5°', '109.5°', '120°', '180°'],
      0,
      'Water has bent structure with ~104.5° bond angle.',
    )
  },
  h2o2: (ctx) => {
    return singleCtx(
      `Hydrogen peroxide acts as:`,
      ['Both oxidising and reducing agent', 'Only oxidising agent', 'Only reducing agent', 'Neither'],
      0,
      'H₂O₂ can be oxidised or reduced → both.',
    )
  },
  'alkali-metals': (ctx) => {
    return singleCtx(
      `The most reactive alkali metal is:`,
      ['Cs', 'Li', 'Na', 'K'],
      0,
      'Reactivity increases down the group; Cs most reactive.',
    )
  },
  'alkaline-earth': (ctx) => {
    return singleCtx(
      `The element used in photoelectric cells is:`,
      ['Caesium', 'Beryllium', 'Magnesium', 'Calcium'],
      0,
      'Caesium (alkali metal) has low work function, used in photoelectric cells.',
    )
  },
  'sblock-compounds': (ctx) => {
    return singleCtx(
      `Baking soda is:`,
      ['$NaHCO_3$', '$Na_2CO_3$', '$NaOH$', '$NaCl$'],
      0,
      'Baking soda = sodium bicarbonate (NaHCO₃).',
    )
  },
  'boron-family': (ctx) => {
    return singleCtx(
      `Boron is:`,
      ['A metalloid', 'A metal', 'A non-metal', 'A noble gas'],
      0,
      'Boron exhibits metalloid properties.',
    )
  },
  'carbon-family': (ctx) => {
    return singleCtx(
      `The element that forms the hardest known natural substance (in one allotrope) is:`,
      ['Carbon', 'Silicon', 'Germanium', 'Lead'],
      0,
      'Carbon (diamond allotrope) is hardest.',
    )
  },
  'nitrogen-family': (ctx) => {
    return singleCtx(
      `The most abundant gas in the atmosphere is:`,
      ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'],
      0,
      'N₂ ~78% of atmosphere.',
    )
  },
  'oxygen-family': (ctx) => {
    return singleCtx(
      `The element that shows the property of catenation most strongly is:`,
      ['Sulphur', 'Oxygen', 'Selenium', 'Tellurium'],
      0,
      'Sulphur shows the strongest catenation in the group.',
    )
  },
  halogens: (ctx) => {
    return singleCtx(
      `The halogen with the highest electronegativity is:`,
      ['Fluorine', 'Chlorine', 'Bromine', 'Iodine'],
      0,
      'Fluorine is the most electronegative element overall.',
    )
  },
  'noble-gases': (ctx) => {
    return singleCtx(
      `Which noble gas is used in discharge tubes for red light (advertising signs)?`,
      ['Neon', 'Helium', 'Argon', 'Krypton'],
      0,
      'Neon glows red in discharge tubes.',
    )
  },
  'transition-metals': (ctx) => {
    return singleCtx(
      `Transition metals exhibit variable oxidation states primarily because:`,
      ['d orbitals are close in energy to s orbitals', 'They have high density', 'They are hard', 'They have f orbitals'],
      0,
      'Similar energies of (n−1)d and ns orbitals → variable oxidation states.',
    )
  },
  'dblock-properties': (ctx) => {
    return singleCtx(
      `A transition metal that is a strong oxidising agent in $K_2Cr_2O_7$ is:`,
      ['Cr', 'Mn', 'Fe', 'Ni'],
      0,
      'Dichromate (Cr⁶⁺) is a strong oxidising agent.',
    )
  },
  lanthanoids: (ctx) => {
    return singleCtx(
      `The lanthanoid contraction is due to:`,
      ['Poor shielding of 4f electrons', 'Excellent shielding of 4f electrons', 'Presence of 5d electrons', 'Relativistic effects only'],
      0,
      'Lanthanoid contraction: imperfect shielding of 4f electrons.',
    )
  },
  actinoids: (ctx) => {
    return singleCtx(
      `Actinoids, unlike lanthanoids, commonly exhibit:`,
      ['Variable oxidation states', 'Only +3 state', 'No radioactivity', 'Diamagnetism'],
      0,
      'Actinoids show more variable oxidation states than lanthanoids.',
    )
  },
  'coordination-basics': (ctx) => {
    return singleCtx(
      `In $[Co(NH_3)_6]Cl_3$, the coordination number of Co is:`,
      ['6', '3', '9', '1'],
      0,
      'Six NH₃ ligands → CN = 6.',
    )
  },
  'werners-theory': (ctx) => {
    return singleCtx(
      `According to Werner, the primary valency is:`,
      ['Ionisable and satisfied by anions', 'Non-ionisable', 'Always zero', 'Satisfied by ligands'],
      0,
      'Primary valency = ionisable, satisfied by negative ions.',
    )
  },
  'iupac-coordination': (ctx) => {
    return singleCtx(
      `The IUPAC name of $K_3[Fe(CN)_6]$ is:`,
      ['Potassium hexacyanidoferrate(III)', 'Potassium ferricyanide', 'Potassium hexacyanidoferrate(II)', 'Iron potassium cyanide'],
      0,
      'Ligands first (alphabetical), central metal with oxidation state in brackets.',
    )
  },
  'isomerism-coordination': (ctx) => {
    return singleCtx(
      `$[Co(NH_3)_5Br]SO_4$ and $[Co(NH_3)_5SO_4]Br$ are:`,
      ['Ionisation isomers', 'Geometrical isomers', 'Linkage isomers', 'Optical isomers'],
      0,
      'Different ions outside coordination sphere → ionisation isomers.',
    )
  },
  cft: (ctx) => {
    return singleCtx(
      `In octahedral field, the d-orbital splitting places ${'$e_g$'} orbitals:`,
      ['Higher in energy than $t_{2g}$', 'Lower in energy than $t_{2g}$', 'Equal to $t_{2g}$', 'At zero energy'],
      0,
      'e_g (d_z², d_x²−y²) are higher energy; t₂g lower.',
    )
  },
  vbt: (ctx) => {
    return singleCtx(
      `Inner orbital octahedral complexes use which hybridisation?`,
      ['$d^2sp^3$', '$sp^3d^2$', '$sp^3$', '$dsp^2$'],
      0,
      'Inner orbital: d²sp³ (uses 3d orbitals).',
    )
  },
  pollution: (ctx) => {
    return singleCtx(
      `The primary pollutant responsible for acid rain is:`,
      ['$SO_2$', '$CO_2$', '$N_2$', '$O_3$'],
      0,
      'SO₂ (and NOₓ) cause acid rain.',
    )
  },
  greenhouse: (ctx) => {
    return singleCtx(
      `The main greenhouse gas from human activities is:`,
      ['$CO_2$', '$N_2$', '$O_2$', '$Ar$'],
      0,
      'CO₂ is the main anthropogenic greenhouse gas.',
    )
  },
  'water-treatment': (ctx) => {
    return singleCtx(
      `The BOD of water indicates:`,
      ['Organic pollution level', 'Acidity', 'Hardness', 'Salinity'],
      0,
      'High BOD = high organic pollution.',
    )
  },
  purification: (ctx) => {
    return singleCtx(
      `The method used to purify liquids by boiling point difference is:`,
      ['Distillation', 'Filtration', 'Crystallisation', 'Sublimation'],
      0,
      'Distillation separates by boiling point differences.',
    )
  },
  'iupac-organic': (ctx) => {
    return singleCtx(
      `The IUPAC name of $CH_3CH_2CH_2OH$ is:`,
      ['Propan-1-ol', 'Propanol', 'Propane-1-ol', '1-Hydroxypropane'],
      0,
      '3-carbon chain with OH at C1 → propan-1-ol.',
    )
  },
  isomerism: (ctx) => {
    return singleCtx(
      `$CH_3OCH_3$ and $CH_3CH_2OH$ are:`,
      ['Functional isomers', 'Position isomers', 'Chain isomers', 'Tautomers'],
      0,
      'Ether vs alcohol = functional isomers.',
    )
  },
  goc: (ctx) => {
    return singleCtx(
      `The most stable carbocation is:`,
      ['$(CH_3)_3C^+$', '$(CH_3)_2CH^+$', '$CH_3CH_2^+$', '$CH_3^+$'],
      0,
      'Tertiary carbocation is most stable (hyperconjugation + inductive).',
    )
  },
  'electronic-effects': (ctx) => {
    return singleCtx(
      `The +I effect is exhibited by:`,
      ['Alkyl groups', 'Nitro group', 'Cyano group', 'Carbonyl group'],
      0,
      'Alkyl groups donate electrons (+I).',
    )
  },
  'reaction-mechanism': (ctx) => {
    return singleCtx(
      `A free radical intermediate has:`,
      ['An unpaired electron', 'No electrons', 'A positive charge', 'A negative charge'],
      0,
      'Free radicals carry an unpaired electron.',
    )
  },
  stereochemistry: (ctx) => {
    return singleCtx(
      `A molecule is optically active if it is:`,
      ['Chiral', 'Achiral', 'Planar', 'Symmetrical'],
      0,
      'Chirality → optical activity.',
    )
  },
  alkanes: (ctx) => {
    return singleCtx(
      `Alkanes undergo primarily:`,
      ['Substitution reactions', 'Addition reactions', 'Electrophilic substitution', 'Polymerisation'],
      0,
      'Alkanes undergo free-radical substitution (e.g., halogenation).',
    )
  },
  alkenes: (ctx) => {
    return singleCtx(
      `Markovnikov's rule applies to the addition of HX to:`,
      ['Alkenes', 'Alkanes', 'Alcohols', 'Amines'],
      0,
      "Markovnikov's rule: H adds to the C with more H.",
    )
  },
  alkynes: (ctx) => {
    return singleCtx(
      `The acidic hydrogen is present in:`,
      ['$CH\\equiv CH$', '$CH_2=CH_2$', '$CH_3-CH_3$', '$CH_4$'],
      0,
      'Terminal alkynes are weakly acidic (sp C–H).',
    )
  },
  aromatic: (ctx) => {
    return singleCtx(
      `Benzene undergoes:`,
      ['Electrophilic aromatic substitution', 'Addition reactions', 'Free radical substitution', 'Nucleophilic substitution'],
      0,
      'Benzene reacts via electrophilic aromatic substitution (stability of ring).',
    )
  },
  haloalkanes: (ctx) => {
    return singleCtx(
      `$CH_3Cl$ reacts with aqueous KOH to give:`,
      ['$CH_3OH$', '$CH_4$', '$CH_3CH_3$', '$CH_2Cl_2$'],
      0,
      'Nucleophilic substitution with OH⁻ → methanol.',
    )
  },
  haloarenes: (ctx) => {
    return singleCtx(
      `Aryl halides are less reactive than alkyl halides in nucleophilic substitution because:`,
      ['Resonance stabilisation of the C–X bond', 'They are more polar', 'Larger size of ring', 'They have no electrons'],
      0,
      'Resonance gives partial double-bond character to C–X → less reactive.',
    )
  },
  'sn-reactions': (ctx) => {
    return singleCtx(
      `SN1 reactions are favoured by:`,
      ['Polar protic solvents and tertiary substrates', 'Polar aprotic solvents', 'Primary substrates', 'Strong nucleophiles'],
      0,
      'SN1: tertiary + polar protic solvent (carbocation intermediate).',
    )
  },
  alcohols: (ctx) => {
    return singleCtx(
      `Ethanol on oxidation with $K_2Cr_2O_7/H^+$ gives:`,
      ['Acetaldehyde', 'Acetic acid', 'Ethene', 'Ether'],
      0,
      'Controlled oxidation → aldehyde; further oxidation → acid.',
    )
  },
  phenols: (ctx) => {
    return singleCtx(
      `Phenols are:`,
      ['Weakly acidic', 'Basic', 'Neutral', 'Amphoteric only in strong acid'],
      0,
      'Phenols are weak acids (pKa ~10).',
    )
  },
  ethers: (ctx) => {
    return singleCtx(
      `Williamson's synthesis is used to prepare:`,
      ['Ethers', 'Alcohols', 'Ketones', 'Esters'],
      0,
      "Williamson's synthesis: alkoxide + alkyl halide → ether.",
    )
  },
  aldehydes: (ctx) => {
    return singleCtx(
      `Tollens' reagent gives a silver mirror with:`,
      ['Aldehydes', 'Ketones', 'Carboxylic acids', 'Esters'],
      0,
      "Tollens' reagent oxidises aldehydes only.",
    )
  },
  ketones: (ctx) => {
    return singleCtx(
      `Ketones do not reduce Tollens' reagent because:`,
      ['They lack a terminal carbonyl hydrogen', 'They are too reactive', 'They are salts', 'They reduce it too strongly'],
      0,
      'Ketones lack the −CHO hydrogen → no reduction of Ag⁺.',
    )
  },
  'carboxylic-acids': (ctx) => {
    return singleCtx(
      `Carboxylic acids are:`,
      ['Stronger acids than phenols', 'Weaker than water', 'Neutral', 'Bases'],
      0,
      'Carboxylic acids are stronger acids than phenols (pKa ~4–5).',
    )
  },
  'nucleophilic-addition': (ctx) => {
    return singleCtx(
      `Aldehydes undergo nucleophilic addition readily because:`,
      ['The carbonyl carbon is electrophilic', 'They are non-polar', 'They are salts', 'The carbonyl is saturated'],
      0,
      'Polarised C=O makes carbon electrophilic → nucleophilic addition.',
    )
  },
  amines: (ctx) => {
    return singleCtx(
      `Among primary, secondary and tertiary amines, the order of basicity in aqueous medium is:`,
      ['2° > 1° > 3° > NH₃', '3° > 2° > 1° > NH₃', '1° > 2° > 3° > NH₃', 'NH₃ > 3° > 2° > 1°'],
      0,
      'In water, 2° > 1° > 3° > NH₃ (solvation vs inductive).',
    )
  },
  diazonium: (ctx) => {
    return singleCtx(
      `Benzenediazonium chloride on heating with water gives:`,
      ['Phenol', 'Benzene', 'Aniline', 'Chlorobenzene'],
      0,
      'Diazonium → phenol with water (hydrolysis).',
    )
  },
  carbohydrates: (ctx) => {
    return singleCtx(
      `Glucose on reduction gives:`,
      ['Sorbitol', 'Fructose', 'Mannose', 'Glucuronic acid'],
      0,
      'Glucose reduces to sorbitol (NaBH₄/H₂).',
    )
  },
  proteins: (ctx) => {
    return singleCtx(
      `The bond that links amino acids in a protein is:`,
      ['Peptide bond', 'Glycosidic bond', 'Hydrogen bond only', 'Ionic bond'],
      0,
      'Proteins: peptide (amide) bonds between amino acids.',
    )
  },
  vitamins: (ctx) => {
    return singleCtx(
      `Vitamin C deficiency causes:`,
      ['Scurvy', 'Rickets', 'Night blindness', 'Anaemia'],
      0,
      'Vitamin C deficiency → scurvy.',
    )
  },
  'nucleic-acids': (ctx) => {
    return singleCtx(
      `DNA is a polymer of:`,
      ['Nucleotides', 'Amino acids', 'Monosaccharides', 'Fatty acids'],
      0,
      'DNA = polymer of nucleotides.',
    )
  },
  polymers: (ctx) => {
    return singleCtx(
      `A condensation polymer is:`,
      ['Nylon-6,6', 'Polythene', 'PVC', 'Teflon'],
      0,
      'Nylon (polyamide) forms by condensation with elimination of water.',
    )
  },
  polymerisation: (ctx) => {
    return singleCtx(
      `Addition polymers form from monomers:`,
      ['Without elimination of small molecules', 'With elimination of water', 'By condensation only', 'With loss of CO₂'],
      0,
      'Addition polymerisation: no small molecule eliminated.',
    )
  },
  drugs: (ctx) => {
    return singleCtx(
      `Antacids work by:`,
      ['Neutralising excess stomach acid', 'Killing bacteria', 'Suppressing enzymes', 'Diluting blood'],
      0,
      'Antacids neutralise gastric HCl.',
    )
  },
  'food-preservatives': (ctx) => {
    return singleCtx(
      `Sodium benzoate is used as a:`,
      ['Food preservative', 'Sweetener', 'Dye', 'Flavour'],
      0,
      'Sodium benzoate prevents microbial growth in food.',
    )
  },
  cleansing: (ctx) => {
    return singleCtx(
      `Soaps are:`,
      ['Sodium salts of long-chain fatty acids', 'Synthetic detergents only', 'Ethers', 'Esters of glycerol only'],
      0,
      'Soap = sodium/potassium salt of fatty acid.',
    )
  },
}

// ============================================================
// MATHEMATICS
// ============================================================

const MATH_TEMPLATES: Record<string, Template> = {
  sets: (ctx) => {
    const nA = ctx.ri(4, 10)
    const nB = ctx.ri(3, 8)
    const nI = ctx.ri(1, Math.min(nA, nB) - 1)
    const nU = nA + nB - nI
    return numericOptionCtx(
      `If $|A| = ${nA}$, $|B| = ${nB}$ and $|A \\cap B| = ${nI}$, then $|A \\cup B|$ is:`,
      nU,
      [nA + nB, nI, nA + nB + nI, nU * 2],
      `$|A \\cup B| = |A| + |B| - |A \\cap B|$.`,
    )
  },
  relations: (ctx) => {
    return singleCtx(
      `A relation R on a set is an equivalence relation if it is:`,
      ['Reflexive, symmetric and transitive', 'Reflexive and symmetric only', 'Symmetric and transitive only', 'Reflexive only'],
      0,
      'Equivalence = reflexive + symmetric + transitive.',
    )
  },
  functions: (ctx) => {
    const nA = ctx.ri(2, 4)
    const nB = ctx.ri(2, 4)
    const inj = nB >= nA ? `_${nB}P_${nA}` : '0'
    return singleCtx(
      `The number of injective functions from a set with ${nA} elements to a set with ${nB} elements is:`,
      [inj === '0' ? '0' : `$\\;{${nB}}P_{${nA}}$`, `$${nB}^{${nA}}$`, `$${nA}^{${nB}}$`, `$${nA}!$`],
      inj === '0' ? 0 : 0,
      `Injective functions = P(nB, nA) if nA ≤ nB, else 0.`,
    )
  },
  'inverse-functions': (ctx) => {
    return singleCtx(
      `If $f$ is bijective, then $f^{-1}\\circ f(x)$ equals:`,
      ['$x$', '$f(x)$', '$f^{-1}(x)$', '$1$'],
      0,
      '$f^{-1} \\circ f = \\text{identity}$.',
    )
  },
  'composite-functions': (ctx) => {
    const a = ctx.ri(2, 4)
    const b = ctx.ri(1, 3)
    return numericOptionCtx(
      `If $f(x) = ${a}x + ${b}$ and $g(x) = 2x$, then $f(g(1))$ is:`,
      2 * a + b,
      [a + b, 2 * (a + b), a * b, 2 * a],
      `$f(g(1)) = f(2) = ${a}\\cdot 2 + ${b}$.`,
    )
  },
  'complex-numbers': (ctx) => {
    const a = ctx.ri(1, 5)
    const b = ctx.ri(1, 5)
    const m = roundN(Math.sqrt(a * a + b * b), 1)
    return numericOptionCtx(
      `The modulus of $${a} + ${b}i$ is:`,
      m,
      [roundN(a + b, 1), roundN(a * b, 1), roundN(Math.sqrt(a * a - b * b), 1), roundN(a * a + b * b, 1)],
      `$|z| = \\sqrt{a^2 + b^2}$.`,
    )
  },
  'modulus-argument': (ctx) => {
    return singleCtx(
      `The argument of $1 + i$ is:`,
      ['$\\pi/4$', '$\\pi/2$', '$\\pi$', '$3\\pi/4$'],
      0,
      'arg(1+i) = tan⁻¹(1/1) = π/4.',
    )
  },
  'de-moivre': (ctx) => {
    const n = ctx.ri(2, 4)
    return singleCtx(
      `de Moivre's theorem states that:`,
      [`$(\\cos\\theta + i\\sin\\theta)^${n} = \\cos ${n}\\theta + i\\sin ${n}\\theta$`, `$(\\cos\\theta)^${n} = \\cos ${n}\\theta$`, `$(i)^{${n}} = ${n}$`, `$(\\cos\\theta + \\sin\\theta)^{${n}} = 1$`],
      0,
      `$(\cos\theta + i\sin\theta)^n = \cos n\theta + i\sin n\theta$.`,
    )
  },
  'quadratic-equations': (ctx) => {
    const s = ctx.ri(4, 8)
    const p = ctx.ri(4, 15)
    const disc = s * s - 4 * p
    const hasReal = disc >= 0
    return singleCtx(
      `The roots of $x^2 - ${s}x + ${p} = 0$ are:`,
      hasReal ? ['Real and distinct', 'Real and equal', 'Imaginary', 'Complex conjugate non-real'] : ['Real and distinct', 'Real and equal', 'Non-real complex', 'Equal'],
      hasReal ? 0 : 2,
      `Discriminant $= ${disc}$ → ${disc > 0 ? 'real distinct' : disc === 0 ? 'real equal' : 'non-real complex'}.`,
    )
  },
  roots: (ctx) => {
    const a = ctx.ri(2, 5)
    const b = ctx.ri(1, 4)
    const sum = roundN(-b / a, 2)
    return numericOptionCtx(
      `The sum of roots of ${a}x² + ${b}x + 1 = 0 is:`,
      sum,
      [roundN(b / a, 2), roundN(1 / a, 2), roundN(a / b, 2), roundN(-b * a, 2)],
      `Sum of roots $= -b/a$.`,
    )
  },
  'cube-roots': (ctx) => {
    return singleCtx(
      `If ω is a complex cube root of unity, then $1 + \\omega + \\omega^2 = $:`,
      ['0', '1', '-1', '3'],
      0,
      '$1 + ω + ω² = 0$.',
    )
  },
  matrices: (ctx) => {
    const a = ctx.ri(1, 3)
    const b = ctx.ri(1, 3)
    return singleCtx(
      `If $A$ is a ${a}×${b} matrix and $B$ is a ${b}×${a} matrix, then $AB$ is:`,
      [`$${a}\\times${a}$`, `$${b}\\times${b}$`, `$${a}\\times${b}$`, `$${b}\\times${a}$`],
      0,
      'Matrix product (m×n)(n×p) = m×p.',
    )
  },
  determinants: (ctx) => {
    const a = ctx.ri(2, 4)
    const b = ctx.ri(1, 3)
    const c = ctx.ri(1, 3)
    const d = ctx.ri(2, 4)
    const det = a * d - b * c
    return numericOptionCtx(
      `The determinant $\\begin{vmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{vmatrix}$ is:`,
      det,
      [a * d + b * c, a * c - b * d, a + d, det * 2],
      `Determinant $= ad - bc$.`,
    )
  },
  'adjoint-inverse': (ctx) => {
    return singleCtx(
      `A square matrix has an inverse only if:`,
      ['Its determinant is non-zero', 'Its determinant is zero', 'It is symmetric', 'It is diagonal'],
      0,
      'Inverse exists iff det ≠ 0 (non-singular).',
    )
  },
  'linear-equations': (ctx) => {
    return singleCtx(
      `The system $ax + by = e$, $ax + by = f$ (e ≠ f) has:`,
      ['No solution', 'Unique solution', 'Infinite solutions', 'Exactly two solutions'],
      0,
      'Parallel lines (same coefficients) → inconsistent → no solution.',
    )
  },
  eigenvalues: (ctx) => {
    const t = ctx.ri(3, 7)
    const d = ctx.ri(2, 12)
    const disc = t * t - 4 * d
    const l1 = roundN((t + Math.sqrt(disc)) / 2, 1)
    return numericOptionCtx(
      `The sum of eigenvalues of a 2×2 matrix with trace ${t} and determinant ${d} is:`,
      t,
      [d, roundN(d / t, 2), roundN(l1 * d, 1), roundN(t * d, 1)],
      'Sum of eigenvalues = trace.',
    )
  },
  permutations: (ctx) => {
    const n = ctx.ri(4, 6)
    const r = ctx.ri(2, Math.min(3, n))
    const val = Math.round(fact(n) / fact(n - r))
    const dist = [Math.round(Math.pow(n, r)), Math.round(fact(n) / (fact(r) * fact(n - r))), Math.round(fact(r)), Math.round(fact(n))]
    return numericOptionCtx(
      `The number of ways to arrange ${r} objects out of ${n} distinct objects is:`,
      val,
      dist,
      `$_${n}P_{${r}} = \\frac{${n}!}{${n - r}!}$.`,
    )
  },
  combinations: (ctx) => {
    const n = ctx.ri(5, 8)
    const r = ctx.ri(2, 4)
    const val = Math.round(fact(n) / (fact(r) * fact(n - r)))
    const dist = [Math.round(fact(n) / fact(n - r)), Math.round(Math.pow(2, r)), Math.round(val * 2), Math.round(fact(n) / fact(r))]
    return numericOptionCtx(
      `The number of ways to choose ${r} items from ${n} distinct items is:`,
      val,
      dist,
      `$_${n}C_{${r}} = \\frac{${n}!}{${r}!(${n - r})!}$.`,
    )
  },
  'circular-arrangement': (ctx) => {
    const n = ctx.ri(4, 7)
    const val = Math.round(fact(n - 1))
    return numericOptionCtx(
      `The number of ways to arrange ${n} distinct people around a circular table is:`,
      val,
      [Math.round(fact(n)), Math.round(fact(n - 2)), Math.round(fact(n) / 2), Math.round(val * 2)],
      `Circular permutations $= (n-1)!$.`,
    )
  },
  multinomial: (ctx) => {
    const n = ctx.ri(6, 10)
    const r = ctx.ri(2, 3)
    const val = Math.round(fact(n) / (fact(r) * fact(n - r)))
    return numericOptionCtx(
      `The number of non-negative integer solutions to $x_1 + x_2 + x_3 = ${n}$ is:`,
      val,
      [Math.round(Math.pow(3, n)), Math.round(n * (n - 1) / 2), Math.round(val * 2), Math.round(fact(n) / fact(3))],
      `Solutions $= ${n + 3 - 1}C_{3-1} = ${val}$.`,
    )
  },
  'binomial-expansion': (ctx) => {
    const n = ctx.ri(5, 7)
    return singleCtx(
      `The binomial expansion of $(1+x)^${n}$ has the general term:`,
      [`$\\;{${n}}C_r x^r$`, `$${n}^r x^r$`, `$r\\,{${n}}C_r x^r$`, `$x^{${n}-r}$`],
      0,
      `General term $T_{r+1} = \\;{${n}}C_r x^r$.`,
    )
  },
  'general-term': (ctx) => {
    const n = ctx.ri(8, 12)
    const r = ctx.ri(2, 4)
    const val = Math.round(fact(n) / (fact(r) * fact(n - r)))
    const dist = [Math.round(fact(n) / fact(n - r)), Math.round(val * 2), Math.round(val / 2), Math.round(Math.pow(2, r))]
    return numericOptionCtx(
      `The coefficient of $x^{${r}}$ in $(1+x)^{${n}}$ is:`,
      val,
      dist,
      `Coefficient $= {${n}}C_${r}$.`,
    )
  },
  'binomial-coefficients': (ctx) => {
    const n = ctx.ri(4, 6)
    const sum = Math.round(Math.pow(2, n))
    return numericOptionCtx(
      `The sum of all binomial coefficients in $(1+x)^{${n}}$ is:`,
      sum,
      [n, n * n, Math.round(sum / 2), Math.round(Math.pow(3, n))],
      `Sum of coefficients $= 2^${n}$.`,
    )
  },
  'arithmetic-progression': (ctx) => {
    const a = ctx.ri(2, 6)
    const d = ctx.ri(2, 5)
    const n = ctx.ri(6, 12)
    const tn = a + (n - 1) * d
    const dist = [a + n * d, a * n * d, a + (n) * d, tn * 2]
    return numericOptionCtx(
      `The ${n}th term of the AP ${a}, ${a + d}, ${a + 2 * d}, ... is:`,
      tn,
      dist,
      `$T_n = a + (n-1)d$.`,
    )
  },
  'geometric-progression': (ctx) => {
    const a = ctx.ri(1, 3)
    const r = ctx.ri(2, 3)
    const n = ctx.ri(3, 5)
    const tn = a * Math.pow(r, n - 1)
    return numericOptionCtx(
      `The ${n}th term of the GP ${a}, ${a * r}, ${a * r * r}, ... is:`,
      tn,
      [a * r * n, a * Math.pow(r, n), a * r * n * r, a + (n - 1) * r],
      `$T_n = ar^{n-1}$.`,
    )
  },
  'harmonic-progression': (ctx) => {
    return singleCtx(
      `If a, b, c are in HP, then:`,
      ['$\\frac{1}{a}, \\frac{1}{b}, \\frac{1}{c}$ are in AP', '$a, b, c$ are in AP', '$a^2, b^2, c^2$ are in AP', '$ab, bc, ca$ are in AP'],
      0,
      'HP means reciprocals are in AP.',
    )
  },
  'sum-of-series': (ctx) => {
    const a = ctx.ri(2, 4)
    const d = ctx.ri(2, 4)
    const n = ctx.ri(5, 10)
    const sum = roundN((n / 2) * (2 * a + (n - 1) * d), 0)
    const dist = [roundN((n / 2) * (a + n * d), 0), roundN(n * (a + d), 0), roundN((n / 2) * (2 * a + n * d), 0), roundN(sum * 2, 0)]
    return numericOptionCtx(
      `The sum of the first ${n} terms of the AP starting at ${a} with common difference ${d} is:`,
      sum,
      dist,
      `$S_n = \\frac{n}{2}(2a + (n-1)d)$.`,
    )
  },
  'special-series': (ctx) => {
    const n = ctx.ri(4, 8)
    const sum = Math.round((n * (n + 1) * (2 * n + 1)) / 6)
    return numericOptionCtx(
      `The sum $1^2 + 2^2 + \\dots + ${n}^2$ is:`,
      sum,
      [Math.round((n * (n + 1)) / 2), Math.round((n * (n + 1) * (n + 2)) / 6), Math.round(n * (n + 1) / 2 * n), Math.round(sum * 2)],
      `$\\sum n^2 = \\frac{n(n+1)(2n+1)}{6}$.`,
    )
  },
  limits: (ctx) => {
    const a = ctx.ri(2, 5)
    return numericOptionCtx(
      `$\\lim_{x\\to 0}\\frac{\\sin ${a}x}{x}$ is:`,
      a,
      [1, a * a, 0, 2 * a],
      `$\\lim_{x\\to 0}\\frac{\\sin kx}{x} = k$.`,
    )
  },
  lhopital: (ctx) => {
    return singleCtx(
      `L'Hôpital's rule applies to limits of the form:`,
      ['$\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$', 'Only $\\frac{0}{0}$', 'Only $1^\\infty$', 'Only $\\infty - \\infty$'],
      0,
      "L'Hôpital applies to 0/0 or ∞/∞ indeterminate forms.",
    )
  },
  continuity: (ctx) => {
    return singleCtx(
      `A function $f$ is continuous at $x = a$ if:`,
      ['$\\lim_{x\\to a^-} f(x) = \\lim_{x\\to a^+} f(x) = f(a)$', '$f(a)$ exists', 'Only left limit exists', 'Only right limit exists'],
      0,
      'Continuity: LHL = RHL = f(a).',
    )
  },
  differentiability: (ctx) => {
    return singleCtx(
      `If $f$ is differentiable at $x=a$, then $f$ is:`,
      ['Continuous at $x=a$', 'Not necessarily continuous', 'Always constant', 'Never defined'],
      0,
      'Differentiability ⇒ continuity.',
    )
  },
  'limits-standard': (ctx) => {
    const a = ctx.ri(2, 5)
    return numericOptionCtx(
      `$\\lim_{x\\to 0}(1 + ${a}x)^{1/x}$ is:`,
      Math.round(Math.exp(a) * 100) / 100,
      [1, a, Math.round(Math.exp(1) * 100) / 100, Math.round(Math.exp(a) * 10) / 10],
      `$\\lim (1+kx)^{1/x} = e^k$.`,
    )
  },
  'tangent-normal': (ctx) => {
    const a = ctx.ri(2, 5)
    const b = ctx.ri(1, 4)
    const x = ctx.ri(1, 3)
    const slope = 2 * a * x + b
    const dist = [a * x + b, a * x * x + b, 2 * a + b, slope * 2]
    return numericOptionCtx(
      `The slope of the tangent to $y = ${a}x^2 + ${b}x$ at $x = ${x}$ is:`,
      slope,
      dist,
      `$m = y' = 2ax + b$.`,
    )
  },
  monotonicity: (ctx) => {
    return singleCtx(
      `The function $f(x) = x^3$ is:`,
      ['Strictly increasing everywhere', 'Strictly decreasing', 'Constant', 'Non-monotonic'],
      0,
      `f'(x) = 3x² ≥ 0 → increasing (strictly except at 0).`,
    )
  },
  'maxima-minima': (ctx) => {
    const a = ctx.ri(2, 4)
    const b = ctx.ri(4, 8)
    const xMax = roundN(b / (2 * a), 1)
    return numericOptionCtx(
      `The function $f(x) = ${a}x^2 - ${b}x$ attains its minimum at $x = $:`,
      xMax,
      [roundN(b / a, 1), roundN(b * a, 1), roundN(2 * a / b, 2), 0],
      `Set $f'(x) = 2ax - b = 0$.`,
    )
  },
  'rate-of-change': (ctx) => {
    const k = ctx.ri(2, 5)
    const r = ctx.ri(3, 6)
    const v = roundN(k * 4 * Math.PI * r * r, 1)
    return numericOptionCtx(
      `If the radius of a sphere increases at ${k} cm/s, the rate of change of volume when r = ${r} cm is:`,
      v,
      [roundN(k * Math.PI * r * r, 1), roundN(k * 4 * Math.PI * r, 1), roundN(k * r * r, 1), roundN(k * 4 / 3 * Math.PI * r * r * r, 1)],
      `$\\frac{dV}{dt} = 4\\pi r^2 \\frac{dr}{dt}$.`,
    )
  },
  'rolle-lmvt': (ctx) => {
    return singleCtx(
      `Rolle's theorem requires that f is continuous on [a,b], differentiable on (a,b) and:`,
      ['$f(a) = f(b)$', '$f(a) \\neq f(b)$', '$f(a) > f(b)$', '$f(a) < f(b)$'],
      0,
      "Rolle: f(a) = f(b) → exists c with f'(c) = 0.",
    )
  },
  'indefinite-integration': (ctx) => {
    const n = ctx.ri(2, 4)
    const a = ctx.ri(2, 5)
    return singleCtx(
      `$\\int ${a}x^{${n - 1}}\\,dx = $:`,
      [`$x^{${n}} + C$`, `$\\frac{x^{${n + 1}}}{${n}} + C$`, `$${a}x^{${n}} + C$`, `$\\frac{x^{${n - 1}}}{${n}} + C$`],
      0,
      `$\\int x^m dx = \\frac{x^{m+1}}{m+1}$.`,
    )
  },
  'definite-integration': (ctx) => {
    const a = ctx.ri(1, 3)
    const b = ctx.ri(a + 1, a + 3)
    const val = Math.round(((b * b * b - a * a * a) / 3) * 10) / 10
    const dist = [b * b - a * a, (b * b * b - a * a * a), (b - a) * 2, val + 1]
    return numericOptionCtx(
      `$\\int_${a}^{${b}} x^2\\,dx$ is:`,
      val,
      dist,
      `$\\int_a^b x^2 dx = \\left[\\frac{x^3}{3}\\right]_a^b$.`,
    )
  },
  'area-under-curve': (ctx) => {
    const b = ctx.ri(2, 4)
    const area = Math.round(((b * b * b) / 3) * 10) / 10
    return numericOptionCtx(
      `The area bounded by $y = x^2$ and the x-axis from x=0 to x=${b} is:`,
      area,
      [b * b, b * b / 2, (b * b * b) / 2, area * 2],
      `Area $= \\int_0^b x^2 dx = b^3/3$.`,
    )
  },
  'integration-by-parts': (ctx) => {
    return singleCtx(
      `Integration by parts follows:`,
      ['$\\int u\\,dv = uv - \\int v\\,du$', '$\\int u\\,dv = uv + \\int v\\,du$', '$\\int uv = \\int u \\int v$', '$\\int u\\,dv = v - \\int u\\,dv$'],
      0,
      '∫u dv = uv − ∫v du (ILATE).',
    )
  },
  substitution: (ctx) => {
    return singleCtx(
      `The substitution that simplifies $\\int \\sin x \\cos x\\,dx$ is:`,
      ['$u = \\sin x$', '$u = x$', '$u = \\tan^2 x$', 'No substitution works'],
      0,
      'Let u = sin x → du = cos x dx.',
    )
  },
  'differential-forms': (ctx) => {
    return singleCtx(
      `$\\int \\frac{1}{x}\\,dx = $:`,
      ['$\\ln|x| + C$', '$\\frac{1}{x^2} + C$', '$x\\ln x + C$', '$e^x + C$'],
      0,
      '∫(1/x) dx = ln|x| + C.',
    )
  },
  'order-degree': (ctx) => {
    return singleCtx(
      `The order of the differential equation $y'' + 3y' + y = 0$ is:`,
      ['2', '1', '3', '0'],
      0,
      'Highest derivative is 2nd order.',
    )
  },
  'variable-separable': (ctx) => {
    const c = ctx.ri(1, 3)
    const k = ctx.ri(2, 3)
    const val = Math.round(Math.exp(k * 1) * c * 10) / 10
    return numericOptionCtx(
      `Solve $\\frac{dy}{dx} = ${k}y$. If y(0) = ${c}, then y(1) is:`,
      val,
      [c + k, c * k, Math.round(Math.exp(1) * c), val * 2],
      `$y = ${c}e^{${k}x}$.`,
    )
  },
  homogeneous: (ctx) => {
    return singleCtx(
      `A differential equation $M(x,y)dx + N(x,y)dy = 0$ is homogeneous if:`,
      ['M and N are homogeneous functions of same degree', 'M and N are constants', 'M = N', 'M is linear'],
      0,
      'Both M, N homogeneous of the same degree.',
    )
  },
  'linear-differential': (ctx) => {
    return singleCtx(
      `The integrating factor for $\\frac{dy}{dx} + Py = Q$ is:`,
      ['$e^{\\int P\\,dx}$', '$e^{\\int Q\\,dx}$', '$\\int P\\,dx$', '$e^{P}$'],
      0,
      'IF = e^{∫P dx}.',
    )
  },
  'straight-lines': (ctx) => {
    const m = ctx.ri(2, 4)
    const c = ctx.ri(1, 5)
    const x = ctx.ri(1, 3)
    const y = m * x + c
    return numericOptionCtx(
      `If the point (${x}, y) lies on $y = ${m}x + ${c}$, then y is:`,
      y,
      [m + c, m * c, m * x, c * x],
      `Substitute x = ${x}.`,
    )
  },
  circles: (ctx) => {
    const r = ctx.ri(2, 5)
    const x = ctx.ri(1, 3)
    return singleCtx(
      `A point is ${x} units from the centre of a circle of radius ${r}. It lies:`,
      ['Inside', 'On the circle', 'Outside', 'At the centre'],
      x <= r ? 0 : 2,
      `Distance < r → inside; = r → on; > r → outside.`,
    )
  },
  parabola: (ctx) => {
    const a = ctx.ri(2, 5)
    return singleCtx(
      `The focus of the parabola $y^2 = ${4 * a}x$ is:`,
      [`$(${a}, 0)$`, `$(0, ${a})$`, `$(-${a}, 0)$`, `$(0, -${a})$`],
      0,
      'For y² = 4ax, focus is (a, 0).',
    )
  },
  ellipse: (ctx) => {
    const a = ctx.ri(4, 6)
    const b = ctx.ri(2, 3)
    const e = roundN(Math.sqrt(1 - (b * b) / (a * a)), 2)
    return numericOptionCtx(
      `The eccentricity of the ellipse $\\frac{x^2}{${a * a}} + \\frac{y^2}{${b * b}} = 1$ is:`,
      e,
      [roundN(b / a, 2), roundN(Math.sqrt(1 + (b * b) / (a * a)), 2), roundN(a / b, 2), roundN(1 - b / a, 2)],
      `$e = \\sqrt{1 - \\frac{b^2}{a^2}}$.`,
    )
  },
  hyperbola: (ctx) => {
    const a = ctx.ri(2, 3)
    const b = ctx.ri(3, 5)
    const e = roundN(Math.sqrt(1 + (b * b) / (a * a)), 2)
    return numericOptionCtx(
      `The eccentricity of the hyperbola $\\frac{x^2}{${a * a}} - \\frac{y^2}{${b * b}} = 1$ is:`,
      e,
      [roundN(Math.sqrt(1 - (b * b) / (a * a)), 2), roundN(b / a, 2), roundN(a / b, 2), roundN(e / 2, 2)],
      `$e = \\sqrt{1 + \\frac{b^2}{a^2}}$ for a hyperbola.`,
    )
  },
  'distance-formula': (ctx) => {
    const x1 = ctx.ri(1, 3)
    const y1 = ctx.ri(2, 5)
    const x2 = x1 + ctx.ri(2, 4)
    const y2 = y1 + ctx.ri(2, 4)
    const d = roundN(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2), 1)
    return numericOptionCtx(
      `The distance between (${x1}, ${y1}) and (${x2}, ${y2}) is:`,
      d,
      [x2 - x1 + y2 - y1, Math.sqrt((x2 - x1) * (y2 - y1)), (x2 - x1) * (y2 - y1), d * 2],
      `$d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$.`,
    )
  },
  locus: (ctx) => {
    return singleCtx(
      `The locus of points equidistant from two fixed points is:`,
      ['A perpendicular bisector', 'A circle', 'A parabola', 'An ellipse'],
      0,
      'Equidistant from two points → perpendicular bisector.',
    )
  },
  '3d-coordinates': (ctx) => {
    const x = ctx.ri(1, 3)
    const y = ctx.ri(2, 4)
    const z = ctx.ri(1, 3)
    const d = roundN(Math.sqrt(x * x + y * y + z * z), 1)
    return numericOptionCtx(
      `The distance of (${x}, ${y}, ${z}) from the origin is:`,
      d,
      [x + y + z, x * y * z, Math.sqrt(x * x + y * y), d * 2],
      `$d = \\sqrt{x^2+y^2+z^2}$.`,
    )
  },
  'direction-cosines': (ctx) => {
    return singleCtx(
      `For a line, $l^2 + m^2 + n^2 = $:`,
      ['1', '0', '2', '3'],
      0,
      'Sum of squares of direction cosines = 1.',
    )
  },
  planes: (ctx) => {
    const a = ctx.ri(1, 2)
    const b = ctx.ri(1, 2)
    const c = ctx.ri(1, 2)
    const d = ctx.ri(1, 4)
    return singleCtx(
      `The plane ${a}x + ${b}y + ${c}z = ${d} has normal vector:`,
      [`$(${a}, ${b}, ${c})$`, `$(${d}, ${a}, ${b})$`, `$(${c}, ${d}, ${a})$`, `$(${a}, ${d}, ${c})$`],
      0,
      'Normal to ax+by+cz=d is (a,b,c).',
    )
  },
  'lines-3d': (ctx) => {
    return singleCtx(
      `Two lines $\\frac{x-1}{1} = \\frac{y-2}{2} = \\frac{z-3}{3}$ and $\\frac{x-1}{2} = \\frac{y-2}{4} = \\frac{z-3}{6}$ are:`,
      ['Parallel', 'Perpendicular', 'Skew', 'Intersecting at right angles'],
      0,
      'Direction ratios proportional → parallel.',
    )
  },
  sphere: (ctx) => {
    const r = ctx.ri(2, 5)
    const V = roundN((4 / 3) * Math.PI * r * r * r, 1)
    return numericOptionCtx(
      `The volume of a sphere of radius ${r} is:`,
      V,
      [roundN((4 / 3) * Math.PI * r * r, 1), roundN(Math.PI * r * r * r, 1), roundN(4 * Math.PI * r * r, 1), roundN(V * 2, 1)],
      `$V = \\frac{4}{3}\\pi r^3$.`,
    )
  },
  'vector-basics': (ctx) => {
    const a = ctx.ri(1, 4)
    const b = ctx.ri(1, 4)
    const m = roundN(Math.sqrt(a * a + b * b), 1)
    return numericOptionCtx(
      `The magnitude of the vector ${a}i + ${b}j is:`,
      m,
      [a + b, a * b, Math.sqrt(a * a - b * b), m * 2],
      `$|\\vec{v}| = \\sqrt{a^2+b^2}$.`,
    )
  },
  'dot-product': (ctx) => {
    const a = ctx.ri(1, 3)
    const b = ctx.ri(1, 3)
    const c = ctx.ri(1, 3)
    const d = ctx.ri(1, 3)
    const dot = a * c + b * d
    return numericOptionCtx(
      `The dot product of (${a}, ${b}) and (${c}, ${d}) is:`,
      dot,
      [a * d + b * c, a * c - b * d, a * b * c * d, a + b + c + d],
      `Dot product $= a_1a_2 + b_1b_2$.`,
    )
  },
  'cross-product': (ctx) => {
    const a = ctx.ri(2, 4)
    const b = ctx.ri(1, 3)
    const mag = roundN(Math.abs(a * b) / 2, 1)
    return numericOptionCtx(
      `The area of the parallelogram formed by vectors (${a}, 0) and (0, ${b}) is:`,
      a * b,
      [mag, a + b, Math.sqrt(a * a + b * b), a * b / 2],
      `Area of parallelogram $= |\\vec{a} \\times \\vec{b}|$.`,
    )
  },
  'triple-product': (ctx) => {
    return singleCtx(
      `The scalar triple product $[\\vec{a}\\,\\vec{b}\\,\\vec{c}]$ represents:`,
      ['Volume of parallelepiped', 'Area of parallelogram', 'Length of vector', 'Angle between vectors'],
      0,
      'Scalar triple product = volume of parallelepiped.',
    )
  },
  statistics: (ctx) => {
    const a = ctx.ri(10, 40)
    const d = ctx.ri(2, 6)
    const n = ctx.ri(3, 5)
    const vals = Array.from({ length: n }, (_, i) => a + i * d)
    const mean = Math.round((vals.reduce((s, v) => s + v, 0) / n) * 10) / 10
    return numericOptionCtx(
      `The mean of ${vals.join(', ')} is:`,
      mean,
      [a, a + d, Math.round(((vals[0] ?? a) + (vals[n - 1] as number)) * 10) / 10, Math.round(mean * 2) / 1],
      `Mean $= \\frac{\\text{sum}}{n}$.`,
    )
  },
  probability: (ctx) => {
    const total = ctx.ri(6, 12)
    const fav = ctx.ri(2, Math.min(4, total - 1))
    const p = Math.round((fav / total) * 100) / 100
    return numericOptionCtx(
      `A number is chosen from 1 to ${total}. The probability it is at most ${fav} is:`,
      p,
      [Math.round((total / fav) * 100) / 100, fav + total, Math.round((fav / (total + 1)) * 100) / 100, Math.round((1 / fav) * 100) / 100],
      `$P = \\frac{\\text{favourable}}{\\text{total}}$.`,
    )
  },
  'conditional-probability': (ctx) => {
    const pA = ctx.ri(3, 7) / 10
    const pB = ctx.ri(2, Math.floor(pA * 10)) / 10
    const p = Math.round((pB / pA) * 100) / 100
    return numericOptionCtx(
      `If $P(A) = ${pA}$ and $P(A \\cap B) = ${pB}$, then $P(B|A)$ is:`,
      p,
      [Math.round((pA / pB) * 100) / 100, Math.round((pA * pB) * 100) / 100, Math.round((pB * pA) * 100) / 100, Math.round((pA + pB) * 100) / 100],
      `$P(B|A) = \\frac{P(A\\cap B)}{P(A)}$.`,
    )
  },
  'random-variables': (ctx) => {
    const p = ctx.ri(3, 7) / 10
    const mean = roundN(p, 2)
    return numericOptionCtx(
      `For a Bernoulli trial with success probability ${p}, the expected value is:`,
      mean,
      [roundN(1 - p, 2), roundN(p * (1 - p), 2), roundN(Math.sqrt(p * (1 - p)), 2), roundN(p * p, 2)],
      'E[X] = p for Bernoulli(p).',
    )
  },
  bayes: (ctx) => {
    return singleCtx(
      `Bayes' theorem relates conditional probabilities:`,
      ['$P(A|B) = \\frac{P(B|A)P(A)}{P(B)}$', '$P(A|B) = P(B|A)$', '$P(A|B) = P(A)P(B)$', '$P(A|B) = P(A) + P(B)$'],
      0,
      "Bayes: P(A|B) = P(B|A)P(A)/P(B).",
    )
  },
  'trig-identities': (ctx) => {
    return singleCtx(
      `$\\sin^2\\theta + \\cos^2\\theta = $:`,
      ['1', '0', '2', '$\\tan\\theta$'],
      0,
      'Pythagorean identity: sin² + cos² = 1.',
    )
  },
  'trig-equations': (ctx) => {
    return singleCtx(
      `The general solution of $\\sin x = 0$ is:`,
      ['$x = n\\pi$', '$x = \\frac{\\pi}{2} + n\\pi$', '$x = 2n\\pi$', '$x = \\pi + 2n\\pi$'],
      0,
      'sin x = 0 → x = nπ.',
    )
  },
  'inverse-trig': (ctx) => {
    return singleCtx(
      `The domain of $\\sin^{-1} x$ is:`,
      ['$[-1, 1]$', '$[-\\infty, \\infty]$', '$[0, 1]$', '$(-1, 1)$'],
      0,
      'Domain of arcsin is [−1, 1].',
    )
  },
  'heights-distances': (ctx) => {
    const h = ctx.ri(20, 60)
    return numericOptionCtx(
      `The shadow of a tower of height ${h} m when the sun's elevation is 45° is:`,
      h,
      [h * 2, Math.round(h / 2), Math.round(h * Math.sqrt(3)), Math.round(h / Math.sqrt(3))],
      'At 45°, shadow length = height.',
    )
  },
  'trig-ratios': (ctx) => {
    const a = ctx.ri(2, 3)
    const b = ctx.ri(a + 1, 5)
    const val = roundN(Math.sin(Math.atan(a / b)), 2)
    return numericOptionCtx(
      `If $\\tan\\theta = \\frac{${a}}{${b}}$, then $\\sin\\theta$ is:`,
      val,
      [roundN(a / b, 2), roundN(b / a, 2), roundN(Math.sqrt(a * a + b * b) / b, 2), roundN(val * 2, 2)],
      `$\\sin\\theta = \\frac{a}{\\sqrt{a^2+b^2}}$.`,
    )
  },
  statements: (ctx) => {
    return singleCtx(
      `The negation of "$p$ and $q$" is:`,
      ['(not p) or (not q)', '(not p) and (not q)', 'p or (not q)', '(not p) or q'],
      0,
      "De Morgan: ¬(p∧q) = ¬p ∨ ¬q.",
    )
  },
  validity: (ctx) => {
    return singleCtx(
      `A statement "If p then q" is false only when:`,
      ['p is true and q is false', 'p is false and q is true', 'Both false', 'Both true'],
      0,
      'Implication p→q is false only when T→F.',
    )
  },
}

// Helpers

function fact(n: number): number {
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function roundN(n: number, digits: number): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

function singleCtx(
  statement: string,
  options: string[],
  correctIndex: number,
  solution: string,
  concept?: string,
): TemplateOutput {
  return {
    content: { text: statement },
    options: options.map((o, i) => ({ key: 'ABCD'[i] ?? `${i + 1}`, text: o })),
    answer: { type: 'single', correctIndex },
    solution: {
      detailed: solution,
      hints: [solution.split('.')[0] ?? solution],
      concept,
    },
  }
}

function numericCtx(
  statement: string,
  correctValue: string,
  display: string,
  solution: string,
): TemplateOutput {
  return {
    content: { text: statement },
    answer: { type: 'integer', correctValue: Number(correctValue), range: [Number(correctValue), Number(correctValue)] },
    solution: {
      detailed: solution,
      hints: [solution.split('.')[0] ?? solution],
    },
    estimatedTime: 90,
  }
}

function numericOptionCtx(
  statement: string,
  correct: number,
  wrongs: number[],
  solution: string,
): TemplateOutput {
  const all = [correct, ...wrongs]
  const unique = Array.from(new Set(all.map((v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v))))
  while (unique.length < 4) {
    const last = unique[unique.length - 1] as number
    unique.push(roundN(last + 1, 1))
  }
  const correctVal = Math.round(correct * 100) / 100
  const shuffled = [...unique].sort(() => Math.random() - 0.5)
  return {
    content: { text: statement },
    options: shuffled.map((v, i) => ({ key: 'ABCD'[i] ?? `${i + 1}`, text: `${v}` })),
    answer: { type: 'single', correctIndex: shuffled.indexOf(correctVal) },
    solution: {
      detailed: solution,
      hints: [solution.split('.')[0] ?? solution],
    },
    estimatedTime: 60,
  }
}
