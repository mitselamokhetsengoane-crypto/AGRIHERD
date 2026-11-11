import unittest
from unittest.mock import patch

from app.core.admin_defaults import (
    DEFAULT_SETTINGS,
    default_permission_rows,
    ensure_admin_defaults,
)


class TestAdminDefaults(unittest.TestCase):
    def test_seed_matrix_covers_three_roles_and_every_module_action(self):
        rows = default_permission_rows()
        self.assertEqual(len(rows), 90)
        self.assertEqual({row["role"] for row in rows}, {"admin", "farmer", "buyer"})
        self.assertTrue(all(row["action"] in {"Read", "Write"} for row in rows))
        self.assertTrue(all(row["permission"] in {"allowed", "restricted"} for row in rows))
        self.assertEqual(len(DEFAULT_SETTINGS), 12)

    def test_startup_upserts_only_missing_defaults(self):
        with patch("app.core.admin_defaults.supabase") as database:
            ensure_admin_defaults()

        calls = database.table.return_value.upsert.call_args_list
        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[0].kwargs["on_conflict"], "setting_key")
        self.assertTrue(calls[0].kwargs["ignore_duplicates"])
        self.assertEqual(calls[1].kwargs["on_conflict"], "role,module,action")
        self.assertTrue(calls[1].kwargs["ignore_duplicates"])


if __name__ == "__main__":
    unittest.main()
