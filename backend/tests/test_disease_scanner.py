from io import BytesIO
from uuid import uuid4
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from PIL import Image

from app.core.permissions import get_current_user
from app.main import api, app


client = TestClient(app)


class TestDiseaseScanner(unittest.TestCase):
    user_id = str(uuid4())

    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {"sub": self.user_id}

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    @staticmethod
    def make_png():
        image_buffer = BytesIO()
        Image.new("RGB", (16, 16), color="green").save(image_buffer, format="PNG")
        return image_buffer.getvalue()

    def test_scan_saves_and_returns_complete_prediction(self):
        prediction = {
            "detections": [
                {
                    "class_name": "Healthy_Banana",
                    "confidence": 0.8,
                    "bbox": [1, 2, 3, 4],
                }
            ],
            "status": "completed",
            "low_confidence": False,
            "message": None,
        }
        scan_id = str(uuid4())
        saved_record = {
            "id": scan_id,
            "user_id": self.user_id,
            "detected_disease": "Healthy_Banana",
            "confidence": 0.8,
            "image_url": None,
            "prediction": prediction,
        }
        with (
            patch(
                "app.api.v1.disease_scanner.predict_disease_remote",
                new_callable=AsyncMock,
                return_value=prediction,
            ) as predict_mock,
            patch("app.api.v1.disease_scanner.supabase") as supabase_mock,
        ):
            insert = supabase_mock.table.return_value.insert.return_value
            insert.select.return_value.execute.return_value.data = [saved_record]
            response = client.post(
                "/api/v1/disease-scanner/scan",
                files={"file": ("crop.png", self.make_png(), "image/png")},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), saved_record)
        predict_mock.assert_awaited_once()
        self.assertTrue(predict_mock.await_args.kwargs["image_bytes"])
        self.assertEqual(predict_mock.await_args.kwargs["content_type"], "image/jpeg")
        supabase_mock.table.assert_called_once_with("disease_scans")
        supabase_mock.table.return_value.insert.assert_called_once_with({
            "user_id": self.user_id,
            "detected_disease": "Healthy_Banana",
            "confidence": 0.8,
            "prediction": prediction,
        })

    def test_scan_does_not_save_when_ai_prediction_fails(self):
        from fastapi import HTTPException

        with (
            patch(
                "app.api.v1.disease_scanner.predict_disease_remote",
                new_callable=AsyncMock,
                side_effect=HTTPException(status_code=503, detail="Model is unavailable."),
            ),
            patch("app.api.v1.disease_scanner.supabase") as supabase_mock,
        ):
            response = client.post(
                "/api/v1/disease-scanner/scan",
                files={"file": ("crop.png", self.make_png(), "image/png")},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "Model is unavailable.")
        supabase_mock.table.assert_not_called()

    def test_scan_does_not_save_invalid_ai_response(self):
        with (
            patch(
                "app.api.v1.disease_scanner.predict_disease_remote",
                new_callable=AsyncMock,
                return_value={"error": "Model failed"},
            ),
            patch("app.api.v1.disease_scanner.supabase") as supabase_mock,
        ):
            response = client.post(
                "/api/v1/disease-scanner/scan",
                files={"file": ("crop.png", self.make_png(), "image/png")},
            )

        self.assertEqual(response.status_code, 502)
        supabase_mock.table.assert_not_called()

    def test_scan_result_is_limited_to_authenticated_user(self):
        scan_id = str(uuid4())
        saved_record = {"id": scan_id, "user_id": self.user_id, "prediction": {}}
        with patch("app.api.v1.disease_scanner.supabase") as supabase_mock:
            query = supabase_mock.table.return_value.select.return_value
            query.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [saved_record]
            response = client.get(f"/api/v1/disease-scanner/scans/{scan_id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), saved_record)
        query.eq.assert_called_once_with("id", scan_id)
        query.eq.return_value.eq.assert_called_once_with("user_id", self.user_id)

    def test_scan_result_rejects_invalid_id_and_reports_missing_record(self):
        invalid_response = client.get("/api/v1/disease-scanner/scans/not-a-uuid")
        self.assertEqual(invalid_response.status_code, 400)
        self.assertEqual(invalid_response.json()["detail"], "Invalid scan ID.")

        with patch("app.api.v1.disease_scanner.supabase") as supabase_mock:
            query = supabase_mock.table.return_value.select.return_value
            query.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
            response = client.get(f"/api/v1/disease-scanner/scans/{uuid4()}")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Scan result not found.")

    def test_scan_rejects_invalid_image_with_actionable_error(self):
        response = client.post(
            "/api/v1/disease-scanner/scan",
            files={"file": ("crop.png", b"not an image", "image/png")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("valid JPEG, PNG, or WEBP", response.json()["detail"])

    def test_scan_reports_unavailable_model(self):
        from fastapi import HTTPException

        with patch(
            "app.api.v1.disease_scanner.predict_disease_remote",
            new_callable=AsyncMock,
            side_effect=HTTPException(
                status_code=503,
                detail="Disease detection model is unavailable on the server.",
            ),
        ) as predict_mock, patch("app.api.v1.disease_scanner.supabase") as supabase_mock:
            response = client.post(
                "/api/v1/disease-scanner/scan",
                files={"file": ("crop.png", self.make_png(), "image/png")},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("model is unavailable", response.json()["detail"])
        predict_mock.assert_awaited_once()
        supabase_mock.table.assert_not_called()

    def test_scan_reports_database_save_failure(self):
        prediction = {
            "detections": [],
            "status": "no_detection",
            "low_confidence": False,
            "message": "No known condition was recognised.",
        }
        with (
            patch(
                "app.api.v1.disease_scanner.predict_disease_remote",
                new_callable=AsyncMock,
                return_value=prediction,
            ),
            patch("app.api.v1.disease_scanner.supabase") as supabase_mock,
        ):
            supabase_mock.table.return_value.insert.return_value.select.return_value.execute.side_effect = (
                RuntimeError("database unavailable")
            )
            response = client.post(
                "/api/v1/disease-scanner/scan",
                files={"file": ("crop.png", self.make_png(), "image/png")},
            )

        self.assertEqual(response.status_code, 500)
        self.assertIn("could not be saved", response.json()["detail"])
