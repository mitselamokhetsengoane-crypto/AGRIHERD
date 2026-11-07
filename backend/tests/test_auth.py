from types import SimpleNamespace
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from supabase_auth.errors import AuthApiError

from app.main import app

client = TestClient(app)


def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AgriHerd API is running"}


class TestAuthLogin(unittest.TestCase):
    def test_register_inserts_email_into_profile(self):
        with patch("app.api.v1.auth.supabase") as supabase_mock:
            supabase_mock.auth.sign_up.return_value = SimpleNamespace(
                user=SimpleNamespace(id="user-id")
            )

            response = client.post(
                "/api/v1/auth/register",
                json={
                    "full_name": "Test Farmer",
                    "email": "farmer@example.com",
                    "password": "valid-password",
                    "phone": "+26658000000",
                    "farm_name": "Test Farm",
                },
            )

        assert response.status_code == 200
        assert response.json() == {
            "message": "User registered successfully",
            "user_id": "user-id",
        }
        supabase_mock.table.assert_called_once_with("profiles")
        supabase_mock.table.return_value.insert.assert_called_once_with({
            "id": "user-id",
            "full_name": "Test Farmer",
            "email": "farmer@example.com",
            "phone": "+26658000000",
            "farm_name": "Test Farm",
            "role": "farmer",
        })

    def test_login_returns_token_and_profile(self):
        profile = {"id": "user-id", "role": "farmer"}
        with (
            patch("app.api.v1.auth.supabase") as supabase_mock,
            patch("app.api.v1.auth.create_access_token", return_value="token"),
        ):
            supabase_mock.auth.sign_in_with_password.return_value = SimpleNamespace(
                user=SimpleNamespace(id="user-id")
            )
            (
                supabase_mock.table.return_value.select.return_value
                .eq.return_value.execute.return_value
            ) = SimpleNamespace(data=[profile])

            response = client.post(
                "/api/v1/auth/login",
                json={"email": "farmer@example.com", "password": "valid-password"},
            )

        assert response.status_code == 200
        assert response.json() == {
            "access_token": "token",
            "token_type": "bearer",
            "user": profile,
        }

    def test_login_returns_401_for_invalid_credentials(self):
        with patch("app.api.v1.auth.supabase") as supabase_mock:
            supabase_mock.auth.sign_in_with_password.side_effect = AuthApiError(
                "Invalid login credentials",
                400,
                None,
            )

            response = client.post(
                "/api/v1/auth/login",
                json={"email": "farmer@example.com", "password": "wrong-password"},
            )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password."

    def test_login_reports_missing_profile(self):
        with patch("app.api.v1.auth.supabase") as supabase_mock:
            supabase_mock.auth.sign_in_with_password.return_value = SimpleNamespace(
                user=SimpleNamespace(id="user-id")
            )
            (
                supabase_mock.table.return_value.select.return_value
                .eq.return_value.execute.return_value
            ) = SimpleNamespace(data=[])

            response = client.post(
                "/api/v1/auth/login",
                json={"email": "farmer@example.com", "password": "valid-password"},
            )

        assert response.status_code == 403
        assert "profile is missing" in response.json()["detail"]