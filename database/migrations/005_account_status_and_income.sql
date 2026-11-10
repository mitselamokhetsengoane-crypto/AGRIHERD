-- ============================================================
-- ACCOUNT STATUS
-- ============================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS account_status VARCHAR(30)
    NOT NULL DEFAULT 'ACTIVE'
    CHECK (account_status IN ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED'));

-- Existing users are ACTIVE — this is correct, they are already using the app.
UPDATE public.profiles SET account_status = 'ACTIVE' WHERE account_status IS NULL;

-- ============================================================
-- FINANCIAL TRANSACTIONS: marketplace income source
-- ============================================================

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MANUAL'
    CHECK (source IN ('MANUAL','MARKETPLACE_SALE','REFUND'));

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);

-- Prevent duplicate marketplace income for the same order
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_marketplace_order
    ON public.transactions (reference_id)
    WHERE source = 'MARKETPLACE_SALE';

-- ============================================================
-- BLOCKCHAIN RECORDS: link to orders
-- ============================================================

ALTER TABLE public.blockchain_records
    ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_records_order
    ON public.blockchain_records(order_id);

-- ============================================================
-- Order audit helper: track who changed status and when
-- ============================================================

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ============================================================
-- Verification
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name = 'account_status';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'transactions' AND column_name = 'source';