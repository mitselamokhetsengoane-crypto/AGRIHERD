import logging

from app.database.connection import supabase

logger = logging.getLogger(__name__)

ADMIN_MODULES = {
    "Platform Dashboard",
    "User Management",
    "Farm Management",
    "Marketplace Monitor",
    "Categories",
    "AI Monitoring",
    "Blockchain Monitoring",
    "Roles & Permissions",
    "Data Classification",
    "Audit Logs",
    "Security Settings",
}

MODULES = (
    "Platform Dashboard",
    "User Management",
    "Farm Management",
    "Marketplace Monitor",
    "Categories",
    "AI Monitoring",
    "Blockchain Monitoring",
    "Roles & Permissions",
    "Data Classification",
    "Audit Logs",
    "Security Settings",
    "My Farms",
    "Marketplace",
    "Farm Data",
    "Private Farm Records",
)

DEFAULT_SETTINGS = (
    ("require_farmer_approval", "false", "If true, new farmer accounts need admin approval."),
    ("password_min_length", "8", "Minimum password length enforced at registration."),
    ("password_require_uppercase", "true", "Passwords must contain an uppercase letter."),
    ("password_require_lowercase", "true", "Passwords must contain a lowercase letter."),
    ("password_require_number", "true", "Passwords must contain a number."),
    ("password_require_special", "true", "Passwords must contain a special character."),
    ("password_expiry_days", "90", "Force password change after this many days."),
    ("session_auto_logout_minutes", "15", "Auto-logout after this many minutes."),
    ("session_token_lifetime_minutes", "60", "Access token lifetime in minutes."),
    ("login_rate_limit_per_minute", "5", "Maximum login attempts per minute per client."),
    ("api_rate_limit_per_minute", "120", "Maximum API requests per minute per client."),
    ("enforce_mfa_for_admins", "false", "Require multi-factor authentication for admin accounts."),
)


def default_permission_rows():
    rows = []
    for role in ("admin", "farmer", "buyer"):
        for module in MODULES:
            for action in ("Read", "Write"):
                allowed = (
                    role == "admin" and module not in {"Farm Data", "Private Farm Records"}
                    or role == "farmer" and module in {"My Farms", "Marketplace", "Farm Data"}
                    or role == "buyer" and module == "Marketplace"
                )
                rows.append({
                    "role": role,
                    "module": module,
                    "permission": "allowed" if allowed else "restricted",
                    "action": action,
                })
    return rows


def ensure_admin_defaults():
    """Insert only absent defaults; never replace administrator-edited values."""
    for table, rows, conflict in (
        (
            "system_settings",
            [
                {"setting_key": key, "setting_value": value, "description": description}
                for key, value, description in DEFAULT_SETTINGS
            ],
            "setting_key",
        ),
        ("role_permissions", default_permission_rows(), "role,module,action"),
    ):
        try:
            supabase.table(table).upsert(
                rows,
                on_conflict=conflict,
                ignore_duplicates=True,
            ).execute()
        except Exception:
            logger.exception(
                "Could not ensure %s defaults. Verify migration 012 is applied to "
                "the Supabase project configured for this backend.",
                table,
            )
