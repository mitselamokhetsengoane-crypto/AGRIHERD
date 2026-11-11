# Database migrations

Apply migrations in filename order to the Supabase project whose URL is configured
for the backend. Do not copy service-role keys or other credentials into the SQL
editor or migration files.

For an existing deployment, apply
`migrations/012_admin_dashboard_and_product_images.sql` and then
`migrations/014_admin_farm_monitoring.sql` after the already-applied migrations.
Both seed statements preserve existing administrator-edited values. Migration 014
adds farm status and blockchain metadata fields and backfills missing first-farm
rows for farmer profiles. It also creates profiles, the initial farm and consent
records from an Auth-user trigger, in the same database transaction. The backfill
is safe to repeat and does not add another farm when an owner already has one.

The backend's configured database currently uses `profiles` as the farmer profile
table (there is no `farmer_profiles` table in `schema.sql`). Confirm the target
project and schema in Supabase SQL Editor with:

```sql
select to_regclass('public.role_permissions'),
       to_regclass('public.system_settings'),
       to_regclass('public.farms'),
       to_regclass('public.profiles');

select role, count(*) as permission_rows
from public.role_permissions
group by role
order by role;

select count(*) as settings_count
from public.system_settings;

select count(*) as farm_count from public.farms;
select count(*) as farmer_profile_count
from public.profiles
where role = 'farmer';

select count(*) as farmers_without_a_farm
from public.profiles p
where p.role = 'farmer'
  and nullif(btrim(p.farm_name), '') is not null
  and not exists (
      select 1 from public.farms f where f.owner_id = p.id
  );

select count(*) as blockchain_records_count
from public.blockchain_records;
select count(*) as prediction_records_count
from public.disease_scans;
```

The default matrix contains 90 entries (three roles, fifteen modules, read and
write actions). Settings are seeded with `ON CONFLICT DO NOTHING`, so rerunning
the migration does not reset changed settings or permissions.

There is no migration-history table in this repository. The administrator
System health panel therefore reports whether the expected migration 012 table
schema is detectable; it cannot prove which SQL file was run historically. The
System health panel also detects migration 014's farm and blockchain columns.
