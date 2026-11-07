from io import BytesIO
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

from app.core.permissions import get_current_user
from app.main import api, app


client = TestClient(app)


class TestDiseaseScanner(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {"sub": "user-id"}

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    @staticmethod
    def make_png():
        image_buffer = BytesIO()
        Image.new("RGB", (16, 16), color="green").save(image_buffer, format="PNG")
        return image_buffer.getvalue()

    def test_scan_valid_image_returns_detections(self):
        with (
            patch(
                "app.api.v1.disease_scanner.predict_disease",
                return_value={
                    "detections": [
                        {
                            "class_name": "Healthy_Banana",
                            "confidence": 0.8,
                            "bbox": [1, 2, 3, 4],
                        }
                    ]
                },
            ) as predict_mock,
            patch("app.api.v1.disease_scanner.supabase") as supabase_mock,
        ):
            response = client.post(
                "/api/v1/disease-scanner/scan",
                files={"file": ("crop.png", self.make_png(), "image/png")},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["detections"][0]["class_name"],
            "Healthy_Banana",
        )
        predict_mock.assert_called_once()
        supabase_mock.table.assert_called_once_with("disease_scans")
        supabase_mock.table.return_value.insert.assert_called_once_with({
            "user_id": "user-id",
            "detected_disease": "Healthy_Banana",
            "confidence": 0.8,
        })

    def test_scan_rejects_invalid_image_with_actionable_error(self):
        response = client.post(
            "/api/v1/disease-scanner/scan",
            files={"file": ("crop.png", b"not an image", "image/png")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("valid JPEG, PNG, or WEBP", response.json()["detail"])

    def test_scan_reports_unavailable_model(self):
        with patch(
            "app.api.v1.disease_scanner.predict_disease",
            return_value={"error": "Disease detection model is unavailable on the server."},
        ):
            response = client.post(
                "/api/v1/disease-scanner/scan",
                files={"file": ("crop.png", self.make_png(), "image/png")},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("model is unavailable", response.json()["detail"])
