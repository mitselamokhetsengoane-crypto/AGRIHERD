# Database schema

[`schema.sql`](./schema.sql) is the single source of truth for the AgriHerd
Supabase database. It defines the application tables, functions, triggers,
permissions, and seed data used by the backend.

Run it only when setting up a new, empty Supabase project. **It starts by
dropping and recreating the `public` schema, which permanently deletes existing
application tables and their data. Do not run it again on a live or populated
project.**

The backend expects the Supabase project configured by `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` to have this schema. If an existing project is
missing objects, inspect and update that project carefully in Supabase before
restarting the backend; do not rerun this destructive bootstrap script.

For an existing project affected by the marketplace checkout UUID-generator
error, run [`migrations/20261112_checkout_uuid_generator.sql`](./migrations/20261112_checkout_uuid_generator.sql)
in the Supabase SQL Editor. This migration only replaces the checkout function
and does not recreate tables or modify existing data.

If Render logs show `permission denied for schema public` for a service-role
request, do not rerun `schema.sql` on the live database. After confirming the
backend URL points at the intended project, run this non-destructive privilege
repair in that project's SQL editor:

```sql
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

`schema.sql` applies these grants on a fresh setup. The `/ready` endpoint checks
the service-key role and required database tables/columns; the administrator
System Health view reports the same schema check.

To confirm which project the backend uses, check the `SUPABASE_URL` host in its
environment settings. Never paste service-role keys into SQL files, source
control, or client-side code.
