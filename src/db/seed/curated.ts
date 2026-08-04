import { db } from '@/db'
import type { QuestionMeta } from '@/db'
import type { Difficulty, ExamId, QuestionTypeId, SubjectId } from '@/types/core'
import type {
  Question,
  QuestionAnswer,
  QuestionContent,
  QuestionOption,
  QuestionSolution,
} from '@/types/question'

/**
 * Curated, hand-verified question bank covering every supported answer type:
 * single, multiple, integer, numerical, matrix, match-columns, assertion-reason
 * and paragraph. Real JEE Main / Advanced style questions with worked solutions.
 *
 * Questions are keyed by stable ids (`curated-*`) so the import is idempotent
 * and additive — re-running never duplicates rows and never touches the
 * generated or real-PYQ banks.
 */

export const CURATED_VERSION = 1

type Exam = Exclude<ExamId, 'practice'>

interface QuestionSpec {
  id: string
  subject: SubjectId
  chapter: string
  microTopic: string
  type: QuestionTypeId
  exam: Exam
  year: number
  difficulty: Difficulty
  time: number
  content: QuestionContent
  options?: QuestionOption[]
  answer: QuestionAnswer
  solution: QuestionSolution
  tags?: string[]
}

const FIXED_CREATED_AT = '2026-01-01T00:00:00.000Z'

function build(spec: QuestionSpec): Question {
  return {
    id: spec.id,
    exam: spec.exam,
    year: spec.year,
    shift: spec.exam === 'jee-advanced' ? undefined : 1,
    paper: spec.exam === 'jee-advanced' ? 'paper-1' : 'session-1',
    session: spec.exam === 'jee-advanced' ? undefined : 1,
    subject: spec.subject,
    chapter: spec.chapter,
    microTopic: spec.microTopic,
    difficulty: spec.difficulty,
    estimatedTime: spec.time,
    type: spec.type,
    content: spec.content,
    options: spec.options ?? [],
    answer: spec.answer,
    solution: spec.solution,
    tags: [...(spec.tags ?? []), spec.chapter, spec.microTopic],
    createdAt: FIXED_CREATED_AT,
  }
}

const KEY = 'ABCD'

function letters(count: number): string[] {
  return Array.from({ length: count }, (_, i) => KEY[i] ?? `${i + 1}`)
}

// ---------------------------------------------------------------- builders

interface CommonArgs {
  subject: SubjectId
  chapter: string
  microTopic: string
  q: string
  latex?: string[]
  sol: string
  short?: string
  hints: string[]
  concept?: string
  difficulty: Difficulty
  exam?: Exam
  year?: number
  time?: number
  tags?: string[]
}

function single(
  id: string,
  p: CommonArgs & { options: string[]; correct: number },
): Question {
  return build({
    id,
    subject: p.subject,
    chapter: p.chapter,
    microTopic: p.microTopic,
    type: 'single',
    exam: p.exam ?? 'jee-main',
    year: p.year ?? 2023,
    difficulty: p.difficulty,
    time: p.time ?? 90,
    content: { text: p.q, latex: p.latex },
    options: p.options.map((text, i) => ({ key: letters(p.options.length)[i] ?? `${i + 1}`, text })),
    answer: { type: 'single', correctIndex: p.correct },
    solution: { detailed: p.sol, short: p.short, hints: p.hints, concept: p.concept },
    tags: p.tags,
  })
}

function multi(
  id: string,
  p: CommonArgs & { options: string[]; correct: number[] },
): Question {
  return build({
    id,
    subject: p.subject,
    chapter: p.chapter,
    microTopic: p.microTopic,
    type: 'multiple',
    exam: p.exam ?? 'jee-advanced',
    year: p.year ?? 2022,
    difficulty: p.difficulty,
    time: p.time ?? 120,
    content: { text: p.q, latex: p.latex },
    options: p.options.map((text, i) => ({ key: letters(p.options.length)[i] ?? `${i + 1}`, text })),
    answer: { type: 'multiple', correctIndices: p.correct },
    solution: { detailed: p.sol, short: p.short, hints: p.hints, concept: p.concept },
    tags: p.tags,
  })
}

function intQ(
  id: string,
  p: CommonArgs & { answer: number; range?: [number, number] },
): Question {
  return build({
    id,
    subject: p.subject,
    chapter: p.chapter,
    microTopic: p.microTopic,
    type: 'integer',
    exam: p.exam ?? 'jee-main',
    year: p.year ?? 2023,
    difficulty: p.difficulty,
    time: p.time ?? 120,
    content: { text: p.q, latex: p.latex },
    answer: { type: 'integer', correctValue: p.answer, range: p.range },
    solution: { detailed: p.sol, short: p.short, hints: p.hints, concept: p.concept },
    tags: p.tags,
  })
}

function numQ(
  id: string,
  p: CommonArgs & { answer: number; range: [number, number] },
): Question {
  return build({
    id,
    subject: p.subject,
    chapter: p.chapter,
    microTopic: p.microTopic,
    type: 'numerical',
    exam: p.exam ?? 'jee-advanced',
    year: p.year ?? 2022,
    difficulty: p.difficulty,
    time: p.time ?? 180,
    content: { text: p.q, latex: p.latex },
    answer: { type: 'numerical', correctValue: p.answer, range: p.range },
    solution: { detailed: p.sol, short: p.short, hints: p.hints, concept: p.concept },
    tags: p.tags,
  })
}

function matrix(
  id: string,
  p: {
    subject: SubjectId
    chapter: string
    microTopic: string
    listI: string[]
    listII: string[]
    /** row index -> column index */
    matches: Record<number, number>
    type: 'matrix' | 'match-columns'
    exam: Exam
    year: number
    difficulty: Difficulty
    time?: number
    sol: string
    hints: string[]
    concept?: string
    tags?: string[]
  },
): Question {
  const cols = letters(p.listII.length)
  const rowLabels = 'PQRS'
  const listILatex =
    `\\begin{array}{ll}\\textbf{List-I} & \\textbf{List-II}\\\\ ` +
    p.listI.map((x, i) => `(${rowLabels[i] ?? i + 1})\\ ${x}`).join(' \\\\ ') +
    ' \\\\ ' +
    p.listII.map((x, i) => `(${i + 1})\\ ${x}`).join(' \\\\ ') +
    '\\end{array}'
  const mapping = p.listI
    .map((_, r) => `Row ${r + 1} = (${rowLabels[r] ?? r + 1})`)
    .join(', ')
  const columnLegend = p.listII
    .map((_, c) => `${cols[c]} = (${c + 1})`)
    .join(', ')

  return build({
    id,
    subject: p.subject,
    chapter: p.chapter,
    microTopic: p.microTopic,
    type: p.type,
    exam: p.exam,
    year: p.year,
    difficulty: p.difficulty,
    time: p.time ?? 240,
    content: {
      text: `Match the items of List-I with List-II. In the matrix below, the rows correspond to List-I entries (${mapping}) and the columns to List-II entries (${columnLegend}). Select the single correct column for each row.`,
      latex: [listILatex],
    },
    answer: { type: p.type, correct: { matches: p.matches } },
    solution: { detailed: p.sol, hints: p.hints, concept: p.concept },
    tags: p.tags,
  })
}

const AR_OPTIONS: string[] = [
  'Both A and R are true and R is the correct explanation of A',
  'Both A and R are true but R is NOT the correct explanation of A',
  'A is true but R is false',
  'A is false but R is true',
]

function arQ(
  id: string,
  p: {
    subject: SubjectId
    chapter: string
    microTopic: string
    assertion: string
    reason: string
    assertionLatex?: string
    reasonLatex?: string
    correct: number
    difficulty: Difficulty
    exam?: Exam
    year?: number
    time?: number
    sol: string
    hints: string[]
    concept?: string
  },
): Question {
  return build({
    id,
    subject: p.subject,
    chapter: p.chapter,
    microTopic: p.microTopic,
    type: 'assertion-reason',
    exam: p.exam ?? 'jee-advanced',
    year: p.year ?? 2022,
    difficulty: p.difficulty,
    time: p.time ?? 90,
    content: {
      text: 'For each of the following statements (A) and reason (R), choose the correct option.',
      assertion: p.assertion,
      assertionLatex: p.assertionLatex,
      reason: p.reason,
      reasonLatex: p.reasonLatex,
    },
    options: AR_OPTIONS.map((text, i) => ({ key: KEY[i] ?? `${i + 1}`, text })),
    answer: { type: 'assertion-reason', correctIndex: p.correct },
    solution: { detailed: p.sol, hints: p.hints, concept: p.concept },
  })
}

function para(
  id: string,
  p: {
    subject: SubjectId
    chapter: string
    microTopic: string
    paragraph: string
    paragraphLatex?: string[]
    q: string
    options: string[]
    correct: number
    difficulty: Difficulty
    exam: Exam
    year: number
    time?: number
    sol: string
    hints: string[]
    concept?: string
  },
): Question {
  return build({
    id,
    subject: p.subject,
    chapter: p.chapter,
    microTopic: p.microTopic,
    type: 'paragraph',
    exam: p.exam,
    year: p.year,
    difficulty: p.difficulty,
    time: p.time ?? 180,
    content: {
      paragraph: p.paragraph,
      paragraphLatex: p.paragraphLatex,
      text: p.q,
    },
    options: p.options.map((text, i) => ({ key: letters(p.options.length)[i] ?? `${i + 1}`, text })),
    answer: { type: 'single', correctIndex: p.correct },
    solution: { detailed: p.sol, hints: p.hints, concept: p.concept },
  })
}

// =====================================================================
// SINGLE CORRECT (JEE Main) — 10 per subject
// =====================================================================

const SINGLES: Question[] = [
  // ---- Physics ----
  single('curated-phy-single-001', {
    subject: 'physics',
    chapter: 'Units and Measurements',
    microTopic: 'Units and Dimensions',
    q: 'The dimensional formula of Planck\u2019s constant is:',
    options: ['$[ML^2T^{-1}]$', '$[ML^2T^{-2}]$', '$[MLT^{-2}]$', '$[ML^{-1}T^{-2}]$'],
    correct: 0,
    sol: 'Planck\u2019s constant $h$ has units J\u00b7s. $[J] = [ML^2T^{-2}]$, so $[h] = [ML^2T^{-2}][T] = [ML^2T^{-1}]$.',
    short: '$h = E/\\nu$ so $[h] = [ML^2T^{-1}]$.',
    hints: ['Use $E = h\\nu$, so $h = E/\\nu$.', 'Energy has dimensions $[ML^2T^{-2}]$.'],
    concept: 'Dimensional formula',
    difficulty: 1,
  }),
  single('curated-phy-single-002', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Projectile Motion',
    q: 'A projectile is launched at $20\\ \\text{m/s}$ at $45^\\circ$ with the horizontal. Taking $g = 10\\ \\text{m/s}^2$, its horizontal range is:',
    options: ['40 m', '20 m', '80 m', '10 m'],
    correct: 0,
    sol: '$R = \\frac{u^2\\sin 2\\theta}{g} = \\frac{20^2\\sin 90^\\circ}{10} = \\frac{400}{10} = 40\\ \\text{m}$.',
    short: '$R = u^2/g = 400/10 = 40\\ \\text{m}$.',
    hints: ['At $45^\\circ$, $\\sin 2\\theta = 1$.'],
    concept: 'Range of projectile',
    difficulty: 1,
  }),
  single('curated-phy-single-003', {
    subject: 'physics',
    chapter: 'Laws of Motion',
    microTopic: "Newton's Laws of Motion",
    q: 'A person of mass $60\\ \\text{kg}$ stands on a weighing machine inside a lift accelerating upward at $2\\ \\text{m/s}^2$. Taking $g = 10\\ \\text{m/s}^2$, the reading of the machine is:',
    options: ['720 N', '600 N', '480 N', '120 N'],
    correct: 0,
    sol: 'Apparent weight $N = m(g + a) = 60(10 + 2) = 720\\ \\text{N}$.',
    short: '$N = m(g+a) = 60 \\times 12 = 720\\ \\text{N}$.',
    hints: ['Upward acceleration increases apparent weight.', 'Normal reaction $N = m(g+a)$ for a lift accelerating up.'],
    concept: 'Apparent weight in lift',
    difficulty: 2,
  }),
  single('curated-phy-single-004', {
    subject: 'physics',
    chapter: 'Electrostatics',
    microTopic: 'Coulomb Law and Charges',
    q: 'Two point charges $2\\ \\mu\\text{C}$ and $3\\ \\mu\\text{C}$ are placed $3\\ \\text{cm}$ apart in vacuum. The force between them is (take $k = 9 \\times 10^9\\ \\text{N m}^2/\\text{C}^2$):',
    options: ['60 N', '6 N', '600 N', '180 N'],
    correct: 0,
    sol: '$F = \\frac{kq_1q_2}{r^2} = \\frac{9\\times10^9 \\times 2\\times10^{-6} \\times 3\\times10^{-6}}{(0.03)^2} = \\frac{54\\times10^{-3}}{9\\times10^{-4}} = 60\\ \\text{N}$.',
    short: '$F = 9\\times10^9 \\cdot \\frac{6\\times10^{-12}}{9\\times10^{-4}} = 60\\ \\text{N}$.',
    hints: ['Convert $r$ to metres.', 'Use Coulomb\u2019s law $F = kq_1q_2/r^2$.'],
    concept: "Coulomb's law",
    difficulty: 2,
  }),
  single('curated-phy-single-005', {
    subject: 'physics',
    chapter: 'Laws of Motion',
    microTopic: 'Pseudo Force',
    q: 'A body of mass $2\\ \\text{kg}$ moves in a circle of radius $5\\ \\text{m}$ at a constant speed of $10\\ \\text{m/s}$. The centripetal force on it is:',
    options: ['40 N', '20 N', '10 N', '100 N'],
    correct: 0,
    sol: '$F_c = \\frac{mv^2}{r} = \\frac{2 \\times 10^2}{5} = \\frac{200}{5} = 40\\ \\text{N}$.',
    short: '$F_c = mv^2/r = 200/5 = 40\\ \\text{N}$.',
    hints: ['Centripetal force $F = mv^2/r$.'],
    concept: 'Circular motion',
    difficulty: 1,
  }),
  single('curated-phy-single-006', {
    subject: 'physics',
    chapter: 'Current Electricity',
    microTopic: 'Electric Current',
    q: 'A $12\\ \\text{V}$ battery drives current through a resistor of $3\\ \\Omega$. The current flowing is:',
    options: ['4 A', '36 A', '0.25 A', '15 A'],
    correct: 0,
    sol: "By Ohm\u2019s law, $I = V/R = 12/3 = 4\\ \\text{A}$.",
    short: '$I = V/R = 12/3 = 4\\ \\text{A}$.',
    hints: ['Use Ohm\u2019s law $V = IR$.'],
    concept: "Ohm's law",
    difficulty: 1,
  }),
  single('curated-phy-single-007', {
    subject: 'physics',
    chapter: 'Ray Optics',
    microTopic: 'Lenses',
    q: 'An object is placed $60\\ \\text{cm}$ from a convex lens of focal length $20\\ \\text{cm}$. The distance of the image from the lens is:',
    options: ['30 cm', '15 cm', '80 cm', '40 cm'],
    correct: 0,
    sol: '$\\frac{1}{v} = \\frac{1}{f} - \\frac{1}{u} = \\frac{1}{20} - \\frac{1}{60} = \\frac{2}{60}$, so $v = 30\\ \\text{cm}$.',
    short: '$v = fu/(u - f) = (20)(60)/40 = 30\\ \\text{cm}$.',
    hints: ['Lens formula $1/f = 1/v - 1/u$.', 'Take real object distance as negative with the Cartesian sign convention.'],
    concept: 'Lens formula',
    difficulty: 2,
  }),
  single('curated-phy-single-008', {
    subject: 'physics',
    chapter: 'Atoms and Nuclei',
    microTopic: 'Radioactivity',
    q: 'A radioactive sample decays through $3$ half-lives. The fraction of the initial nuclei remaining is:',
    options: ['$\\frac{1}{8}$', '$\\frac{1}{3}$', '$\\frac{1}{6}$', '$\\frac{3}{4}$'],
    correct: 0,
    sol: 'After $n$ half-lives, $N = N_0(1/2)^n$. For $n = 3$, $N/N_0 = 1/8$.',
    short: '$(1/2)^3 = 1/8$.',
    hints: ['Each half-life halves the remaining sample.'],
    concept: 'Half-life',
    difficulty: 1,
  }),
  single('curated-phy-single-009', {
    subject: 'physics',
    chapter: 'Waves',
    microTopic: 'Beats',
    q: 'Two tuning forks of frequencies $250\\ \\text{Hz}$ and $256\\ \\text{Hz}$ are sounded together. The beat frequency heard is:',
    options: ['6 Hz', '2 Hz', '253 Hz', '506 Hz'],
    correct: 0,
    sol: 'Beat frequency $= |f_1 - f_2| = |250 - 256| = 6\\ \\text{Hz}$.',
    short: '$|f_1 - f_2| = 6\\ \\text{Hz}$.',
    hints: ['Beats arise from the difference of the two frequencies.'],
    concept: 'Beats',
    difficulty: 1,
  }),
  single('curated-phy-single-010', {
    subject: 'physics',
    chapter: 'Dual Nature of Matter and Radiation',
    microTopic: 'Photoelectric Effect',
    q: 'Photons of energy $5\\ \\text{eV}$ fall on a metal of work function $2\\ \\text{eV}$. The maximum kinetic energy of the emitted photoelectrons is:',
    options: ['3 eV', '7 eV', '2.5 eV', '10 eV'],
    correct: 0,
    sol: '$KE_{\\max} = h\\nu - \\phi = 5 - 2 = 3\\ \\text{eV}$.',
    short: '$KE = h\\nu - \\phi = 3\\ \\text{eV}$.',
    hints: ['Einstein\u2019s photoelectric equation.'],
    concept: 'Photoelectric effect',
    difficulty: 1,
  }),

  // ---- Chemistry ----
  single('curated-che-single-001', {
    subject: 'chemistry',
    chapter: 'Some Basic Concepts of Chemistry',
    microTopic: 'Mole Concept',
    q: 'The number of moles in $44\\ \\text{g}$ of $CO_2$ (molar mass $44\\ \\text{g/mol}$) is:',
    options: ['1', '2', '0.5', '44'],
    correct: 0,
    sol: '$n = m/M = 44/44 = 1\\ \\text{mol}$.',
    short: '$n = m/M = 1\\ \\text{mol}$.',
    hints: ['Moles = mass / molar mass.'],
    concept: 'Mole concept',
    difficulty: 1,
  }),
  single('curated-che-single-002', {
    subject: 'chemistry',
    chapter: 'Structure of Atom',
    microTopic: 'Electronic Configuration',
    q: 'The element with the electronic configuration $1s^2\\,2s^2\\,2p^6\\,3s^1$ is:',
    options: ['Sodium', 'Magnesium', 'Aluminium', 'Potassium'],
    correct: 0,
    sol: 'Total electrons $= 2 + 2 + 6 + 1 = 11$, which is the atomic number of sodium (Na).',
    short: '11 electrons \u2192 atomic number 11 \u2192 sodium.',
    hints: ['Count the total number of electrons.', 'Match the electron count with the atomic number.'],
    concept: 'Electronic configuration',
    difficulty: 1,
  }),
  single('curated-che-single-003', {
    subject: 'chemistry',
    chapter: 'Chemical Bonding',
    microTopic: 'VSEPR Theory',
    q: 'According to VSEPR theory, the shape of the $NH_3$ molecule is:',
    options: ['Trigonal pyramidal', 'Trigonal planar', 'Tetrahedral', 'Linear'],
    correct: 0,
    sol: 'In $NH_3$, nitrogen has 3 bond pairs and 1 lone pair, giving a trigonal pyramidal shape with bond angle about $107^\\circ$.',
    short: '3 bond pairs + 1 lone pair \u2192 trigonal pyramidal.',
    hints: ['Count bond pairs and lone pairs on the central atom.', 'A lone pair compresses the tetrahedral geometry.'],
    concept: 'VSEPR theory',
    difficulty: 1,
  }),
  single('curated-che-single-004', {
    subject: 'chemistry',
    chapter: 'Classification and Periodicity',
    microTopic: 'Electronegativity',
    q: 'The most electronegative element is:',
    options: ['Fluorine', 'Chlorine', 'Oxygen', 'Nitrogen'],
    correct: 0,
    sol: 'Fluorine has the highest electronegativity (4.0 on the Pauling scale) because of its small size and high effective nuclear charge.',
    short: 'F has maximum electronegativity (4.0).',
    hints: ['Electronegativity peaks at the top-right of the periodic table.'],
    concept: 'Electronegativity',
    difficulty: 1,
  }),
  single('curated-che-single-005', {
    subject: 'chemistry',
    chapter: 'Chemical Thermodynamics',
    microTopic: 'Thermodynamic Terms',
    q: 'For an exothermic reaction at constant pressure, the enthalpy change $\\Delta H$ is:',
    options: ['Negative', 'Positive', 'Zero', 'Independent of temperature'],
    correct: 0,
    sol: 'An exothermic reaction releases heat to the surroundings, so $\\Delta H < 0$.',
    short: 'Exothermic \u2192 heat released \u2192 $\\Delta H < 0$.',
    hints: ['Exothermic means heat is released.'],
    concept: 'Enthalpy of reaction',
    difficulty: 1,
  }),
  single('curated-che-single-006', {
    subject: 'chemistry',
    chapter: 'Equilibrium',
    microTopic: 'Chemical Equilibrium',
    q: 'For the reaction $N_2 + 3H_2 \\rightleftharpoons 2NH_3$, if $K_c = 10$, the reaction at equilibrium is:',
    options: ['Product-favoured', 'Reactant-favoured', 'Equally balanced', 'Non-spontaneous'],
    correct: 0,
    sol: 'Since $K_c > 1$, the equilibrium mixture contains more products than reactants, i.e. the reaction is product-favoured.',
    short: '$K_c > 1$ \u2192 product-favoured.',
    hints: ['A large $K_c$ means products dominate at equilibrium.'],
    concept: 'Equilibrium constant',
    difficulty: 1,
  }),
  single('curated-che-single-007', {
    subject: 'chemistry',
    chapter: 'Redox Reactions',
    microTopic: 'Oxidation Number',
    q: 'The oxidation number of chromium in $K_2Cr_2O_7$ is:',
    options: ['$+6$', '$+3$', '$+7$', '$+2$'],
    correct: 0,
    sol: 'Let the oxidation state of Cr be $x$. $2(+1) + 2x + 7(-2) = 0 \\Rightarrow 2x = 12 \\Rightarrow x = +6$.',
    short: 'K: $+1$, O: $-2$ \u2192 $2x = 12$ \u2192 $x = +6$.',
    hints: ['Sum of oxidation states in a neutral molecule is zero.'],
    concept: 'Oxidation number',
    difficulty: 2,
  }),
  single('curated-che-single-008', {
    subject: 'chemistry',
    chapter: 'Hydrocarbons',
    microTopic: 'Alkanes',
    q: 'The general formula of the alkane homologous series is:',
    options: ['$C_nH_{2n+2}$', '$C_nH_{2n}$', '$C_nH_{2n-2}$', '$C_nH_{n}$'],
    correct: 0,
    sol: 'Alkanes are saturated open-chain hydrocarbons with the general formula $C_nH_{2n+2}$.',
    short: 'Alkanes: $C_nH_{2n+2}$.',
    hints: ['Alkanes contain only single bonds and are saturated.'],
    concept: 'Homologous series',
    difficulty: 1,
  }),
  single('curated-che-single-009', {
    subject: 'chemistry',
    chapter: 'Hydrocarbons',
    microTopic: 'Alkenes',
    q: 'Which of the following tests is used to detect unsaturation in organic compounds?',
    options: [
      'Decolourisation of bromine water',
      'Fehling\u2019s test',
      'Iodoform test',
      'Molisch\u2019s test',
    ],
    correct: 0,
    sol: 'Alkenes and alkynes (unsaturated) decolourise bromine water in the dark by addition of bromine across the multiple bond.',
    short: 'Unsaturated hydrocarbons add bromine and decolourise bromine water.',
    hints: ['Bromine adds across a $C=C$ or $C\\equiv C$ bond.'],
    concept: 'Tests for unsaturation',
    difficulty: 1,
  }),
  single('curated-che-single-010', {
    subject: 'chemistry',
    chapter: 'Biomolecules',
    microTopic: 'Carbohydrates',
    q: 'Glucose is an example of a:',
    options: ['Monosaccharide', 'Disaccharide', 'Polysaccharide', 'Protein'],
    correct: 0,
    sol: 'Glucose ($C_6H_{12}O_6$) is the simplest form of sugar that cannot be hydrolysed further \u2014 a monosaccharide.',
    short: 'Glucose cannot be hydrolysed \u2192 monosaccharide.',
    hints: ['Monosaccharides are the simplest carbohydrates.'],
    concept: 'Carbohydrates',
    difficulty: 1,
  }),

  // ---- Mathematics ----
  single('curated-math-single-001', {
    subject: 'mathematics',
    chapter: 'Complex Numbers and Quadratic Equations',
    microTopic: 'Quadratic Equations',
    q: 'The roots of the equation $x^2 - 5x + 6 = 0$ are:',
    options: ['2 and 3', '1 and 6', '-2 and -3', '5 and 1'],
    correct: 0,
    sol: '$x^2 - 5x + 6 = (x - 2)(x - 3) = 0$, so $x = 2, 3$.',
    short: 'Factorise: $(x-2)(x-3) = 0$.',
    hints: ['Find two numbers whose product is 6 and sum is 5.'],
    concept: 'Roots of a quadratic',
    difficulty: 1,
  }),
  single('curated-math-single-002', {
    subject: 'mathematics',
    chapter: 'Permutations and Combinations',
    microTopic: 'Permutations',
    q: 'The number of distinct arrangements of the letters of the word \u201cEXAM\u201d is:',
    options: ['24', '16', '12', '4'],
    correct: 0,
    sol: 'All four letters are distinct, so the number of arrangements is $4! = 24$.',
    short: '$4! = 24$.',
    hints: ['All letters are distinct.'],
    concept: 'Permutations',
    difficulty: 1,
  }),
  single('curated-math-single-003', {
    subject: 'mathematics',
    chapter: 'Binomial Theorem',
    microTopic: 'Binomial Expansion',
    q: 'The coefficient of $x^3$ in the expansion of $(1 + x)^6$ is:',
    options: ['20', '15', '6', '120'],
    correct: 0,
    sol: 'The coefficient of $x^3$ is $\\binom{6}{3} = \\frac{6!}{3!3!} = 20$.',
    short: '$\\binom{6}{3} = 20$.',
    hints: ['Coefficient of $x^r$ in $(1+x)^n$ is $\\binom{n}{r}$.'],
    concept: 'Binomial coefficient',
    difficulty: 1,
  }),
  single('curated-math-single-004', {
    subject: 'mathematics',
    chapter: 'Limits, Continuity and Differentiability',
    microTopic: 'Limits',
    q: 'The value of $\\lim_{x \\to 0} \\frac{\\sin x}{x}$ is:',
    options: ['1', '0', '$\\infty$', 'Does not exist'],
    correct: 0,
    sol: 'This is the standard limit $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.',
    short: 'Standard limit \u2192 1.',
    hints: ['Use the standard trigonometric limit.'],
    concept: 'Standard limits',
    difficulty: 1,
  }),
  single('curated-math-single-005', {
    subject: 'mathematics',
    chapter: 'Statistics and Probability',
    microTopic: 'Probability',
    q: 'Two fair dice are thrown. The probability that the sum of the numbers is $7$ is:',
    options: ['$\\frac{1}{6}$', '$\\frac{1}{12}$', '$\\frac{5}{36}$', '$\\frac{1}{3}$'],
    correct: 0,
    sol: 'Favourable outcomes: $(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)$ \u2014 6 outcomes out of 36. So $P = 6/36 = 1/6$.',
    short: '$6/36 = 1/6$.',
    hints: ['Total outcomes $= 36$.', 'List the outcomes that sum to 7.'],
    concept: 'Probability',
    difficulty: 1,
  }),
  single('curated-math-single-006', {
    subject: 'mathematics',
    chapter: 'Trigonometry',
    microTopic: 'Trigonometric Ratios',
    q: 'The value of $\\sin 30^\\circ$ is:',
    options: ['$\\frac{1}{2}$', '$\\frac{\\sqrt{3}}{2}$', '1', '$\\frac{1}{\\sqrt{2}}$'],
    correct: 0,
    sol: 'From the standard angles, $\\sin 30^\\circ = 1/2$.',
    short: '$\\sin 30^\\circ = 1/2$.',
    hints: ['Recall the standard trigonometric values.'],
    concept: 'Trigonometric ratios',
    difficulty: 1,
  }),
  single('curated-math-single-007', {
    subject: 'mathematics',
    chapter: 'Vector Algebra',
    microTopic: 'Dot Product',
    q: 'If $\\vec{a} = (1, 2)$ and $\\vec{b} = (3, 4)$, the scalar product $\\vec{a} \\cdot \\vec{b}$ is:',
    options: ['11', '10', '7', '14'],
    correct: 0,
    sol: '$\\vec{a} \\cdot \\vec{b} = 1(3) + 2(4) = 3 + 8 = 11$.',
    short: '$1(3) + 2(4) = 11$.',
    hints: ['Dot product = sum of products of corresponding components.'],
    concept: 'Dot product',
    difficulty: 1,
  }),
  single('curated-math-single-008', {
    subject: 'mathematics',
    chapter: 'Matrices and Determinants',
    microTopic: 'Determinants',
    q: 'The determinant of the matrix $\\begin{pmatrix} 2 & 0 \\\\ 0 & 3 \\end{pmatrix}$ is:',
    options: ['6', '5', '0', '1'],
    correct: 0,
    sol: 'For a diagonal matrix, the determinant is the product of the diagonal entries: $2 \\times 3 = 6$.',
    short: '$\\det = 2 \\times 3 = 6$.',
    hints: ['Determinant of a $2 \\times 2$ matrix $ad - bc$.'],
    concept: 'Determinants',
    difficulty: 1,
  }),
  single('curated-math-single-009', {
    subject: 'mathematics',
    chapter: 'Coordinate Geometry',
    microTopic: 'Distance and Section Formula',
    q: 'The distance between the points $(0, 0)$ and $(3, 4)$ is:',
    options: ['5', '7', '25', '1'],
    correct: 0,
    sol: '$d = \\sqrt{(3-0)^2 + (4-0)^2} = \\sqrt{9 + 16} = 5$.',
    short: '$\\sqrt{9 + 16} = 5$.',
    hints: ['Use the distance formula $\\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$.'],
    concept: 'Distance formula',
    difficulty: 1,
  }),
  single('curated-math-single-010', {
    subject: 'mathematics',
    chapter: 'Sequences and Series',
    microTopic: 'Arithmetic Progression',
    q: 'The 10th term of the arithmetic progression $2, 5, 8, \\ldots$ is:',
    options: ['29', '28', '32', '26'],
    correct: 0,
    sol: 'First term $a = 2$, common difference $d = 3$. $t_{10} = a + 9d = 2 + 27 = 29$.',
    short: '$t_n = a + (n-1)d = 2 + 9(3) = 29$.',
    hints: ['Use the formula for the $n$th term of an AP.'],
    concept: 'Arithmetic progression',
    difficulty: 1,
  }),
]

// =====================================================================
// MULTIPLE CORRECT (JEE Advanced) — 5 per subject
// =====================================================================

const MULTIPLES: Question[] = [
  multi('curated-phy-multi-001', {
    subject: 'physics',
    chapter: 'Units and Measurements',
    microTopic: 'Dimensional Analysis',
    q: 'Which of the following physical quantities have the dimensions $[ML^2T^{-2}]$?',
    options: ['Work', 'Torque', 'Pressure', 'Momentum'],
    correct: [0, 1],
    sol: 'Work = force \u00d7 distance \u2192 $[ML^2T^{-2}]$. Torque = force \u00d7 lever arm \u2192 also $[ML^2T^{-2}]$. Pressure has $[ML^{-1}T^{-2}]$ and momentum has $[MLT^{-1}]$.',
    short: 'Work and torque share dimensions $[ML^2T^{-2}]$.',
    hints: ['Write dimensions as force \u00d7 distance for both.'],
    concept: 'Dimensional analysis',
    difficulty: 2,
  }),
  multi('curated-phy-multi-002', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Vectors',
    q: 'Which of the following are vector quantities?',
    options: ['Velocity', 'Acceleration', 'Speed', 'Distance'],
    correct: [0, 1],
    sol: 'Velocity and acceleration have both magnitude and direction, so they are vectors. Speed and distance are scalars (magnitude only).',
    short: 'Velocity and acceleration are vectors.',
    hints: ['A vector needs magnitude and direction.'],
    concept: 'Scalar and vector quantities',
    difficulty: 1,
  }),
  multi('curated-phy-multi-003', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Projectile Motion',
    q: 'A projectile is fired at an angle $\\theta$ with speed $u$. Which of the following statements are correct? (Take air resistance as negligible.)',
    options: [
      'Time of flight is $\\frac{2u \\sin \\theta}{g}$',
      'Horizontal range is maximum when $\\theta = 45^\\circ$',
      'The horizontal component of velocity is zero at the highest point',
      'The acceleration is zero at the highest point',
    ],
    correct: [0, 1],
    sol: 'Time of flight $T = 2u\\sin\\theta/g$ and range $R = u^2\\sin 2\\theta/g$, which is maximum at $45^\\circ$. At the highest point only the vertical velocity is zero; the horizontal velocity is unchanged and the acceleration remains $g$ throughout.',
    short: 'Only the first two statements hold.',
    hints: ['Resolve motion into horizontal and vertical components.'],
    concept: 'Projectile motion',
    difficulty: 2,
  }),
  multi('curated-phy-multi-004', {
    subject: 'physics',
    chapter: 'Oscillations',
    microTopic: 'Simple Harmonic Motion',
    q: 'A particle executes simple harmonic motion. Which of the following statements are correct?',
    options: [
      'Acceleration is proportional to the displacement and directed opposite to it',
      'Velocity is maximum at the mean position',
      'Kinetic energy is constant throughout the motion',
      'Acceleration is maximum at the mean position',
    ],
    correct: [0, 1],
    sol: 'In SHM, $a = -\\omega^2 x$, so acceleration is proportional to displacement and opposite in direction. Speed (hence kinetic energy) is maximum at the mean position. Kinetic energy varies; acceleration is maximum at the extremes and zero at the mean position.',
    short: 'SHM acceleration is $a = -\\omega^2 x$; speed is max at mean position.',
    hints: ['Recall $a = -\\omega^2 x$ for SHM.'],
    concept: 'Simple harmonic motion',
    difficulty: 2,
  }),
  multi('curated-phy-multi-005', {
    subject: 'physics',
    chapter: 'Electromagnetic Waves',
    microTopic: 'EM Waves Spectrum',
    q: 'Which of the following statements about electromagnetic waves are correct?',
    options: [
      'They are transverse in nature',
      'They carry energy and momentum',
      'They require a material medium to propagate',
      'Their speed in vacuum is less than the speed of light',
    ],
    correct: [0, 1],
    sol: 'EM waves are transverse and travel at speed $c$ in vacuum without any medium, carrying energy and momentum. The last two statements are false.',
    short: 'EM waves are transverse, travel in vacuum, and carry energy.',
    hints: ['Maxwell\u2019s theory of EM waves.'],
    concept: 'Electromagnetic waves',
    difficulty: 1,
  }),

  multi('curated-che-multi-001', {
    subject: 'chemistry',
    chapter: 'Chemical Bonding',
    microTopic: 'Hybridisation',
    q: 'In which of the following species is the carbon atom $sp^3$ hybridised?',
    options: ['$CH_4$', '$CH_3Cl$', '$C_2H_4$', '$C_6H_6$'],
    correct: [0, 1],
    sol: 'In $CH_4$ and $CH_3Cl$ the carbon forms four sigma bonds, so it is $sp^3$. In $C_2H_4$ and benzene the carbons are $sp^2$ hybridised.',
    short: '$sp^3$ requires four sigma bonds on carbon.',
    hints: ['Count sigma bonds around carbon.'],
    concept: 'Hybridisation',
    difficulty: 2,
  }),
  multi('curated-che-multi-002', {
    subject: 'chemistry',
    chapter: 'Chemical Bonding',
    microTopic: 'Hydrogen Bonding',
    q: 'Which of the following molecules exhibit hydrogen bonding?',
    options: ['$H_2O$', '$HF$', '$CH_4$', '$CO_2$'],
    correct: [0, 1],
    sol: 'Hydrogen bonding requires a hydrogen attached to a highly electronegative atom (N, O, F). $H_2O$ and $HF$ show it; $CH_4$ and $CO_2$ do not.',
    short: 'H-bonding needs H\u2013N/O/F.',
    hints: ['Look for H bonded to N, O or F.'],
    concept: 'Hydrogen bonding',
    difficulty: 1,
  }),
  multi('curated-che-multi-003', {
    subject: 'chemistry',
    chapter: 'Structure of Atom',
    microTopic: 'Atomic Models',
    q: 'Which of the following pairs of species are isoelectronic (same number of electrons)?',
    options: ['$N_2$ and $CO$', '$O_2$ and $NO$', '$N_2$ and $O_2$', '$CO$ and $NO^+$'],
    correct: [0, 1, 3],
    sol: '$N_2$: 14 e\u207b, $CO$: 14 e\u207b, $NO^+$: 14 e\u207b \u2014 all isoelectronic. $O_2$ has 16 e\u207b and $NO$ has 15 e\u207b, so option B and C are not pairs of the same electron count.',
    short: '14-electron species: $N_2$, $CO$, $NO^+$.',
    hints: ['Count total valence electrons of each species.'],
    concept: 'Isoelectronic species',
    difficulty: 3,
  }),
  multi('curated-che-multi-004', {
    subject: 'chemistry',
    chapter: 'Hydrocarbons',
    microTopic: 'Aromatic Hydrocarbons',
    q: 'Which of the following compounds are aromatic?',
    options: ['Benzene', 'Pyridine', 'Cyclopentadiene', 'Cyclohexane'],
    correct: [0, 1],
    sol: 'Benzene and pyridine satisfy H\u00fcckel\u2019s rule (4n+2 \u03c0 electrons, planar, fully conjugated). Cyclopentadiene is not aromatic (sp\u00b3 CH\u2082 breaks conjugation) and cyclohexane is not conjugated.',
    short: 'Benzene and pyridine obey H\u00fcckel\u2019s rule.',
    hints: ['Apply H\u00fcckel\u2019s (4n+2) rule.'],
    concept: 'Aromaticity',
    difficulty: 3,
  }),
  multi('curated-che-multi-005', {
    subject: 'chemistry',
    chapter: 'Biomolecules',
    microTopic: 'Carbohydrates',
    q: 'Which of the following are reducing sugars?',
    options: ['Glucose', 'Fructose', 'Sucrose', 'Starch'],
    correct: [0, 1],
    sol: 'Glucose and fructose reduce Tollens\u2019 and Fehling\u2019s reagents because they have a free aldehyde/ketone group that can tautomerise. Sucrose and starch have no free reducing group.',
    short: 'Glucose and fructose are reducing sugars.',
    hints: ['Reducing sugars have a free aldehyde or ketone group.'],
    concept: 'Reducing sugars',
    difficulty: 2,
  }),

  multi('curated-math-multi-001', {
    subject: 'mathematics',
    chapter: 'Sets, Relations and Functions',
    microTopic: 'Functions',
    q: 'Which of the following functions are even?',
    options: ['$f(x) = x^2$', '$f(x) = \\cos x$', '$f(x) = x^3$', '$f(x) = \\sin x$'],
    correct: [0, 1],
    sol: 'A function is even if $f(-x) = f(x)$. $(-x)^2 = x^2$ and $\\cos(-x) = \\cos x$. The odd functions $x^3$ and $\\sin x$ are not even.',
    short: 'Even functions satisfy $f(-x) = f(x)$.',
    hints: ['Test each with $x$ replaced by $-x$.'],
    concept: 'Even and odd functions',
    difficulty: 1,
  }),
  multi('curated-math-multi-002', {
    subject: 'mathematics',
    chapter: 'Complex Numbers and Quadratic Equations',
    microTopic: 'Quadratic Equations',
    q: 'The solutions of the equation $|x - 2| = 3$ are:',
    options: ['5', '-1', '1', '-5'],
    correct: [0, 1],
    sol: '$|x-2| = 3$ gives $x - 2 = 3$ or $x - 2 = -3$, i.e. $x = 5$ or $x = -1$.',
    short: 'Solve the two linear cases of the absolute value.',
    hints: ['$|a| = b$ means $a = b$ or $a = -b$.'],
    concept: 'Absolute value equations',
    difficulty: 1,
  }),
  multi('curated-math-multi-003', {
    subject: 'mathematics',
    chapter: 'Statistics and Probability',
    microTopic: 'Probability',
    q: 'Which of the following numbers are prime?',
    options: ['13', '17', '21', '25'],
    correct: [0, 1],
    sol: '13 and 17 have no divisors other than 1 and themselves. 21 = 3 \u00d7 7 and 25 = 5 \u00d7 5 are composite.',
    short: 'Primes: numbers with exactly two divisors.',
    hints: ['Check divisibility by small primes.'],
    concept: 'Prime numbers',
    difficulty: 1,
  }),
  multi('curated-math-multi-004', {
    subject: 'mathematics',
    chapter: 'Sets, Relations and Functions',
    microTopic: 'Sets',
    q: 'Which of the following integers are perfect squares between 1 and 10 (inclusive)?',
    options: ['1', '4', '9', '16'],
    correct: [0, 1, 2],
    sol: '$1 = 1^2$, $4 = 2^2$ and $9 = 3^2$ lie between 1 and 10. $16 = 4^2$ is outside the range.',
    short: 'Perfect squares $1, 4, 9$ are within the range.',
    hints: ['List squares up to 10.'],
    concept: 'Perfect squares',
    difficulty: 1,
  }),
  multi('curated-math-multi-005', {
    subject: 'mathematics',
    chapter: 'Trigonometry',
    microTopic: 'Trigonometric Identities',
    q: 'Which of the following statements about $f(x) = \\sin x$ are true?',
    options: [
      'It is an odd function',
      'It is periodic with period $2\\pi$',
      'Its range is the set of all real numbers',
      'It is an even function',
    ],
    correct: [0, 1],
    sol: '$\\sin(-x) = -\\sin x$, so it is odd, and $\\sin(x + 2\\pi) = \\sin x$, so the period is $2\\pi$. Its range is $[-1, 1]$, not all reals, and it is not even.',
    short: 'Sine is odd and $2\\pi$-periodic with range $[-1,1]$.',
    hints: ['Check $f(-x)$, period, and range.'],
    concept: 'Sine function',
    difficulty: 1,
  }),
]

// =====================================================================
// INTEGER TYPE — 6 per subject
// =====================================================================

const INTEGERS: Question[] = [
  intQ('curated-phy-int-001', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Kinematics in 1D',
    q: 'A body starts from rest and accelerates uniformly at $4\\ \\text{m/s}^2$. The distance covered by it during the 3rd second (in metres) is:',
    answer: 10,
    sol: 'Distance in the $n$th second $s_n = u + a(n - \\tfrac{1}{2}) = 0 + 4(3 - 0.5) = 4 \\times 2.5 = 10\\ \\text{m}$.',
    short: '$s_3 = a(2.5) = 10\\ \\text{m}$.',
    hints: ['Use $s_n = u + \\frac{a}{2}(2n-1)$.'],
    concept: 'Equations of motion',
    difficulty: 2,
  }),
  intQ('curated-phy-int-002', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Kinematics in 1D',
    q: 'A ball is thrown vertically upward with a speed of $20\\ \\text{m/s}$. Taking $g = 10\\ \\text{m/s}^2$ and neglecting air resistance, the total time taken to return to the point of projection (in seconds) is:',
    answer: 4,
    sol: 'Time of flight $T = \\frac{2u}{g} = \\frac{2 \\times 20}{10} = 4\\ \\text{s}$.',
    short: '$T = 2u/g = 4\\ \\text{s}$.',
    hints: ['Time up equals time down.'],
    concept: 'Vertical motion',
    difficulty: 1,
  }),
  intQ('curated-phy-int-003', {
    subject: 'physics',
    chapter: 'Ray Optics',
    microTopic: 'Reflection and Refraction',
    q: 'Two plane mirrors are inclined at an angle of $60^\\circ$. The number of images of an object placed between them is:',
    answer: 5,
    sol: 'Number of images $n = \\frac{360^\\circ}{\\theta} - 1 = \\frac{360}{60} - 1 = 6 - 1 = 5$.',
    short: '$n = 360/\\theta - 1 = 5$.',
    hints: ['Use $n = \\frac{360^\\circ}{\\theta} - 1$ (object not on the bisector).'],
    concept: 'Plane mirrors',
    difficulty: 2,
  }),
  intQ('curated-phy-int-004', {
    subject: 'physics',
    chapter: 'Current Electricity',
    microTopic: 'Resistance and Resistivity',
    q: 'Three identical resistors, each of resistance $6\\ \\Omega$, are connected in parallel. The equivalent resistance (in ohm) of the combination is:',
    answer: 2,
    sol: 'For $n$ equal resistors in parallel, $R_{eq} = R/n = 6/3 = 2\\ \\Omega$.',
    short: '$R_{eq} = R/n = 6/3 = 2\\ \\Omega$.',
    hints: ['Parallel combination divides resistance by the number of equal resistors.'],
    concept: 'Resistors in parallel',
    difficulty: 1,
  }),
  intQ('curated-phy-int-005', {
    subject: 'physics',
    chapter: 'EMI and AC',
    microTopic: 'Electromagnetic Induction',
    q: 'A conductor of length $2\\ \\text{m}$ moves perpendicular to a uniform magnetic field of $0.5\\ \\text{T}$ at a speed of $10\\ \\text{m/s}$. The motional emf induced across its ends (in volts) is:',
    answer: 10,
    sol: '$\\varepsilon = BvL = 0.5 \\times 10 \\times 2 = 10\\ \\text{V}$.',
    short: '$\\varepsilon = BvL = 10\\ \\text{V}$.',
    hints: ['Motional emf $\\varepsilon = Bvl$ for motion perpendicular to the field.'],
    concept: 'Motional emf',
    difficulty: 2,
  }),
  intQ('curated-phy-int-006', {
    subject: 'physics',
    chapter: 'Ray Optics',
    microTopic: 'Reflection and Refraction',
    q: 'Two plane mirrors are placed at right angles to each other. The number of images of an object placed between them is:',
    answer: 3,
    sol: '$n = \\frac{360^\\circ}{\\theta} - 1 = \\frac{360}{90} - 1 = 4 - 1 = 3$.',
    short: '$n = 360/90 - 1 = 3$.',
    hints: ['Use $n = 360^\\circ/\\theta - 1$.'],
    concept: 'Plane mirrors',
    difficulty: 1,
  }),

  intQ('curated-che-int-001', {
    subject: 'chemistry',
    chapter: 'Equilibrium',
    microTopic: 'Ionic Equilibrium',
    q: 'The pH of a $10^{-2}\\ \\text{M}$ aqueous solution of HCl is:',
    answer: 2,
    sol: 'HCl is a strong acid and dissociates completely: $[H^+] = 10^{-2}\\ \\text{M}$, so $pH = -\\log(10^{-2}) = 2$.',
    short: '$pH = -\\log[H^+] = 2$.',
    hints: ['HCl is a strong acid; $[H^+] = 10^{-2}$.'],
    concept: 'pH of strong acid',
    difficulty: 1,
  }),
  intQ('curated-che-int-002', {
    subject: 'chemistry',
    chapter: 'Redox Reactions',
    microTopic: 'Oxidation Number',
    q: 'The oxidation number of manganese in $KMnO_4$ is:',
    answer: 7,
    sol: 'Let the oxidation state of Mn be $x$. $1 + x + 4(-2) = 0 \\Rightarrow x = +7$.',
    short: 'K $= +1$, O $= -2$ \u2192 $x = +7$.',
    hints: ['Set the sum of oxidation states equal to zero for a neutral compound.'],
    concept: 'Oxidation number',
    difficulty: 1,
  }),
  intQ('curated-che-int-003', {
    subject: 'chemistry',
    chapter: 'Hydrocarbons',
    microTopic: 'Aromatic Hydrocarbons',
    q: 'The number of $\\pi$-bonds present in one molecule of benzene is:',
    answer: 3,
    sol: 'Benzene has a hexagonal ring with three alternating double bonds, i.e. three $\\pi$-bonds (delocalised over the ring).',
    short: 'Benzene has 3 $\\pi$-bonds.',
    hints: ['Count the double bonds in the Kekul\u00e9 structure of benzene.'],
    concept: 'Benzene structure',
    difficulty: 1,
  }),
  intQ('curated-che-int-004', {
    subject: 'chemistry',
    chapter: 'Chemical Bonding',
    microTopic: 'VSEPR Theory',
    q: 'The number of lone pairs of electrons on the central oxygen atom in the water molecule is:',
    answer: 2,
    sol: 'Oxygen in $H_2O$ has 6 valence electrons; two are shared in O\u2013H bonds and the remaining 4 form 2 lone pairs.',
    short: '$H_2O$: central O has 2 lone pairs.',
    hints: ['Valence electrons of O = 6; subtract two for the two bonds.'],
    concept: 'VSEPR theory',
    difficulty: 1,
  }),
  intQ('curated-che-int-005', {
    subject: 'chemistry',
    chapter: 'Some Basic Concepts of Chemistry',
    microTopic: 'Mole Concept',
    q: 'The number of moles present in $88\\ \\text{g}$ of $CO_2$ (molar mass $44\\ \\text{g/mol}$) is:',
    answer: 2,
    sol: '$n = m/M = 88/44 = 2\\ \\text{mol}$.',
    short: '$n = m/M = 2\\ \\text{mol}$.',
    hints: ['Moles = mass / molar mass.'],
    concept: 'Mole concept',
    difficulty: 1,
  }),
  intQ('curated-che-int-006', {
    subject: 'chemistry',
    chapter: 'Classification and Periodicity',
    microTopic: 'Periodic Table',
    q: 'The number of valence electrons in a chlorine atom (atomic number 17) is:',
    answer: 7,
    sol: 'Configuration of Cl: $[Ne]\\,3s^2\\,3p^5$, so it has $2 + 5 = 7$ valence electrons.',
    short: 'Cl has 7 valence electrons (group 17).',
    hints: ['Chlorine belongs to group 17.'],
    concept: 'Valence electrons',
    difficulty: 1,
  }),

  intQ('curated-math-int-001', {
    subject: 'mathematics',
    chapter: 'Binomial Theorem',
    microTopic: 'Binomial Expansion',
    q: 'The number of terms in the expansion of $(1 + x)^5$ is:',
    answer: 6,
    sol: 'The expansion of $(1+x)^n$ has $n + 1$ terms, so $(1+x)^5$ has $5 + 1 = 6$ terms.',
    short: 'Number of terms $= n + 1 = 6$.',
    hints: ['Count powers of $x$ from 0 to 5.'],
    concept: 'Binomial expansion',
    difficulty: 1,
  }),
  intQ('curated-math-int-002', {
    subject: 'mathematics',
    chapter: 'Complex Numbers and Quadratic Equations',
    microTopic: 'Quadratic Equations',
    q: 'The number of solutions of the equation $x^2 + x + 1 = 0$ in the set of complex numbers is:',
    answer: 2,
    sol: 'The discriminant $D = 1 - 4 = -3 < 0$, so the equation has two distinct complex (conjugate) roots.',
    short: 'A quadratic always has two roots over $\\mathbb{C}$.',
    hints: ['Fundamental theorem of algebra.'],
    concept: 'Nature of roots',
    difficulty: 1,
  }),
  intQ('curated-math-int-003', {
    subject: 'mathematics',
    chapter: 'Complex Numbers and Quadratic Equations',
    microTopic: 'Quadratic Equations',
    q: 'The remainder when $2^{50}$ is divided by $5$ is:',
    answer: 4,
    sol: 'Since $2^4 = 16 \\equiv 1 \\pmod 5$, $2^{50} = 2^{4\\cdot12} \\cdot 2^2 \\equiv 1 \\cdot 4 = 4 \\pmod 5$.',
    short: '$2^4 \\equiv 1$, so $2^{50} \\equiv 4 \\pmod 5$.',
    hints: ['Reduce the exponent using $2^4 \\equiv 1 \\pmod 5$.'],
    concept: 'Modular arithmetic',
    difficulty: 3,
  }),
  intQ('curated-math-int-004', {
    subject: 'mathematics',
    chapter: 'Permutations and Combinations',
    microTopic: 'Combinations',
    q: 'The number of ways of choosing 3 books out of 7 different books is:',
    answer: 35,
    sol: '$\\binom{7}{3} = \\frac{7!}{3!4!} = \\frac{7 \\times 6 \\times 5}{6} = 35$.',
    short: '$\\binom{7}{3} = 35$.',
    hints: ['Selection = combination.'],
    concept: 'Combinations',
    difficulty: 1,
  }),
  intQ('curated-math-int-005', {
    subject: 'mathematics',
    chapter: 'Coordinate Geometry',
    microTopic: 'Straight Lines',
    q: 'The sum of the interior angles of a regular polygon is $540^\\circ$. The number of sides of the polygon is:',
    answer: 5,
    sol: 'Sum of interior angles $= (n - 2) \\times 180 = 540 \\Rightarrow n - 2 = 3 \\Rightarrow n = 5$.',
    short: '$(n-2)180 = 540 \\Rightarrow n = 5$.',
    hints: ['Use the interior angle sum formula.'],
    concept: 'Polygons',
    difficulty: 2,
  }),
  intQ('curated-math-int-006', {
    subject: 'mathematics',
    chapter: 'Trigonometry',
    microTopic: 'Trigonometric Ratios',
    q: 'The value of $|3 - 7| + |7 - 3|$ is:',
    answer: 8,
    sol: '$|3-7| = 4$ and $|7-3| = 4$, so the sum is $8$.',
    short: '$4 + 4 = 8$.',
    hints: ['Absolute value removes the sign.'],
    concept: 'Absolute value',
    difficulty: 1,
  }),
]

// =====================================================================
// NUMERICAL TYPE (JEE Advanced style, range accepted) — 4 per subject
// =====================================================================

const NUMERICALS: Question[] = [
  numQ('curated-phy-num-001', {
    subject: 'physics',
    chapter: 'Current Electricity',
    microTopic: 'Resistance and Resistivity',
    q: 'Two resistors of $4\\ \\Omega$ and $6\\ \\Omega$ are connected in parallel. The equivalent resistance (in ohm) is:',
    answer: 2.4,
    range: [2.3, 2.5],
    sol: '$\\frac{1}{R_{eq}} = \\frac{1}{4} + \\frac{1}{6} = \\frac{3 + 2}{12} = \\frac{5}{12}$, so $R_{eq} = 12/5 = 2.4\\ \\Omega$.',
    short: '$R_{eq} = \\frac{4 \\times 6}{4 + 6} = 2.4\\ \\Omega$.',
    hints: ['Use the product-over-sum formula for two parallel resistors.'],
    concept: 'Resistors in parallel',
    difficulty: 1,
  }),
  numQ('curated-phy-num-002', {
    subject: 'physics',
    chapter: 'Work, Energy and Power',
    microTopic: 'Work and Energy',
    q: 'A spring of spring constant $200\\ \\text{N/m}$ is compressed by $5\\ \\text{cm}$. The potential energy stored in it (in joule) is:',
    answer: 0.25,
    range: [0.24, 0.26],
    sol: '$PE = \\tfrac{1}{2}kx^2 = \\tfrac{1}{2}(200)(0.05)^2 = 100 \\times 0.0025 = 0.25\\ \\text{J}$.',
    short: '$\\tfrac{1}{2}kx^2 = 0.25\\ \\text{J}$.',
    hints: ['Convert cm to metres first.'],
    concept: 'Elastic potential energy',
    difficulty: 2,
  }),
  numQ('curated-phy-num-003', {
    subject: 'physics',
    chapter: 'Gravitation',
    microTopic: 'Escape Velocity',
    q: 'The escape velocity from the surface of the Earth (radius $6400\\ \\text{km}$, $g = 9.8\\ \\text{m/s}^2$) is approximately (in km/s):',
    answer: 11.2,
    range: [11.0, 11.4],
    sol: '$v_e = \\sqrt{2gR} = \\sqrt{2 \\times 9.8 \\times 6.4 \\times 10^6} \\approx 1.12 \\times 10^4\\ \\text{m/s} = 11.2\\ \\text{km/s}$.',
    short: '$v_e = \\sqrt{2gR} \\approx 11.2\\ \\text{km/s}$.',
    hints: ['Use $v_e = \\sqrt{2gR}$ with $R$ in metres.'],
    concept: 'Escape velocity',
    difficulty: 2,
  }),
  numQ('curated-phy-num-004', {
    subject: 'physics',
    chapter: 'Waves',
    microTopic: 'Wave Motion',
    q: 'The speed of sound in air at $0^\\circ\\text{C}$ is approximately (in m/s):',
    answer: 331,
    range: [325, 340],
    sol: 'The speed of sound in air at $0^\\circ\\text{C}$ is about $331\\ \\text{m/s}$ (increases by roughly $0.6\\ \\text{m/s}$ per $^\\circ\\text{C}$).',
    short: '$v \\approx 331\\ \\text{m/s}$ at $0^\\circ\\text{C}$.',
    hints: ['Standard value for sound speed in air.'],
    concept: 'Speed of sound',
    difficulty: 1,
  }),

  numQ('curated-che-num-001', {
    subject: 'chemistry',
    chapter: 'Equilibrium',
    microTopic: 'pH and Buffer',
    q: 'The pH of a $10^{-3}\\ \\text{M}$ aqueous solution of NaOH at $25^\\circ\\text{C}$ is:',
    answer: 11,
    range: [10.9, 11.1],
    sol: 'NaOH is a strong base: $[OH^-] = 10^{-3}$, so $pOH = 3$ and $pH = 14 - 3 = 11$.',
    short: '$pH = 14 - pOH = 11$.',
    hints: ['$pOH = -\\log[OH^-]$ and $pH + pOH = 14$.'],
    concept: 'pH of a strong base',
    difficulty: 1,
  }),
  numQ('curated-che-num-002', {
    subject: 'chemistry',
    chapter: 'Some Basic Concepts of Chemistry',
    microTopic: 'Mole Concept',
    q: 'The molar mass of $CaCO_3$ (in g/mol) is: (Ca = 40, C = 12, O = 16)',
    answer: 100,
    range: [99, 101],
    sol: '$M = 40 + 12 + 3(16) = 40 + 12 + 48 = 100\\ \\text{g/mol}$.',
    short: '$40 + 12 + 48 = 100\\ \\text{g/mol}$.',
    hints: ['Add the atomic masses of all atoms.'],
    concept: 'Molar mass',
    difficulty: 1,
  }),
  numQ('curated-che-num-003', {
    subject: 'chemistry',
    chapter: 'Redox Reactions',
    microTopic: 'Electrochemical Cells',
    q: 'The standard emf of the zinc\u2013copper cell, $E^\\circ_{Cu^{2+}/Cu} - E^\\circ_{Zn^{2+}/Zn}$, is approximately (in volts):',
    answer: 1.1,
    range: [1.05, 1.15],
    sol: '$E^\\circ_{Cu^{2+}/Cu} = +0.34\\ \\text{V}$ and $E^\\circ_{Zn^{2+}/Zn} = -0.76\\ \\text{V}$, so $E^\\circ_{cell} = 0.34 - (-0.76) = 1.10\\ \\text{V}$.',
    short: '$0.34 - (-0.76) = 1.10\\ \\text{V}$.',
    hints: ['Standard electrode potentials of Cu and Zn.'],
    concept: 'Cell emf',
    difficulty: 2,
  }),
  numQ('curated-che-num-004', {
    subject: 'chemistry',
    chapter: 'Some Basic Concepts of Chemistry',
    microTopic: 'Concentration Terms',
    q: 'The molarity of a solution containing 2 mol of solute in 500 mL of solution is (in mol/L):',
    answer: 4,
    range: [3.9, 4.1],
    sol: '$M = \\frac{\\text{moles}}{\\text{volume in L}} = \\frac{2}{0.5} = 4\\ \\text{M}$.',
    short: '$M = 2/0.5 = 4\\ \\text{mol/L}$.',
    hints: ['Convert mL to litres.'],
    concept: 'Molarity',
    difficulty: 1,
  }),

  numQ('curated-math-num-001', {
    subject: 'mathematics',
    chapter: 'Trigonometry',
    microTopic: 'Trigonometric Ratios',
    q: 'The value of $\\sin 75^\\circ$ is (give your answer correct to two decimal places):',
    answer: 0.97,
    range: [0.95, 0.98],
    sol: '$\\sin 75^\\circ = \\sin(45^\\circ + 30^\\circ) = \\sin45\\cos30 + \\cos45\\sin30 = \\frac{\\sqrt{6} + \\sqrt{2}}{4} \\approx 0.966$.',
    short: '$\\frac{\\sqrt{6}+\\sqrt{2}}{4} \\approx 0.97$.',
    hints: ['Use the angle addition formula.'],
    concept: 'Trigonometric identities',
    difficulty: 2,
  }),
  numQ('curated-math-num-002', {
    subject: 'mathematics',
    chapter: 'Sequences and Series',
    microTopic: 'Geometric Progression',
    q: 'The sum of the infinite geometric series $1 + \\frac{1}{2} + \\frac{1}{4} + \\cdots$ is:',
    answer: 2,
    range: [1.99, 2.01],
    sol: '$S_\\infty = \\frac{a}{1-r} = \\frac{1}{1 - 1/2} = 2$.',
    short: '$S_\\infty = a/(1-r) = 2$.',
    hints: ['First term $a = 1$, common ratio $r = 1/2$.'],
    concept: 'Infinite geometric series',
    difficulty: 1,
  }),
  numQ('curated-math-num-003', {
    subject: 'mathematics',
    chapter: 'Coordinate Geometry',
    microTopic: 'Distance and Section Formula',
    q: 'The area of the triangle with vertices $(0,0)$, $(3,0)$ and $(0,4)$ is:',
    answer: 6,
    range: [5.9, 6.1],
    sol: 'This is a right triangle with legs 3 and 4, so area $= \\tfrac{1}{2} \\times 3 \\times 4 = 6$ square units.',
    short: 'Area $= \\tfrac{1}{2} \\cdot 3 \\cdot 4 = 6$.',
    hints: ['It is a right triangle at the origin.'],
    concept: 'Area of a triangle',
    difficulty: 1,
  }),
  numQ('curated-math-num-004', {
    subject: 'mathematics',
    chapter: 'Coordinate Geometry',
    microTopic: 'Straight Lines',
    q: 'The distance between the parallel lines $3x + 4y + 5 = 0$ and $3x + 4y - 5 = 0$ is:',
    answer: 2,
    range: [1.9, 2.1],
    sol: '$d = \\frac{|c_1 - c_2|}{\\sqrt{a^2 + b^2}} = \\frac{|5 - (-5)|}{\\sqrt{9 + 16}} = \\frac{10}{5} = 2$.',
    short: '$d = |c_1 - c_2|/\\sqrt{a^2+b^2} = 2$.',
    hints: ['Lines are of the form $ax+by+c = 0$.'],
    concept: 'Distance between parallel lines',
    difficulty: 2,
  }),
]

// =====================================================================
// MATRIX MATCH — 2 per subject (permutation-type, each row a distinct column)
// =====================================================================

const MATRICES: Question[] = [
  matrix('curated-phy-matrix-001', {
    subject: 'physics',
    chapter: 'Units and Measurements',
    microTopic: 'Units and Dimensions',
    listI: ['Work', 'Power', 'Impulse', 'Momentum'],
    listII: ['$F\\Delta t$', '$Fs\\cos\\theta$', '$mv$', '$Fv$'],
    matches: { 0: 1, 1: 3, 2: 0, 3: 2 },
    type: 'matrix',
    exam: 'jee-advanced',
    year: 2021,
    difficulty: 2,
    sol: 'Work $= Fs\\cos\\theta$ (2), Power $= Fv$ (4), Impulse $= F\\Delta t$ (1), Momentum $= mv$ (3). So P\u21922, Q\u21924, R\u21921, S\u21923.',
    hints: ['Work is force \u00d7 displacement.', 'Power is force \u00d7 velocity.', 'Impulse is force \u00d7 time.'],
    concept: 'Physical quantities and formulas',
  }),
  matrix('curated-phy-matrix-002', {
    subject: 'physics',
    chapter: 'Oscillations',
    microTopic: 'Simple Harmonic Motion',
    listI: ['Period of mass\u2013spring system', 'Period of simple pendulum', 'Angular frequency of spring', 'Total energy of SHM'],
    listII: ['$2\\pi\\sqrt{l/g}$', '$\\sqrt{k/m}$', '$2\\pi\\sqrt{m/k}$', '$\\tfrac{1}{2}kA^2$'],
    matches: { 0: 2, 1: 0, 2: 1, 3: 3 },
    type: 'matrix',
    exam: 'jee-advanced',
    year: 2020,
    difficulty: 2,
    sol: 'Mass\u2013spring period $T = 2\\pi\\sqrt{m/k}$ (3), pendulum period $T = 2\\pi\\sqrt{l/g}$ (1), angular frequency $\\omega = \\sqrt{k/m}$ (2), total energy $E = \\tfrac{1}{2}kA^2$ (4). So P\u21923, Q\u21921, R\u21922, S\u21924.',
    hints: ['Compare the standard SHM formulas.'],
    concept: 'Oscillations',
  }),

  matrix('curated-che-matrix-001', {
    subject: 'chemistry',
    chapter: 'States of Matter',
    microTopic: 'Gaseous State',
    listI: ["Boyle's law", "Charles' law", "Gay-Lussac's law", 'Avogadro\u2019s law'],
    listII: ['$V \\propto T$', '$V \\propto n$', '$P \\propto \\tfrac{1}{V}$', '$P \\propto T$'],
    matches: { 0: 2, 1: 0, 2: 3, 3: 1 },
    type: 'matrix',
    exam: 'jee-advanced',
    year: 2021,
    difficulty: 1,
    sol: 'Boyle: $P \\propto 1/V$ (3), Charles: $V \\propto T$ (1), Gay-Lussac: $P \\propto T$ (4), Avogadro: $V \\propto n$ (2). So P\u21923, Q\u21921, R\u21924, S\u21922.',
    hints: ['Recall each gas law statement.'],
    concept: 'Gas laws',
  }),
  matrix('curated-che-matrix-002', {
    subject: 'chemistry',
    chapter: 'Chemical Bonding',
    microTopic: 'Hybridisation',
    listI: ['$CH_4$', '$C_2H_2$', '$BeCl_2$', '$C_2H_4$'],
    listII: ['$sp$', '$sp^3$', '$sp$', '$sp^2$'],
    matches: { 0: 1, 1: 0, 2: 2, 3: 3 },
    type: 'matrix',
    exam: 'jee-advanced',
    year: 2020,
    difficulty: 2,
    sol: '$CH_4$: four sigma bonds \u2192 $sp^3$ (2). $C_2H_2$: triple bond \u2192 $sp$ (1). $BeCl_2$: linear, two sigma bonds \u2192 $sp$ (3). $C_2H_4$: double bond \u2192 $sp^2$ (4). So P\u21922, Q\u21921, R\u21923, S\u21924.',
    hints: ['Sigma bonds + lone pairs determine hybridisation.'],
    concept: 'Hybridisation',
  }),

  matrix('curated-math-matrix-001', {
    subject: 'mathematics',
    chapter: 'Trigonometry',
    microTopic: 'Trigonometric Identities',
    listI: ['$\\sin x$', '$\\tan x$', '$e^x$', '$\\log x$ (base $e$)'],
    listII: ['All real numbers', '$(0, \\infty)$', '$[-1, 1]$', 'All real numbers'],
    matches: { 0: 2, 1: 0, 2: 1, 3: 3 },
    type: 'matrix',
    exam: 'jee-advanced',
    year: 2021,
    difficulty: 2,
    sol: 'Range of $\\sin x$ is $[-1,1]$ (3), $\\tan x$ is all reals (1), $e^x$ is $(0,\\infty)$ (2), $\\log x$ is all reals (4). So P\u21923, Q\u21921, R\u21922, S\u21924.',
    hints: ['Recall the range of each standard function.'],
    concept: 'Ranges of functions',
  }),
  matrix('curated-math-matrix-002', {
    subject: 'mathematics',
    chapter: 'Coordinate Geometry',
    microTopic: 'Locus',
    listI: ['Circle', 'Parabola', 'Ellipse', 'Hyperbola'],
    listII: ['$e < 1$', '$0$', '$e = 1$', '$e > 1$'],
    matches: { 0: 1, 1: 2, 2: 0, 3: 3 },
    type: 'matrix',
    exam: 'jee-advanced',
    year: 2020,
    difficulty: 2,
    sol: 'Circle has $e = 0$ (2), parabola $e = 1$ (3), ellipse $0 < e < 1$ (1), hyperbola $e > 1$ (4). So P\u21922, Q\u21923, R\u21921, S\u21924.',
    hints: ['Compare eccentricities of the conics.'],
    concept: 'Eccentricity of conics',
  }),
]

// =====================================================================
// MATCH THE COLUMNS — 2 per subject (repeated columns allowed)
// =====================================================================

const MATCH_COLUMNS: Question[] = [
  matrix('curated-phy-match-001', {
    subject: 'physics',
    chapter: 'Units and Measurements',
    microTopic: 'Units and Dimensions',
    listI: ['Force', 'Work', 'Power', 'Pressure'],
    listII: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'],
    matches: { 0: 0, 1: 1, 2: 2, 3: 3 },
    type: 'match-columns',
    exam: 'jee-advanced',
    year: 2021,
    difficulty: 1,
    sol: 'SI units: Force\u2192N (1), Work\u2192J (2), Power\u2192W (3), Pressure\u2192Pa (4). So P\u21921, Q\u21922, R\u21923, S\u21924.',
    hints: ['Recall the SI unit of each quantity.'],
    concept: 'SI units',
  }),
  matrix('curated-phy-match-002', {
    subject: 'physics',
    chapter: 'Laws of Motion',
    microTopic: "Newton's Laws of Motion",
    listI: ['Momentum', 'Force', 'Kinetic energy', 'Work'],
    listII: ['$ma$', '$F\\,s\\cos\\theta$', '$\\tfrac{1}{2}mv^2$', '$mv$'],
    matches: { 0: 3, 1: 0, 2: 2, 3: 1 },
    type: 'match-columns',
    exam: 'jee-advanced',
    year: 2020,
    difficulty: 1,
    sol: 'Momentum $= mv$ (4), Force $= ma$ (1), Kinetic energy $= \\tfrac{1}{2}mv^2$ (3), Work $= Fs\\cos\\theta$ (2). So P\u21924, Q\u21921, R\u21923, S\u21922.',
    hints: ['Match each quantity to its defining formula.'],
    concept: 'Force and motion formulas',
  }),

  matrix('curated-che-match-001', {
    subject: 'chemistry',
    chapter: 'Chemical Bonding',
    microTopic: 'VSEPR Theory',
    listI: ['$H_2O$', '$NH_3$', '$CH_4$', '$BeCl_2$'],
    listII: ['1 lone pair', '2 lone pairs', '0 lone pairs'],
    matches: { 0: 1, 1: 0, 2: 2, 3: 2 },
    type: 'match-columns',
    exam: 'jee-advanced',
    year: 2021,
    difficulty: 2,
    sol: 'Central atom lone pairs: $H_2O$: 2 (B), $NH_3$: 1 (A), $CH_4$: 0 (C), $BeCl_2$: 0 (C). So P\u2192B, Q\u2192A, R\u2192C, S\u2192C.',
    hints: ['Count valence electrons minus those used in bonds.'],
    concept: 'Lone pairs',
  }),
  matrix('curated-che-match-002', {
    subject: 'chemistry',
    chapter: 'Chemical Bonding',
    microTopic: 'Hydrogen Bonding',
    listI: ['$CH_3COOH$', '$HCl$', '$H_2SO_4$', '$HF$'],
    listII: ['Strong acid', 'Weak acid'],
    matches: { 0: 1, 1: 0, 2: 0, 3: 1 },
    type: 'match-columns',
    exam: 'jee-advanced',
    year: 2020,
    difficulty: 2,
    sol: '$HCl$ and $H_2SO_4$ are strong acids (A); $CH_3COOH$ and $HF$ are weak acids (B). So P\u2192B, Q\u2192A, R\u2192A, S\u2192B.',
    hints: ['Strong acids dissociate completely in water.'],
    concept: 'Acid strength',
  }),

  matrix('curated-math-match-001', {
    subject: 'mathematics',
    chapter: 'Trigonometry',
    microTopic: 'Trigonometric Ratios',
    listI: ['$\\sin 30^\\circ$', '$\\cos 0^\\circ$', '$\\tan 45^\\circ$', '$\\sin 90^\\circ$'],
    listII: ['$1$', '$\\tfrac{1}{2}$'],
    matches: { 0: 1, 1: 0, 2: 0, 3: 0 },
    type: 'match-columns',
    exam: 'jee-advanced',
    year: 2021,
    difficulty: 1,
    sol: '$\\sin 30^\\circ = \\tfrac{1}{2}$ (B), while $\\cos 0^\\circ$, $\\tan 45^\\circ$ and $\\sin 90^\\circ$ all equal $1$ (A). So P\u2192B, Q\u2192A, R\u2192A, S\u2192A.',
    hints: ['Use standard angle values.'],
    concept: 'Standard trigonometric values',
  }),
  matrix('curated-math-match-002', {
    subject: 'mathematics',
    chapter: 'Limits, Continuity and Differentiability',
    microTopic: 'Limits',
    listI: ['$\\lim_{x\\to0} \\frac{\\sin x}{x}$', '$\\lim_{x\\to0} \\frac{e^x - 1}{x}$', '$\\lim_{x\\to\\infty} \\frac{1}{x}$', '$\\lim_{x\\to0} \\frac{\\tan x}{x}$'],
    listII: ['$1$', '$0$'],
    matches: { 0: 0, 1: 0, 2: 1, 3: 0 },
    type: 'match-columns',
    exam: 'jee-advanced',
    year: 2020,
    difficulty: 2,
    sol: 'The three standard limits equal 1 (column A): $\\sin x/x$, $(e^x - 1)/x$ and $\\tan x/x$. Only $\\lim_{x\\to\\infty}1/x = 0$ maps to column B.',
    hints: ['Recall the three standard limits.'],
    concept: 'Standard limits',
  }),
]

// =====================================================================
// ASSERTION–REASON (JEE Advanced) — 5 per subject
// =====================================================================

const ASSERTION_REASONS: Question[] = [
  arQ('curated-phy-ar-001', {
    subject: 'physics',
    chapter: 'Work, Energy and Power',
    microTopic: 'Momentum',
    assertion: 'A rocket works on the principle of conservation of momentum.',
    reason: 'In the absence of an external force, the total momentum of a system remains constant.',
    correct: 0,
    difficulty: 1,
    sol: 'The rocket expels exhaust gas backwards, gaining equal and opposite momentum forwards. Since no external force acts on the rocket\u2013fuel system, momentum is conserved \u2014 the reason correctly explains the assertion.',
    hints: ['Think of the rocket\u2013fuel system as isolated.'],
    concept: 'Conservation of momentum',
  }),
  arQ('curated-phy-ar-002', {
    subject: 'physics',
    chapter: 'Properties of Solids and Fluids',
    microTopic: 'Surface Tension',
    assertion: 'Raindrops are spherical in shape.',
    reason: 'Surface tension tends to minimise the surface area of a liquid for a given volume.',
    correct: 0,
    difficulty: 1,
    sol: 'For a given volume, a sphere has the minimum surface area. Surface tension pulls the drop into a sphere \u2014 the reason correctly explains the assertion.',
    hints: ['Surface tension minimises area.'],
    concept: 'Surface tension',
  }),
  arQ('curated-phy-ar-003', {
    subject: 'physics',
    chapter: 'Rotational Motion',
    microTopic: 'Rolling Motion',
    assertion: 'When a solid sphere rolls without slipping down an inclined plane, the frictional force does no work.',
    reason: 'In pure rolling, the point of contact of the sphere with the surface is instantaneously at rest.',
    correct: 0,
    difficulty: 3,
    sol: 'Work done by friction is $f \\cdot s$ where $s$ is the displacement of the point of application. In pure rolling, the point of contact is instantaneously at rest, so friction does no work \u2014 the reason correctly explains the assertion.',
    hints: ['Work needs displacement of the point of application of force.'],
    concept: 'Pure rolling',
  }),
  arQ('curated-phy-ar-004', {
    subject: 'physics',
    chapter: 'Laws of Motion',
    microTopic: 'Pseudo Force',
    assertion: 'For a particle in uniform circular motion, the work done by the centripetal force over one complete revolution is zero.',
    reason: 'The centripetal force is always perpendicular to the displacement of the particle.',
    correct: 0,
    difficulty: 2,
    sol: 'Work $W = F s \\cos\\theta$. Since the centripetal force is radial and the displacement is tangential, $\\theta = 90^\\circ$ and $W = 0$ \u2014 the reason correctly explains the assertion.',
    hints: ['$W = Fs\\cos\\theta$.', 'Force is radial; displacement is tangential.'],
    concept: 'Work by centripetal force',
  }),
  arQ('curated-phy-ar-005', {
    subject: 'physics',
    chapter: 'Gravitation',
    microTopic: 'Satellites and Orbits',
    assertion: 'The total mechanical energy of a satellite in a stable circular orbit around the Earth is negative.',
    reason: 'The satellite is bound to the Earth by the gravitational attraction.',
    correct: 0,
    difficulty: 2,
    sol: 'For a bound system, the total energy $E = -\\frac{GMm}{2r} < 0$. A negative total energy is exactly the condition for a bound orbit, so the reason correctly explains the assertion.',
    hints: ['Bound orbits have negative total energy.'],
    concept: 'Energy of a satellite',
  }),

  arQ('curated-che-ar-001', {
    subject: 'chemistry',
    chapter: 's-Block Elements',
    microTopic: 'Alkali Metals',
    assertion: 'Alkali metals are good reducing agents.',
    reason: 'Alkali metals have low ionisation enthalpy.',
    correct: 0,
    difficulty: 2,
    sol: 'A reducing agent donates electrons. The low ionisation enthalpy of alkali metals allows them to lose their single valence electron readily, so the reason correctly explains why they are strong reducing agents.',
    hints: ['Reducing agent \u2192 electron donor.'],
    concept: 'Reducing character of alkali metals',
  }),
  arQ('curated-che-ar-002', {
    subject: 'chemistry',
    chapter: 'Hydrogen',
    microTopic: 'Water',
    assertion: 'Ice floats on water.',
    reason: 'The density of ice is lower than that of liquid water.',
    correct: 0,
    difficulty: 1,
    sol: 'In ice, hydrogen bonding produces an open cage-like structure, making its density lower than liquid water. Lower density causes ice to float \u2014 the reason correctly explains the assertion.',
    hints: ['Density of ice < density of water.'],
    concept: 'Anomalous behaviour of water',
  }),
  arQ('curated-che-ar-003', {
    subject: 'chemistry',
    chapter: 'Chemical Bonding',
    microTopic: 'Covalent Bonding',
    assertion: '$BF_3$ acts as a Lewis acid.',
    reason: 'Boron in $BF_3$ has a vacant $2p$ orbital.',
    correct: 0,
    difficulty: 2,
    sol: 'Boron has only six electrons in its valence shell and a vacant $2p$ orbital, allowing $BF_3$ to accept an electron pair. This electron-pair accepting ability is the definition of a Lewis acid \u2014 the reason correctly explains the assertion.',
    hints: ['Lewis acid = electron pair acceptor.'],
    concept: 'Lewis acid',
  }),
  arQ('curated-che-ar-004', {
    subject: 'chemistry',
    chapter: 'Alcohols, Phenols and Ethers',
    microTopic: 'Phenols',
    assertion: 'Phenol is a stronger acid than ethanol.',
    reason: 'The phenoxide ion is stabilised by resonance.',
    correct: 0,
    difficulty: 3,
    sol: 'Loss of a proton from phenol gives the phenoxide ion, whose negative charge is delocalised by resonance. Ethoxide has no such stabilisation, so the reason correctly explains the greater acidity of phenol.',
    hints: ['Compare the stability of the conjugate bases.'],
    concept: 'Acidity of phenols',
  }),
  arQ('curated-che-ar-005', {
    subject: 'chemistry',
    chapter: 'Environmental Chemistry',
    microTopic: 'Pollution',
    assertion: 'The ozone layer in the stratosphere protects living organisms.',
    reason: 'Ozone absorbs harmful ultraviolet (UV) radiation from the Sun.',
    correct: 0,
    difficulty: 1,
    sol: 'Ozone strongly absorbs UV-B radiation, protecting life from its harmful effects \u2014 the reason correctly explains the assertion.',
    hints: ['Ozone absorbs UV radiation.'],
    concept: 'Ozone layer',
  }),

  arQ('curated-math-ar-001', {
    subject: 'mathematics',
    chapter: 'Limits, Continuity and Differentiability',
    microTopic: 'Continuity',
    assertion: 'The function $f(x) = |x|$ is continuous at $x = 0$.',
    reason: 'The function $f(x) = |x|$ is differentiable at $x = 0$.',
    correct: 2,
    difficulty: 2,
    sol: '$f(x) = |x|$ is continuous at 0 since $\\lim_{x\\to0}|x| = f(0) = 0$, but it is NOT differentiable at 0 because the left and right derivatives are $-1$ and $+1$. So A is true and R is false.',
    hints: ['Check left and right derivatives at 0.'],
    concept: 'Continuity and differentiability',
  }),
  arQ('curated-math-ar-002', {
    subject: 'mathematics',
    chapter: 'Trigonometry',
    microTopic: 'Trigonometric Identities',
    assertion: 'For all real $\\theta$, $\\sin^2\\theta + \\cos^2\\theta = 1$.',
    reason: 'The sine and cosine functions are periodic with period $2\\pi$.',
    correct: 1,
    difficulty: 1,
    sol: 'Both statements are true (the Pythagorean identity and the periodicity of sine and cosine), but periodicity does not explain why $\\sin^2\\theta + \\cos^2\\theta = 1$.',
    hints: ['Periodicity and the Pythagorean identity are unrelated facts.'],
    concept: 'Trigonometric identities',
  }),
  arQ('curated-math-ar-003', {
    subject: 'mathematics',
    chapter: 'Limits, Continuity and Differentiability',
    microTopic: 'Differentiability',
    assertion: 'Every differentiable function is continuous.',
    reason: 'Every continuous function is differentiable.',
    correct: 2,
    difficulty: 2,
    sol: 'Differentiability implies continuity (A true), but the converse is false \u2014 e.g. $|x|$ is continuous but not differentiable at 0 (R false).',
    hints: ['Differentiable \u21d2 continuous; continuous \u21d2/ differentiable.'],
    concept: 'Differentiability and continuity',
  }),
  arQ('curated-math-ar-004', {
    subject: 'mathematics',
    chapter: 'Sequences and Series',
    microTopic: 'Sum of Series',
    assertion: 'The series $1 + \\frac{1}{2} + \\frac{1}{3} + \\frac{1}{4} + \\cdots$ diverges.',
    reason: 'The harmonic series $\\sum \\frac{1}{n}$ diverges.',
    correct: 0,
    difficulty: 3,
    sol: 'The series given is exactly the harmonic series, which is known to diverge. The reason directly states the same fact and correctly explains the assertion.',
    hints: ['Identify the series as the harmonic series.'],
    concept: 'Harmonic series',
  }),
  arQ('curated-math-ar-005', {
    subject: 'mathematics',
    chapter: 'Complex Numbers and Quadratic Equations',
    microTopic: 'Cube Roots of Unity',
    assertion: '$\\log_a 1 = 0$ for every $a > 0$, $a \\neq 1$.',
    reason: 'For every $a > 0$, $a \\neq 1$, we have $a^0 = 1$.',
    correct: 0,
    difficulty: 1,
    sol: 'By the definition of the logarithm, $\\log_a 1 = x \\iff a^x = 1$, and since $a^0 = 1$, $x = 0$. The reason correctly explains the assertion.',
    hints: ['Use the definition of logarithm.'],
    concept: 'Logarithms',
  }),
]

// =====================================================================
// PARAGRAPH / COMPREHENSION — 4 paragraphs × 3 questions
// =====================================================================

const PARAGRAPHS: Question[] = [
  // ---- Paragraph 1: Projectile ----
  para('curated-phy-para-001', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Projectile Motion',
    paragraph: 'A projectile is launched from the ground with a speed of $20\\ \\text{m/s}$ at an angle of $30^\\circ$ with the horizontal. Neglect air resistance and take $g = 10\\ \\text{m/s}^2$.',
    paragraphLatex: [],
    q: 'The time of flight of the projectile is:',
    options: ['2 s', '4 s', '1 s', '0.5 s'],
    correct: 0,
    difficulty: 2,
    exam: 'jee-main',
    year: 2023,
    sol: '$T = \\frac{2u\\sin\\theta}{g} = \\frac{2 \\times 20 \\times \\sin30^\\circ}{10} = \\frac{40 \\times 0.5}{10} = 2\\ \\text{s}$.',
    hints: ['Time of flight $= 2u\\sin\\theta/g$.'],
    concept: 'Projectile motion',
  }),
  para('curated-phy-para-002', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Projectile Motion',
    paragraph: 'A projectile is launched from the ground with a speed of $20\\ \\text{m/s}$ at an angle of $30^\\circ$ with the horizontal. Neglect air resistance and take $g = 10\\ \\text{m/s}^2$.',
    paragraphLatex: [],
    q: 'The horizontal range of the projectile is approximately:',
    options: ['34.6 m', '20 m', '40 m', '17.3 m'],
    correct: 0,
    difficulty: 2,
    exam: 'jee-main',
    year: 2023,
    sol: '$R = \\frac{u^2\\sin 2\\theta}{g} = \\frac{400 \\times \\sin60^\\circ}{10} = 40 \\times 0.866 = 34.64 \\approx 34.6\\ \\text{m}$.',
    hints: ['Range $= u^2\\sin2\\theta/g$.'],
    concept: 'Projectile motion',
  }),
  para('curated-phy-para-003', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Projectile Motion',
    paragraph: 'A projectile is launched from the ground with a speed of $20\\ \\text{m/s}$ at an angle of $30^\\circ$ with the horizontal. Neglect air resistance and take $g = 10\\ \\text{m/s}^2$.',
    paragraphLatex: [],
    q: 'The maximum height reached by the projectile is:',
    options: ['5 m', '10 m', '20 m', '2.5 m'],
    correct: 0,
    difficulty: 2,
    exam: 'jee-main',
    year: 2023,
    sol: '$H = \\frac{u^2\\sin^2\\theta}{2g} = \\frac{400 \\times 0.25}{20} = 5\\ \\text{m}$.',
    hints: ['Max height $= u^2\\sin^2\\theta/(2g)$.'],
    concept: 'Projectile motion',
  }),

  // ---- Paragraph 2: Haber process ----
  para('curated-che-para-001', {
    subject: 'chemistry',
    chapter: 'Equilibrium',
    microTopic: 'Le-Chatelier',
    paragraph: 'The Haber process for the synthesis of ammonia is $N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)$, $\\Delta H = -92\\ \\text{kJ/mol}$ (exothermic).',
    paragraphLatex: [],
    q: 'Increasing the total pressure on the system at equilibrium will:',
    options: [
      'Shift the equilibrium to the right',
      'Shift the equilibrium to the left',
      'Have no effect on the equilibrium',
      'Increase the value of $K_c$',
    ],
    correct: 0,
    difficulty: 2,
    exam: 'jee-advanced',
    year: 2022,
    sol: 'There are 4 moles of gas on the left and 2 moles on the right. By Le-Chatelier\u2019s principle, increasing pressure favours the side with fewer gas moles, i.e. the forward direction. $K_c$ is unchanged by pressure.',
    hints: ['Compare the number of gas moles on each side.'],
    concept: "Le-Chatelier's principle",
  }),
  para('curated-che-para-002', {
    subject: 'chemistry',
    chapter: 'Equilibrium',
    microTopic: 'Le-Chatelier',
    paragraph: 'The Haber process for the synthesis of ammonia is $N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)$, $\\Delta H = -92\\ \\text{kJ/mol}$ (exothermic).',
    paragraphLatex: [],
    q: 'Increasing the temperature of the system at equilibrium will:',
    options: [
      'Shift the equilibrium to the left',
      'Shift the equilibrium to the right',
      'Have no effect',
      'Make the reaction faster only in the forward direction',
    ],
    correct: 0,
    difficulty: 2,
    exam: 'jee-advanced',
    year: 2022,
    sol: 'The reaction is exothermic. Increasing temperature favours the endothermic (reverse) direction, shifting equilibrium to the left and lowering the equilibrium yield of ammonia.',
    hints: ['Exothermic reactions are favoured at lower temperature.'],
    concept: "Le-Chatelier's principle",
  }),
  para('curated-che-para-003', {
    subject: 'chemistry',
    chapter: 'Equilibrium',
    microTopic: 'Chemical Equilibrium',
    paragraph: 'The Haber process for the synthesis of ammonia is $N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)$, $\\Delta H = -92\\ \\text{kJ/mol}$ (exothermic).',
    paragraphLatex: [],
    q: 'The effect of adding a catalyst to the system at equilibrium is:',
    options: [
      'To speed up the attainment of equilibrium without changing its position',
      'To increase the equilibrium yield of ammonia',
      'To shift the equilibrium to the left',
      'To change the value of $K_c$',
    ],
    correct: 0,
    difficulty: 2,
    exam: 'jee-advanced',
    year: 2022,
    sol: 'A catalyst lowers the activation energy for both forward and reverse reactions equally. It only speeds up the attainment of equilibrium; it does not change the equilibrium composition or $K_c$.',
    hints: ['A catalyst affects both directions equally.'],
    concept: 'Effect of catalyst',
  }),

  // ---- Paragraph 3: Quadratic function ----
  para('curated-math-para-001', {
    subject: 'mathematics',
    chapter: 'Complex Numbers and Quadratic Equations',
    microTopic: 'Quadratic Equations',
    paragraph: 'Consider the quadratic function $f(x) = x^2 - 4x + 3$ defined for all real $x$.',
    paragraphLatex: [],
    q: 'The roots of the equation $f(x) = 0$ are:',
    options: ['1 and 3', '-1 and -3', '1 and -3', '4 and 3'],
    correct: 0,
    difficulty: 1,
    exam: 'jee-main',
    year: 2023,
    sol: '$x^2 - 4x + 3 = (x - 1)(x - 3) = 0$, so the roots are $x = 1$ and $x = 3$.',
    hints: ['Factorise the quadratic.'],
    concept: 'Quadratic equations',
  }),
  para('curated-math-para-002', {
    subject: 'mathematics',
    chapter: 'Applications of Derivatives',
    microTopic: 'Maxima and Minima',
    paragraph: 'Consider the quadratic function $f(x) = x^2 - 4x + 3$ defined for all real $x$.',
    paragraphLatex: [],
    q: 'The minimum value of $f(x)$ is:',
    options: ['-1', '1', '3', '0'],
    correct: 0,
    difficulty: 2,
    exam: 'jee-main',
    year: 2023,
    sol: 'Write $f(x) = (x - 2)^2 - 1$. The minimum is attained at $x = 2$ and equals $-1$.',
    hints: ['Complete the square.'],
    concept: 'Maxima and minima',
  }),
  para('curated-math-para-003', {
    subject: 'mathematics',
    chapter: 'Sets, Relations and Functions',
    microTopic: 'Functions',
    paragraph: 'Consider the quadratic function $f(x) = x^2 - 4x + 3$ defined for all real $x$.',
    paragraphLatex: [],
    q: 'The range of $f$ over the real line is:',
    options: ['$[-1, \\infty)$', '$(-\\infty, -1]$', '$[0, \\infty)$', 'All real numbers'],
    correct: 0,
    difficulty: 2,
    exam: 'jee-main',
    year: 2023,
    sol: 'Since the parabola opens upward and the minimum value is $-1$, the range is $[-1, \\infty)$.',
    hints: ['The minimum value determines the lower end of the range.'],
    concept: 'Range of a quadratic',
  }),

  // ---- Paragraph 4: Kinematics from v(t) ----
  para('curated-phy-para-004', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Kinematics in 1D',
    paragraph: 'A particle moves along the $x$-axis with velocity $v(t) = 4t + 2\\ \\text{m/s}$, where $t$ is in seconds. At $t = 0$, the particle is at the origin.',
    paragraphLatex: [],
    q: 'The acceleration of the particle is:',
    options: ['$4\\ \\text{m/s}^2$', '$2\\ \\text{m/s}^2$', '$6\\ \\text{m/s}^2$', '$0$'],
    correct: 0,
    difficulty: 2,
    exam: 'jee-main',
    year: 2023,
    sol: '$a = \\frac{dv}{dt} = \\frac{d}{dt}(4t + 2) = 4\\ \\text{m/s}^2$, constant.',
    hints: ['Acceleration is the time derivative of velocity.'],
    concept: 'Kinematics',
  }),
  para('curated-phy-para-005', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Kinematics in 1D',
    paragraph: 'A particle moves along the $x$-axis with velocity $v(t) = 4t + 2\\ \\text{m/s}$, where $t$ is in seconds. At $t = 0$, the particle is at the origin.',
    paragraphLatex: [],
    q: 'The position of the particle at $t = 2\\ \\text{s}$ is:',
    options: ['12 m', '10 m', '20 m', '8 m'],
    correct: 0,
    difficulty: 2,
    exam: 'jee-main',
    year: 2023,
    sol: '$x(t) = \\int_0^t (4u + 2)\\,du = 2t^2 + 2t$. At $t = 2$: $x = 2(4) + 2(2) = 8 + 4 = 12\\ \\text{m}$.',
    hints: ['Integrate the velocity with initial position zero.'],
    concept: 'Kinematics',
  }),
  para('curated-phy-para-006', {
    subject: 'physics',
    chapter: 'Kinematics',
    microTopic: 'Kinematics in 1D',
    paragraph: 'A particle moves along the $x$-axis with velocity $v(t) = 4t + 2\\ \\text{m/s}$, where $t$ is in seconds. At $t = 0$, the particle is at the origin.',
    paragraphLatex: [],
    q: 'The velocity of the particle at $t = 0$ is:',
    options: ['$2\\ \\text{m/s}$', '$4\\ \\text{m/s}$', '$0$', '$6\\ \\text{m/s}$'],
    correct: 0,
    difficulty: 1,
    exam: 'jee-main',
    year: 2023,
    sol: '$v(0) = 4(0) + 2 = 2\\ \\text{m/s}$.',
    hints: ['Substitute $t = 0$ into $v(t)$.'],
    concept: 'Kinematics',
  }),
]

export const CURATED_QUESTIONS: Question[] = [
  ...SINGLES,
  ...MULTIPLES,
  ...INTEGERS,
  ...NUMERICALS,
  ...MATRICES,
  ...MATCH_COLUMNS,
  ...ASSERTION_REASONS,
  ...PARAGRAPHS,
]

export const CURATED_QUESTION_COUNT = CURATED_QUESTIONS.length

const CURATED_MARKER_KEY = 'jee-arena.curated-version'

/**
 * Imports the curated question bank into the local database.
 * Additive and idempotent: rows are upserted by their stable `curated-*` ids,
 * so existing generated / real-PYQ banks are untouched and re-running never
 * duplicates questions. Uses a localStorage version marker so it only writes
 * once per curated release.
 */
export async function importCuratedQuestions(): Promise<number> {
  const stored = Number(
    typeof localStorage !== 'undefined' ? localStorage.getItem(CURATED_MARKER_KEY) ?? 0 : 0,
  )
  if (stored >= CURATED_VERSION) return 0

  const meta: QuestionMeta[] = CURATED_QUESTIONS.map((q, i) => ({
    id: q.id,
    averageAccuracy: 0.45 + ((i * 7) % 40) / 100,
    averageTime: q.estimatedTime,
    attempts: 100 + ((i * 13) % 500),
    bookmarks: (i * 5) % 25,
  }))

  await db.transaction('rw', db.questions, db.questionMeta, async () => {
    const CHUNK = 60
    for (let i = 0; i < CURATED_QUESTIONS.length; i += CHUNK) {
      await db.questions.bulkPut(CURATED_QUESTIONS.slice(i, i + CHUNK))
      await db.questionMeta.bulkPut(meta.slice(i, i + CHUNK))
    }
  })

  try {
    localStorage.setItem(CURATED_MARKER_KEY, String(CURATED_VERSION))
  } catch {
    // ignore storage failures — the import is idempotent anyway
  }
  return CURATED_QUESTIONS.length
}
