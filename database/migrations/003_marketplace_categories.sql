-- ============================================================
-- MARKETPLACE CATEGORIES
-- ============================================================

-- 1) Categories (self-referencing for crop subcategories)
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (name, parent_id)
);

-- 2) Add category_id to products (keep old string category for backward compat)
ALTER TABLE public.marketplace_products
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL;

-- 3) Seed main categories (idempotent — ON CONFLICT skips if already there)
INSERT INTO public.marketplace_categories (name, parent_id) VALUES ('Animal Products', NULL)
    ON CONFLICT DO NOTHING;

INSERT INTO public.marketplace_categories (name, parent_id) VALUES ('Crops', NULL)
    ON CONFLICT DO NOTHING;

-- 4) Seed crop subcategories
DO $$
DECLARE crops_id UUID;
BEGIN
    SELECT id INTO crops_id FROM public.marketplace_categories WHERE name = 'Crops' AND parent_id IS NULL LIMIT 1;
    IF crops_id IS NOT NULL THEN
        INSERT INTO public.marketplace_categories (name, parent_id) VALUES ('Vegetables', crops_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.marketplace_categories (name, parent_id) VALUES ('Grains and Cereals', crops_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.marketplace_categories (name, parent_id) VALUES ('Fruits', crops_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.marketplace_categories (name, parent_id) VALUES ('Legumes', crops_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.marketplace_categories (name, parent_id) VALUES ('Other Crops', crops_id) ON CONFLICT DO NOTHING;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_parent ON public.marketplace_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON public.marketplace_products(category_id);