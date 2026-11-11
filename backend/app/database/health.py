import logging
import uuid
from typing import Any

from supabase import Client

from app.database.connection import SERVICE_KEY_ROLE

logger = logging.getLogger(__name__)

REQUIRED_SCHEMA_COLUMNS = {
    "profiles": ("id", "full_name", "email", "role", "account_status"),
    "farms": ("id", "owner_id", "farm_name", "location", "status"),
    "consent_records": ("user_id", "policy_type", "policy_version", "consented_at"),
    "system_settings": ("setting_key", "setting_value"),
    "role_permissions": ("role", "module", "permission", "action"),
    "blockchain_records": ("network", "status"),
}

_schema_status: dict[str, Any] = {
    "ready": False,
    "service_key_role": SERVICE_KEY_ROLE,
    "unavailable_tables": list(REQUIRED_SCHEMA_COLUMNS),
    "correlation_id": None,
}


def check_database_schema(supabase_client: Client) -> dict[str, Any]:
    unavailable_tables = []
    correlation_id = str(uuid.uuid4())
    for table, columns in REQUIRED_SCHEMA_COLUMNS.items():
        try:
            (
                supabase_client.table(table)
                .select(",".join(columns))
                .limit(0)
                .execute()
            )
        except Exception:
            logger.exception(
                "Database schema self-check failed for public.%s "
                "(correlation_id=%s).",
                table,
                correlation_id,
            )
            unavailable_tables.append(table)

    _schema_status.update({
        "ready": SERVICE_KEY_ROLE == "service_role" and not unavailable_tables,
        "service_key_role": SERVICE_KEY_ROLE,
        "unavailable_tables": unavailable_tables,
        "correlation_id": correlation_id if unavailable_tables else None,
    })
    return dict(_schema_status)


def get_database_schema_status() -> dict[str, Any]:
    return dict(_schema_status)
