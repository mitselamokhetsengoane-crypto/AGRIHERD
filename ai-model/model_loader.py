"""
AI Model Loader for AgriHerd
============================
Loads the YOLOv8 disease detection model once and exposes it as a singleton.

This module is imported by:
- backend/app/services/ai_service.py (for FastAPI predictions)
- ai-model/predict.py (for standalone CLI predictions)
- ai-model/evaluation/metrics.py (for evaluation)
"""

import os
from ultralytics import YOLO

# Calculate the absolute path to the model file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "weights", "best.pt")

# Singleton instance
_model_instance = None


def load_model():
    """
    Load the YOLOv8 model. Uses lazy loading so the model is only
    loaded once, regardless of how many times this function is called.
    """
    global _model_instance

    if _model_instance is not None:
        return _model_instance

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"AI model not found at {MODEL_PATH}\n"
            f"   Please place your trained 'best.pt' file in ai-model/weights/"
        )

    print(f"Loading AI model from {MODEL_PATH}...")
    _model_instance = YOLO(MODEL_PATH)
    print("Model loaded successfully!")
    print(f"   Classes: {len(_model_instance.names)}")
    print(f"   Class names: {list(_model_instance.names.values())[:5]}... (showing first 5)")

    return _model_instance


def get_model_info():
    """
    Returns metadata about the loaded model.
    Useful for the AI dashboard and evaluation reports.
    """
    model = load_model()
    return {
        "model_path": MODEL_PATH,
        "num_classes": len(model.names),
        "classes": model.names,
        "task": model.task,  # "detect"
        "model_name": "YOLOv8n (custom-trained)",
    }