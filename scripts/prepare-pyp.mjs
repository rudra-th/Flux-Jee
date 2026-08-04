/**
 * Converts the eQOURSE JEE question datasets (JSONL) into the app's Question
 * schema, writing a single JSON file to `public/data/jee-pyp.json`.
 *
 * Sources (CC BY 4.0):
 *   - eQOURSE/jee-main-questions    https://huggingface.co/datasets/eQOURSE/jee-main-questions
 *   - eQOURSE/jee-advanced-questions https://huggingface.co/datasets/eQOURSE/jee-advanced-questions
 *
 * Usage: node scripts/prepare-pyp.mjs [srcDir] [advSrcDir]
 *   srcDir    defaults to the local JEE Main jsonl mirror used during development.
 *   advSrcDir defaults to the local JEE Advanced jsonl mirror.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = process.argv[2] ?? 'C:\\Users\\Asus\\AppData\\Local\\Temp\\opencode\\jee-data\\hf'
const ADV_SRC_DIR = process.argv[3] ?? 'C:\\Users\\Asus\\AppData\\Local\\Temp\\opencode\\jee-data\\hf-adv'
const OUT_DIR = join(ROOT, 'public', 'data')
const OUT_FILE = join(OUT_DIR, 'jee-pyp.json')

const HF_BASE = 'https://huggingface.co/datasets/eQOURSE/jee-main-questions/resolve/main'
const ADV_HF_BASE = 'https://huggingface.co/datasets/eQOURSE/jee-advanced-questions/resolve/main'

const SUBJECT_ID = { Physics: 'physics', Chemistry: 'chemistry', Mathematics: 'mathematics' }

const DIFF_MAP = {
  easy: 1,
  moderate: 3,
  tough: 5,
}

const DIFF_LABEL = { 1: 'Easy', 3: 'Moderate', 5: 'Tough' }

// Dataset topic -> app syllabus chapter *name* (fallback: the topic itself)
const CHAPTER_MAP = {
  physics: {
    'Unit and dimension': 'Units and Measurements',
    'Units and Measurements': 'Units and Measurements',
    'Error analysis': 'Units and Measurements',
    Kinematics: 'Kinematics',
    'Motion in 1D': 'Kinematics',
    'Projectile Motion': 'Kinematics',
    'Relative motion': 'Kinematics',
    'Circular motion': 'Kinematics',
    Vector: 'Kinematics',
    "Newton's Laws of Motion": 'Laws of Motion',
    Mechanics: 'Kinematics',
    'Rigid Body Dynamics': 'Rotational Motion',
    'Rotational motion': 'Rotational Motion',
    'Center of mass': 'Centre of Mass and Collisions',
    'Centre of Mass': 'Centre of Mass and Collisions',
    Collision: 'Centre of Mass and Collisions',
    'System of particle': 'Centre of Mass and Collisions',
    'System of particles': 'Centre of Mass and Collisions',
    'Work Power & Energy': 'Work, Energy and Power',
    Gravitation: 'Gravitation',
    Elasticity: 'Properties of Solids and Fluids',
    'Mechanical properties of solid': 'Properties of Solids and Fluids',
    'Mechanical property of solids': 'Properties of Solids and Fluids',
    'Mechanical properties of matter': 'Properties of Solids and Fluids',
    'Mechanical Properties of Fluids': 'Properties of Solids and Fluids',
    'Mechanical properties of liquid': 'Properties of Solids and Fluids',
    'Behaviour of perfect gases': 'Thermal Properties and Thermodynamics',
    'Kinetic Theory of Gases': 'Thermal Properties and Thermodynamics',
    'Kinetic theory of gasses': 'Thermal Properties and Thermodynamics',
    Thermodynamics: 'Thermal Properties and Thermodynamics',
    Thermodynamic: 'Thermal Properties and Thermodynamics',
    'Isobaric process': 'Thermal Properties and Thermodynamics',
    'Thermal properties of matter': 'Thermal Properties and Thermodynamics',
    Heat: 'Thermal Properties and Thermodynamics',
    Oscillation: 'Oscillations',
    'Simple Harmonic Motion': 'Oscillations',
    Sound: 'Waves',
    'Sound wave': 'Waves',
    'Wave on a string': 'Waves',
    'Wave on string': 'Waves',
    Wave: 'Waves',
    Electrostatics: 'Electrostatics',
    Capacitance: 'Electrostatics',
    Capacitor: 'Electrostatics',
    'Current Electricity': 'Current Electricity',
    'Electric current': 'Current Electricity',
    Magnetism: 'Magnetic Effects of Current and Magnetism',
    Magnetics: 'Magnetic Effects of Current and Magnetism',
    Mangetism: 'Magnetic Effects of Current and Magnetism',
    'Magnetic effect of current': 'Magnetic Effects of Current and Magnetism',
    'Magnetic effects of current': 'Magnetic Effects of Current and Magnetism',
    'Moving charges and': 'Magnetic Effects of Current and Magnetism',
    'Moving charges and magnetism': 'Magnetic Effects of Current and Magnetism',
    'Electromagnetic induction': 'EMI and AC',
    EMI: 'EMI and AC',
    AC: 'EMI and AC',
    'AC circuit': 'EMI and AC',
    'EM wave': 'Electromagnetic Waves',
    'E-M waves': 'Electromagnetic Waves',
    'Ray Optics': 'Ray Optics',
    'Wave Optics': 'Wave Optics',
    'Dual Nature of Matter': 'Dual Nature of Matter and Radiation',
    'Modern physics': 'Dual Nature of Matter and Radiation',
    'Atomic Physics': 'Atoms and Nuclei',
    'Nuclear Physics': 'Atoms and Nuclei',
    Semiconductors: 'Semiconductors',
    'Electronic device': 'Semiconductors',
    'Electronic devices': 'Semiconductors',
    'Digital electronics': 'Semiconductors',
    'Communication system': 'Semiconductors',
  },
  chemistry: {
    'Atomic Structure': 'Structure of Atom',
    'Periodic table': 'Classification and Periodicity',
    'Chemical Bonding': 'Chemical Bonding',
    'Mole concept': 'Some Basic Concepts of Chemistry',
    'Equivalent Concept': 'Some Basic Concepts of Chemistry',
    'Ideal Gas': 'States of Matter',
    'Real Gas': 'States of Matter',
    Eudiometry: 'States of Matter',
    Electrochemistry: 'Redox Reactions',
    'Redox Reaction': 'Redox Reactions',
    'S-block': 's-Block Elements',
    'P-block': 'p-Block Elements',
    'P-block VA, VIA, VIIA elements': 'p-Block Elements',
    'Coordination Compounds': 'Coordination Compounds',
    'Alcohol, Phenol and Ethers': 'Alcohols, Phenols and Ethers',
    'Carbonyl Compound (Aldehyde and Ketone)': 'Aldehydes, Ketones and Acids',
    Halogen: 'Haloalkanes and Haloarenes',
    Hydrocarbon: 'Hydrocarbons',
    Isomerism: 'Organic Chemistry Basics',
    Stereoisomerism: 'Organic Chemistry Basics',
    'IUPAC and Structural Isomerism': 'Organic Chemistry Basics',
    'IUPAC Nomenclature': 'Organic Chemistry Basics',
    'IUPAC Nomenclature and Structural Isomerism': 'Organic Chemistry Basics',
    Amines: 'Amines',
  },
  mathematics: {
    Sets: 'Sets, Relations and Functions',
    Relation: 'Sets, Relations and Functions',
    Functions: 'Sets, Relations and Functions',
    'Special functions': 'Sets, Relations and Functions',
    Logarithm: 'Complex Numbers and Quadratic Equations',
    'Logarithm and its applications': 'Complex Numbers and Quadratic Equations',
    Inequalities: 'Complex Numbers and Quadratic Equations',
    'Inequalities and absolute value': 'Complex Numbers and Quadratic Equations',
    'Theory of Equations': 'Complex Numbers and Quadratic Equations',
    'Thoery of equation': 'Complex Numbers and Quadratic Equations',
    'Quadratic Equations': 'Complex Numbers and Quadratic Equations',
    'Quadratic Equation Nature of Roots': 'Complex Numbers and Quadratic Equations',
    'Complex Numbers': 'Complex Numbers and Quadratic Equations',
    Matrix: 'Matrices and Determinants',
    'Matrix and determinant': 'Matrices and Determinants',
    'Matrix and determinants': 'Matrices and Determinants',
    'Pemutation and combination': 'Permutations and Combinations',
    'Permutations and Combinations': 'Permutations and Combinations',
    'Binomial Theorem': 'Binomial Theorem',
    'Sequence & Series': 'Sequences and Series',
    'Sequences and Series': 'Sequences and Series',
    'Series and progressions': 'Sequences and Series',
    Limits: 'Limits, Continuity and Differentiability',
    Limit: 'Limits, Continuity and Differentiability',
    'Limits, continuity and derivability': 'Limits, Continuity and Differentiability',
    'Limits, continuity and differentiability': 'Limits, Continuity and Differentiability',
    'Continuity and derivability': 'Limits, Continuity and Differentiability',
    'Continuity and differentiability': 'Limits, Continuity and Differentiability',
    Differcntiation: 'Limits, Continuity and Differentiability',
    Differentiation: 'Limits, Continuity and Differentiability',
    'Application of derivative': 'Applications of Derivatives',
    'Application of derivatives': 'Applications of Derivatives',
    Monotonocity: 'Applications of Derivatives',
    'Definite Integration': 'Integral Calculus',
    'Indefinite integration': 'Integral Calculus',
    Integrals: 'Integral Calculus',
    Integration: 'Integral Calculus',
    'Area under curve': 'Integral Calculus',
    'Differential equation': 'Differential Equations',
    'Straight Lines': 'Coordinate Geometry',
    'Circle and parabola': 'Coordinate Geometry',
    Circles: 'Coordinate Geometry',
    'Conic Sections': 'Coordinate Geometry',
    Parabola: 'Coordinate Geometry',
    Ellipse: 'Coordinate Geometry',
    Hyperbola: 'Coordinate Geometry',
    '3D': 'Three Dimensional Geometry',
    'Three dimension': 'Three Dimensional Geometry',
    Vectors: 'Vector Algebra',
    Probability: 'Statistics and Probability',
    Statistics: 'Statistics and Probability',
    Trigonometry: 'Trigonometry',
    'Trigonometric ratio & equations': 'Trigonometry',
    'Trigonometric ratio and equation': 'Trigonometry',
    'Compound angles': 'Trigonometry',
    'Inverse Trigonometric functions': 'Trigonometry',
    ITF: 'Trigonometry',
    Triangles: 'Trigonometry',
    'Properties of triangle': 'Trigonometry',
    'Mathematical reasoning': 'Mathematical Reasoning',
    'Mathematical induction': 'Mathematical Reasoning',
    'Logical reasoning': 'Mathematical Reasoning',
  },
}

const CREATED_AT = new Date('2025-01-01T00:00:00Z').toISOString()

const clean = (s) => (s ?? '').trim()
const stripImages = (s) => (s ?? '').replace(/\[IMAGE\]/g, '').trim()
const imgUrl = (subject, path) => `${HF_BASE}/${subject}/${path}`

function difficultyToLevel(raw) {
  const v = clean(raw).toLowerCase()
  for (const key of Object.keys(DIFF_MAP)) {
    if (v.includes(key)) return DIFF_MAP[key]
  }
  return 3
}

function yearFromPaper(paper) {
  const m = /(\d{4})/.exec(paper ?? '')
  if (m) return Number(m[1])
  return 2021
}

function makeAnswer(row) {
  if (row.question_type === 'numerical' && row.numerical_answer !== null && row.numerical_answer !== undefined) {
    const v = Number(row.numerical_answer)
    if (!Number.isFinite(v)) return null
    if (Number.isInteger(v)) {
      return { type: 'integer', correctValue: v, range: [v, v] }
    }
    return { type: 'numerical', correctValue: v, range: [v - 0.5, v + 0.5] }
  }
  const idx = Number(row.correct_option) - 1
  if (row.question_type === 'single_correct' && Number.isInteger(idx) && idx >= 0 && idx < 4) {
    return { type: 'single', correctIndex: idx }
  }
  return null
}

function makeOptions(row) {
  const out = []
  for (let i = 1; i <= 4; i++) {
    const text = clean(row[`option_${i}`])
    if (!text) continue
    out.push({ key: 'ABCD'[i - 1], text: stripImages(text) })
  }
  return out
}

function convert(row) {
  const subject = SUBJECT_ID[row.subject]
  if (!subject) return null
  const answer = makeAnswer(row)
  if (!answer) return null
  const type = answer.type === 'single' ? 'single' : 'integer'
  const difficulty = difficultyToLevel(row.difficulty)
  const topic = clean(row.topic)
  const subtopic = clean(row.subtopic)
  const chapter = CHAPTER_MAP[subject]?.[topic] ?? topic
  const microTopic = subtopic || topic || chapter
  const options = makeOptions(row)
  if (answer.type === 'single' && options.length < 2) return null

  const qImages = (row.question_images ?? []).filter(Boolean).map((p) => imgUrl(row.subject.toLowerCase(), p))
  const sImages = (row.solution_images ?? []).filter(Boolean).map((p) => imgUrl(row.subject.toLowerCase(), p))

  const solutionText = stripImages(row.solution)
  const detailed = solutionText || (sImages.length ? 'Refer to the diagram below.' : '')

  return {
    id: `pyq-${row.question_id}`,
    exam: 'jee-main',
    year: yearFromPaper(row.source_paper),
    paper: 'session-1',
    subject,
    chapter,
    microTopic,
    difficulty,
    estimatedTime: Math.round((answer.type === 'single' ? 60 : 90) + difficulty * 20),
    type,
    content: {
      text: stripImages(row.question).replace(/\s*\n\s*/g, ' '),
      ...(qImages[0] ? { image: qImages[0] } : {}),
    },
    options,
    answer,
    solution: {
      detailed,
      hints: [topic || subtopic || 'Solve using standard concepts'],
      ...(subtopic ? { concept: subtopic } : { concept: topic }),
      ...(sImages.length ? { images: sImages } : {}),
    },
    tags: [topic, subtopic, DIFF_LABEL[difficulty]].filter(Boolean),
    createdAt: CREATED_AT,
  }
}

// JEE Advanced dataset topic -> app syllabus chapter *name* (fallback: the topic itself)
const CHAPTER_MAP_ADV = {
  chemistry: {
    'Coordination Compounds': 'Coordination Compounds',
    'Solid State': 'States of Matter',
    'Chemical Thermodynamics': 'Chemical Thermodynamics',
    Electrochemistry: 'Redox Reactions',
    Stoichiometry: 'Some Basic Concepts of Chemistry',
    'Chemical Equilibrium': 'Equilibrium',
    'Ionic Equilibrium': 'Equilibrium',
    'Atomic Structure': 'Structure of Atom',
  },
  mathematics: {
    Circles: 'Coordinate Geometry',
    Hyperbola: 'Coordinate Geometry',
    'Complex Numbers': 'Complex Numbers and Quadratic Equations',
    Probability: 'Statistics and Probability',
    'Definite Integration': 'Integral Calculus',
    Trigonometry: 'Trigonometry',
    Limits: 'Limits, Continuity and Differentiability',
    'Differential Calculus': 'Limits, Continuity and Differentiability',
    'Permutations and Combinations': 'Permutations and Combinations',
    Vectors: 'Vector Algebra',
  },
  physics: {
    Optics: 'Ray Optics',
  },
}

/**
 * Extract a numeric answer from the Advanced dataset's free-text answer field.
 * Only clean scalar values survive (integers, decimals, optional parentheses,
 * LaTeX wrapping or trailing backslash continuations). Anything carrying a
 * unit or formula is rejected so we never grade a question with a guessed key.
 */
function numericFromAnswer(raw) {
  if (raw === null || raw === undefined) return null
  let s = String(raw).trim()
  if (!s) return null
  // Drop parenthetical groups that hold no digits (e.g. "(zero)").
  s = s.replace(/\([^0-9.\-]*\)/g, '')
  // Strip LaTeX markers, backslash continuations, hashes, parens, whitespace.
  s = s.replace(/[$\\()#\s]/g, '')
  // Strip leading stray list punctuation (e.g. ". 2520.00").
  s = s.replace(/^[.,:]+/, '')
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const v = Number(s)
  return Number.isFinite(v) ? v : null
}

function convertAdvanced(row) {
  const subject = SUBJECT_ID[row.subject]
  if (!subject) return null
  const value = numericFromAnswer(row.answer)
  if (value === null) return null

  const topic = clean(row.topic)
  const chapter = CHAPTER_MAP_ADV[subject]?.[topic] ?? topic
  const microTopic = topic || chapter

  const qImages = (row.question_images ?? []).filter(Boolean).map((p) => `${ADV_HF_BASE}/${row.subject.toLowerCase()}/${p}`)
  const sImages = (row.solution_images ?? []).filter(Boolean).map((p) => `${ADV_HF_BASE}/${row.subject.toLowerCase()}/${p}`)

  const isInt = Number.isInteger(value)
  const type = isInt ? 'integer' : 'numerical'
  const difficulty = 5
  const answer =
    type === 'integer'
      ? { type: 'integer', correctValue: value, range: [value, value] }
      : { type: 'numerical', correctValue: value, range: [value - 0.5, value + 0.5] }

  const solutionText = stripImages(row.solution)
  const detailed = solutionText || (sImages.length ? 'Refer to the diagram below.' : '')

  return {
    id: `pyq-${row.question_id}`,
    exam: 'jee-advanced',
    year: 2021,
    paper: 'paper-1',
    subject,
    chapter,
    microTopic,
    difficulty,
    estimatedTime: Math.round((isInt ? 90 : 120) + difficulty * 20),
    type,
    content: {
      text: stripImages(row.question).replace(/\s*\n\s*/g, ' '),
      ...(qImages[0] ? { image: qImages[0] } : {}),
    },
    options: [],
    answer,
    solution: {
      detailed,
      hints: [topic || 'Solve using standard concepts'],
      concept: topic,
      ...(sImages.length ? { images: sImages } : {}),
    },
    tags: [topic, 'Advanced', 'Hard'].filter(Boolean),
    createdAt: CREATED_AT,
  }
}

function main() {
  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.jsonl'))
  if (!files.length) {
    console.error(`No jsonl files found in ${SRC_DIR}`)
    process.exit(1)
  }

  const rows = []
  for (const f of files) {
    for (const line of readFileSync(join(SRC_DIR, f), 'utf8').split(/\r?\n/)) {
      const t = line.trim()
      if (!t) continue
      rows.push(JSON.parse(t))
    }
  }

  const out = []
  const skipped = { single: 0, numerical: 0 }
  let chapterMatched = 0
  let chapterUnmatched = 0
  for (const row of rows) {
    const q = convert(row)
    if (q) {
      out.push(q)
      const topic = clean(row.topic)
      if (CHAPTER_MAP[q.subject]?.[topic]) chapterMatched++
      else chapterUnmatched++
    } else {
      skipped[row.question_type] = (skipped[row.question_type] ?? 0) + 1
    }
  }

  // JEE Advanced: include only questions with a clean numeric answer.
  const advDirOk = existsSync(ADV_SRC_DIR)
  let advRows = []
  if (advDirOk) {
    const files = readdirSync(ADV_SRC_DIR).filter((f) => f.endsWith('.jsonl'))
    for (const f of files) {
      for (const line of readFileSync(join(ADV_SRC_DIR, f), 'utf8').split(/\r?\n/)) {
        const t = line.trim()
        if (!t) continue
        advRows.push(JSON.parse(t))
      }
    }
  }
  let advConverted = 0
  const advSkipped = { nonNumeric: 0, other: 0 }
  for (const row of advRows) {
    const q = convertAdvanced(row)
    if (q) {
      out.push(q)
      advConverted++
    } else if (row.subject) {
      advSkipped.nonNumeric++
    } else {
      advSkipped.other++
    }
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(out), 'utf8')

  const bySubject = {}
  const byType = {}
  for (const q of out) {
    bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1
    byType[q.type] = (byType[q.type] ?? 0) + 1
  }

  console.log(`Rows parsed: ${rows.length}`)
  console.log(`Converted:   ${out.length}`)
  console.log(`Skipped:     ${JSON.stringify(skipped)}`)
  console.log(`By subject:  ${JSON.stringify(bySubject)}`)
  console.log(`By type:     ${JSON.stringify(byType)}`)
  console.log(`Chapter mapped: ${chapterMatched}, unmapped: ${chapterUnmatched}`)
  if (advDirOk) {
    console.log(`Advanced rows parsed: ${advRows.length}`)
    console.log(`Advanced converted:   ${advConverted}`)
    console.log(`Advanced skipped:     ${JSON.stringify(advSkipped)}`)
  }
  console.log(`File:        ${OUT_FILE} (${(JSON.stringify(out).length / 1024 / 1024).toFixed(2)} MB)`)
}

main()
