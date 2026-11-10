CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('require_farmer_approval', 'false', 'If true, new farmer accounts need admin approval before they can log in.'),
    ('password_min_length', '8', 'Minimum password length enforced at registration.'),
    ('password_require_uppercase', 'true', 'Passwords must contain at least one uppercase letter.'),
    ('password_require_lowercase', 'true', 'Passwords must contain at least one lowercase letter.'),
    ('password_require_number', 'true', 'Passwords must contain at least one number.'),
    ('password_require_special', 'true', 'Passwords must contain at least one special character.'),
    ('password_expiry_days', '90', 'Force password change after this many days.'),
    ('session_auto_logout_minutes', '15', 'Auto-logout after this many minutes of inactivity.'),
    ('enforce_mfa_for_admins', 'false', 'Require multi-factor authentication for admin accounts.')
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin','farmer','buyer')),
    module VARCHAR(100) NOT NULL,
    permission VARCHAR(50) NOT NULL DEFAULT 'restricted'
        CHECK (permission IN ('allowed','restricted')),
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (role, module, action)
);

ALTER TABLE public.role_permissions
    ADD COLUMN IF NOT EXISTS permission VARCHAR(50) NOT NULL DEFAULT 'restricted';
ALTER TABLE public.role_permissions
    ADD COLUMN IF NOT EXISTS action VARCHAR(100);

DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'role_permissions'
          AND column_name = 'can_read'
    ) THEN
        EXECUTE $sql$
            UPDATE public.role_permissions
            SET permission = CASE
                    WHEN COALESCE(can_read, FALSE) OR COALESCE(can_write, FALSE)
                    THEN 'allowed' ELSE 'restricted'
                END,
                action = COALESCE(action, 'Legacy read/write permissions')
        $sql$;
    END IF;
END
$migration$;

UPDATE public.role_permissions
SET action = COALESCE(action, 'Legacy permission')
WHERE action IS NULL;

ALTER TABLE public.role_permissions
    ALTER COLUMN action SET NOT NULL;
ALTER TABLE public.role_permissions
    ALTER COLUMN permission SET NOT NULL;

ALTER TABLE public.role_permissions
    DROP CONSTRAINT IF EXISTS role_permissions_role_module_key;

CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_module_action_key
    ON public.role_permissions (role, module, action);

INSERT INTO public.role_permissions (role, module, permission, action) VALUES
    ('farmer', 'Farm Data', 'allowed', 'Read: Own Farm Data'),
    ('farmer', 'Farm Data', 'allowed', 'Write: Own Farm Data'),
    ('farmer', 'Farm Data', 'restricted', 'Read: Other Farms'),
    ('farmer', 'Security', 'restricted', 'Write: Security Settings'),
    ('buyer', 'Marketplace', 'allowed', 'Read: Active Listings'),
    ('buyer', 'Marketplace', 'allowed', 'Write: Own Cart and Orders'),
    ('buyer', 'Farmer Data', 'restricted', 'Read: Farm Operational Data'),
    ('admin', 'Platform', 'allowed', 'Read: All Platform Data'),
    ('admin', 'Platform', 'allowed', 'Write: Users, Categories, Settings'),
    ('admin', 'Farmer Data', 'restricted', 'Read: Private Farm Records')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.data_classification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classification VARCHAR(30) NOT NULL
        CHECK (classification IN ('public','private','confidential','restricted')),
    title VARCHAR(150) NOT NULL,
    items TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.data_classification (classification, title, items)
SELECT seeds.classification, seeds.title, seeds.items
FROM (VALUES
    ('public', 'Public Data', 'Marketplace listings, product prices, farm names.'),
    ('private', 'Private Data', 'User profiles, farm locations, contact details.'),
    ('confidential', 'Confidential Data', 'Crop yields, livestock health, AI scan results.'),
    ('restricted', 'Restricted Data', 'Financial transactions, passwords, blockchain keys.')
) AS seeds(classification, title, items)
WHERE NOT EXISTS (
    SELECT 1 FROM public.data_classification AS existing
    WHERE existing.classification = seeds.classification
      AND existing.title = seeds.title
);

INSERT INTO public.farms (owner_id, farm_name, location)
SELECT profiles.id, BTRIM(profiles.farm_name), profiles.location
FROM public.profiles AS profiles
WHERE profiles.role = 'farmer'
  AND NULLIF(BTRIM(profiles.farm_name), '') IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.farms AS farms WHERE farms.owner_id = profiles.id
  );

CREATE OR REPLACE FUNCTION public.create_farmer_farm_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF NEW.role = 'farmer'
       AND NULLIF(BTRIM(NEW.farm_name), '') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM public.farms WHERE farms.owner_id = NEW.id
       ) THEN
        INSERT INTO public.farms (owner_id, farm_name, location)
        VALUES (NEW.id, BTRIM(NEW.farm_name), NEW.location);
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS create_farmer_farm_from_profile ON public.profiles;
CREATE TRIGGER create_farmer_farm_from_profile
    AFTER INSERT OR UPDATE OF role, farm_name, location ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_farmer_farm_from_profile();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'marketplace-products',
    'marketplace-products',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];
