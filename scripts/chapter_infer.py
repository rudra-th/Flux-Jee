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

import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SYLLABUS_PATH = os.path.join(SCRIPT_DIR, "..", "src", "constants", "syllabus.ts")

# (chapter, [keywords]) — matched as lowercase substrings, specific-first.
# Shared with scripts/prepare-pyp.mjs via scripts/chapter_keywords.json so the
# JS and Python data pipelines classify questions identically.
def _load_keywords() -> dict[str, list[tuple[str, list[str]]]]:
    with open(os.path.join(SCRIPT_DIR, "chapter_keywords.json"), encoding="utf-8") as f:
        data = json.load(f)
    return {
        subject: [(ch, list(kws)) for ch, kws in entries]
        for subject, entries in data.items()
    }


KEYWORDS: dict[str, list[tuple[str, list[str]]]] = _load_keywords()
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
