ALTER TABLE public.disease_scans
    ADD COLUMN IF NOT EXISTS prediction JSONB NOT NULL DEFAULT '{}'::jsonb;
