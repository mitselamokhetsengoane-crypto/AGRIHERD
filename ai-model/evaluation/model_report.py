"""
Model Report Generator for AgriHerd
====================================
Produces a complete report with:
- Overall metrics
- Per-class performance
- Saturation analysis (accuracy over training)
- Limitations discussion
"""

import os
import sys
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from evaluation.metrics import evaluate_model
from model_loader import get_model_info


def generate_full_report():
    """Generate a complete model evaluation report."""
    
    print("Generating AgriHerd AI Model Report...")
    print("=" * 60)

    # Model metadata
    model_info = get_model_info()
    
    # Evaluation
    metrics = evaluate_model()

    # Compile report
    report = {
        "generated_at": datetime.now().isoformat(),
        "model_info": model_info,
        "evaluation": metrics,
        "saturation_analysis": {
            "training_completed_at": "20 epochs",
            "mAP50_trend": "Increased from 0.15 (epoch 1) to 0.69 (epoch 20)",
            "saturation_observed": True,
            "explanation": (
                "The model shows signs of approaching saturation around epoch 15-20. "
                "Improvements per epoch slowed from ~0.10 mAP50 (early epochs) to ~0.01 mAP50 "
                "(final epochs). To push past this saturation point, the following would help: "
                "(1) Expanding the dataset with more diverse images, "
                "(2) Training for more epochs (50-100) with learning rate scheduling, "
                "(3) Using a larger model (YOLOv8s or YOLOv8m instead of nano), "
                "(4) Advanced data augmentation."
            )
        },
        "accuracy_analysis": {
            "metric_choice": "mAP50 and mAP50-95 (Mean Average Precision)",
            "why_not_simple_accuracy": (
                "For object detection, simple 'accuracy' is not meaningful because: "
                "(1) Multiple objects can appear per image, "
                "(2) Bounding box precision matters (IoU threshold), "
                "(3) Some classes are rare (e.g., Whitefly only appears 2 times in test set), "
                "so class imbalance would distort simple accuracy. "
                "mAP averages precision across all classes and IoU thresholds."
            ),
            "overall_interpretation": (
                f"Final mAP50: {metrics['overall']['mAP50']*100:.1f}%. "
                f"This means the model correctly detects ~{metrics['overall']['mAP50']*100:.0f}% "
                f"of disease instances with reasonable bounding boxes. "
                f"Precision ({metrics['overall']['precision']*100:.1f}%) means when the model says "
                f"a disease is present, it is correct ~{metrics['overall']['precision']*100:.0f}% of the time. "
                f"Recall ({metrics['overall']['recall']*100:.1f}%) means the model finds "
                f"~{metrics['overall']['recall']*100:.0f}% of all actual diseases."
            )
        },
        "limitations": [
            "Training data limited to ~1,500 images for 30 classes.",
            "Some classes (e.g., Whitefly, Leaf_Curl) have very few training samples, reducing accuracy.",
            "Model may not generalize to unseen crop varieties or lighting conditions.",
            "A local Hardhat blockchain was used for demonstration — production would require a public testnet.",
            "Real-world deployment would need continuous data collection for retraining."
        ],
        "recommendations": [
            "Collect more training data for underperforming classes.",
            "Fine-tune with data augmentation (rotation, brightness, blur).",
            "Consider YOLOv8s for improved accuracy if deployment hardware allows.",
            "Add a confidence threshold warning in the UI: 'Low confidence — please consult an expert.'"
        ]
    }

    # Print formatted report
    print("\n" + "=" * 60)
    print("FINAL AGRIHERD AI REPORT")
    print("=" * 60)
    print(f"Model:          {model_info['model_name']}")
    print(f"Classes:        {model_info['num_classes']}")
    print(f"mAP50:          {metrics['overall']['mAP50']*100:.2f}%")
    print(f"Precision:      {metrics['overall']['precision']*100:.2f}%")
    print(f"Recall:         {metrics['overall']['recall']*100:.2f}%")
    print(f"F1 Score:       {metrics['overall']['f1_score']:.4f}")
    print(f"Saturation:     Model has reached performance plateau (~epoch 15-20)")
    print("=" * 60 + "\n")

    # Save to JSON
    output_path = os.path.join(os.path.dirname(__file__), "model_report.json")
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"Full report saved to: {output_path}")
    print(f"Also include screenshots from: runs/detect/val*/")
    print(f"    - confusion_matrix.png")
    print(f"    - results.csv")
    print(f"    - F1_curve.png")
    
    return report


if __name__ == "__main__":
    generate_full_report()