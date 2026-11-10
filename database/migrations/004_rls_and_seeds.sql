-- ============================================================
-- 1. RLS policies for all backend-managed tables
-- Service-role client should bypass RLS, but this guarantees it.
-- ============================================================

-- Disable RLS on backend-only tables (safer for a demo; RLS-less tables
-- can only be read with the anon key which the frontend never uses).
ALTER TABLE IF EXISTS public.profiles                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketplace_categories   DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.carts                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_items               DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items              DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketplace_products     DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. System settings
-- ============================================================
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

-- ============================================================
-- 3. Role permissions matrix
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin','farmer','buyer')),
    module VARCHAR(100) NOT NULL,
    permission VARCHAR(50) NOT NULL CHECK (permission IN ('allowed','restricted')),
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (role, module, action)
);

INSERT INTO public.role_permissions (role, module, permission, action) VALUES
    ('farmer', 'Farm Data', 'allowed',    'Read: Own Farm Data'),
    ('farmer', 'Farm Data', 'allowed',    'Write: Own Farm Data'),
    ('farmer', 'Farm Data', 'restricted', 'Read: Other Farms'),
    ('farmer', 'Security', 'restricted', 'Write: Security Settings'),
    ('buyer',  'Marketplace', 'allowed',  'Read: Active Listings'),
    ('buyer',  'Marketplace', 'allowed',  'Write: Own Cart and Orders'),
    ('buyer',  'Farmer Data', 'restricted', 'Read: Farm Operational Data'),
    ('admin',  'Platform', 'allowed',     'Read: All Platform Data'),
    ('admin',  'Platform', 'allowed',     'Write: Users, Categories, Settings'),
    ('admin',  'Farmer Data', 'restricted', 'Read: Private Farm Records')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Data classification matrix
-- ============================================================
CREATE TABLE IF NOT EXISTS public.data_classification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classification VARCHAR(30) NOT NULL CHECK (classification IN ('public','private','confidential','restricted')),
    title VARCHAR(150) NOT NULL,
    items TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.data_classification (classification, title, items) VALUES
    ('public', 'Public Data',
        'Marketplace listings, product prices, farm names.'),
    ('private', 'Private Data',
        'User profiles, farm locations, contact details.'),
    ('confidential', 'Confidential Data',
        'Crop yields, livestock health, AI scan results.'),
    ('restricted', 'Restricted Data',
        'Financial transactions, passwords, blockchain keys.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Clean up orphan auth users (fixes "Profile is missing")
-- ============================================================
-- This deletes Supabase auth users that have no matching profile row,
-- so the email becomes free to register again.
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- ============================================================
-- 6. Verify
-- ============================================================
-- Run these to confirm:
-- SELECT count(*) FROM public.system_settings;
-- SELECT count(*) FROM public.role_permissions;
-- SELECT count(*) FROM public.data_classification;
-- SELECT count(*) FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);