-- ============================================================
-- CONSENT RECORDS
-- ============================================================
-- One row per user per policy version. If a user re-consents after
-- a policy version bump, a new row is added (audit trail).

CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('terms','privacy')),
    policy_version VARCHAR(20) NOT NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(64),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user
    ON public.consent_records(user_id);

CREATE INDEX IF NOT EXISTS idx_consent_records_policy
    ON public.consent_records(policy_type, policy_version);

-- Backend uses the service-role client, but this guarantees writes succeed
-- even if a policy is ever added here by mistake.
ALTER TABLE public.consent_records DISABLE ROW LEVEL SECURITY;

-- Verification:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'consent_records';