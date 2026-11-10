from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.core.permissions import get_current_user
from app.main import api, app


client = TestClient(app)


def mock_table(data):
    table = MagicMock()
    table.insert.return_value = table
    table.select.return_value = table
    table.eq.return_value = table
    table.gte.return_value = table
    table.neq.return_value = table
    table.lte.return_value = table
    table.order.return_value = table
    table.limit.return_value = table
    table.execute.return_value = SimpleNamespace(data=data)
    return table


class TestMissingApiRoutes(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {"sub": "user-id"}

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    def test_dashboard_summary_returns_user_scoped_database_totals(self):
        tables = {
            "livestock": mock_table([{"id": "animal-id"}]),
            "crops": mock_table([]),
            "tasks": mock_table([{"id": "task-id"}]),
            "inventory": mock_table([{"quantity": 2, "minimum_stock_level": 5}]),
            "transactions": mock_table([
                {"amount": 100, "type": "income"},
                {"amount": 25, "type": "expense"},
            ]),
            "audit_logs": mock_table([
                {"action": "ADD_ANIMAL", "details": "Added animal", "created_at": "2026-11-07"}
            ]),
        }
        with patch("app.api.v1.dashboard.supabase") as supabase_mock:
            supabase_mock.table.side_effect = tables.get
            response = client.get("/api/v1/dashboard/summary")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "livestock_count": 1,
            "crop_count": 0,
            "upcoming_tasks": 1,
            "low_stock_alerts": 1,
            "net_balance": 75,
            "recent_activity": [{"description": "Added animal", "time": "2026-11-07"}],
        })

    def test_inventory_item_detail_is_scoped_to_current_user(self):
        table = mock_table([{"id": "item-id", "name": "Feed", "user_id": "user-id"}])
        with patch("app.api.v1.inventory.supabase") as supabase_mock:
            supabase_mock.table.return_value = table
            response = client.get("/api/v1/inventory/item-id")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Feed")
        table.eq.assert_any_call("user_id", "user-id")

    def test_finance_reports_aggregate_transactions_by_month(self):
        table = mock_table([
            {"amount": 100, "type": "income", "date": "2026-10-12"},
            {"amount": 40, "type": "expense", "date": "2026-10-20"},
            {"amount": 20, "type": "income", "date": "2026-09-04"},
        ])
        with patch("app.api.v1.finance.supabase") as supabase_mock:
            supabase_mock.table.return_value = table
            response = client.get("/api/v1/finance/reports")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [
            {"month": "2026-10", "income": 100, "expenses": 40, "balance": 60},
            {"month": "2026-09", "income": 20, "expenses": 0, "balance": 20},
        ])

    def test_cors_header_is_returned_for_unhandled_server_errors(self):
        test_client = TestClient(app, raise_server_exceptions=False)
        with patch("app.api.v1.dashboard.supabase") as supabase_mock:
            supabase_mock.table.side_effect = RuntimeError("Database unavailable")
            response = test_client.get(
                "/api/v1/dashboard/summary",
                headers={"Origin": "https://agriherd-1.onrender.com"},
            )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            "https://agriherd-1.onrender.com",
        )

    def test_cors_preflight_allows_production_frontend(self):
        response = client.options(
            "/api/v1/crops/crop-id/plantings",
            headers={
                "Origin": "https://agriherd-1.onrender.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            "https://agriherd-1.onrender.com",
        )


class TestLivestockRecordRoutes(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {"sub": "user-id"}

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    def test_health_record_is_saved(self):
        table = mock_table([{"id": "record-id", "animal_id": "animal-id"}])
        with (
            patch("app.api.v1.livestock.LivestockService.get_by_id"),
            patch("app.api.v1.livestock.supabase") as supabase_mock,
        ):
            supabase_mock.table.return_value = table
            response = client.post(
                "/api/v1/livestock/animal-id/health",
                json={"date": "2026-11-10", "condition": "Healthy"},
            )

        self.assertEqual(response.status_code, 200)
        table.insert.assert_called_once_with({
            "date": "2026-11-10",
            "condition": "Healthy",
            "animal_id": "animal-id",
        })

    def test_vaccination_omits_empty_optional_due_date(self):
        table = mock_table([{"id": "record-id", "animal_id": "animal-id"}])
        with (
            patch("app.api.v1.livestock.LivestockService.get_by_id"),
            patch("app.api.v1.livestock.supabase") as supabase_mock,
        ):
            supabase_mock.table.return_value = table
            response = client.post(
                "/api/v1/livestock/animal-id/vaccinations",
                json={
                    "vaccine_name": "Vaccine",
                    "date_administered": "2026-11-10",
                    "next_due_date": "",
                },
            )

        self.assertEqual(response.status_code, 200)
        table.insert.assert_called_once_with({
            "vaccine_name": "Vaccine",
            "date_administered": "2026-11-10",
            "animal_id": "animal-id",
        })

    def test_feeding_record_is_saved(self):
        table = mock_table([{"id": "record-id", "animal_id": "animal-id"}])
        with (
            patch("app.api.v1.livestock.LivestockService.get_by_id"),
            patch("app.api.v1.livestock.supabase") as supabase_mock,
        ):
            supabase_mock.table.return_value = table
            response = client.post(
                "/api/v1/livestock/animal-id/feeding",
                json={
                    "date": "2026-11-10",
                    "feed_type": "Hay",
                    "quantity": "5 kg",
                },
            )

        self.assertEqual(response.status_code, 200)
        table.insert.assert_called_once_with({
            "date": "2026-11-10",
            "feed_type": "Hay",
            "quantity": "5 kg",
            "animal_id": "animal-id",
        })

    def test_breeding_accepts_outcome_and_omits_empty_optional_dates(self):
        table = mock_table([{"id": "record-id", "animal_id": "animal-id"}])
        with (
            patch("app.api.v1.livestock.LivestockService.get_by_id"),
            patch("app.api.v1.livestock.supabase") as supabase_mock,
        ):
            supabase_mock.table.return_value = table
            response = client.post(
                "/api/v1/livestock/animal-id/breeding",
                json={
                    "breeding_date": "2026-11-10",
                    "expected_birth_date": "",
                    "actual_birth_date": "",
                    "outcome": "Pregnant",
                },
            )

        self.assertEqual(response.status_code, 200)
        table.insert.assert_called_once_with({
            "breeding_date": "2026-11-10",
            "outcome": "Pregnant",
            "animal_id": "animal-id",
        })


class TestCropRecordRoutes(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {"sub": "user-id"}

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    def test_planting_record_is_saved(self):
        tables = {
            "crops": mock_table([{"id": "crop-id"}]),
            "planting_records": mock_table([{"id": "record-id", "crop_id": "crop-id"}]),
        }
        with patch("app.api.v1.crops.supabase") as supabase_mock:
            supabase_mock.table.side_effect = tables.get
            response = client.post(
                "/api/v1/crops/crop-id/plantings",
                json={
                    "planting_date": "2026-11-10",
                    "seed_type": "Maize",
                    "quantity_used": 3.5,
                },
            )

        self.assertEqual(response.status_code, 200)
        tables["planting_records"].insert.assert_called_once_with({
            "planting_date": "2026-11-10",
            "seed_type": "Maize",
            "quantity_used": 3.5,
            "crop_id": "crop-id",
        })

    def test_harvest_record_is_saved(self):
        tables = {
            "crops": mock_table([{"id": "crop-id"}]),
            "harvest_records": mock_table([{"id": "record-id", "crop_id": "crop-id"}]),
        }
        with patch("app.api.v1.crops.supabase") as supabase_mock:
            supabase_mock.table.side_effect = tables.get
            response = client.post(
                "/api/v1/crops/crop-id/harvests",
                json={
                    "harvest_date": "2026-11-10",
                    "quantity": 50,
                    "unit": "kg",
                    "quality": "Good",
                },
            )

        self.assertEqual(response.status_code, 200)
        tables["harvest_records"].insert.assert_called_once_with({
            "harvest_date": "2026-11-10",
            "quantity": 50,
            "unit": "kg",
            "quality": "Good",
            "crop_id": "crop-id",
        })
