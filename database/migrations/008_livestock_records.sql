CREATE TABLE IF NOT EXISTS public.animal_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    condition VARCHAR(255),
    treatment TEXT,
    date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vaccination_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(150),
    date_administered DATE,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feeding_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    date DATE,
    feed_type VARCHAR(150),
    quantity VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.breeding_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    status VARCHAR(50),
    outcome VARCHAR(100),
    breeding_date DATE,
    expected_birth_date DATE,
    actual_birth_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.breeding_records
    ADD COLUMN IF NOT EXISTS outcome VARCHAR(100),
    ADD COLUMN IF NOT EXISTS actual_birth_date DATE;

CREATE INDEX IF NOT EXISTS idx_animal_health_records_animal_date
    ON public.animal_health_records(animal_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_animal_date
    ON public.vaccination_records(animal_id, date_administered DESC);
CREATE INDEX IF NOT EXISTS idx_feeding_records_animal_date
    ON public.feeding_records(animal_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_breeding_records_animal_date
    ON public.breeding_records(animal_id, breeding_date DESC);

ALTER TABLE public.animal_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own animal health records" ON public.animal_health_records;
CREATE POLICY "Users can access own animal health records" ON public.animal_health_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.livestock
            WHERE livestock.id = animal_health_records.animal_id
              AND livestock.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.livestock
            WHERE livestock.id = animal_health_records.animal_id
              AND livestock.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can access own vaccination records" ON public.vaccination_records;
CREATE POLICY "Users can access own vaccination records" ON public.vaccination_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.livestock
            WHERE livestock.id = vaccination_records.animal_id
              AND livestock.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.livestock
            WHERE livestock.id = vaccination_records.animal_id
              AND livestock.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can access own feeding records" ON public.feeding_records;
CREATE POLICY "Users can access own feeding records" ON public.feeding_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.livestock
            WHERE livestock.id = feeding_records.animal_id
              AND livestock.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.livestock
            WHERE livestock.id = feeding_records.animal_id
              AND livestock.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can access own breeding records" ON public.breeding_records;
CREATE POLICY "Users can access own breeding records" ON public.breeding_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.livestock
            WHERE livestock.id = breeding_records.animal_id
              AND livestock.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.livestock
            WHERE livestock.id = breeding_records.animal_id
              AND livestock.user_id = auth.uid()
        )
    );
