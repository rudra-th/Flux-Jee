"""Prepares 2025-2026 real question additions:
  - public/data/jee-2025.json  (JEE Main 2025, text)
      * CK0607/2025-Jee-Mains-Question (250 Math Jan 2025)
      * hymanshu/jee_mains_2025_shift1 (Physics/Chemistry only)
  - public/data/jee-mmjee.json (JEE Advanced 2019-2026, image-based)
      * ArkaMukherjee/mmJEE-Eval (English subset; images -> public/images/mmjee/)

Usage: python scripts/prepare-2025.py
Requires: pyarrow
"""
import csv
import json
import os
import re
import sys

import pyarrow.parquet as pq

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chapter_infer import infer_chapter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "public", "data")
IMG_DIR = os.path.join(ROOT, "public", "images", "mmjee")
SRC_DIR = r"C:\Users\Asus\AppData\Local\Temp\opencode\jee-data"
CK0607_CSV = os.path.join(SRC_DIR, "ck0607_2025.csv")
HYMANSHU_PARQUET = os.path.join(SRC_DIR, "hymanshu2025s1.parquet")
MMJEE_PARQUET = os.path.join(SRC_DIR, "mmjee", "train.parquet")
CREATED_AT = "2026-08-05T00:00:00.000Z"

SUBJECT_ID = {"Mathematics": "mathematics", "maths": "mathematics", "physics": "physics",
              "Physics": "physics", "Chemistry": "chemistry", "chemistry": "chemistry"}


def base_question(qid, subject, chapter, qtype, answer, options, text, year, paper, exam, shift=None, session=None, img=None, difficulty=3, tag_extra=()):
    return {
        "id": qid,
        "exam": exam,
        "year": year,
        "shift": shift,
        "paper": paper,
        "session": session,
        "subject": subject,
        "chapter": chapter,
        "microTopic": chapter,
        "difficulty": difficulty,
        "estimatedTime": 60 + (20 if qtype != "integer" else 30),
        "type": qtype,
        "content": {"text": text} if not img else {"image": img, "text": "Question shown as image."},
        "options": options,
        "answer": answer,
        "solution": {"detailed": "", "hints": [chapter or "Solve using standard concepts"], "concept": chapter},
        "tags": list(tag_extra),
        "createdAt": CREATED_AT,
    }

def parse_ck0607():
    rows = list(csv.DictReader(open(CK0607_CSV, encoding="utf-8-sig", newline="")))
    out = []
    skipped = 0
    shift_re = re.compile(r"\((\d{1,2}) (\w+) Shift (\d)\)")
    for r in rows:
        qtext = (r.get("Question Text") or "").strip()
        subject = SUBJECT_ID.get((r.get("Subject") or "").strip())
        if not subject or not qtext:
            skipped += 1
            continue
        # Split options: "(1) ... (2) ..." lines at the end of the text.
        m = re.search(r"\n\(1\)\s*", qtext) or re.search(r"^\(1\)\s*", qtext)
        if m:
            stem = qtext[: m.start()].strip()
            tail = qtext[m.start():]
            parts = re.split(r"\(([1-4])\)\s*", tail)
            options = []
            for i in range(1, len(parts) - 1, 2):
                num = int(parts[i])
                opt_text = re.sub(r"\s*\n\s*", " ", parts[i + 1]).strip()
                if opt_text:
                    options.append({"key": str(num), "text": opt_text})
            if len(options) < 2:
                skipped += 1
                continue
            ans = (r.get("Correct Option") or "").strip()
            try:
                v = int(ans)
                if not (1 <= v <= len(options)):
                    raise ValueError
                correct_index = v - 1
            except (ValueError, TypeError):
                skipped += 1
                continue
            sm = shift_re.search(r.get("Shift Name") or "")
            shift = int(sm.group(3)) if sm else None
            chapter = infer_chapter(subject, stem) or "General"
            stem_clean = re.sub(r"\s*\n\s*", " ", stem)
            uid = (r.get("unique_id") or "").strip()
            out.append(base_question(
                f"m2025-{uid}", subject, chapter, "single",
                {"type": "single", "correctIndex": correct_index},
                options, stem_clean, 2025, "session-1", "jee-main",
                shift=shift, session=1, tag_extra=("JEE Main 2025", "Jan 2025"),
            ))
        else:
            # Numeric/integer question — answer is a bare number in Correct Option.
            stem_clean = re.sub(r"\s*\n\s*", " ", qtext).rstrip(".")
            ans = (r.get("Correct Option") or "").strip()
            try:
                if "." in ans:
                    v = float(ans)
                    if not v.is_integer():
                        answer = {"type": "numerical", "correctValue": v, "range": [v - 0.5, v + 0.5]}
                        qtype_out = "numerical"
                    else:
                        v = int(v)
                        answer = {"type": "integer", "correctValue": v, "range": [v, v]}
                        qtype_out = "integer"
                else:
                    v = int(ans)
                    answer = {"type": "integer", "correctValue": v, "range": [v, v]}
                    qtype_out = "integer"
            except (ValueError, TypeError):
                skipped += 1
                continue
            sm = shift_re.search(r.get("Shift Name") or "")
            shift = int(sm.group(3)) if sm else None
            chapter = infer_chapter(subject, qtext) or "General"
            uid = (r.get("unique_id") or "").strip()
            out.append(base_question(
                f"m2025-{uid}", subject, chapter, qtype_out,
                answer, [], stem_clean, 2025, "session-1", "jee-main",
                shift=shift, session=1, tag_extra=("JEE Main 2025", "Jan 2025"),
            ))
    return out, skipped

def parse_hymanshu():
    df = pq.read_table(HYMANSHU_PARQUET).to_pandas()
    out = []
    skipped = 0
    for idx, r in df.iterrows():
        subject = SUBJECT_ID.get(str(r["subject"]).lower())
        if subject == "mathematics":
            continue  # duplicates CK0607
        if not subject:
            skipped += 1
            continue
        q = re.sub(r"\s*\n\s*", " ", str(r["question"])).strip()
        if not q or "\ufffd" in q:
            skipped += 1
            continue
        chapter = infer_chapter(subject, q) or "General"
        qtype = str(r["question_type"]).lower()
        qid = f"h2025-{idx:03d}"
        if qtype == "mcq":
            opts = r["options"]
            options = []
            if not isinstance(opts, float):
                for o in opts:
                    options.append({"key": str(o["identifier"]), "text": str(o["content"]).strip()})
            correct = r["correct_option"]
            if isinstance(correct, float) or not correct:
                skipped += 1
                continue
            letters = [str(c).strip().upper() for c in correct]
            key_to_idx = {o["key"].upper(): i for i, o in enumerate(options)}
            indices = [key_to_idx[l] for l in letters if l in key_to_idx]
            if not indices or len(options) < 2:
                skipped += 1
                continue
            if len(indices) == 1:
                answer = {"type": "single", "correctIndex": indices[0]}
                qtype_out = "single"
            else:
                answer = {"type": "multiple", "correctIndices": indices}
                qtype_out = "multiple"
            out.append(base_question(
                qid, subject, chapter, qtype_out, answer, options, q,
                2025, "session-1", "jee-main", shift=1, session=1,
                tag_extra=("JEE Main 2025", "Jan 2025"),
            ))
        else:
            ans = r["answer"]
            try:
                v = int(ans)
            except (ValueError, TypeError):
                skipped += 1
                continue
            out.append(base_question(
                qid, subject, chapter, "integer",
                {"type": "integer", "correctValue": v, "range": [v, v]},
                [], q, 2025, "session-1", "jee-main", shift=1, session=1,
                tag_extra=("JEE Main 2025", "Jan 2025"),
            ))
    return out, skipped

def parse_numerical_answer(raw):
    """Parse mmJEE-style numerical answer strings into (value, range) or None.

    Handles: '7', '3.5', '7.00 TO 10.00', '0.99 to 1.01', '49 TO 51',
    '[0.5] OR [3.13 TO 3.15]', '9 OR 13 OR 14', '[-2640.00 to -2620.00] or ...'.
    Returns (correctValue, [lo, hi]) using the first accepted alternative.
    """
    num_re = re.compile(r"-?\d+(?:\.\d+)?")
    alt_re = re.compile(r"\s*(?:OR|or)\s*")
    segments = [s.strip() for s in alt_re.split(raw) if s.strip()]
    if not segments:
        return None
    seg = segments[0]
    nums = num_re.findall(seg)
    if not nums:
        return None
    values = [float(n) for n in nums]
    if re.search(r"\b(?:TO|to)\b", seg):
        lo, hi = min(values), max(values)
    elif len(values) == 1:
        lo = hi = values[0]
    else:
        lo, hi = values[0], values[0]
    if hi < lo:
        lo, hi = hi, lo
    return ((lo + hi) / 2, [lo, hi])

def parse_mmjee():
    df = pq.read_table(MMJEE_PARQUET).to_pandas()
    out = []
    skipped = 0
    for _, r in df.iterrows():
        if str(r["language"]).lower() != "english":
            continue
        subject = SUBJECT_ID.get(str(r["subject"]).title())
        if not subject:
            skipped += 1
            continue
        qtype = str(r["question_type"]).strip()
        answer_raw = str(r["answer"]).strip()
        qid = "mmjee-" + str(r["question_id"]).strip()
        img_name = f"{qid}.png"
        img_rel = f"images/mmjee/{img_name}"
        chapter = "JEE Advanced PYQ"
        year = int(re.sub(r"\D", "", str(r["year"]))[:4] or 2019)
        paper = "paper-1" if str(r["paper"]).upper() == "P1" else "paper-2"
        if qtype == "Numerical":
            parsed = parse_numerical_answer(answer_raw)
            if not parsed:
                skipped += 1
                continue
            v, rng = parsed
            if rng[0] == rng[1] and v.is_integer():
                v = int(v)
                answer = {"type": "integer", "correctValue": v, "range": [v, v]}
                qtype_out = "integer"
            else:
                answer = {"type": "numerical", "correctValue": v, "range": rng}
                qtype_out = "numerical"
            options = []
        elif qtype == "MCQ-Single":
            letters = "ABCD"
            if answer_raw not in letters:
                # Mislabeled multi-answer (e.g. 'ACD') — treat as MCQ-Multiple.
                indices = [letters.index(c) for c in answer_raw if c in letters]
                if not indices:
                    skipped += 1
                    continue
                answer = {"type": "multiple", "correctIndices": indices}
                qtype_out = "multiple"
            else:
                answer = {"type": "single", "correctIndex": letters.index(answer_raw)}
                qtype_out = "single"
            options = [{"key": c, "text": f"Option {c} (see image)"} for c in letters]
        elif qtype == "MCQ-Multiple":
            letters = "ABCD"
            indices = [letters.index(c) for c in answer_raw if c in letters]
            if not indices:
                skipped += 1
                continue
            answer = {"type": "multiple", "correctIndices": indices}
            qtype_out = "multiple"
            options = [{"key": c, "text": f"Option {c} (see image)"} for c in letters]
        elif qtype == "Matching":
            # JEE Advanced matching questions have A-D answer options (in the image).
            letters = "ABCD"
            if answer_raw not in letters:
                skipped += 1
                continue
            correct_index = letters.index(answer_raw)
            answer = {"type": "single", "correctIndex": correct_index}
            qtype_out = "single"
            options = [{"key": c, "text": f"Option {c} (see image)"} for c in letters]
        else:
            skipped += 1
            continue
        out.append(base_question(
            qid, subject, chapter, qtype_out, answer, options, "",
            year, paper, "jee-advanced", session=2, img=img_rel,
            difficulty=5, tag_extra=("JEE Advanced", str(year), str(r["paper"])),
        ))
    return out, skipped

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)

    m2025, s1 = parse_ck0607()
    h2025, s2 = parse_hymanshu()
    mmjee, s3 = parse_mmjee()

    # Copy mmJEE images from the parquet into public/images/mmjee/.
    df = pq.read_table(MMJEE_PARQUET).to_pandas()
    img_map = {}
    for _, r in df.iterrows():
        if str(r["language"]).lower() != "english":
            continue
        img = r["image"]
        if not isinstance(img, dict) or not img.get("bytes"):
            continue
        name = "mmjee-" + str(r["question_id"]).strip() + ".png"
        img_map[name] = img["bytes"]
    written = 0
    for name, blob in img_map.items():
        with open(os.path.join(IMG_DIR, name), "wb") as f:
            f.write(blob)
        written += 1

    with open(os.path.join(DATA_DIR, "jee-2025.json"), "w", encoding="utf-8") as f:
        json.dump(m2025 + h2025, f, ensure_ascii=False)
    with open(os.path.join(DATA_DIR, "jee-mmjee.json"), "w", encoding="utf-8") as f:
        json.dump(mmjee, f, ensure_ascii=False)

    print(f"CK0607  : {len(m2025)} (skipped {s1})")
    print(f"hymanshu: {len(h2025)} (skipped {s2})")
    print(f"mmJEE   : {len(mmjee)} (skipped {s3})")
    print(f"images  : {written}")
    print(f"2025    : {os.path.join(DATA_DIR, 'jee-2025.json')}")
    print(f"mmJEE   : {os.path.join(DATA_DIR, 'jee-mmjee.json')}")

if __name__ == "__main__":
    main()
