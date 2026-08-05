import type { SubjectId } from '@/types/core'

export interface MicroTopic {
  id: string
  name: string
}

export interface Chapter {
  id: string
  name: string
  /** Display number */
  order: number
  topics: MicroTopic[]
}

export interface Subject {
  id: SubjectId
  name: string
  short: string
  color: string
  chapters: Chapter[]
}

export const PHYSICS: Subject = {
  id: 'physics',
  name: 'Physics',
  short: 'Phy',
  color: '#4f8cff',
  chapters: [
    { id: 'phy-units', name: 'Units and Measurements', order: 1, topics: [
      { id: 'units', name: 'Units and Dimensions' },
      { id: 'dimensions', name: 'Dimensional Analysis' },
      { id: 'error-analysis', name: 'Error Analysis' },
      { id: 'significant-figures', name: 'Significant Figures' },
    ]},
    { id: 'phy-kinematics', name: 'Kinematics', order: 2, topics: [
      { id: 'vectors', name: 'Vectors' },
      { id: 'kinematics-1d', name: 'Kinematics in 1D' },
      { id: 'relative-motion', name: 'Relative Motion' },
      { id: 'projectile', name: 'Projectile Motion' },
      { id: 'river-boat', name: 'River-Boat Problems' },
    ]},
    { id: 'phy-lom', name: 'Laws of Motion', order: 3, topics: [
      { id: 'nlm', name: "Newton's Laws of Motion" },
      { id: 'pseudo-force', name: 'Pseudo Force' },
      { id: 'friction', name: 'Friction' },
      { id: 'pulley', name: 'Pulley Systems' },
      { id: 'inclined-plane', name: 'Inclined Plane' },
      { id: 'constraint-motion', name: 'Constraint Motion' },
    ]},
    { id: 'phy-wep', name: 'Work, Energy and Power', order: 4, topics: [
      { id: 'wpe', name: 'Work and Energy' },
      { id: 'power', name: 'Power' },
      { id: 'variable-force', name: 'Variable Force' },
      { id: 'momentum', name: 'Momentum' },
      { id: 'impulse', name: 'Impulse' },
    ]},
    { id: 'phy-com', name: 'Centre of Mass and Collisions', order: 5, topics: [
      { id: 'com', name: 'Centre of Mass' },
      { id: 'collision', name: 'Collisions' },
    ]},
    { id: 'phy-rotation', name: 'Rotational Motion', order: 6, topics: [
      { id: 'rotation', name: 'Rotational Kinematics' },
      { id: 'rolling', name: 'Rolling Motion' },
      { id: 'angular-momentum', name: 'Angular Momentum' },
      { id: 'moment-of-inertia', name: 'Moment of Inertia' },
    ]},
    { id: 'phy-gravitation', name: 'Gravitation', order: 7, topics: [
      { id: 'gravitation', name: 'Gravitation Law' },
      { id: 'satellites', name: 'Satellites and Orbits' },
      { id: 'escape-velocity', name: 'Escape Velocity' },
    ]},
    { id: 'phy-fluids', name: 'Properties of Solids and Fluids', order: 8, topics: [
      { id: 'fluids', name: 'Fluid Mechanics' },
      { id: 'surface-tension', name: 'Surface Tension' },
      { id: 'viscosity', name: 'Viscosity' },
      { id: 'elasticity', name: 'Elasticity' },
    ]},
    { id: 'phy-thermal', name: 'Thermal Properties and Thermodynamics', order: 9, topics: [
      { id: 'thermal-expansion', name: 'Thermal Expansion' },
      { id: 'ktg', name: 'Kinetic Theory of Gases' },
      { id: 'thermodynamics', name: 'Thermodynamics' },
      { id: 'heat-transfer', name: 'Heat Transfer' },
      { id: 'calorimetry', name: 'Calorimetry' },
    ]},
    { id: 'phy-oscillation', name: 'Oscillations', order: 10, topics: [
      { id: 'shm', name: 'Simple Harmonic Motion' },
      { id: 'pendulum', name: 'Pendulum' },
      { id: 'spring', name: 'Spring Systems' },
      { id: 'damped-oscillation', name: 'Damped Oscillation' },
      { id: 'forced-oscillation', name: 'Forced Oscillation' },
    ]},
    { id: 'phy-waves', name: 'Waves', order: 11, topics: [
      { id: 'wave-motion', name: 'Wave Motion' },
      { id: 'standing-waves', name: 'Standing Waves' },
      { id: 'doppler', name: 'Doppler Effect' },
      { id: 'beats', name: 'Beats' },
    ]},
    { id: 'phy-electrostatics', name: 'Electrostatics', order: 12, topics: [
      { id: 'electrostatics', name: 'Coulomb Law and Charges' },
      { id: 'electric-field', name: 'Electric Field' },
      { id: 'potential', name: 'Electric Potential' },
      { id: 'capacitance', name: 'Capacitance' },
      { id: 'gauss-law', name: "Gauss's Law" },
    ]},
    { id: 'phy-current', name: 'Current Electricity', order: 13, topics: [
      { id: 'current', name: 'Electric Current' },
      { id: 'kirchhoff', name: "Kirchhoff's Laws" },
      { id: 'bridge', name: 'Wheatstone Bridge' },
      { id: 'potentiometer', name: 'Potentiometer' },
      { id: 'resistivity', name: 'Resistance and Resistivity' },
    ]},
    { id: 'phy-magnetism', name: 'Magnetic Effects of Current and Magnetism', order: 14, topics: [
      { id: 'magnetism', name: 'Magnetism and Matter' },
      { id: 'moving-charge', name: 'Moving Charges and Magnetism' },
      { id: 'biot-savart', name: "Biot-Savart Law" },
      { id: 'amperes-law', name: "Ampere's Law" },
    ]},
    { id: 'phy-emi-ac', name: 'EMI and AC', order: 15, topics: [
      { id: 'emi', name: 'Electromagnetic Induction' },
      { id: 'ac', name: 'Alternating Current' },
      { id: 'inductance', name: 'Inductance' },
      { id: 'transformers', name: 'Transformers' },
    ]},
    { id: 'phy-emwaves', name: 'Electromagnetic Waves', order: 16, topics: [
      { id: 'em-waves', name: 'EM Waves Spectrum' },
    ]},
    { id: 'phy-ray-optics', name: 'Ray Optics', order: 17, topics: [
      { id: 'ray-optics', name: 'Reflection and Refraction' },
      { id: 'lens', name: 'Lenses' },
      { id: 'prism', name: 'Prism' },
      { id: 'optical-instruments', name: 'Optical Instruments' },
      { id: 'total-internal-reflection', name: 'Total Internal Reflection' },
    ]},
    { id: 'phy-wave-optics', name: 'Wave Optics', order: 18, topics: [
      { id: 'wave-optics', name: 'Interference' },
      { id: 'diffraction', name: 'Diffraction' },
      { id: 'polarisation', name: 'Polarisation' },
      { id: 'young-double-slit', name: "Young's Double Slit Experiment" },
    ]},
    { id: 'phy-dual-nature', name: 'Dual Nature of Matter and Radiation', order: 19, topics: [
      { id: 'photoelectric', name: 'Photoelectric Effect' },
      { id: 'de-broglie', name: 'de-Broglie Wavelength' },
      { id: 'radiation', name: 'Radiation' },
    ]},
    { id: 'phy-atoms-nuclei', name: 'Atoms and Nuclei', order: 20, topics: [
      { id: 'atoms', name: 'Atomic Models' },
      { id: 'nucleus', name: 'Nuclear Physics' },
      { id: 'bohr-model', name: 'Bohr Model' },
      { id: 'radioactivity', name: 'Radioactivity' },
    ]},
    { id: 'phy-semiconductors', name: 'Semiconductors', order: 21, topics: [
      { id: 'semiconductors', name: 'Semiconductor Devices' },
      { id: 'diodes', name: 'Diodes' },
      { id: 'logic-gates', name: 'Logic Gates' },
      { id: 'transistors', name: 'Transistors' },
    ]},
    { id: 'phy-experimental', name: 'Experimental Physics', order: 22, topics: [
      { id: 'experimental', name: 'Experiments and Instruments' },
    ]},
  ],
}

export const CHEMISTRY: Subject = {
  id: 'chemistry',
  name: 'Chemistry',
  short: 'Che',
  color: '#2fd87f',
  chapters: [
    { id: 'che-basic-concepts', name: 'Some Basic Concepts of Chemistry', order: 1, topics: [
      { id: 'mole-concept', name: 'Mole Concept' },
      { id: 'stoichiometry', name: 'Stoichiometry' },
      { id: 'equivalent-weight', name: 'Equivalent Weight' },
      { id: 'concentration', name: 'Concentration Terms' },
    ]},
    { id: 'che-atomic-structure', name: 'Structure of Atom', order: 2, topics: [
      { id: 'atomic-models', name: 'Atomic Models' },
      { id: 'quantum-numbers', name: 'Quantum Numbers' },
      { id: 'electronic-configuration', name: 'Electronic Configuration' },
      { id: 'de-broglie-uncertainty', name: 'de-Broglie and Uncertainty' },
      { id: 'photoelectric', name: 'Photoelectric Effect' },
    ]},
    { id: 'che-periodicity', name: 'Classification and Periodicity', order: 3, topics: [
      { id: 'periodic-table', name: 'Periodic Table' },
      { id: 'periodicity', name: 'Periodicity in Properties' },
      { id: 'ionisation-energy', name: 'Ionisation Energy' },
      { id: 'electronegativity', name: 'Electronegativity' },
      { id: 'atomic-radius', name: 'Atomic Radius' },
    ]},
    { id: 'che-bonding', name: 'Chemical Bonding', order: 4, topics: [
      { id: 'ionic-bond', name: 'Ionic Bonding' },
      { id: 'covalent-bond', name: 'Covalent Bonding' },
      { id: 'vsepr', name: 'VSEPR Theory' },
      { id: 'hybridisation', name: 'Hybridisation' },
      { id: 'molecular-orbital-theory', name: 'Molecular Orbital Theory' },
      { id: 'hydrogen-bonding', name: 'Hydrogen Bonding' },
      { id: 'resonance', name: 'Resonance' },
    ]},
    { id: 'che-states-matter', name: 'States of Matter', order: 5, topics: [
      { id: 'gaseous-state', name: 'Gaseous State' },
      { id: 'ideal-gas', name: 'Ideal Gas Equation' },
      { id: 'real-gas', name: 'Real Gases' },
      { id: 'liquids', name: 'Liquid State' },
    ]},
    { id: 'che-thermo', name: 'Chemical Thermodynamics', order: 6, topics: [
      { id: 'thermodynamics', name: 'Thermodynamic Terms' },
      { id: 'first-law', name: 'First Law of Thermodynamics' },
      { id: 'enthalpy', name: 'Enthalpy and Calorimetry' },
      { id: 'entropy', name: 'Entropy and Gibbs Energy' },
      { id: 'hess-law', name: "Hess's Law" },
      { id: 'bond-energies', name: 'Bond Enthalpies' },
    ]},
    { id: 'che-kinetics', name: 'Chemical Kinetics', order: 7, topics: [
      { id: 'rate-of-reaction', name: 'Rate of Reaction' },
      { id: 'rate-law', name: 'Rate Laws and Order' },
      { id: 'integrated-rate-laws', name: 'Integrated Rate Laws' },
      { id: 'arrhenius', name: 'Arrhenius Equation' },
      { id: 'half-life', name: 'Half-Life' },
    ]},
    { id: 'che-surface', name: 'Surface Chemistry', order: 8, topics: [
      { id: 'adsorption', name: 'Adsorption' },
      { id: 'catalysis', name: 'Catalysis' },
      { id: 'colloids', name: 'Colloids' },
      { id: 'emulsions', name: 'Emulsions' },
    ]},
    { id: 'che-salt-analysis', name: 'Salt Analysis', order: 9, topics: [
      { id: 'group-analysis', name: 'Group Analysis' },
      { id: 'dry-tests', name: 'Dry Tests' },
      { id: 'precipitation', name: 'Precipitation Reactions' },
    ]},
    { id: 'che-equilibrium', name: 'Equilibrium', order: 10, topics: [
      { id: 'chemical-equilibrium', name: 'Chemical Equilibrium' },
      { id: 'le-chatelier', name: "Le-Chatelier's Principle" },
      { id: 'ionic-equilibrium', name: 'Ionic Equilibrium' },
      { id: 'ph-buffer', name: 'pH and Buffer' },
      { id: 'solubility-product', name: 'Solubility Product' },
      { id: 'common-ion', name: 'Common Ion Effect' },
    ]},
    { id: 'che-redox', name: 'Redox Reactions', order: 11, topics: [
      { id: 'redox', name: 'Oxidation Number' },
      { id: 'balancing-redox', name: 'Balancing Redox Equations' },
      { id: 'electrochemical-cells', name: 'Electrochemical Cells' },
      { id: 'nernst-equation', name: 'Nernst Equation' },
      { id: 'faraday-laws', name: "Faraday's Laws" },
    ]},
    { id: 'che-hydrogen', name: 'Hydrogen', order: 12, topics: [
      { id: 'hydrogen', name: 'Hydrogen and Its Compounds' },
      { id: 'water', name: 'Water' },
      { id: 'h2o2', name: 'Hydrogen Peroxide' },
    ]},
    { id: 'che-sblock', name: 's-Block Elements', order: 13, topics: [
      { id: 'alkali-metals', name: 'Alkali Metals' },
      { id: 'alkaline-earth', name: 'Alkaline Earth Metals' },
      { id: 'sblock-compounds', name: 'Important Compounds' },
    ]},
    { id: 'che-pblock', name: 'p-Block Elements', order: 14, topics: [
      { id: 'boron-family', name: 'Boron Family' },
      { id: 'carbon-family', name: 'Carbon Family' },
      { id: 'nitrogen-family', name: 'Nitrogen Family' },
      { id: 'oxygen-family', name: 'Oxygen Family' },
      { id: 'halogens', name: 'Halogens' },
      { id: 'noble-gases', name: 'Noble Gases' },
    ]},
    { id: 'che-dfblock', name: 'd and f-Block Elements', order: 15, topics: [
      { id: 'transition-metals', name: 'Transition Metals' },
      { id: 'dblock-properties', name: 'Properties of d-Block' },
      { id: 'lanthanoids', name: 'Lanthanoids' },
      { id: 'actinoids', name: 'Actinoids' },
    ]},
    { id: 'che-coordination', name: 'Coordination Compounds', order: 16, topics: [
      { id: 'coordination-basics', name: 'Coordination Basics' },
      { id: 'werners-theory', name: "Werner's Theory" },
      { id: 'iupac-coordination', name: 'IUPAC Nomenclature' },
      { id: 'isomerism-coordination', name: 'Isomerism in Coordination' },
      { id: 'cft', name: 'Crystal Field Theory' },
      { id: 'vbt', name: 'Valence Bond Theory' },
    ]},
    { id: 'che-environmental', name: 'Environmental Chemistry', order: 17, topics: [
      { id: 'pollution', name: 'Pollution' },
      { id: 'greenhouse', name: 'Greenhouse Effect' },
      { id: 'water-treatment', name: 'Water Treatment' },
    ]},
    { id: 'che-organic-basics', name: 'Organic Chemistry Basics', order: 18, topics: [
      { id: 'purification', name: 'Purification Techniques' },
      { id: 'iupac-organic', name: 'IUPAC Nomenclature' },
      { id: 'isomerism', name: 'Isomerism' },
      { id: 'goc', name: 'General Organic Chemistry' },
      { id: 'electronic-effects', name: 'Electronic Effects' },
      { id: 'reaction-mechanism', name: 'Reaction Intermediates' },
      { id: 'stereochemistry', name: 'Stereochemistry' },
    ]},
    { id: 'che-hydrocarbons', name: 'Hydrocarbons', order: 19, topics: [
      { id: 'alkanes', name: 'Alkanes' },
      { id: 'alkenes', name: 'Alkenes' },
      { id: 'alkynes', name: 'Alkynes' },
      { id: 'aromatic', name: 'Aromatic Hydrocarbons' },
    ]},
    { id: 'che-halogen', name: 'Haloalkanes and Haloarenes', order: 20, topics: [
      { id: 'haloalkanes', name: 'Haloalkanes' },
      { id: 'haloarenes', name: 'Haloarenes' },
      { id: 'sn-reactions', name: 'SN1 and SN2' },
    ]},
    { id: 'che-oxygen', name: 'Alcohols, Phenols and Ethers', order: 21, topics: [
      { id: 'alcohols', name: 'Alcohols' },
      { id: 'phenols', name: 'Phenols' },
      { id: 'ethers', name: 'Ethers' },
    ]},
    { id: 'che-carbonyl', name: 'Aldehydes, Ketones and Acids', order: 22, topics: [
      { id: 'aldehydes', name: 'Aldehydes' },
      { id: 'ketones', name: 'Ketones' },
      { id: 'carboxylic-acids', name: 'Carboxylic Acids' },
      { id: 'nucleophilic-addition', name: 'Nucleophilic Addition' },
    ]},
    { id: 'che-amines', name: 'Amines', order: 23, topics: [
      { id: 'amines', name: 'Amines' },
      { id: 'diazonium', name: 'Diazonium Salts' },
    ]},
    { id: 'che-biomolecules', name: 'Biomolecules', order: 24, topics: [
      { id: 'carbohydrates', name: 'Carbohydrates' },
      { id: 'proteins', name: 'Proteins and Amino Acids' },
      { id: 'vitamins', name: 'Vitamins' },
      { id: 'nucleic-acids', name: 'Nucleic Acids' },
    ]},
    { id: 'che-polymers', name: 'Polymers', order: 25, topics: [
      { id: 'polymers', name: 'Polymer Types' },
      { id: 'polymerisation', name: 'Polymerisation' },
    ]},
    { id: 'che-everyday', name: 'Chemistry in Everyday Life', order: 26, topics: [
      { id: 'drugs', name: 'Drugs and Medicines' },
      { id: 'food-preservatives', name: 'Food Preservatives' },
      { id: 'cleansing', name: 'Cleansing Agents' },
    ]},
  ],
}

export const MATHEMATICS: Subject = {
  id: 'mathematics',
  name: 'Mathematics',
  short: 'Mat',
  color: '#f5a524',
  chapters: [
    { id: 'math-sets', name: 'Sets, Relations and Functions', order: 1, topics: [
      { id: 'sets', name: 'Sets' },
      { id: 'relations', name: 'Relations' },
      { id: 'functions', name: 'Functions' },
      { id: 'inverse-functions', name: 'Inverse Functions' },
      { id: 'composite-functions', name: 'Composite Functions' },
    ]},
    { id: 'math-complex', name: 'Complex Numbers and Quadratic Equations', order: 2, topics: [
      { id: 'complex-numbers', name: 'Complex Numbers' },
      { id: 'modulus-argument', name: 'Modulus and Argument' },
      { id: 'de-moivre', name: "de-Moivre's Theorem" },
      { id: 'quadratic-equations', name: 'Quadratic Equations' },
      { id: 'roots', name: 'Nature of Roots' },
      { id: 'cube-roots', name: 'Cube Roots of Unity' },
    ]},
    { id: 'math-matrices', name: 'Matrices and Determinants', order: 3, topics: [
      { id: 'matrices', name: 'Matrices' },
      { id: 'determinants', name: 'Determinants' },
      { id: 'adjoint-inverse', name: 'Adjoint and Inverse' },
      { id: 'linear-equations', name: 'System of Linear Equations' },
      { id: 'eigenvalues', name: 'Eigenvalues' },
    ]},
    { id: 'math-pnc', name: 'Permutations and Combinations', order: 4, topics: [
      { id: 'permutations', name: 'Permutations' },
      { id: 'combinations', name: 'Combinations' },
      { id: 'circular-arrangement', name: 'Circular Arrangement' },
      { id: 'multinomial', name: 'Multinomial Theorem' },
    ]},
    { id: 'math-binomial', name: 'Binomial Theorem', order: 5, topics: [
      { id: 'binomial-expansion', name: 'Binomial Expansion' },
      { id: 'general-term', name: 'General Term' },
      { id: 'binomial-coefficients', name: 'Binomial Coefficients' },
    ]},
    { id: 'math-sequence', name: 'Sequences and Series', order: 6, topics: [
      { id: 'arithmetic-progression', name: 'Arithmetic Progression' },
      { id: 'geometric-progression', name: 'Geometric Progression' },
      { id: 'harmonic-progression', name: 'Harmonic Progression' },
      { id: 'sum-of-series', name: 'Sum of Series' },
      { id: 'special-series', name: 'Special Series' },
    ]},
    { id: 'math-lcd', name: 'Limits, Continuity and Differentiability', order: 7, topics: [
      { id: 'limits', name: 'Limits' },
      { id: 'lhopital', name: "L'Hospital's Rule" },
      { id: 'continuity', name: 'Continuity' },
      { id: 'differentiability', name: 'Differentiability' },
      { id: 'limits-standard', name: 'Standard Limits' },
    ]},
    { id: 'math-app-derivatives', name: 'Applications of Derivatives', order: 8, topics: [
      { id: 'tangent-normal', name: 'Tangent and Normal' },
      { id: 'monotonicity', name: 'Monotonicity' },
      { id: 'maxima-minima', name: 'Maxima and Minima' },
      { id: 'rate-of-change', name: 'Rate of Change' },
      { id: 'rolle-lmvt', name: 'Rolle and LMVT' },
    ]},
    { id: 'math-integral', name: 'Integral Calculus', order: 9, topics: [
      { id: 'indefinite-integration', name: 'Indefinite Integration' },
      { id: 'definite-integration', name: 'Definite Integration' },
      { id: 'area-under-curve', name: 'Area Under Curves' },
      { id: 'integration-by-parts', name: 'Integration by Parts' },
      { id: 'substitution', name: 'Substitution' },
      { id: 'differential-forms', name: 'Integration of Special Forms' },
    ]},
    { id: 'math-differential', name: 'Differential Equations', order: 10, topics: [
      { id: 'order-degree', name: 'Order and Degree' },
      { id: 'variable-separable', name: 'Variable Separable' },
      { id: 'homogeneous', name: 'Homogeneous Equations' },
      { id: 'linear-differential', name: 'Linear Differential Equations' },
    ]},
    { id: 'math-coordinate', name: 'Coordinate Geometry', order: 11, topics: [
      { id: 'straight-lines', name: 'Straight Lines' },
      { id: 'circles', name: 'Circles' },
      { id: 'parabola', name: 'Parabola' },
      { id: 'ellipse', name: 'Ellipse' },
      { id: 'hyperbola', name: 'Hyperbola' },
      { id: 'distance-formula', name: 'Distance and Section Formula' },
      { id: 'locus', name: 'Locus' },
    ]},
    { id: 'math-3d', name: 'Three Dimensional Geometry', order: 12, topics: [
      { id: '3d-coordinates', name: 'Coordinates in 3D' },
      { id: 'direction-cosines', name: 'Direction Cosines' },
      { id: 'planes', name: 'Planes' },
      { id: 'lines-3d', name: 'Lines in 3D' },
      { id: 'sphere', name: 'Sphere' },
    ]},
    { id: 'math-vector', name: 'Vector Algebra', order: 13, topics: [
      { id: 'vector-basics', name: 'Vector Basics' },
      { id: 'dot-product', name: 'Dot Product' },
      { id: 'cross-product', name: 'Cross Product' },
      { id: 'triple-product', name: 'Scalar and Vector Triple Product' },
    ]},
    { id: 'math-probability', name: 'Statistics and Probability', order: 14, topics: [
      { id: 'statistics', name: 'Statistics' },
      { id: 'probability', name: 'Probability' },
      { id: 'conditional-probability', name: 'Conditional Probability' },
      { id: 'random-variables', name: 'Random Variables' },
      { id: 'bayes', name: "Bayes' Theorem" },
    ]},
    { id: 'math-trig', name: 'Trigonometry', order: 15, topics: [
      { id: 'trig-identities', name: 'Trigonometric Identities' },
      { id: 'trig-equations', name: 'Trigonometric Equations' },
      { id: 'inverse-trig', name: 'Inverse Trigonometric Functions' },
      { id: 'heights-distances', name: 'Heights and Distances' },
      { id: 'trig-ratios', name: 'Trigonometric Ratios' },
    ]},
    { id: 'math-reasoning', name: 'Mathematical Reasoning', order: 16, topics: [
      { id: 'statements', name: 'Statements and Truth Tables' },
      { id: 'validity', name: 'Validity of Statements' },
    ]},
  ],
}

export const SUBJECTS: Subject[] = [PHYSICS, CHEMISTRY, MATHEMATICS]

export const getSubject = (id: SubjectId): Subject => {
  const s = SUBJECTS.find((s) => s.id === id)
  if (!s) throw new Error(`Unknown subject: ${id}`)
  return s
}

export const getChapter = (subject: SubjectId, chapterId: string): Chapter => {
  const c = getSubject(subject).chapters.find((c) => c.id === chapterId)
  if (!c) throw new Error(`Unknown chapter: ${subject}/${chapterId}`)
  return c
}

export const ALL_CHAPTERS = SUBJECTS.flatMap((s) =>
  s.chapters.map((c) => ({ ...c, subject: s.id as SubjectId })),
)

export const ALL_TOPICS = ALL_CHAPTERS.flatMap((c) =>
  c.topics.map((t) => ({ ...t, chapterId: c.id, subject: c.subject })),
)

export const TOTAL_QUESTIONS_META = {
  physics: PHYSICS.chapters.reduce((acc, c) => acc + c.topics.length * 4, 0),
  chemistry: CHEMISTRY.chapters.reduce((acc, c) => acc + c.topics.length * 4, 0),
  mathematics: MATHEMATICS.chapters.reduce((acc, c) => acc + c.topics.length * 4, 0),
}
