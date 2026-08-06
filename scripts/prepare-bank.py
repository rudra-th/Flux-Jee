"""
Converts large real JEE datasets into the app's Question schema.

Sources:
  - ruh-ai/grafite-jee-mains-qna-no-img  (real JEE Main + AIEEE 2002-2024, CC/Embedit)
  - daman1209arora/jeebench              (real JEE Advanced 2016-2023, MIT)

Writes:
  - public/data/jee-bank.json   (Grafite Mains, single/integer)
  - public/data/jee-adv.json    (JEEBench Advanced, single/multiple/integer/numerical)

Usage: python scripts/prepare-bank.py [grafite.parquet] [jeebench-test.json]
"""
import html
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "data")
DEFAULT_JEE_DATA = os.environ.get("JEE_DATA_DIR", r"C:\Users\Asus\AppData\Local\Temp\opencode\jee-data")
DEFAULT_GRAFITE = os.path.join(DEFAULT_JEE_DATA, "new", "grafite.parquet")
DEFAULT_BENCH = os.path.join(DEFAULT_JEE_DATA, "jeebench-test.json")

SUBJECT_ID = {"physics": "physics", "chemistry": "chemistry", "maths": "mathematics"}
SUBJECT_ID_ADV = {"phy": "physics", "chem": "chemistry", "math": "mathematics"}

# Dataset topic -> app syllabus chapter name (fallback: the topic itself)
CHAPTER_MAP = {
    "physics": {
        "Unit and dimension": "Units and Measurements",
        "Units and Measurements": "Units and Measurements",
        "Error analysis": "Units and Measurements",
        "Kinematics": "Kinematics",
        "Motion in 1D": "Kinematics",
        "Projectile Motion": "Kinematics",
        "Relative motion": "Kinematics",
        "Circular motion": "Kinematics",
        "Vector": "Kinematics",
        "Newton's Laws of Motion": "Laws of Motion",
        "Mechanics": "Kinematics",
        "Rigid Body Dynamics": "Rotational Motion",
        "Rotational motion": "Rotational Motion",
        "Center of mass": "Centre of Mass and Collisions",
        "Centre of Mass": "Centre of Mass and Collisions",
        "Collision": "Centre of Mass and Collisions",
        "System of particle": "Centre of Mass and Collisions",
        "System of particles": "Centre of Mass and Collisions",
        "Work Power & Energy": "Work, Energy and Power",
        "Gravitation": "Gravitation",
        "Elasticity": "Properties of Solids and Fluids",
        "Mechanical properties of solid": "Properties of Solids and Fluids",
        "Mechanical property of solids": "Properties of Solids and Fluids",
        "Mechanical properties of matter": "Properties of Solids and Fluids",
        "Mechanical Properties of Fluids": "Properties of Solids and Fluids",
        "Mechanical properties of liquid": "Properties of Solids and Fluids",
        "Behaviour of perfect gases": "Thermal Properties and Thermodynamics",
        "Kinetic Theory of Gases": "Thermal Properties and Thermodynamics",
        "Kinetic theory of gasses": "Thermal Properties and Thermodynamics",
        "Thermodynamics": "Thermal Properties and Thermodynamics",
        "Thermodynamic": "Thermal Properties and Thermodynamics",
        "Isobaric process": "Thermal Properties and Thermodynamics",
        "Thermal properties of matter": "Thermal Properties and Thermodynamics",
        "Heat": "Thermal Properties and Thermodynamics",
        "Oscillation": "Oscillations",
        "Simple Harmonic Motion": "Oscillations",
        "Sound": "Waves",
        "Sound wave": "Waves",
        "Wave on a string": "Waves",
        "Wave on string": "Waves",
        "Wave": "Waves",
        "Electrostatics": "Electrostatics",
        "Capacitance": "Electrostatics",
        "Capacitor": "Electrostatics",
        "Current Electricity": "Current Electricity",
        "Electric current": "Current Electricity",
        "Magnetism": "Magnetic Effects of Current and Magnetism",
        "Magnetics": "Magnetic Effects of Current and Magnetism",
        "Mangetism": "Magnetic Effects of Current and Magnetism",
        "Magnetic effect of current": "Magnetic Effects of Current and Magnetism",
        "Magnetic effects of current": "Magnetic Effects of Current and Magnetism",
        "Moving charges and magnetism": "Magnetic Effects of Current and Magnetism",
        "Electromagnetic induction": "EMI and AC",
        "EMI": "EMI and AC",
        "AC": "EMI and AC",
        "AC circuit": "EMI and AC",
        "EM wave": "Electromagnetic Waves",
        "E-M waves": "Electromagnetic Waves",
        "Ray Optics": "Ray Optics",
        "Wave Optics": "Wave Optics",
        "Dual Nature of Matter": "Dual Nature of Matter and Radiation",
        "Modern physics": "Dual Nature of Matter and Radiation",
        "Atomic Physics": "Atoms and Nuclei",
        "Nuclear Physics": "Atoms and Nuclei",
        "Semiconductors": "Semiconductors",
        "Electronic device": "Semiconductors",
        "Electronic devices": "Semiconductors",
        "Digital electronics": "Semiconductors",
        "Communication system": "Semiconductors",
    },
    "chemistry": {
        "Atomic Structure": "Structure of Atom",
        "Periodic table": "Classification and Periodicity",
        "Chemical Bonding": "Chemical Bonding",
        "Mole concept": "Some Basic Concepts of Chemistry",
        "Equivalent Concept": "Some Basic Concepts of Chemistry",
        "Ideal Gas": "States of Matter",
        "Real Gas": "States of Matter",
        "Eudiometry": "States of Matter",
        "Electrochemistry": "Redox Reactions",
        "Redox Reaction": "Redox Reactions",
        "S-block": "s-Block Elements",
        "P-block": "p-Block Elements",
        "P-block VA, VIA, VIIA elements": "p-Block Elements",
        "Coordination Compounds": "Coordination Compounds",
        "Alcohol, Phenol and Ethers": "Alcohols, Phenols and Ethers",
        "Carbonyl Compound (Aldehyde and Ketone)": "Aldehydes, Ketones and Acids",
        "Halogen": "Haloalkanes and Haloarenes",
        "Hydrocarbon": "Hydrocarbons",
        "Isomerism": "Organic Chemistry Basics",
        "Stereoisomerism": "Organic Chemistry Basics",
        "IUPAC and Structural Isomerism": "Organic Chemistry Basics",
        "IUPAC Nomenclature": "Organic Chemistry Basics",
        "IUPAC Nomenclature and Structural Isomerism": "Organic Chemistry Basics",
        "Amines": "Amines",
    },
    "mathematics": {
        "Sets": "Sets, Relations and Functions",
        "Relation": "Sets, Relations and Functions",
        "Functions": "Sets, Relations and Functions",
        "Special functions": "Sets, Relations and Functions",
        "Logarithm": "Complex Numbers and Quadratic Equations",
        "Logarithm and its applications": "Complex Numbers and Quadratic Equations",
        "Inequalities": "Complex Numbers and Quadratic Equations",
        "Inequalities and absolute value": "Complex Numbers and Quadratic Equations",
        "Theory of Equations": "Complex Numbers and Quadratic Equations",
        "Thoery of equation": "Complex Numbers and Quadratic Equations",
        "Quadratic Equations": "Complex Numbers and Quadratic Equations",
        "Quadratic Equation Nature of Roots": "Complex Numbers and Quadratic Equations",
        "Complex Numbers": "Complex Numbers and Quadratic Equations",
        "Matrix": "Matrices and Determinants",
        "Matrix and determinant": "Matrices and Determinants",
        "Matrix and determinants": "Matrices and Determinants",
        "Pemutation and combination": "Permutations and Combinations",
        "Permutations and Combinations": "Permutations and Combinations",
        "Binomial Theorem": "Binomial Theorem",
        "Sequence & Series": "Sequences and Series",
        "Sequences and Series": "Sequences and Series",
        "Series and progressions": "Sequences and Series",
        "Limits": "Limits, Continuity and Differentiability",
        "Limit": "Limits, Continuity and Differentiability",
        "Limits, continuity and derivability": "Limits, Continuity and Differentiability",
        "Limits, continuity and differentiability": "Limits, Continuity and Differentiability",
        "Continuity and derivability": "Limits, Continuity and Differentiability",
        "Continuity and differentiability": "Limits, Continuity and Differentiability",
        "Differcntiation": "Limits, Continuity and Differentiability",
        "Differentiation": "Limits, Continuity and Differentiability",
        "Application of derivative": "Applications of Derivatives",
        "Application of derivatives": "Applications of Derivatives",
        "Monotonocity": "Applications of Derivatives",
        "Definite Integration": "Integral Calculus",
        "Indefinite integration": "Integral Calculus",
        "Integrals": "Integral Calculus",
        "Integration": "Integral Calculus",
        "Area under curve": "Integral Calculus",
        "Differential equation": "Differential Equations",
        "Straight Lines": "Coordinate Geometry",
        "Circle and parabola": "Coordinate Geometry",
        "Circles": "Coordinate Geometry",
        "Conic Sections": "Coordinate Geometry",
        "Parabola": "Coordinate Geometry",
        "Ellipse": "Coordinate Geometry",
        "Hyperbola": "Coordinate Geometry",
        "3D": "Three Dimensional Geometry",
        "Three dimension": "Three Dimensional Geometry",
        "Vectors": "Vector Algebra",
        "Probability": "Statistics and Probability",
        "Statistics": "Statistics and Probability",
        "Trigonometry": "Trigonometry",
        "Trigonometric ratio & equations": "Trigonometry",
        "Trigonometric ratio and equation": "Trigonometry",
        "Compound angles": "Trigonometry",
        "Inverse Trigonometric functions": "Trigonometry",
        "ITF": "Trigonometry",
        "Triangles": "Trigonometry",
        "Properties of triangle": "Trigonometry",
        "Mathematical reasoning": "Mathematical Reasoning",
        "Mathematical induction": "Mathematical Reasoning",
        "Logical reasoning": "Mathematical Reasoning",
    },
}

CREATED_AT = "2026-01-01T00:00:00.000Z"


def clean(s):
    return "" if s is None else str(s).strip()


def html_to_text(s):
    if not s:
        return ""
    s = clean(s)
    # Drop images entirely (remote URLs are unreliable).
    s = re.sub(r"<img[^>]*>", "", s)
    # Block-ish tags -> newline.
    s = re.sub(r"</?(br|p|div|li|tr|h[1-6])([^>]*)>", "\n", s, flags=re.I)
    # Any other tag -> nothing.
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n", s)
    return s.strip()


def norm_text(s):
    t = clean(s).lower()
    t = re.sub(r"[\s$\\]", "", t)
    return hashlib.md5(t.encode("utf-8")).hexdigest()


def latex_to_text(s):
    """Clean plain LaTeX text WITHOUT HTML tag stripping (which would corrupt
    inequalities like `a<b ... c>d`). Only collapses whitespace."""
    if not s:
        return ""
    s = clean(s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n", s)
    return s.strip()


def year_from(s):
    m = re.search(r"(19\d{2}|20\d{2})", s or "")
    return int(m.group(1)) if m else 2021


def make_options(entries):
    opts = []
    for e in entries:
        text = html_to_text(e.get("content"))
        if not text:
            continue
        opts.append({"key": e.get("identifier") or "?", "text": text})
    return opts


def map_chapter(subject, topic):
    return CHAPTER_MAP.get(subject, {}).get(topic, topic)


def convert_grafite(row):
    subject = SUBJECT_ID.get(clean(row.get("subject")))
    if not subject:
        return None
    qtype = clean(row.get("question_type"))
    question = html_to_text(row.get("question"))
    if not question:
        return None

    if qtype == "integer":
        raw = clean(row.get("answer"))
        try:
            v = float(raw)
        except (TypeError, ValueError):
            return None
        if not (v == int(v)):
            return None
        v = int(v)
        answer = {"type": "integer", "correctValue": v, "range": [v, v]}
        app_type = "integer"
        options = []
    elif qtype == "mcq":
        try:
            entries = json.loads(row.get("options") or "[]")
        except (TypeError, ValueError):
            entries = []
        options = make_options(entries)
        if len(options) < 2:
            return None
        try:
            correct = json.loads(row.get("correct_option") or "[]")
        except (TypeError, ValueError):
            correct = []
        if len(correct) != 1:
            return None
        letter = clean(correct[0])
        idx = [i for i, o in enumerate(options) if o["key"] == letter]
        if len(idx) != 1:
            return None
        answer = {"type": "single", "correctIndex": idx[0]}
        app_type = "single"
    else:
        return None

    topic = clean(row.get("topic"))
    chapter = map_chapter(subject, topic)
    subtopic = clean(row.get("subtopic"))
    micro_topic = subtopic or topic or chapter
    explanation = html_to_text(row.get("explanation")) or html_to_text(row.get("solution"))
    difficulty = 3

    return {
        "id": "bank-" + clean(row.get("question_id")),
        "exam": "jee-main",
        "year": year_from(clean(row.get("paper_id"))),
        "paper": "session-1",
        "shift": 1,
        "session": 1,
        "subject": subject,
        "chapter": chapter,
        "microTopic": micro_topic,
        "difficulty": difficulty,
        "estimatedTime": 60 + difficulty * 20 if app_type == "single" else 90 + difficulty * 20,
        "type": app_type,
        "content": {"text": question},
        "options": options,
        "answer": answer,
        "solution": {
            "detailed": explanation or "See the source paper for the official solution.",
            "hints": [topic or "Solve using standard concepts"],
            "concept": subtopic or topic or chapter,
        },
        "tags": [topic, subtopic, "Mains"].__add__([e for e in [subtopic, topic] if e]),
        "createdAt": CREATED_AT,
    }


ADV_MARKER = re.compile(r"(?:\(|\[)\s*(?:\\mathrm\{)?\s*([A-D])\s*(?:\})?\s*(?:\)|\])")
ADV_QUAD = re.compile(r"(?:\\quad\s*|\\qquad\s*|:?\s*)")


def split_adv_options(question):
    """Return (preamble, [(letter, text), ...]) using the LAST occurrence of each marker."""
    matches = []
    for m in ADV_MARKER.finditer(question):
        matches.append((m.start(), m.end(), m.group(1)))
    if not matches:
        return None
    last = {}
    for s, e, letter in matches:
        last[letter] = (s, e)
    letters = [L for L in "ABCD" if L in last]
    starts = [last[L][0] for L in letters]
    ends = [last[L][1] for L in letters]
    if starts != sorted(starts):
        return None
    # Option text: after each marker, up to the next marker.
    options = []
    for i, L in enumerate(letters):
        seg_start = ends[i]
        seg_end = starts[i + 1] if i + 1 < len(letters) else len(question)
        seg = question[seg_start:seg_end]
        seg = ADV_QUAD.sub("", seg, count=1)
        seg = re.sub(r"^[:\s]+", "", seg)
        seg = seg.strip()
        # Drop a single wrapper '$' when unbalanced (e.g. `$[A] ... $`), but keep
        # balanced `$...$` math intact.
        if seg.count("$") % 2 == 1:
            if seg.startswith("$"):
                seg = seg[1:]
            elif seg.endswith("$"):
                seg = seg[:-1]
        seg = seg.strip()
        options.append((L, seg))
    preamble = question[: starts[0]].strip()
    return preamble, options


def convert_adv(row):
    subject = SUBJECT_ID_ADV.get(clean(row.get("subject")))
    if not subject:
        return None
    qtype = clean(row.get("type"))
    gold = clean(row.get("gold"))
    description = clean(row.get("description"))
    year = year_from(description)

    if qtype in ("MCQ", "MCQ(multiple)"):
        parsed = split_adv_options(row.get("question") or "")
        if not parsed:
            return None
        preamble, options = parsed
        if len(options) < 2:
            return None
        correct_letters = re.findall(r"[A-D]", gold)
        indices = []
        for L in correct_letters:
            found = [i for i, (ol, _) in enumerate(options) if ol == L]
            if len(found) != 1:
                return None
            indices.append(found[0])
        if not indices:
            return None
        if qtype == "MCQ":
            if len(indices) != 1:
                return None
            answer = {"type": "single", "correctIndex": indices[0]}
            app_type = "single"
        else:
            answer = {"type": "multiple", "correctIndices": sorted(indices)}
            app_type = "multiple"
        opts = [{"key": L, "text": latex_to_text(t)} for L, t in options]
        opts = [o for o in opts if o["text"]]
        if len(opts) < 2:
            return None
        if app_type == "single":
            # indices may shift if we dropped empty options; recompute from keys
            letter = options[indices[0]][0]
            idx = [i for i, o in enumerate(opts) if o["key"] == letter]
            if len(idx) != 1:
                return None
            answer = {"type": "single", "correctIndex": idx[0]}
        else:
            letters = [options[i][0] for i in indices]
            idxs = []
            for L in letters:
                f = [i for i, o in enumerate(opts) if o["key"] == L]
                if len(f) != 1:
                    return None
                idxs.append(f[0])
            answer = {"type": "multiple", "correctIndices": sorted(idxs)}
        question_text = latex_to_text(preamble)
    elif qtype == "Integer":
        try:
            v = int(gold)
        except ValueError:
            return None
        answer = {"type": "integer", "correctValue": v, "range": [v, v]}
        app_type = "integer"
        opts = []
        question_text = latex_to_text(row.get("question") or "")
    elif qtype == "Numeric":
        try:
            v = float(gold)
        except ValueError:
            return None
        tol = max(0.005, abs(v) * 0.001)
        answer = {"type": "numerical", "correctValue": v, "range": [round(v - tol, 6), round(v + tol, 6)]}
        app_type = "numerical"
        opts = []
        question_text = latex_to_text(row.get("question") or "")
    else:
        return None

    if not question_text:
        return None

    chapter = "JEE Advanced PYQ"
    micro_topic = description or f"JEE Advanced {year}"
    qid = "adv-" + hashlib.sha1(norm_text(question_text).encode("utf-8")).hexdigest()[:12]

    return {
        "id": qid,
        "exam": "jee-advanced",
        "year": year,
        "paper": "paper-1",
        "subject": subject,
        "chapter": chapter,
        "microTopic": micro_topic,
        "difficulty": 5,
        "estimatedTime": (60 if app_type == "single" else 120) + 5 * 20,
        "type": app_type,
        "content": {"text": question_text},
        "options": opts,
        "answer": answer,
        "solution": {
            "detailed": f"Official answer: {gold}. See JEE Advanced {year} paper for the full solution.",
            "hints": [f"JEE Advanced {year}"],
            "concept": "JEE Advanced",
        },
        "tags": ["JEE Advanced", f"Year {year}", "Hard"],
        "createdAt": CREATED_AT,
    }


def load_existing_hashes():
    path = os.path.join(OUT_DIR, "jee-pyp.json")
    if not os.path.exists(path):
        return set()
    with open(path, encoding="utf-8") as f:
        rows = json.load(f)
    return {norm_text(r.get("content", {}).get("text", "")) for r in rows}


def main():
    grafite_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_GRAFITE
    bench_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_BENCH

    import pandas as pd

    df = pd.read_parquet(grafite_path)
    rows = df.to_dict("records")
    print(f"Grafite rows: {len(rows)}")

    seen = load_existing_hashes()
    bank = []
    dup = 0
    for row in rows:
        q = convert_grafite(row)
        if not q:
            continue
        h = norm_text(q["content"]["text"])
        if h in seen:
            dup += 1
            continue
        seen.add(h)
        bank.append(q)
    print(f"Grafite converted: {len(bank)} (dupes skipped: {dup})")

    with open(bench_path, encoding="utf-8") as f:
        bench_rows = json.load(f)
    adv = []
    adv_skip = 0
    for row in bench_rows:
        q = convert_adv(row)
        if not q:
            adv_skip += 1
            continue
        h = norm_text(q["content"]["text"])
        if h in seen:
            dup += 1
            continue
        seen.add(h)
        adv.append(q)
    print(f"JEEBench converted: {len(adv)} (skipped: {adv_skip})")

    os.makedirs(OUT_DIR, exist_ok=True)
    bank_path = os.path.join(OUT_DIR, "jee-bank.json")
    adv_path = os.path.join(OUT_DIR, "jee-adv.json")
    with open(bank_path, "w", encoding="utf-8") as f:
        json.dump(bank, f, ensure_ascii=False, separators=(",", ":"))
    with open(adv_path, "w", encoding="utf-8") as f:
        json.dump(adv, f, ensure_ascii=False, separators=(",", ":"))

    for name, arr in (("jee-bank", bank), ("jee-adv", adv)):
        by_type = {}
        by_subject = {}
        for q in arr:
            by_type[q["type"]] = by_type.get(q["type"], 0) + 1
            by_subject[q["subject"]] = by_subject.get(q["subject"], 0) + 1
        size = os.path.getsize(os.path.join(OUT_DIR, name + ".json")) / 1024 / 1024
        print(f"{name}: total={len(arr)} type={by_type} subject={by_subject} size={size:.2f} MB")


if __name__ == "__main__":
    main()
