from io import BytesIO
from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from PIL import Image

from app.core.permissions import get_current_user
from app.main import api, app


client = TestClient(app)


def mock_table(data):
    table = MagicMock()
    table.insert.return_value = table
    table.select.return_value = table
    table.eq.return_value = table
    table.in_.return_value = table
    table.gt.return_value = table
    table.gt.return_value = table
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

    def test_dashboard_returns_at_most_three_recent_activities(self):
        tables = {
            "livestock": mock_table([]),
            "crops": mock_table([]),
            "tasks": mock_table([]),
            "inventory": mock_table([]),
            "transactions": mock_table([]),
            "audit_logs": mock_table([
                {"action": "UPDATE", "details": f"Activity {i}", "created_at": f"2026-11-{10 - i:02d}"}
                for i in range(5)
            ]),
        }
        with patch("app.api.v1.dashboard.supabase") as supabase_mock:
            supabase_mock.table.side_effect = tables.get
            response = client.get("/api/v1/dashboard/summary")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["recent_activity"]), 3)

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


class TestInventoryStockRoute(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {"sub": "user-id"}

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    def test_stock_update_uses_atomic_inventory_rpc(self):
        item = {
            "id": "item-id",
            "user_id": "user-id",
            "name": "maize",
            "quantity": 250.1,
            "minimum_stock_level": 20.1,
        }
        updated_item = {**item, "quantity": 241.1, "stock_status": "In Stock"}
        table = mock_table([item])

        with (
            patch("app.api.v1.inventory.supabase") as supabase_mock,
            patch("app.api.v1.inventory.AuditService.log"),
        ):
            supabase_mock.table.return_value = table
            supabase_mock.rpc.return_value.execute.return_value = SimpleNamespace(
                data=[updated_item]
            )
            response = client.post(
                "/api/v1/inventory/item-id/stock",
                json={"change_amount": -9, "reason": "sold"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["quantity"], 241.1)
        supabase_mock.rpc.assert_called_once_with(
            "update_inventory_stock",
            {
                "p_item_id": "item-id",
                "p_user_id": "user-id",
                "p_change_amount": -9.0,
                "p_reason": "sold",
            },
        )

    def test_stock_update_rejects_negative_result_without_writing(self):
        item = {
            "id": "item-id",
            "user_id": "user-id",
            "name": "maize",
            "quantity": 2,
            "minimum_stock_level": 0,
        }
        table = mock_table([item])

        with patch("app.api.v1.inventory.supabase") as supabase_mock:
            supabase_mock.table.return_value = table
            response = client.post(
                "/api/v1/inventory/item-id/stock",
                json={"change_amount": -9, "reason": "sold"},
            )

        self.assertEqual(response.status_code, 422)
        supabase_mock.rpc.assert_not_called()


class TestMarketplaceBuyerRoutes(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {
            "sub": "buyer-id",
            "role": "buyer",
        }

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    def test_add_to_cart_uses_authenticated_buyer_and_atomic_rpc(self):
        cart_items = mock_table([])
        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.rpc.return_value.execute.return_value.data = "cart-id"
            supabase_mock.table.return_value = cart_items
            response = client.post(
                "/api/v1/marketplace/cart",
                json={"product_id": "product-id", "quantity": 2},
            )

        self.assertEqual(response.status_code, 200)
        supabase_mock.rpc.assert_called_once_with(
            "add_marketplace_cart_item",
            {
                "p_buyer_id": "buyer-id",
                "p_product_id": "product-id",
                "p_quantity": 2.0,
            },
        )
        self.assertEqual(response.json()["item_count"], 0)

    def test_add_to_cart_reports_when_checkout_migration_rpc_is_not_installed(self):
        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.rpc.return_value.execute.side_effect = Exception(
                "PGRST202: Could not find the function "
                "public.add_marketplace_cart_item in the schema cache"
            )
            response = client.post(
                "/api/v1/marketplace/cart",
                json={"product_id": "product-id", "quantity": 1},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("011_buyer_marketplace_checkout.sql", response.json()["detail"])

    def test_add_to_cart_reports_missing_rpc_execute_permission(self):
        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.rpc.return_value.execute.side_effect = Exception(
                "403 Forbidden: permission denied for function add_marketplace_cart_item "
                "(42501)"
            )
            response = client.post(
                "/api/v1/marketplace/cart",
                json={"product_id": "product-id", "quantity": 1},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("013_marketplace_cart_rpc_permissions.sql", response.json()["detail"])
        self.assertIn("service-role key", response.json()["detail"])

    def test_add_to_cart_reports_missing_cart_table_after_rpc(self):
        cart_items_table = mock_table([])
        cart_items_table.execute.side_effect = Exception(
            "PGRST205: Could not find the table public.cart_items in the schema cache"
        )
        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.rpc.return_value.execute.return_value.data = "cart-id"
            supabase_mock.table.return_value = cart_items_table
            response = client.post(
                "/api/v1/marketplace/cart",
                json={"product_id": "product-id", "quantity": 1},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("002_cart_orders.sql", response.json()["detail"])

    def test_cart_returns_buyer_items_and_calculated_totals(self):
        cart_table = mock_table([{"id": "cart-id", "buyer_id": "buyer-id"}])
        items_table = mock_table([{
            "id": "item-id",
            "quantity": 2,
            "marketplace_products": {
                "id": "product-id",
                "name": "Maize",
                "price": 12.5,
                "unit": "kg",
                "image_url": "https://example.test/maize.jpg",
                "seller_id": "seller-id",
                "quantity_available": 8,
            },
        }])

        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.table.side_effect = [cart_table, items_table]
            response = client.get("/api/v1/marketplace/cart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["item_count"], 2)
        self.assertEqual(response.json()["subtotal"], 25)
        self.assertEqual(response.json()["total"], 25)
        self.assertEqual(response.json()["items"][0]["product"]["name"], "Maize")
        cart_table.eq.assert_called_once_with("buyer_id", "buyer-id")

    def test_checkout_uses_server_calculated_atomic_rpc(self):
        rpc_result = {
            "checkout_group": "group-id",
            "orders": [{"id": "order-id", "total": 25}],
            "total": 25,
            "payment_method": "CASH",
            "is_simulated": False,
        }
        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.rpc.return_value.execute.return_value.data = rpc_result
            response = client.post(
                "/api/v1/marketplace/checkout",
                json={
                    "customer_name": "Buyer",
                    "phone": "123",
                    "delivery_location": "Town",
                    "payment_method": "CASH",
                    "idempotency_key": "11111111-1111-4111-8111-111111111111",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), rpc_result)
        supabase_mock.rpc.assert_called_once_with(
            "checkout_marketplace_cart",
            {
                "p_buyer_id": "buyer-id",
                "p_idempotency_key": "11111111-1111-4111-8111-111111111111",
                "p_customer_name": "Buyer",
                "p_phone": "123",
                "p_delivery_location": "Town",
                "p_notes": None,
                "p_payment_method": "CASH",
            },
        )

    def test_checkout_rejects_insufficient_stock(self):
        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.rpc.return_value.execute.side_effect = Exception(
                "Not enough stock available"
            )
            response = client.post(
                "/api/v1/marketplace/checkout",
                json={
                    "customer_name": "Buyer",
                    "phone": "123",
                    "delivery_location": "Town",
                    "payment_method": "CASH",
                    "idempotency_key": "11111111-1111-4111-8111-111111111111",
                },
            )

        self.assertEqual(response.status_code, 409)

    def test_buyer_cannot_read_another_buyers_order(self):
        order_table = mock_table([{
            "id": "order-id",
            "buyer_id": "another-buyer-id",
            "seller_id": "seller-id",
            "status": "PENDING",
        }])
        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.table.return_value = order_table
            response = client.get("/api/v1/marketplace/orders/order-id")

        self.assertEqual(response.status_code, 403)

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


class TestMarketplaceImageUpload(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {
            "sub": "seller-id",
            "role": "farmer",
        }

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    def test_seller_uploads_image_file_to_product_storage(self):
        image_buffer = BytesIO()
        Image.new("RGB", (4, 4), color="green").save(image_buffer, format="PNG")
        image_buffer.seek(0)
        storage = MagicMock()
        storage.get_public_url.return_value = "https://storage.test/product.jpg"

        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.storage.from_.return_value = storage
            response = client.post(
                "/api/v1/marketplace/products/image",
                files={"file": ("product.png", image_buffer, "image/png")},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"image_url": "https://storage.test/product.jpg"},
        )
        storage.upload.assert_called_once()
        self.assertEqual(storage.upload.call_args.args[2]["content-type"], "image/jpeg")

    def test_missing_product_storage_bucket_has_actionable_error(self):
        image_buffer = BytesIO()
        Image.new("RGB", (4, 4), color="green").save(image_buffer, format="PNG")
        image_buffer.seek(0)
        storage = MagicMock()
        storage.upload.side_effect = Exception("Bucket not found")

        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.storage.from_.return_value = storage
            response = client.post(
                "/api/v1/marketplace/products/image",
                files={"file": ("product.png", image_buffer, "image/png")},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("012_admin_dashboard_and_product_images.sql", response.json()["detail"])

    def test_storage_permission_failure_points_to_backend_service_key(self):
        image_buffer = BytesIO()
        Image.new("RGB", (4, 4), color="green").save(image_buffer, format="PNG")
        image_buffer.seek(0)
        storage = MagicMock()
        storage.upload.side_effect = Exception("new row violates row-level security policy")

        with patch("app.api.v1.marketplace.supabase") as supabase_mock:
            supabase_mock.storage.from_.return_value = storage
            response = client.post(
                "/api/v1/marketplace/products/image",
                files={"file": ("product.png", image_buffer, "image/png")},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("SUPABASE_SERVICE_ROLE_KEY", response.json()["detail"])


class TestAdminDashboardAndNotifications(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {
            "sub": "admin-id",
            "role": "admin",
        }

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    def test_security_settings_returns_database_rows(self):
        settings_table = mock_table([{
            "setting_key": "password_min_length",
            "setting_value": "8",
        }])
        with patch("app.api.v1.security.supabase") as supabase_mock:
            supabase_mock.table.return_value = settings_table
            response = client.get("/api/v1/security/system-settings")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["setting_key"], "password_min_length")

    def test_role_permissions_returns_database_rows(self):
        permissions_table = mock_table([{
            "id": "permission-id",
            "role": "buyer",
            "module": "Marketplace",
            "permission": "allowed",
            "action": "Read: Active Listings",
        }])
        with patch("app.api.v1.security.supabase") as supabase_mock:
            supabase_mock.table.return_value = permissions_table
            response = client.get("/api/v1/security/role-permissions")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["role"], "buyer")

    def test_ai_summary_returns_scan_count(self):
        scans_table = mock_table([])
        scans_table.execute.return_value = SimpleNamespace(data=[], count=6)
        with patch("app.api.v1.admin.supabase") as supabase_mock:
            supabase_mock.table.return_value = scans_table
            response = client.get("/api/v1/admin/ai/summary")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["disease_scan_count"], 6)

    def test_blockchain_dashboard_returns_records(self):
        record = {"id": "record-id", "record_type": "order"}
        records_table = mock_table([record])
        with patch("app.api.v1.admin.supabase") as supabase_mock:
            supabase_mock.table.return_value = records_table
            response = client.get("/api/v1/admin/blockchain/all")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [record])


class TestNotificationRoutes(unittest.TestCase):
    def setUp(self):
        api.dependency_overrides[get_current_user] = lambda: {
            "sub": "user-id",
            "role": "farmer",
        }

    def tearDown(self):
        api.dependency_overrides.pop(get_current_user, None)

    def test_notifications_are_loaded_for_the_authenticated_user(self):
        notification = {
            "id": "notification-id",
            "user_id": "user-id",
            "title": "Farm update",
            "is_read": False,
        }
        table = mock_table([notification])
        with patch("app.api.v1.notifications.supabase") as supabase_mock:
            supabase_mock.table.return_value = table
            response = client.get("/api/v1/notifications/?only_unread=true")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [notification])
        table.eq.assert_any_call("user_id", "user-id")
        table.eq.assert_any_call("is_read", False)


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
