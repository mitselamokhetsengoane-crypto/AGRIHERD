"""
Evaluation Metrics for AgriHerd AI Model
=========================================
Runs YOLOv8 validation on the test set and computes:
- Precision
- Recall
- F1-Score
- mAP50
- mAP50-95
- Per-class performance
"""

import os
import json
import sys

# Allow running as a standalone script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from model_loader import load_model


def evaluate_model(data_yaml_path: str = None, split: str = "test"):
    """
    Run evaluation on the test dataset.
    
    Args:
        data_yaml_path: Path to data.yaml. Defaults to dataset/data.yaml
        split: Which split to evaluate ("test", "val", or "train")
    
    Returns:
        dict with overall and per-class metrics
    """
    if data_yaml_path is None:
        # Try common locations
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "../../dataset/data.yaml"),
            os.path.join(os.path.dirname(__file__), "../../multicrop_clean/multicrop_clean/data.yaml"),
        ]
        for path in possible_paths:
            if os.path.exists(path):
                data_yaml_path = path
                break

    if not data_yaml_path or not os.path.exists(data_yaml_path):
        raise FileNotFoundError(
            f"data.yaml not found. Please specify the path or place your "
            f"dataset at dataset/data.yaml"
        )

    model = load_model()
    print(f"🔍 Running evaluation on '{split}' split...")

    metrics = model.val(data=data_yaml_path, split=split)

    # Overall metrics
    overall = {
        "precision": float(metrics.box.mp),
        "recall": float(metrics.box.mr),
        "mAP50": float(metrics.box.map50),
        "mAP50-95": float(metrics.box.map),
        "f1_score": 2 * (metrics.box.mp * metrics.box.mr) / (metrics.box.mp + metrics.box.mr + 1e-8)
    }

    # Per-class metrics
    per_class = {}
    for i, class_name in model.names.items():
        try:
            per_class[class_name] = {
                "precision": float(metrics.box.p[i]),
                "recall": float(metrics.box.r[i]),
                "mAP50": float(metrics.box.ap50[i]),
                "mAP50-95": float(metrics.box.ap[i])
            }
        except (IndexError, KeyError):
            per_class[class_name] = {"note": "No data in this split for this class"}

    result = {
        "overall": overall,
        "per_class": per_class,
        "split": split,
        "data_yaml": data_yaml_path
    }

    # Print summary
    print("\n" + "=" * 60)
    print("📊 Evaluation Results")
    print("=" * 60)
    print(f"Precision:  {overall['precision']:.4f} ({overall['precision']*100:.2f}%)")
    print(f"Recall:     {overall['recall']:.4f} ({overall['recall']*100:.2f}%)")
    print(f"F1 Score:   {overall['f1_score']:.4f}")
    print(f"mAP50:      {overall['mAP50']:.4f} ({overall['mAP50']*100:.2f}%)")
    print(f"mAP50-95:   {overall['mAP50-95']:.4f} ({overall['mAP50-95']*100:.2f}%)")
    print("=" * 60 + "\n")

    return result


if __name__ == "__main__":
    result = evaluate_model()
    
    # Save results to JSON for the report
    output_path = os.path.join(os.path.dirname(__file__), "metrics_results.json")
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"💾 Results saved to {output_path}")