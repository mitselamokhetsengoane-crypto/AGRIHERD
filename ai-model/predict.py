"""
Standalone Prediction Script for AgriHerd
==========================================
Usage:
    python predict.py path/to/image.jpg
    python predict.py path/to/image.jpg --save
    python predict.py path/to/image.jpg --json
"""

import sys
import os
import json
import argparse
from datetime import datetime
from model_loader import load_model

# Ensure predictions directory exists
PREDICTIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "predictions")
os.makedirs(PREDICTIONS_DIR, exist_ok=True)


def predict_image(image_path: str, save_annotated: bool = False, as_json: bool = False):
    """
    Run inference on an image and return detections.
    
    Args:
        image_path: Path to the image file
        save_annotated: Save an annotated image to predictions/
        as_json: Return JSON output instead of printing
    
    Returns:
        dict with detections
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    model = load_model()
    results = model(image_path)

    detections = []
    for box in results[0].boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        bbox = [float(x) for x in box.xyxy[0].tolist()]
        
        detections.append({
            "class_id": class_id,
            "class_name": model.names[class_id],
            "confidence": round(confidence, 4),
            "bbox": {
                "x1": round(bbox[0], 2),
                "y1": round(bbox[1], 2),
                "x2": round(bbox[2], 2),
                "y2": round(bbox[3], 2)
            }
        })

    # Save annotated image if requested
    annotated_path = None
    if save_annotated:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        annotated_path = os.path.join(PREDICTIONS_DIR, f"{base_name}_{timestamp}_annotated.jpg")
        annotated_img = results[0].plot()
        import cv2
        cv2.imwrite(annotated_path, annotated_img)

    output = {
        "image": image_path,
        "num_detections": len(detections),
        "detections": detections,
        "annotated_image": annotated_path,
        "timestamp": datetime.now().isoformat()
    }

    if as_json:
        return output

    # Pretty print to console
    print("\n" + "=" * 60)
    print("AgriHerd AI Disease Detection")
    print("=" * 60)
    print(f"Image: {image_path}")
    print(f"Detections: {len(detections)}")
    print("-" * 60)

    if not detections:
        print("No diseases detected. The crop appears healthy.")
    else:
        for i, det in enumerate(detections, 1):
            print(f"\n[{i}] {det['class_name']}")
            print(f"    Confidence: {det['confidence'] * 100:.2f}%")
            print(f"    Bounding Box: ({det['bbox']['x1']}, {det['bbox']['y1']}) to ({det['bbox']['x2']}, {det['bbox']['y2']})")

    if annotated_path:
        print(f"\nAnnotated image saved: {annotated_path}")

    print("=" * 60 + "\n")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AgriHerd AI Disease Prediction")
    parser.add_argument("image", help="Path to the image file")
    parser.add_argument("--save", action="store_true", help="Save annotated image")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    try:
        result = predict_image(args.image, save_annotated=args.save, as_json=args.json)
        if args.json:
            print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)