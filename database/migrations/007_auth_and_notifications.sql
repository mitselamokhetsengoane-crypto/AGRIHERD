-- ============================================================
-- 007_auth_and_notifications.sql
-- Adds: revoked_tokens, password_reset_tokens,
--       notification preferences columns on system_settings
-- Run in Supabase SQL Editor
-- ============================================================

-- 1) Revoked JWTs (single row per jti that has been logged out)
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jti VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti
    ON public.revoked_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires
    ON public.revoked_tokens(expires_at);
ALTER TABLE public.revoked_tokens DISABLE ROW LEVEL SECURITY;

-- 2) Password reset tokens (store SHA-256 hash, never the raw token)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
    ON public.password_reset_tokens(token_hash);
ALTER TABLE public.password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- 3) Notification preferences (one row per user)
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    crop_updates BOOLEAN NOT NULL DEFAULT TRUE,
    livestock_updates BOOLEAN NOT NULL DEFAULT TRUE,
    low_stock_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    marketplace_updates BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.notification_settings DISABLE ROW LEVEL SECURITY;

-- 4) Optional: category column on notifications so the UI can filter
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'GENERAL';
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS link VARCHAR(255);

-- 5) Verification queries (run these and confirm counts > 0 later)
-- SELECT count(*) FROM public.revoked_tokens;
-- SELECT count(*) FROM public.password_reset_tokens;