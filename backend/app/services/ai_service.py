import logging
from pathlib import Path

from ultralytics import YOLO

logger = logging.getLogger(__name__)
MODEL_PATH = Path(__file__).resolve().parents[3] / "ai-model" / "weights" / "best.pt"

try:
    model = YOLO(str(MODEL_PATH))
    logger.info("AI model loaded from %s", MODEL_PATH)
except Exception:
    logger.exception("Failed to load AI model from %s", MODEL_PATH)
    model = None


def predict_disease(image_path: str):
    global model

    if model is None:
        try:
            model = YOLO(str(MODEL_PATH))
            logger.info("AI model loaded on demand from %s", MODEL_PATH)
        except Exception:
            logger.exception("AI model is unavailable at %s", MODEL_PATH)
            return {"error": "Disease detection model is unavailable on the server."}

    try:
        results = model(image_path)
    except Exception as exc:
        logger.exception("AI model failed to process image")
        raise RuntimeError("The AI model could not process this image.") from exc

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