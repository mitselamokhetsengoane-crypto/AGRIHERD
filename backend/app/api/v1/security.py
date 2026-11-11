import logging
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Literal, Optional
from app.core.admin_defaults import ADMIN_MODULES
from app.core.permissions import require_admin_module
from app.database.connection import supabase
from app.services.audit_service import AuditService

router = APIRouter()
logger = logging.getLogger(__name__)
ADMIN_SCHEMA_MIGRATION = "database/migrations/012_admin_dashboard_and_product_images.sql"


class RoleUpdate(BaseModel):
    role: Literal["farmer", "buyer", "admin"]


class StatusUpdate(BaseModel):
    account_status: Literal["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"]


class SettingUpdate(BaseModel):
    setting_value: str


class AuditEntry(BaseModel):
    action: str
    details: Optional[str] = None


class PermissionUpdate(BaseModel):
    permission: Literal["allowed", "restricted"]


def _missing_table(exc: Exception, table: str) -> bool:
    code = getattr(exc, "code", None)
    message = str(exc).lower()
    return table in message and (
        code in {"42P01", "PGRST205"} or "could not find the table" in message
    )


def _missing_column(exc: Exception, column: str) -> bool:
    code = getattr(exc, "code", None)
    message = str(exc).lower()
    return code in {"42703", "PGRST204"} or (
        column.lower() in message
        and ("column" in message or "schema cache" in message)
    )


def _raise_admin_table_error(exc: Exception, table: str):
    if _missing_table(exc, table):
        raise HTTPException(
            status_code=503,
            detail=f"Database table public.{table} is missing. Apply {ADMIN_SCHEMA_MIGRATION} "
            "to the Supabase project configured for this backend.",
        ) from exc
    logger.exception("Could not read the admin table %s.", table)
    raise HTTPException(status_code=503, detail=f"Could not read database table public.{table}.") from exc


@router.get("/overview")
def get_platform_overview(current_user: dict = Depends(require_admin_module("Platform Dashboard"))):
    try:
        users_res = supabase.table("profiles").select("role, account_status", count="exact").execute()
        farms_res = supabase.table("farms").select("id", count="exact").execute()
        rows = users_res.data or []
        return {
            "total_users": users_res.count or 0,
            "total_farms": farms_res.count or 0,
            "total_farmers": sum(1 for u in rows if u.get("role") == "farmer"),
            "total_buyers": sum(1 for u in rows if u.get("role") == "buyer"),
            "pending_accounts": sum(1 for u in rows if u.get("account_status") == "PENDING"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/role-permissions")
def get_role_permissions(current_user: dict = Depends(require_admin_module("Roles & Permissions"))):
    try:
        response = (
            supabase.table("role_permissions")
            .select("*")
            .order("role")
            .order("module")
            .order("action")
            .execute()
        )
    except Exception as exc:
        _raise_admin_table_error(exc, "role_permissions")
    if not response.data:
        raise HTTPException(
            status_code=503,
            detail=f"Database table public.role_permissions exists but is empty. "
            f"Apply {ADMIN_SCHEMA_MIGRATION} and verify the backend's Supabase project.",
        )
    return response.data


@router.get("/data-classification")
def get_data_classification(current_user: dict = Depends(require_admin_module("Data Classification"))):
    response = supabase.table("data_classification").select("*").execute()
    grouped = {"public": [], "private": [], "confidential": [], "restricted": []}
    for row in response.data or []:
        key = row.get("classification")
        if key in grouped:
            grouped[key].append(row)
    return grouped


@router.get("/system-settings")
def get_system_settings(current_user: dict = Depends(require_admin_module("Security Settings"))):
    try:
        response = (
            supabase.table("system_settings")
            .select("*")
            .order("setting_key")
            .execute()
        )
    except Exception as exc:
        _raise_admin_table_error(exc, "system_settings")
    if not response.data:
        raise HTTPException(
            status_code=503,
            detail=f"Database table public.system_settings exists but is empty. "
            f"Apply {ADMIN_SCHEMA_MIGRATION} and verify the backend's Supabase project.",
        )
    return response.data


@router.get("/system-health")
def get_system_health(current_user: dict = Depends(require_admin_module("Security Settings"))):
    tables = {
        "users": "profiles",
        "farms": "farms",
        "role_permissions": "role_permissions",
        "settings": "system_settings",
        "blockchain_records": "blockchain_records",
        "ai_predictions": "disease_scans",
    }
    counts = {}
    errors = []
    for label, table in tables.items():
        try:
            response = (
                supabase.table(table)
                .select("id", count="exact")
                .limit(1)
                .execute()
            )
            counts[label] = response.count or 0
        except Exception as exc:
            logger.warning("System health count failed for %s (%s).", table, type(exc).__name__)
            counts[label] = None
            errors.append(label)

    try:
        supabase.table("role_permissions").select("permission,action").limit(1).execute()
        supabase.table("system_settings").select("setting_key").limit(1).execute()
        migration_applied = True
    except Exception as exc:
        logger.warning("Admin migration schema check failed (%s).", type(exc).__name__)
        migration_applied = False

    try:
        supabase.table("farms").select("status").limit(1).execute()
        supabase.table("blockchain_records").select("network,status").limit(1).execute()
        farm_monitoring_migration_applied = True
    except Exception as exc:
        logger.warning("Farm monitoring migration check failed (%s).", type(exc).__name__)
        farm_monitoring_migration_applied = False

    return {
        "database_connected": "users" not in errors,
        "migration_012_applied": migration_applied,
        "migration_014_applied": farm_monitoring_migration_applied,
        "table_counts": counts,
        "unavailable_tables": errors,
    }


@router.patch("/system-settings/{setting_key}")
def update_system_setting(
    setting_key: str,
    body: SettingUpdate,
    current_user: dict = Depends(require_admin_module("Security Settings", "Write")),
):
    try:
        response = (
            supabase.table("system_settings")
            .update({"setting_value": body.setting_value})
            .eq("setting_key", setting_key)
            .execute()
        )
    except Exception as exc:
        _raise_admin_table_error(exc, "system_settings")
    if not response.data:
        raise HTTPException(status_code=404, detail="Setting not found.")
    try:
        AuditService.log_or_raise(
            current_user["sub"],
            "UPDATE_SETTING",
            f"{setting_key} = {body.setting_value}",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return response.data[0]


@router.patch("/role-permissions/{permission_id}")
def update_role_permission(
    permission_id: str,
    body: PermissionUpdate,
    current_user: dict = Depends(require_admin_module("Roles & Permissions", "Write")),
):
    try:
        current = (
            supabase.table("role_permissions")
            .select("id,role,module,action,permission")
            .eq("id", permission_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        _raise_admin_table_error(exc, "role_permissions")
    if not current.data:
        raise HTTPException(status_code=404, detail="Permission entry not found.")

    row = current.data[0]
    if (
        body.permission == "allowed"
        and row["role"] in {"farmer", "buyer"}
        and row["module"] in ADMIN_MODULES
    ):
        raise HTTPException(
            status_code=403,
            detail="Farmers and buyers cannot be granted administrator module access.",
        )

    try:
        updated = (
            supabase.table("role_permissions")
            .update({"permission": body.permission})
            .eq("id", permission_id)
            .execute()
        )
    except Exception as exc:
        _raise_admin_table_error(exc, "role_permissions")
    if not updated.data:
        raise HTTPException(status_code=404, detail="Permission entry not found.")
    try:
        AuditService.log_or_raise(
            current_user["sub"],
            "UPDATE_ROLE_PERMISSION",
            f"role={row['role']} module={row['module']} action={row['action']} "
            f"permission={body.permission}",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return updated.data[0]


@router.get("/audit-logs")
def get_audit_logs(current_user: dict = Depends(require_admin_module("Audit Logs"))):
    # Use the AuditService to ensure it handles empty tables gracefully
    return AuditService.get_logs(limit=200)


@router.post("/audit-logs", status_code=201)
def create_audit_log(entry: AuditEntry, current_user: dict = Depends(require_admin_module("Audit Logs", "Write"))):
    AuditService.log(current_user["sub"], entry.action, entry.details or "")
    return {"message": "Audit entry logged"}


@router.get("/users")
def get_all_users(current_user: dict = Depends(require_admin_module("User Management"))):
    return (
        supabase.table("profiles")
        .select("id, full_name, email, role, account_status, created_at")
        .execute()
        .data
        or []
    )


@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, role_update: RoleUpdate, current_user: dict = Depends(require_admin_module("User Management", "Write"))):
    if current_user.get("sub") == user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")
    response = supabase.table("profiles").update({"role": role_update.role}).eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    AuditService.log(current_user["sub"], "UPDATE_USER_ROLE", f"User {user_id} → {role_update.role}")
    return response.data[0]


@router.patch("/users/{user_id}/status")
def update_user_status(user_id: str, body: StatusUpdate, current_user: dict = Depends(require_admin_module("User Management", "Write"))):
    if current_user.get("sub") == user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own status")
    response = supabase.table("profiles").update({"account_status": body.account_status}).eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    AuditService.log(current_user["sub"], "UPDATE_USER_STATUS", f"User {user_id} → {body.account_status}")
    return response.data[0]


@router.get("/farms")
def get_all_farms(
    q: Optional[str] = Query(default=None, max_length=100),
    status: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_user: dict = Depends(require_admin_module("Farm Management")),
):
    if status and status not in {"active", "inactive", "pending"}:
        raise HTTPException(status_code=422, detail="Status must be active, inactive, or pending.")

    try:
        def farm_query():
            query = supabase.table("farms").select(
                "id,owner_id,farm_name,location,status,created_at",
                count="exact",
            )
            return query.eq("status", status) if status else query

        if q:
            pattern = f"%{q.strip()}%"
            matching_farms = []
            for column in ("farm_name", "location"):
                matching_farms.extend(
                    (farm_query().ilike(column, pattern).execute().data or [])
                )
            matching_profiles = (
                supabase.table("profiles")
                .select("id")
                .ilike("full_name", pattern)
                .execute()
                .data
                or []
            )
            owner_ids = [profile["id"] for profile in matching_profiles]
            if owner_ids:
                matching_farms.extend(
                    farm_query().in_("owner_id", owner_ids).execute().data or []
                )
            unique_farms = {farm["id"]: farm for farm in matching_farms}
            ordered_farms = sorted(
                unique_farms.values(),
                key=lambda farm: farm.get("created_at") or "",
                reverse=True,
            )
            total = len(ordered_farms)
            start = (page - 1) * page_size
            farms = ordered_farms[start:start + page_size]
        else:
            start = (page - 1) * page_size
            response = (
                farm_query().order("created_at", desc=True)
                .range(start, start + page_size - 1)
                .execute()
            )
            farms = response.data or []
            total = response.count or 0

        owner_ids = list({farm["owner_id"] for farm in farms})
        farm_ids = [farm["id"] for farm in farms]
        owners = {}
        livestock_counts = Counter()
        crop_counts = Counter()
        if owner_ids:
            owner_rows = (
                supabase.table("profiles")
                .select("id,full_name")
                .in_("id", owner_ids)
                .execute()
                .data
                or []
            )
            owners = {owner["id"]: owner.get("full_name") for owner in owner_rows}
        if farm_ids:
            livestock_rows = (
                supabase.table("livestock")
                .select("farm_id")
                .in_("farm_id", farm_ids)
                .execute()
                .data
                or []
            )
            crop_rows = (
                supabase.table("crops")
                .select("farm_id")
                .in_("farm_id", farm_ids)
                .execute()
                .data
                or []
            )
            livestock_counts.update(row["farm_id"] for row in livestock_rows if row.get("farm_id"))
            crop_counts.update(row["farm_id"] for row in crop_rows if row.get("farm_id"))
    except HTTPException:
        raise
    except Exception as exc:
        if _missing_table(exc, "farms"):
            _raise_admin_table_error(exc, "farms")
        if _missing_column(exc, "status"):
            raise HTTPException(
                status_code=503,
                detail="Farm status schema is missing. Apply "
                "database/migrations/014_admin_farm_monitoring.sql.",
            ) from exc
        logger.exception("Could not load administrator farm list.")
        raise HTTPException(status_code=503, detail="Could not load farm management data.") from exc

    return {
        "items": [
            {
                "id": farm["id"],
                "farm_name": farm.get("farm_name"),
                "location": farm.get("location"),
                "owner_name": owners.get(farm["owner_id"], "Unknown owner"),
                "status": farm.get("status"),
                "created_at": farm.get("created_at"),
                "livestock_count": livestock_counts[farm["id"]],
                "crop_count": crop_counts[farm["id"]],
            }
            for farm in farms
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }