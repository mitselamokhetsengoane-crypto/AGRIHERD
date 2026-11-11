CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('require_farmer_approval', 'false', 'If true, new farmer accounts need admin approval.'),
    ('password_min_length', '8', 'Minimum password length enforced at registration.'),
    ('password_require_uppercase', 'true', 'Passwords must contain an uppercase letter.'),
    ('password_require_lowercase', 'true', 'Passwords must contain a lowercase letter.'),
    ('password_require_number', 'true', 'Passwords must contain a number.'),
    ('password_require_special', 'true', 'Passwords must contain a special character.'),
    ('password_expiry_days', '90', 'Force password change after this many days.'),
    ('session_auto_logout_minutes', '15', 'Auto-logout after this many minutes.'),
    ('session_token_lifetime_minutes', '60', 'Access token lifetime in minutes.'),
    ('login_rate_limit_per_minute', '5', 'Maximum login attempts per minute per client.'),
    ('api_rate_limit_per_minute', '120', 'Maximum API requests per minute per client.'),
    ('enforce_mfa_for_admins', 'false', 'Require multi-factor authentication for admin accounts.')
ON CONFLICT (setting_key) DO NOTHING;

WITH roles(role) AS (
    VALUES ('admin'), ('farmer'), ('buyer')
),
modules(module) AS (
    VALUES
        ('Platform Dashboard'),
        ('User Management'),
        ('Farm Management'),
        ('Marketplace Monitor'),
        ('Categories'),
        ('AI Monitoring'),
        ('Blockchain Monitoring'),
        ('Roles & Permissions'),
        ('Data Classification'),
        ('Audit Logs'),
        ('Security Settings'),
        ('My Farms'),
        ('Marketplace'),
        ('Farm Data'),
        ('Private Farm Records')
),
actions(action) AS (
    VALUES ('Read'), ('Write')
)
INSERT INTO public.role_permissions (role, module, permission, action)
SELECT
    roles.role,
    modules.module,
    CASE
        WHEN roles.role = 'admin'
            THEN CASE WHEN modules.module IN ('Farm Data', 'Private Farm Records')
                THEN 'restricted' ELSE 'allowed' END
        WHEN roles.role = 'farmer' AND modules.module IN ('My Farms', 'Marketplace', 'Farm Data')
            THEN 'allowed'
        WHEN roles.role = 'buyer' AND modules.module = 'Marketplace'
            THEN 'allowed'
        ELSE 'restricted'
    END,
    actions.action
FROM roles
CROSS JOIN modules
CROSS JOIN actions
ON CONFLICT (role, module, action) DO NOTHING;

ALTER TABLE public.farms
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'pending'));
CREATE INDEX IF NOT EXISTS idx_farms_status_created_at
    ON public.farms (status, created_at DESC);

ALTER TABLE public.blockchain_records
    ADD COLUMN IF NOT EXISTS network VARCHAR(100),
    ADD COLUMN IF NOT EXISTS status VARCHAR(30);

INSERT INTO public.farms (owner_id, farm_name, location)
SELECT profiles.id, BTRIM(profiles.farm_name), profiles.location
FROM public.profiles AS profiles
WHERE profiles.role = 'farmer'
  AND NULLIF(BTRIM(profiles.farm_name), '') IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public.farms AS farms
      WHERE farms.owner_id = profiles.id
  );

CREATE OR REPLACE FUNCTION public.create_profile_for_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    metadata JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    profile_role TEXT := lower(COALESCE(metadata->>'role', 'farmer'));
    approval_setting TEXT;
    profile_farm_name TEXT := NULLIF(BTRIM(metadata->>'farm_name'), '');
    privacy_version TEXT := COALESCE(
        NULLIF(BTRIM(metadata->>'privacy_policy_version'), ''),
        '1.0'
    );
    terms_version TEXT := COALESCE(
        NULLIF(BTRIM(metadata->>'terms_version'), ''),
        '1.0'
    );
BEGIN
    IF profile_role NOT IN ('farmer', 'buyer') THEN
        RAISE EXCEPTION 'Registration role must be farmer or buyer.';
    END IF;

    IF NULLIF(BTRIM(metadata->>'full_name'), '') IS NULL THEN
        RAISE EXCEPTION 'A full name is required to create the account profile.';
    END IF;

    IF lower(COALESCE(metadata->>'consent_given', 'false')) <> 'true' THEN
        RAISE EXCEPTION 'Privacy Policy and Terms consent is required.';
    END IF;

    IF profile_role = 'farmer' AND profile_farm_name IS NULL THEN
        RAISE EXCEPTION 'A farm name is required to create a farmer profile.';
    END IF;

    SELECT setting_value
    INTO approval_setting
    FROM public.system_settings
    WHERE setting_key = 'require_farmer_approval';

    IF NOT FOUND OR approval_setting IS NULL THEN
        RAISE EXCEPTION 'The require_farmer_approval system setting is missing.';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        farm_name,
        location,
        role,
        account_status
    )
    VALUES (
        NEW.id,
        BTRIM(metadata->>'full_name'),
        NEW.email,
        NULLIF(BTRIM(metadata->>'phone'), ''),
        CASE WHEN profile_role = 'farmer' THEN profile_farm_name ELSE NULL END,
        CASE WHEN profile_role = 'farmer' THEN NULLIF(BTRIM(metadata->>'location'), '') ELSE NULL END,
        profile_role,
        CASE
            WHEN profile_role = 'farmer' AND lower(approval_setting) = 'true' THEN 'PENDING'
            ELSE 'ACTIVE'
        END
    );

    INSERT INTO public.consent_records (user_id, policy_type, policy_version)
    VALUES
        (NEW.id, 'privacy', privacy_version),
        (NEW.id, 'terms', terms_version);

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS agriherd_create_profile_on_auth_user ON auth.users;
CREATE TRIGGER agriherd_create_profile_on_auth_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_profile_for_new_auth_user();
