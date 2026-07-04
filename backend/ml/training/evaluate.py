"""
ml/training/evaluate.py

Evaluates the trained NER model on the dev split and prints per-label
precision, recall, and F1 scores.

Run from the backend/ directory:
    python ml/training/evaluate.py

What to look for:
  - F1 > 0.75 on HARD_SKILL and JOB_TITLE is good for a FYP.
  - EXPERIENCE and ORGANIZATION will likely be lower — that's fine,
    the Entity Ruler handles the high-confidence cases.
  - If overall F1 < 0.60, try: more training steps, check your
    label mapping, or add more annotated examples.
"""

import pathlib
import spacy
from spacy.tokens import DocBin
from spacy.scorer import Scorer
from spacy.training import Example

MODEL_PATH = pathlib.Path("ml/ner_model/model-best")
DEV_DATA   = pathlib.Path("ml/training/data/dev.spacy")


def evaluate():
    # ── load model ────────────────────────────────────────────────────────────
    if not MODEL_PATH.exists():
        print(f"Model not found at {MODEL_PATH}")
        print("Run ml/training/train.py first.")
        return

    print(f"Loading model from {MODEL_PATH}...")
    nlp = spacy.load(MODEL_PATH)

    # ── load dev data ─────────────────────────────────────────────────────────
    if not DEV_DATA.exists():
        print(f"Dev data not found at {DEV_DATA}")
        print("Run ml/training/convert.py first.")
        return

    print(f"Loading dev data from {DEV_DATA}...")
    dev_db = DocBin().from_disk(DEV_DATA)
    dev_docs = list(dev_db.get_docs(nlp.vocab))
    print(f"Dev examples: {len(dev_docs)}")

    # ── run evaluation ────────────────────────────────────────────────────────
    scorer = Scorer()
    examples = []
    for gold_doc in dev_docs:
        pred_doc = nlp(gold_doc.text)
        examples.append(Example(pred_doc, gold_doc))

    scores = scorer.score(examples)

    # ── print results ─────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("NER EVALUATION RESULTS")
    print("=" * 60)

    ents_overall = scores.get("ents_f", 0)
    print(f"\nOverall NER F1:     {ents_overall:.3f}")
    print(f"Overall Precision:  {scores.get('ents_p', 0):.3f}")
    print(f"Overall Recall:     {scores.get('ents_r', 0):.3f}")

    per_type = scores.get("ents_per_type", {})
    if per_type:
        print("\nPer-label breakdown:")
        print(f"  {'Label':<20} {'P':>6} {'R':>6} {'F1':>6}")
        print(f"  {'-'*20} {'-'*6} {'-'*6} {'-'*6}")
        for label, label_scores in sorted(per_type.items()):
            p  = label_scores.get("p", 0)
            r  = label_scores.get("r", 0)
            f1 = label_scores.get("f", 0)
            flag = "  ← needs work" if f1 < 0.60 else ""
            print(f"  {label:<20} {p:>6.3f} {r:>6.3f} {f1:>6.3f}{flag}")

    print("\n" + "=" * 60)

    if ents_overall >= 0.75:
        print("✓ Model looks good — deploy ml/ner_model/model-best")
    elif ents_overall >= 0.60:
        print("~ Acceptable — consider more training steps or more data")
    else:
        print("✗ Below threshold — review label mapping or add more examples")

    # ── quick qualitative test ────────────────────────────────────────────────
    print("\nQuick qualitative check on a sample sentence:")
    sample = (
        "Experienced Backend Developer with 3 years of experience in FastAPI, "
        "PostgreSQL, and Docker. Led a team of 4 engineers at TechCorp. "
        "B.Tech in Computer Science from IIT Delhi."
    )
    doc = nlp(sample)
    print(f"  Input: {sample[:80]}...")
    if doc.ents:
        for ent in doc.ents:
            print(f"  → [{ent.label_}]  {ent.text!r}")
    else:
        print("  No entities detected (check your model)")


if __name__ == "__main__":
    evaluate()