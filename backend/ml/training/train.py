import pathlib
import sys
import spacy
from spacy.cli.train import train as spacy_train

CONFIG     = pathlib.Path("ml/training/config.cfg")
TRAIN_DATA = pathlib.Path("ml/training/data/train.spacy")
DEV_DATA   = pathlib.Path("ml/training/data/dev.spacy")
OUTPUT_DIR = pathlib.Path("ml/ner_model")

def check_prerequisites():
    errors = []
    if not CONFIG.exists():
        errors.append(f"Missing config: {CONFIG}")
    if not TRAIN_DATA.exists():
        errors.append(f"Missing train data — run convert.py first")
    if not DEV_DATA.exists():
        errors.append(f"Missing dev data — run convert.py first")
    if errors:
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)
    print("✓ All prerequisites met")

def train():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nStarting training... (10–30 mins on CPU)\n")

    spacy_train(
        CONFIG,
        output_path=OUTPUT_DIR,
        overrides={
            "paths.train": TRAIN_DATA.as_posix(),
            "paths.dev":   DEV_DATA.as_posix(),
        }
    )

    best = OUTPUT_DIR / "model-best"
    if best.exists():
        print(f"\n✓ Done. Model saved at: {best}")
        print(f"Next step: python ml/training/evaluate.py")
    else:
        print(f"\n✗ model-best not found after training")
        sys.exit(1)

if __name__ == "__main__":
    check_prerequisites()
    train()