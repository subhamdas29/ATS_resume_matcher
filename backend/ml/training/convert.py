import json
import random
import pathlib
import spacy
from spacy.tokens import DocBin
from spacy.util import filter_spans

RAW_FILE    = pathlib.Path("ml/training/data/raw/Entity Recognition in Resumes.json")
OUT_DIR     = pathlib.Path("ml/training/data")
TRAIN_RATIO = 0.85
RANDOM_SEED = 42

LABEL_MAP = {
    "Skills":               "HARD_SKILL",
    "Designation":          "JOB_TITLE",
    "College Name":         "ORGANIZATION",
    "Companies worked at":  "ORGANIZATION",
    "Degree":               "EDUCATION",
    "Years of Experience":  "EXPERIENCE",
}

def load_raw(path):
    records = []
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().strip()
    try:
        data = json.loads(content)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    for line in content.splitlines():
        line = line.strip()
        if line:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return records

def clean_span(text, start, end):
    """
    Aggressively strip whitespace and punctuation from both ends
    of a span by walking the character indices inward.
    Returns (start, end) or None if nothing valid remains.
    """
    STRIP_CHARS = ' \t\n\r\xa0.,;:!?\'"()[]{}•-'
    while start < end and text[start] in STRIP_CHARS:
        start += 1
    while end > start and text[end - 1] in STRIP_CHARS:
        end -= 1
    if start >= end:
        return None
    return start, end

def build_docbin(examples, nlp):
    db = DocBin()
    skipped = 0
    for text, entities in examples:
        doc = nlp.make_doc(text)
        spans = []
        for start, end, label in entities:
            cleaned = clean_span(text, start, end)
            if cleaned is None:
                skipped += 1
                continue
            start, end = cleaned
            span = doc.char_span(start, end, label=label, alignment_mode="contract")
            if span is None:
                skipped += 1
                continue
            # Reject if the tokenized span still has boundary whitespace
            if span.text != span.text.strip():
                skipped += 1
                continue
            if not span.text.strip():
                skipped += 1
                continue
            spans.append(span)
        doc.ents = filter_spans(spans)
        db.add(doc)
    print(f"  [info] {skipped} spans skipped")
    return db

def main():
    print("Loading spaCy tokenizer...")
    nlp = spacy.blank("en")

    print(f"Reading {RAW_FILE}...")
    records = load_raw(RAW_FILE)
    print(f"Loaded {len(records)} records")

    examples = []
    for rec in records:
        text = rec.get("content", "")
        if not text:
            continue
        entities = []
        for ann in (rec.get("annotation") or []):
            for label_str in ann.get("label", []):
                mapped = LABEL_MAP.get(label_str)
                if not mapped:
                    continue
                for point in ann.get("points", []):
                    start = point.get("start")
                    end   = point.get("end")
                    if start is None or end is None:
                        continue
                    # Kaggle end is inclusive — make exclusive
                    entities.append((start, end + 1, mapped))
        if entities:
            examples.append((text, entities))

    print(f"Converted {len(examples)} examples")

    random.seed(RANDOM_SEED)
    random.shuffle(examples)
    split = int(len(examples) * TRAIN_RATIO)
    train_ex = examples[:split]
    dev_ex   = examples[split:]
    print(f"Train: {len(train_ex)}, Dev: {len(dev_ex)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_docbin(train_ex, nlp).to_disk(OUT_DIR / "train.spacy")
    build_docbin(dev_ex,   nlp).to_disk(OUT_DIR / "dev.spacy")
    print("Done. Run: python ml/training/train.py")

if __name__ == "__main__":
    main()