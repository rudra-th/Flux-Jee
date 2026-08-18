import type { MockTestEntry, MockTestSeriesConfig } from '@/types/mockTest'

/**
 * JEE Main Mock Test Series
 * 20 tests: 10 Minor + 4 Semi Major + 6 Major
 * Format: 75Q (25 Phy + 25 Chem + 25 Math), 3 hours, MCQ + Integer
 * All questions filtered to difficulty 4-5 ("high level handpicked")
 */
const JEE_MAIN_SERIES: MockTestSeriesConfig = {
  id: 'main-series',
  name: 'JEE Main Mock Series',
  description: 'High-level handpicked questions in exact NTA format. 20 tests covering your entire syllabus.',
  series: 'main',
  tests: [
    // Minor Tests
    {
      id: 'main-minor-1',
      name: 'Minor Test 1',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-08-09',
      chapters: {
        physics: ['Units and Measurements', 'Vector'],
        chemistry: ['Basic Mole Concept', 'Atomic Structure'],
        mathematics: ['Fundamentals of Algebra'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-2',
      name: 'Minor Test 2',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-08-16',
      chapters: {
        physics: ['Kinematics'],
        chemistry: ['Atomic Structure', 'Periodic Table'],
        mathematics: ['Quadratic Equation', 'Set Theory and Number System'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-3',
      name: 'Minor Test 3',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-08-30',
      chapters: {
        physics: ["Newton's Laws of Motion & Friction"],
        chemistry: ['Chemical Bonding'],
        mathematics: ['Logarithm', 'Sequence and Progression'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-4',
      name: 'Minor Test 4',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-09-20',
      chapters: {
        physics: ['Circular Motion'],
        chemistry: ['Stoichiometry, Eudiometry and Redox Reactions'],
        mathematics: ['Trigonometric Ratios and Identities', 'Trigonometric Equation', 'Solution of Triangle'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-5',
      name: 'Minor Test 5',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-10-04',
      chapters: {
        physics: ['Work Energy & Power'],
        chemistry: ['Thermodynamics-I (First Law)', 'Thermochemistry', 'Thermodynamics-II (Second and Third Law)'],
        mathematics: ['Permutation and Combination'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-6',
      name: 'Minor Test 6',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-10-25',
      chapters: {
        physics: ['Centre of Mass'],
        chemistry: ['Equilibrium-I (Chemical Equilibrium)', 'Equilibrium-II (Ionic Equilibrium)'],
        mathematics: ['Binomial Theorem'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-7',
      name: 'Minor Test 7',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-11-15',
      chapters: {
        physics: ['Rotational Motion'],
        chemistry: ['IUPAC Nomenclature and Common Names', 'Electronic Displacement Effects (GOC)'],
        mathematics: ['Straight Line and Linear Inequality'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-8',
      name: 'Minor Test 8',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-11-22',
      chapters: {
        physics: ['Simple Harmonic Motion'],
        chemistry: ['Electronic Displacement Effects (GOC)', 'Structural Isomerism, Geometrical Isomerism and Conformations'],
        mathematics: ['Circle'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-9',
      name: 'Minor Test 9',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-12-13',
      chapters: {
        physics: ['Fluid Mechanics'],
        chemistry: ['Structural Isomerism, Geometrical Isomerism and Conformations', 'Optical Isomerism'],
        mathematics: ['Parabola', 'Ellipse'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },
    {
      id: 'main-minor-10',
      name: 'Minor Test 10',
      series: 'main',
      type: 'minor',
      recommendedDate: '2026-12-27',
      chapters: {
        physics: ['Heat & Thermodynamics'],
        chemistry: ['Hydrocarbons'],
        mathematics: ['Hyperbola', 'Statistics'],
      },
      questionCount: 30,
      durationMinutes: 60,
      format: 'main',
    },

    // Semi Major Tests
    {
      id: 'main-semi-1',
      name: 'Semi Major Test 1',
      series: 'main',
      type: 'semi-major',
      recommendedDate: '2026-09-06',
      chapters: {
        physics: ['Units and Measurements', 'Vector', 'Kinematics', "Newton's Laws of Motion & Friction"],
        chemistry: ['Basic Mole Concept', 'Atomic Structure', 'Periodic Table', 'Chemical Bonding'],
        mathematics: ['Fundamentals of Algebra', 'Quadratic Equation', 'Set Theory and Number System', 'Logarithm', 'Sequence and Progression'],
      },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
    {
      id: 'main-semi-2',
      name: 'Semi Major Test 2',
      series: 'main',
      type: 'semi-major',
      recommendedDate: '2026-10-11',
      chapters: {
        physics: ['Units and Measurements', 'Vector', 'Kinematics', "Newton's Laws of Motion & Friction", 'Circular Motion', 'Work Energy & Power'],
        chemistry: ['Basic Mole Concept', 'Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'Hydrocarbons', 'Stoichiometry, Eudiometry and Redox Reactions', 'Thermodynamics-I (First Law)', 'Thermochemistry', 'Thermodynamics-II (Second and Third Law)'],
        mathematics: ['Fundamentals of Algebra', 'Quadratic Equation', 'Set Theory and Number System', 'Logarithm', 'Sequence and Progression', 'Trigonometric Ratios and Identities', 'Trigonometric Equation', 'Solution of Triangle', 'Permutation and Combination'],
      },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
    {
      id: 'main-semi-3',
      name: 'Semi Major Test 3',
      series: 'main',
      type: 'semi-major',
      recommendedDate: '2026-11-29',
      chapters: {
        physics: ['Centre of Mass', 'Rotational Motion', 'Simple Harmonic Motion'],
        chemistry: ['Equilibrium-I (Chemical Equilibrium)', 'Equilibrium-II (Ionic Equilibrium)', 'IUPAC Nomenclature and Common Names', 'Electronic Displacement Effects (GOC)', 'Structural Isomerism, Geometrical Isomerism and Conformations'],
        mathematics: ['Binomial Theorem', 'Straight Line and Linear Inequality', 'Circle'],
      },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
    {
      id: 'main-semi-4',
      name: 'Semi Major Test 4',
      series: 'main',
      type: 'semi-major',
      recommendedDate: '2027-01-03',
      chapters: {
        physics: ['Centre of Mass', 'Rotational Motion', 'Simple Harmonic Motion', 'Fluid Mechanics', 'Heat & Thermodynamics'],
        chemistry: ['Equilibrium-I (Chemical Equilibrium)', 'Equilibrium-II (Ionic Equilibrium)', 'IUPAC Nomenclature and Common Names', 'Electronic Displacement Effects (GOC)', 'Structural Isomerism, Geometrical Isomerism and Conformations', 'Optical Isomerism', 'Hydrocarbons'],
        mathematics: ['Binomial Theorem', 'Straight Line and Linear Inequality', 'Circle', 'Parabola', 'Ellipse', 'Hyperbola', 'Statistics'],
      },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },

    // Major Tests (Full Syllabus)
    {
      id: 'main-major-1',
      name: 'Major Test 1',
      series: 'main',
      type: 'major',
      recommendedDate: '2027-01-10',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
    {
      id: 'main-major-2',
      name: 'Major Test 2',
      series: 'main',
      type: 'major',
      recommendedDate: '2027-01-17',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
    {
      id: 'main-major-3',
      name: 'Major Test 3',
      series: 'main',
      type: 'major',
      recommendedDate: '2027-01-24',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
    {
      id: 'main-major-4',
      name: 'Major Test 4',
      series: 'main',
      type: 'major',
      recommendedDate: '2027-01-31',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
    {
      id: 'main-major-5',
      name: 'Major Test 5',
      series: 'main',
      type: 'major',
      recommendedDate: '2027-02-07',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
    {
      id: 'main-major-6',
      name: 'Major Test 6',
      series: 'main',
      type: 'major',
      recommendedDate: '2027-02-14',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 75,
      durationMinutes: 180,
      format: 'main',
    },
  ],
}

/**
 * JEE Advanced Mock Test Series
 * 15 tests: 5 Sectional + 5 Partial Syllabus + 5 Full Syllabus
 * Format: MCQ + MSQ + Integer + Numerical + Matrix Match
 * All questions filtered to difficulty 4-5 ("extreme level, slightly above actual")
 */
const JEE_ADVANCED_SERIES: MockTestSeriesConfig = {
  id: 'advanced-series',
  name: 'JEE Advanced Mock Series',
  description: 'Extreme-level handpicked questions slightly above actual JEE Advanced. 15 tests to push your limits.',
  series: 'advanced',
  tests: [
    // Sectional Tests (per-subject)
    {
      id: 'adv-sectional-1',
      name: 'Physics Sectional Test',
      series: 'advanced',
      type: 'minor',
      recommendedDate: '2026-09-15',
      chapters: {
        physics: ['Units and Measurements', 'Kinematics', "Newton's Laws of Motion & Friction", 'Work Energy & Power', 'Centre of Mass', 'Rotational Motion'],
        chemistry: [],
        mathematics: [],
      },
      questionCount: 20,
      durationMinutes: 60,
      format: 'advanced',
    },
    {
      id: 'adv-sectional-2',
      name: 'Chemistry Sectional Test',
      series: 'advanced',
      type: 'minor',
      recommendedDate: '2026-09-22',
      chapters: {
        physics: [],
        chemistry: ['Basic Mole Concept', 'Atomic Structure', 'Chemical Bonding', 'Equilibrium-I (Chemical Equilibrium)', 'Equilibrium-II (Ionic Equilibrium)'],
        mathematics: [],
      },
      questionCount: 20,
      durationMinutes: 60,
      format: 'advanced',
    },
    {
      id: 'adv-sectional-3',
      name: 'Mathematics Sectional Test',
      series: 'advanced',
      type: 'minor',
      recommendedDate: '2026-09-29',
      chapters: {
        physics: [],
        chemistry: [],
        mathematics: ['Quadratic Equation', 'Sequence and Progression', 'Binomial Theorem', 'Permutation and Combination', 'Trigonometric Ratios and Identities'],
      },
      questionCount: 20,
      durationMinutes: 60,
      format: 'advanced',
    },
    {
      id: 'adv-sectional-4',
      name: 'Physics Advanced Sectional',
      series: 'advanced',
      type: 'minor',
      recommendedDate: '2026-10-20',
      chapters: {
        physics: ['Simple Harmonic Motion', 'Fluid Mechanics', 'Heat & Thermodynamics', 'Gravitation'],
        chemistry: [],
        mathematics: [],
      },
      questionCount: 20,
      durationMinutes: 60,
      format: 'advanced',
    },
    {
      id: 'adv-sectional-5',
      name: 'Organic Chemistry Sectional',
      series: 'advanced',
      type: 'minor',
      recommendedDate: '2026-11-10',
      chapters: {
        physics: [],
        chemistry: ['IUPAC Nomenclature and Common Names', 'Electronic Displacement Effects (GOC)', 'Structural Isomerism, Geometrical Isomerism and Conformations', 'Optical Isomerism'],
        mathematics: [],
      },
      questionCount: 20,
      durationMinutes: 60,
      format: 'advanced',
    },

    // Partial Syllabus Tests
    {
      id: 'adv-partial-1',
      name: 'Partial Syllabus Test 1',
      series: 'advanced',
      type: 'semi-major',
      recommendedDate: '2026-11-20',
      chapters: {
        physics: ['Units and Measurements', 'Kinematics', "Newton's Laws of Motion & Friction", 'Work Energy & Power', 'Circular Motion'],
        chemistry: ['Basic Mole Concept', 'Atomic Structure', 'Periodic Table', 'Chemical Bonding'],
        mathematics: ['Fundamentals of Algebra', 'Quadratic Equation', 'Sequence and Progression', 'Binomial Theorem'],
      },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
    {
      id: 'adv-partial-2',
      name: 'Partial Syllabus Test 2',
      series: 'advanced',
      type: 'semi-major',
      recommendedDate: '2026-12-05',
      chapters: {
        physics: ['Centre of Mass', 'Rotational Motion', 'Simple Harmonic Motion', 'Fluid Mechanics'],
        chemistry: ['Equilibrium-I (Chemical Equilibrium)', 'Equilibrium-II (Ionic Equilibrium)', 'Thermodynamics-I (First Law)', 'Thermochemistry'],
        mathematics: ['Straight Line and Linear Inequality', 'Circle', 'Trigonometric Ratios and Identities', 'Trigonometric Equation'],
      },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
    {
      id: 'adv-partial-3',
      name: 'Partial Syllabus Test 3',
      series: 'advanced',
      type: 'semi-major',
      recommendedDate: '2026-12-20',
      chapters: {
        physics: ['Heat & Thermodynamics', 'Gravitation', 'Electrostatics', 'Current Electricity'],
        chemistry: ['IUPAC Nomenclature and Common Names', 'Electronic Displacement Effects (GOC)', 'Hydrocarbons', 'Haloalkanes and Haloarenes'],
        mathematics: ['Parabola', 'Ellipse', 'Hyperbola', 'Permutation and Combination'],
      },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
    {
      id: 'adv-partial-4',
      name: 'Partial Syllabus Test 4',
      series: 'advanced',
      type: 'semi-major',
      recommendedDate: '2027-01-05',
      chapters: {
        physics: ['Electrostatics', 'Current Electricity', 'Magnetic Effects of Current and Magnetism', 'EMI and AC'],
        chemistry: ['Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Acids', 'Amines', 'Biomolecules'],
        mathematics: ['Limits, Continuity and Differentiability', 'Applications of Derivatives', 'Integral Calculus', 'Differential Equations'],
      },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
    {
      id: 'adv-partial-5',
      name: 'Partial Syllabus Test 5',
      series: 'advanced',
      type: 'semi-major',
      recommendedDate: '2027-01-12',
      chapters: {
        physics: ['Ray Optics', 'Wave Optics', 'Dual Nature of Matter and Radiation', 'Atoms and Nuclei'],
        chemistry: ['d and f-Block Elements', 'Coordination Compounds', 'Chemical Kinetics', 'Surface Chemistry'],
        mathematics: ['Three Dimensional Geometry', 'Vector Algebra', 'Statistics and Probability', 'Matrices and Determinants'],
      },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },

    // Full Syllabus Tests
    {
      id: 'adv-full-1',
      name: 'Full Syllabus Test 1',
      series: 'advanced',
      type: 'major',
      recommendedDate: '2027-01-19',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
    {
      id: 'adv-full-2',
      name: 'Full Syllabus Test 2',
      series: 'advanced',
      type: 'major',
      recommendedDate: '2027-01-26',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
    {
      id: 'adv-full-3',
      name: 'Full Syllabus Test 3',
      series: 'advanced',
      type: 'major',
      recommendedDate: '2027-02-02',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
    {
      id: 'adv-full-4',
      name: 'Full Syllabus Test 4',
      series: 'advanced',
      type: 'major',
      recommendedDate: '2027-02-09',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
    {
      id: 'adv-full-5',
      name: 'Full Syllabus Test 5',
      series: 'advanced',
      type: 'major',
      recommendedDate: '2027-02-16',
      chapters: { physics: [], chemistry: [], mathematics: [] },
      questionCount: 54,
      durationMinutes: 180,
      format: 'advanced',
    },
  ],
}

export const MOCK_TEST_SERIES: MockTestSeriesConfig[] = [
  JEE_MAIN_SERIES,
  JEE_ADVANCED_SERIES,
]

export function getMockTestById(testId: string): MockTestEntry | undefined {
  for (const series of MOCK_TEST_SERIES) {
    const found = series.tests.find((t) => t.id === testId)
    if (found) return found
  }
  return undefined
}

export function getSeriesById(seriesId: string): MockTestSeriesConfig | undefined {
  return MOCK_TEST_SERIES.find((s) => s.id === seriesId)
}

export function getTestsForSeries(series: 'main' | 'advanced'): MockTestEntry[] {
  const config = MOCK_TEST_SERIES.find((s) => s.series === series)
  return config?.tests ?? []
}

export function isFullSyllabus(test: MockTestEntry): boolean {
  return test.type === 'major' && test.chapters.physics.length === 0
}

export const MOCK_TEST_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  minor: { label: 'Minor', color: '#4f8cff' },
  'semi-major': { label: 'Semi Major', color: '#f5a524' },
  major: { label: 'Major', color: '#ef4444' },
}
