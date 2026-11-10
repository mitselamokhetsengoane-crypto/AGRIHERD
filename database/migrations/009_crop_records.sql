CREATE TABLE IF NOT EXISTS public.planting_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    seed_type VARCHAR(100),
    quantity_used NUMERIC(10, 2),
    planting_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.harvest_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    harvest_date DATE,
    quantity NUMERIC(10, 2),
    unit VARCHAR(50),
    quality VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planting_records_crop_date
    ON public.planting_records(crop_id, planting_date DESC);
CREATE INDEX IF NOT EXISTS idx_harvest_records_crop_date
    ON public.harvest_records(crop_id, harvest_date DESC);

ALTER TABLE public.planting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own planting records" ON public.planting_records;
CREATE POLICY "Users can access own planting records" ON public.planting_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.crops
            WHERE crops.id = planting_records.crop_id
              AND crops.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crops
            WHERE crops.id = planting_records.crop_id
              AND crops.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can access own harvest records" ON public.harvest_records;
CREATE POLICY "Users can access own harvest records" ON public.harvest_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.crops
            WHERE crops.id = harvest_records.crop_id
              AND crops.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crops
            WHERE crops.id = harvest_records.crop_id
              AND crops.user_id = auth.uid()
        )
    );
