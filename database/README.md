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

To confirm which project the backend uses, check the `SUPABASE_URL` host in its
environment settings. Never paste service-role keys into SQL files, source
control, or client-side code.
