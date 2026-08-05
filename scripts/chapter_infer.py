"""Shared chapter inference for the real JEE datasets.

Every dataset script should route chapter assignment through
`infer_chapter(subject, text)` so the app's syllabus chapters stay the single
source of truth (canonical names are parsed straight out of
`src/constants/syllabus.ts`). Inference is keyword based: it scans the raw
lowercased text plus a LaTeX-cleaned copy and returns the first matching
chapter for the subject. Chapters are ordered "specific-first" so that
overlapping vocabulary (e.g. "wave velocity" -> Waves, not Kinematics) lands
on the right shelf.

Known limitation: image-based questions (mmJEE-Eval) carry no text, so they
cannot be inferred and keep their dataset-level pseudo-chapter.
"""
from __future__ import annotations

import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SYLLABUS_PATH = os.path.join(SCRIPT_DIR, "..", "src", "constants", "syllabus.ts")

# (chapter, [keywords]) — matched as lowercase substrings, specific-first.
KEYWORDS: dict[str, list[tuple[str, list[str]]]] = {
    "physics": [
        ("Units and Measurements", [
            "vernier", "calliper", "caliper", "screw gauge", "least count",
            "significant figure", "dimension", "dimensional", "error analysis",
            "si unit", "unit of", "measuring", "instrument",
        ]),
        ("Electrostatics", [
            "electrostat", "electric charge", "charge", "coulomb", "capacitor",
            "capacitance", "dielectric", "electric field", "electric potential",
            "potential difference", "electric flux", "gauss", "dipole", "flux",
        ]),
        ("Current Electricity", [
            "current", "resistance", "ohm", "potentiometer", "wheatstone",
            "meter bridge", "galvanometer", "ammeter", "voltmeter", "circuit",
            "emf", "battery", "cell", "kirchhoff", "drift velocity", "conductance",
            "resistivity", "superconduct",
        ]),
        ("Magnetic Effects of Current and Magnetism", [
            "magnetic", "magnet", "ampere", "solenoid", "lorentz", "biot-savart",
            "cyclotron", "magnetic field", "magnetisation", "magnetic moment",
            "bar magnet", "earth's magnetism", "diamagnet", "paramagnet",
            "ferromagnet",
        ]),
        ("EMI and AC", [
            "induction", "induced", "mutual inductance", "self-inductance",
            "alternating", "ac circuit", "rms", "transformer", "eddy current",
            "lenz", "faraday", "motional emf", "reactance", "impedance", "resonance in",
        ]),
        ("Electromagnetic Waves", [
            "electromagnetic wave", "em wave", "electromagnetic radiation",
            "em spectrum", "displacement current", "maxwell", "radio wave",
            "microwave", "infrared", "ultraviolet", "x-ray", "gamma ray",
            "electromagnetic induction between",
        ]),
        ("Ray Optics", [
            "lens", "mirror", "reflection", "refraction", "refractive index",
            "prism", "optical", "focal", "optic axis", "tir", "total internal",
            "magnification", "virtual image", "real image", "aperture",
            "dispersive power", "deviation",
        ]),
        ("Wave Optics", [
            "interference", "diffraction", "fringe", "double slit", "polaris",
            "huygens", "young's", "polarisation", "coherent", "optical path",
            "path difference",
        ]),
        ("Dual Nature of Matter and Radiation", [
            "photoelectric", "photon", "work function", "de broglie", "de-broglie",
            "threshold frequency", "photoelectron", "electron volt", "stopping potential",
            "dual nature", "photocell", "radiation pressure",
        ]),
        ("Atoms and Nuclei", [
            "hydrogen atom", "bohr", "nucleus", "nuclear", "radioactive", "decay",
            "half-life", "half life", "binding energy", "mass defect", "alpha particle",
            "rutherford", "atomic number", "fission", "fusion", "isotope",
            "neutron", "proton", "atomic spectra", "rutherford", "radioactivity",
        ]),
        ("Semiconductors", [
            "diode", "semiconductor", "transistor", "forward bias", "reverse bias",
            "p-n", "pn junction", "zener", "logic gate", "and gate", "or gate",
            "not gate", "rectifier", "amplifier", "n-type", "p-type", "digital electronics",
            "electronic device",
        ]),
        ("Gravitation", [
            "gravit", "satellite", "escape velocity", "orbital", "kepler",
            "geostationary", "orbital speed", "weightlessness",
        ]),
        ("Oscillations", [
            "oscillat", "simple harmonic", "shm", "spring", "pendulum", "vibration",
            "time period of", "amplitude", "restoring force", "resonance", "damped",
        ]),
        ("Waves", [
            "wave", "wavelength", "frequency", "organ pipe", "beats", "doppler",
            "sound", "stationary wave", "longitudinal", "transverse", "string",
            "superposition", "node", "antinode", "progressive wave", "frequency of",
        ]),
        ("Thermal Properties and Thermodynamics", [
            "temperature", "heat", "thermodynam", "specific heat", "latent heat",
            "isothermal", "adiabatic", "entropy", "calorimetr", "conduction",
            "convection", "carnot", "kelvin", "boyle", "charles", "ideal gas",
            "kinetic theory", "gas law", "pressure", "thermal expansion", "heat transfer",
            "gaseous state", "first law", "internal energy", "specific heat capacity",
        ]),
        ("Properties of Solids and Fluids", [
            "fluid", "stress", "strain", "elastic", "young's", "young modulus",
            "bulk modulus", "viscos", "surface tension", "capillary", "pascal",
            "bernoulli", "buoyanc", "archimedes", "tube", "liquid", "flow",
            "hydraulic", "streamline", "turbulent", "rod", "elongation", "wire",
            "bubble", "soap",
        ]),
        ("Rotational Motion", [
            "angular", "torque", "moment of inertia", "rotating", "rotational",
            "disc", "flywheel", "rolling", "angular momentum", "gyration",
            "rigid body", "rotation",
        ]),
        ("Centre of Mass and Collisions", [
            "centre of mass", "center of mass", "collision", "elastic collision",
            "inelastic", "momentum conservation", "system of particles",
        ]),
        ("Work, Energy and Power", [
            "work done", "kinetic energy", "potential energy", "power", "work-energy",
            "work is done", "work done upon", "energy conservation", "variable force",
        ]),
        ("Kinematics", [
            "displacement", "velocity", "acceleration", "projectile", "projected",
            "speed", "motion", "distance", "dropped", "retardation", "position",
            "trajectory", "free fall", "graphical",
        ]),
        ("Laws of Motion", [
            "newton", "friction", "force", "incline", "tension", "string", "pulley",
            "normal reaction", "laws of motion", "pseudo", "constraint",
        ]),
    ],
    "chemistry": [
        ("Salt Analysis", [
            "salt analysis", "qualitative analysis", "dry test", "precipitation reaction",
            "group analysis", "iiib group", "iib group", "ivth group", "group iv",
        ]),
        ("Surface Chemistry", [
            "surface chemistry", "adsorption", "colloid", "catalysis", "catalyst",
            "emulsion", "micelle", "gel", "coagulation", "adsorption isotherm",
            "lyophilic", "lyophobic",
        ]),
        ("Chemical Kinetics", [
            "chemical kinetics", "rate of reaction", "rate law", "order of reaction",
            "rate constant", "half-life", "half life", "arrhenius", "activation energy",
            "integrated rate", "pseudo first order", "reaction rate", "radioactive decay",
            "radioactivity",
        ]),
        ("Coordination Compounds", [
            "coordination", "ligand", "complex", "chelate", "werner", "crystal field",
            "cft", "valence bond theory", "coordination number", "spin only",
        ]),
        ("d and f-Block Elements", [
            "d-block", "f-block", "d and f block", "transition element", "transition metal",
            "lanthanoid", "lanthanide", "actinoid", "actinide", "metallurgy",
            "extraction of metal", "ore", "refining of", "colouring", "rusting",
            "compound of transition",
        ]),
        ("p-Block Elements", [
            "p-block", "p block", "halogen", "sulphuric acid", "sulfuric acid", "noble gas",
            "boron", "silicon", "phosphorus", "sulphur", "sulfur", "ammonia", "chlorine",
            "fluorine", "oxygen family", "nitrogen family", "carbon family", "boron family",
            "silicates", "ozone", "nitric acid", "sulphur dioxide", "hydrogen sulphide",
        ]),
        ("s-Block Elements", [
            "alkali", "alkaline", "s-block", "s block", "sodium", "potassium",
            "lithium", "caesium", "magnesium", "calcium", "group 1", "group 2",
        ]),
        ("Hydrogen", [
            "hydrogen peroxide", "h2o2", "hydride", "heavy water", "dihydrogen",
            "hydrogen atom", "water", "hydrogen is",
        ]),
        ("Biomolecules", [
            "biomolecule", "carbohydrate", "glucose", "protein", "amino acid",
            "vitamin", "nucleic", "dna", "rna", "enzyme", "polysaccharide",
            "sucrose", "starch", "cellulose", "lipid", "fructose",
        ]),
        ("Polymers", [
            "polymer", "monomer", "polymerisation", "polymerization", "synthetic rubber",
            "nylon", "terylene", "bakelite", "teflon", "pvc", "polyester", "neoprene",
            "buna",
        ]),
        ("Chemistry in Everyday Life", [
            "medicine", "drug", "food preservative", "cleansing", "detergent",
            "antiseptic", "analgesic", "antibiotic", "tranquilizer", "tranquilliser",
            "sweetener", "chemotherapy", "soap",
        ]),
        ("Alcohols, Phenols and Ethers", [
            "alcohol", "phenol", "ether", "glycerol", "glycol", "alcoholysis",
            "lucas", "cresol", "hydroxy",
        ]),
        ("Haloalkanes and Haloarenes", [
            "haloalkane", "haloarene", "halide", "sn1", "sn2", "chloro", "bromo",
            "iodo", "carius", "grignard", "alkyl halide", "aryl halide", "freon",
        ]),
        ("Aldehydes, Ketones and Acids", [
            "aldehyde", "ketone", "carbonyl", "carboxylic", "carboxyl", "fehling",
            "tollen", "ester", "ascorbic", "iodoform", "cannizzaro", "aldol",
            "formic acid", "acetic acid", "acetaldehyde", "acetone",
        ]),
        ("Amines", [
            "amine", "diazonium", "azo", "aniline", "quaternary ammonium", "azo dye",
            "coupling", "sn, hcl", "sn+hcl", "diazotiz", "sandmeyer", "gattermann",
        ]),
        ("Hydrocarbons", [
            "hydrocarbon", "alkane", "alkene", "alkyne", "alkadiene", "benzene",
            "aromatic", "cycloalkane", "methane", "ethane", "propene", "butene",
            "propyne", "toluene", "xylene", "naphthalene", "petrol", "wurtz",
        ]),
        ("Organic Chemistry Basics", [
            "iupac", "nomenclature", "isomer", "stereoisomer", "goc", "general organic",
            "inductive", "mesomeric", "electromeric", "hyperconjugation", "reaction mechanism",
            "carbocation", "carbanion", "electrophile", "nucleophile", "homolytic",
            "heterolytic", "purification", "functional group", "tautomer", "free radical",
            "resonance structure", "organic chemistry", "qualitative organic",
        ]),
        ("Environmental Chemistry", [
            "environmental", "pollution", "greenhouse", "water treatment", "smog",
            "acid rain", "air pollution", "soil pollution", "refrigerant", "cfc",
        ]),
        ("Redox Reactions", [
            "redox", "oxidation", "reduction", "oxidation number", "electrolysis",
            "electrolyte", "faraday", "electrode", "electrochemical", "nernst",
            "galvanic", "cell", "oxidising agent", "reducing agent", "equivalent weight",
            "balancing of redox", "disproportionation",
        ]),
        ("Equilibrium", [
            "equilibrium", "kp", "kc", "ka ", "kb ", "ph of", "buffer", "solubility product",
            "common ion", "acid", "base", "salt hydrolysis", "poh", "ionic product",
            "le chatelier", "le-chatelier", "degree of dissociation", "ksp",
        ]),
        ("Chemical Thermodynamics", [
            "thermodynam", "enthalpy", "heat of", "entropy", "gibbs", "spontaneity",
            "first law", "hess", "calorimetr", "internal energy", "isothermal",
            "adiabatic", "bond energy", "heat capacity", "heat released",
        ]),
        ("States of Matter", [
            "gas", "boyle", "charles", "kelvin", "vapour", "boiling point",
            "raoult", "van't hoff", "osmotic", "solid", "liquid state", "crystal",
            "bcc", "fcc", "unit cell", "packing", "effusion", "graham", "dalton",
            "vapour pressure", "melting point", "colligative",
        ]),
        ("Chemical Bonding", [
            "bond", "hybrid", "vsepr", "dipole moment", "resonance", "lattice",
            "molecular orbital", "lewis", "valence bond", "hydrogen bond", "ionic bond",
            "covalent", "bond order", "octet", "coordinate bond", "bond length",
            "molecular geometry", "geometry of", "shape of the", "linear geometry",
            "planar geometry", "tetrahedral geometry",
        ]),
        ("Classification and Periodicity", [
            "electronegativity", "periodic", "ionisation enthalpy", "ionization energy",
            "electron gain", "atomic radius", "ionic radius", "metallic character",
            "periodicity", "valence electron", "non-metallic character",
        ]),
        ("Structure of Atom", [
            "orbital", "quantum number", "excited state", "ground state", "spectrum",
            "bohr", "de broglie", "uncertainty", "electronic configuration", "electron",
            "wavelength of electron", "photoelectric", "electromagnetic spectrum",
            "hydrogen spectrum", "atomic spectra",
        ]),
        ("Some Basic Concepts of Chemistry", [
            "mole concept", "moles", "molarity", "molality", "molar mass",
            "stoichiometr", "percentage composition", "limiting reagent", "empirical formula",
            "molecular formula", "avogadro", "concentration", "equivalent concept",
            "normality", "yield",
        ]),
    ],
    "mathematics": [
        ("Three Dimensional Geometry", [
            "direction cosine", "direction ratio", "z-axis", "z axis", "yz-plane",
            "xz-plane", "xy-plane", "plane", "shortest distance between", "skew lines",
            "foot of the perpendicular", "line segment joining", "section formula in",
            "perpendicular to both", "direction vector",
        ]),
        ("Vector Algebra", [
            "vector", "cross product", "dot product", "scalar triple", "vector triple",
            "position vector", "unit vector", "projection of", "collinear vectors",
            "coplanar vectors", "\\vec",
        ]),
        ("Differential Equations", [
            "differential equation", "order of the differential", "dy/dx", "dy/dx",
            "\\frac{dy}{dx}", "solution of the differential", "formation of differential",
            "degree of the differential",
        ]),
        ("Integral Calculus", [
            "integral", "integrat", "area under", "area bounded", "area of the region",
            "area enclosed", "\\int", "\\iint", "definite integral", "indefinite integral",
            "area of the larger", "area between", "of the region", "region bounded",
            "region enclosed",
        ]),
        ("Limits, Continuity and Differentiability", [
            "\\lim", "lim_", "limit", "continuity", "continuous", "differentiab",
            "l'hopital", "l'hospital", "l-hospital", "lim_{x",
        ]),
        ("Applications of Derivatives", [
            "tangent", "normal to the curve", "maxima", "minima", "monotonic",
            "increasing function", "decreasing function", "strictly increasing",
            "strictly decreasing", "rate of change", "rate at which",
            "at the rate", "related rates", "local maximum", "local minimum",
            "local maxima", "local minima", "extreme value", "stationary point",
            "point of inflection", "rolle", "lmvt", "mean value theorem", "instantaneous rate",
        ]),
        ("Trigonometry", [
            "trigonometr", "inverse trig", "sine rule", "cosine rule",
            "circumradius", "inradius", "ex-radii", "angle of elevation",
            "principal value", "\\sin", "\\cos", "\\tan", "\\sec", "\\cosec", "\\cot",
            "\\sec^{-1}", "\\cosec^{-1}",
        ]),
        ("Complex Numbers and Quadratic Equations", [
            "complex number", "argument", "modulus of", "|z", "quadratic", "roots of",
            "equal roots", "nature of roots", "discriminant", "sum of roots",
            "product of roots", "cube roots", "de moivre", "iota", "imaginary",
            "number of solutions", "solutions of the equation", "solutions of this equation",
            "number of real solutions", "real solutions of", "real solution", "real root",
        ]),
        ("Coordinate Geometry", [
            "straight line", "locus", "circle", "parabola", "ellipse", "hyperbola",
            "conic", "eccentricity", "directrix", "focus", "foci", "chord", "area of triangle",
            "collinear", "section formula", "slope", "intercept", "vertices", "midpoint",
            "centroid of", "equation of the line", "coordinates of the point", "axes",
            "line x", "meet the axes", "diameters", "parallel lines",
        ]),
        ("Matrices and Determinants", [
            "matrix", "matrices", "determinant", "adjoint", "adjoint of", "\\text{adj}",
            "inverse of a matrix", "system of linear",
            "system of equations", "linear equations", "rank of", "eigenvalue", "eigen value",
            "augmented", "nonsingular", "singular matrix", "x + y +", "x + 2y",
        ]),
        ("Statistics and Probability", [
            "probability", "variance", "standard deviation", "mean of", "mean deviation",
            "median", "mode", "random variable", "binomial distribution", "bayes",
            "conditional probability", "die", "coins", "cards", "bag contains", "expectation",
            "independent events", "mutually exclusive", "statistical", "observations",
        ]),
        ("Permutations and Combinations", [
            "permutation", "combination", "number of ways", "arranged", "chosen",
            "ways of", "seating", "committee", "digits", "digit", "letters", "arrangements",
            "factorial", "npr", "distributed", "ring",
        ]),
        ("Sequences and Series", [
            "progression", "a.p.", "g.p.", "h.p.", "arithmetic progression", "geometric progression",
            "harmonic progression", "series", "sequence", "sum of", "\\sum", "summation",
            "nth term", "sum_{", "n terms", "sum to n",
        ]),
        ("Binomial Theorem", [
            "binomial", "coefficient of", "general term", "expansion of", "middle term",
            "greatest term", "remainder", "rational term", "irrational term",
            "number of terms", "independent of x", "(1+x)^n", "(1 + x)", "multinomial",
        ]),
        ("Sets, Relations and Functions", [
            "relation", "function", "domain", "range of", "one-one", "onto", "bijective",
            "inverse function", "f(x)", "composite", "f:", "f(x) =", "a = {", "a={",
            "subset", "power set", "image of", "set", "symmetric", "reflexive", "transitive",
            "equivalence relation", "\\in",
        ]),
        ("Mathematical Reasoning", [
            "statement", "truth value", "contradiction", "tautology", "if and only if",
            "negation", "contrapositive", "converse", "implication", "which of the following statements",
            "logical", "argument", "valid", "premises",
        ]),
    ],
}

# Regex rules checked before keywords, in order. (pattern, chapter)
REGEX_RULES: list[tuple[re.Pattern[str], str]] = [
    # 3D coordinate tuples like P(10, -3, -1) are a strong 3D-geometry signal.
    (re.compile(r"\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+\s*\)"), "Three Dimensional Geometry"),
    (re.compile(r"\\vec\{?\w"), "Vector Algebra"),
]


def load_canonical_chapters() -> dict[str, set[str]]:
    """Parse canonical chapter names per subject out of syllabus.ts."""
    with open(SYLLABUS_PATH, encoding="utf-8") as f:
        src = f.read()
    sections: dict[str, str] = {}
    for subject, const in (("physics", "PHYSICS"), ("chemistry", "CHEMISTRY"), ("mathematics", "MATHEMATICS")):
        start = src.find(f"export const {const}: Subject")
        end = len(src)
        for other in ("PHYSICS", "CHEMISTRY", "MATHEMATICS"):
            if other == const:
                continue
            idx = src.find(f"export const {other}: Subject", start + 1)
            if idx != -1:
                end = min(end, idx)
        sections[subject] = src[start:end] if start != -1 else ""
    return {
        subject: set(re.findall(r"name: '([^']+)', order:", block))
        for subject, block in sections.items()
    }


def _normalize(text: str) -> tuple[str, str]:
    raw = (text or "").lower()
    cleaned = raw.replace("\\", " ").replace("{", " ").replace("}", " ")
    return raw, cleaned


def infer_chapter(subject: str, text: str) -> str | None:
    """Return the best-guess canonical chapter name for a question, or None."""
    raw, cleaned = _normalize(text)

    for pattern, chapter in REGEX_RULES:
        if pattern.search(raw):
            return chapter

    for chapter, keywords in KEYWORDS.get(subject, []):
        for kw in keywords:
            k = kw.lower()
            if k in raw or k in cleaned:
                return chapter
    return None


def is_canonical(subject: str, chapter: str) -> bool:
    """True when `chapter` is a name that exists in the app syllabus for `subject`."""
    return chapter in load_canonical_chapters().get(subject, set())


if __name__ == "__main__":
    import sys

    canon = load_canonical_chapters()
    print("canonical chapter counts:", {k: len(v) for k, v in canon.items()})

    # Self-check: every target chapter in KEYWORDS must exist in the syllabus.
    ok = True
    for subject, entries in KEYWORDS.items():
        for chapter, _ in entries:
            if chapter not in canon[subject]:
                print(f"MISSING IN SYLLABUS: {subject} / {chapter}")
                ok = False
    print("keyword targets all canonical" if ok else "KEYWORD TARGETS HAVE GAPS")

    if len(sys.argv) > 2:
        print("infer:", infer_chapter(sys.argv[1], sys.argv[2]))
