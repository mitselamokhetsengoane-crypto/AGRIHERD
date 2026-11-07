"""
AI inference service.

IMPORTANT DESIGN CHANGE: nothing heavy happens at import time. 'ultralytics' (which pulls in PyTorch) is imported, and best.pt is
loaded, only on first use (or by the optional warm-up). Importing this module can never crash the API or exhaust memory on start-up.
"""
import logging
import os
import threading
import time
from pathlib import Path

logger = logging.getLogger(__name__)

DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[3] / "ai-model" / "weights" / "best.pt"
MODEL_PATH = Path(os.getenv("MODEL_PATH") or DEFAULT_MODEL_PATH)      # override on the server with MODEL_PATH
MIN_CONFIDENCE = float(os.getenv("AI_MIN_CONFIDENCE", "0.25"))
CONFIDENT_AT = float(os.getenv("AI_CONFIDENT_THRESHOLD", "0.50"))
IMAGE_SIZE = int(os.getenv("AI_IMAGE_SIZE", "640"))
MAX_CONCURRENT = int(os.getenv("AI_MAX_CONCURRENT", "1"))              # small servers: keep at 1 to avoid out-of-memory
QUEUE_WAIT_SECONDS = float(os.getenv("AI_QUEUE_WAIT_SECONDS", "20"))

_model = None
_last_error: str | None = None
_load_seconds: float | None = None
_load_lock = threading.Lock()
_slots = threading.BoundedSemaphore(MAX_CONCURRENT)


class ModelUnavailable(RuntimeError):
    """best.pt is missing, or the inference library cannot be loaded."""


def get_model():
    """Lazy, thread-safe singleton. Loads the model once and reuses it for every request."""
    global _model, _last_error, _load_seconds
    if _model is not None:
        return _model
    with _load_lock:
        if _model is not None:
            return _model
        if not MODEL_PATH.is_file():
            _last_error = "model file not found"
            logger.error("AI model file not found at %s", MODEL_PATH)
            raise ModelUnavailable("Disease detection model is unavailable on the server.")
        try:
            started = time.time()
            from ultralytics import YOLO          # heavy import happens HERE, not at start-up
            _model = YOLO(str(MODEL_PATH))
            _load_seconds = round(time.time() - started, 2)
            _last_error = None
            logger.info("AI model loaded from %s in %.1fs", MODEL_PATH, _load_seconds)
            return _model
        except Exception as exc:
            _last_error = f"{type(exc).__name__}"
            logger.exception("Failed to load AI model from %s", MODEL_PATH)
            raise ModelUnavailable("Disease detection model is unavailable on the server.") from exc


def get_status() -> dict:
    """Report model state WITHOUT loading it (safe for health checks)."""
    return {"loaded": _model is not None, "file_found": MODEL_PATH.is_file(), "load_seconds": _load_seconds, "last_error": _last_error}


def predict_disease(source):
    """
    source: a file path or a PIL image.
    Returns {"detections": [...], ...} on success, or {"error": "...", "status_code": int} when it cannot run.
    Only genuine model output is returned.
    """
    try:
        model = get_model()
    except ModelUnavailable as exc:
        return {"error": str(exc), "status_code": 503}

    if not _slots.acquire(timeout=QUEUE_WAIT_SECONDS):
        return {"error": "The scanner is busy with other requests. Please try again in a moment.", "status_code": 429}
    try:
        results = model.predict(source, imgsz=IMAGE_SIZE, conf=MIN_CONFIDENCE, verbose=False)
    except Exception:
        logger.exception("AI model failed to process image")
        return {"error": "The AI model could not process this image.", "status_code": 500}
    finally:
        _slots.release()

    res = results[0]
    names = model.names
    detections = []
    boxes = getattr(res, "boxes", None)
    probs = getattr(res, "probs", None)

    if boxes is not None and len(boxes):
        for box in boxes:
            class_id = int(box.cls[0])
            detections.append({
                "class_name": names[class_id],
                "confidence": float(box.conf[0]),
                "bbox": [float(x) for x in box.xyxy[0].tolist()],
            })
    elif probs is not None:                       # classification model: no boxes
        class_id = int(probs.top1)
        detections.append({"class_name": names[class_id], "confidence": float(probs.top1conf), "bbox": None})

    detections.sort(key=lambda d: d["confidence"], reverse=True)
    top = detections[0] if detections else None
    return {
        "detections": detections,
        "status": "completed" if top else "no_detection",
        "low_confidence": bool(top and top["confidence"] < CONFIDENT_AT),
        "message": None if top else "No known condition was recognised in this image above the minimum confidence.",
    }