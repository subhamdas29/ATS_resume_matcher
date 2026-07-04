"""
ml/extractor.py

Entry point for keyword extraction. Currently uses the Entity Ruler only.
When the custom NER model is trained, it will be layered in here — nothing
outside this file needs to change.

Returns the same dict shape that keywords.py previously got from Groq,
so ATS_score.py and suggestions.py are completely unaffected.
"""

import json
import pathlib
import spacy
from spacy.pipeline import EntityRuler

# ── paths ────────────────────────────────────────────────────────────────────
_BASE = pathlib.Path(__file__).parent          # ml/
_RULER_PATTERNS = _BASE / "entity_ruler" / "skills.jsonl"
_NER_MODEL_PATH = _BASE / "ner_model" / "model-best"  # saved by train.py

# ── label → output-key mapping ───────────────────────────────────────────────
_LABEL_TO_KEY = {
    "HARD_SKILL":   "hard_skills",
    "SOFT_SKILL":   "soft_skills",
    "JOB_TITLE":    "job_titles",
    "EDUCATION":    "education",
    "CERTIFICATION":"certifications",
    "ORGANIZATION": "organizations",
    "EXPERIENCE":   "experience",
}

# ── model is loaded ONCE at import time, not on every request ─────────────────
def _build_pipeline() -> spacy.Language:
    """
    Build the spaCy pipeline:
      1. Load base model (for tokenization + sentence splitting).
      2. Add EntityRuler with our skills dictionary.
      3. If a trained NER model exists, add it as a second pass.

    Returns a ready-to-use nlp pipeline.
    """
    # Step 1 — base model (tokenizer + tagger, no NER yet)
    nlp = spacy.load("en_core_web_sm", exclude=["ner"])

    # Step 2 — Entity Ruler (dictionary-based, fast)
    ruler = nlp.add_pipe("entity_ruler", config={"overwrite_ents": False})
    patterns = []
    with open(_RULER_PATTERNS, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                patterns.append(json.loads(line))
    ruler.add_patterns(patterns)
    print(f"[extractor] Entity Ruler loaded: {len(patterns)} patterns")

    # Step 3 — Custom NER model (plugged in later — nothing to change here)
    if _NER_MODEL_PATH.exists():
        # Load the trained NER component and add it after the ruler
        ner_nlp = spacy.load(_NER_MODEL_PATH)
        if "ner" in ner_nlp.pipe_names:
            nlp.add_pipe(
                "ner",
                source=ner_nlp,
                name="custom_ner",
                after="entity_ruler",
            )
            print("[extractor] Custom NER model loaded and added to pipeline")
    else:
        print("[extractor] No trained NER model found — using Entity Ruler only")

    return nlp


# Load once at module import
_nlp = _build_pipeline()


# ── public API ────────────────────────────────────────────────────────────────
def extract_keywords(text: str) -> dict:
    """
    Run the full extraction pipeline on a text string.

    Returns a dict with keys matching what keywords.py previously returned
    from Groq, so everything above this layer is unchanged:

    {
        "hard_skills":    ["Python", "FastAPI", "PostgreSQL", ...],
        "soft_skills":    ["teamwork", "communication", ...],
        "job_titles":     ["Backend Developer", ...],
        "education":      ["B.Tech", "Computer Science", ...],
        "certifications": ["AWS Certified", ...],
        "organizations":  [],          # populated by custom NER once trained
        "experience":     [],          # populated by custom NER once trained
    }
    """
    if not text or not text.strip():
        return _empty_result()

    doc = _nlp(text)

    result = _empty_result()
    seen = set()  # deduplicate across both ruler + NER

    for ent in doc.ents:
        key = _LABEL_TO_KEY.get(ent.label_)
        if key is None:
            continue
        # Normalise: strip whitespace, preserve original casing
        value = ent.text.strip()
        dedup_key = (key, value.lower())
        if dedup_key not in seen:
            seen.add(dedup_key)
            result[key].append(value)

    return result


def _empty_result() -> dict:
    return {key: [] for key in _LABEL_TO_KEY.values()}