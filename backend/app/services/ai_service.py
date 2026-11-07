import os
from ultralytics import YOLO

# Calculate absolute path to the model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODEL_PATH = os.path.join(BASE_DIR, "ai-model", "weights", "best.pt")

try:
    model = YOLO(MODEL_PATH)
    print(f"✅ AI Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading AI model: {e}")
    model = None


def predict_disease(image_path: str):
    """
    Run YOLOv8 inference on an image.
    Returns a dict with a 'detections' list.
    """
    if model is None:
        return {"error": "AI model is not loaded on the server."}

    results = model(image_path)
    detections = []

    for box in results[0].boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        class_name = model.names[class_id]

        detections.append({
            "class_name": class_name,
            "confidence": confidence,
            "bbox": [float(x) for x in box.xyxy[0].tolist()]
        })

    return {"detections": detections}