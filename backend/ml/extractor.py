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
    # Load the trained NER model as the base (it already has tok2vec + ner)
    if _NER_MODEL_PATH.exists():
        nlp = spacy.load(_NER_MODEL_PATH)
        print("[extractor] Custom NER model loaded as base pipeline")
    else:
        nlp = spacy.load("en_core_web_lg", exclude=["ner"])
        print("[extractor] No trained NER model found — using en_core_web_lg only")

    # Add Entity Ruler BEFORE the NER so it runs first
    # (overwrite_ents=False means ruler results are protected from NER overwriting)
    if "entity_ruler" not in nlp.pipe_names:
        ruler = nlp.add_pipe("entity_ruler", before="ner", config={"overwrite_ents": False})
        patterns = []
        with open(_RULER_PATTERNS, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    patterns.append(json.loads(line))
        ruler.add_patterns(patterns)
        print(f"[extractor] Entity Ruler loaded: {len(patterns)} patterns")

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