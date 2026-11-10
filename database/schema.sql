-- ============================================================
-- AGRIHERD DATABASE SCHEMA (Supabase PostgreSQL)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    farm_name VARCHAR(150),
    location VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'worker', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. FARMS
-- ============================================================
CREATE TABLE public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    size_hectares NUMERIC(10, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. FARM MEMBERS (for workers)
-- ============================================================
CREATE TABLE public.farm_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    access_role VARCHAR(30) DEFAULT 'worker',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(farm_id, user_id)
);

-- ============================================================
-- 4. FIELDS
-- ============================================================
CREATE TABLE public.fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    field_name VARCHAR(150) NOT NULL,
    area NUMERIC(10, 2),
    soil_type VARCHAR(100),
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. LIVESTOCK
-- ============================================================
CREATE TABLE public.livestock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    animal_id VARCHAR(100),
    name VARCHAR(100),
    type VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    gender VARCHAR(20),
    age INTEGER,
    weight NUMERIC(10, 2),
    health_status VARCHAR(50) DEFAULT 'Healthy',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. ANIMAL HEALTH RECORDS
-- ============================================================
CREATE TABLE public.animal_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    condition VARCHAR(255),
    treatment TEXT,
    date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. VACCINATION RECORDS
-- ============================================================
CREATE TABLE public.vaccination_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(150),
    date_administered DATE,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 8. FEEDING RECORDS
-- ============================================================
CREATE TABLE public.feeding_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    date DATE,
    feed_type VARCHAR(150),
    quantity VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. BREEDING RECORDS
-- ============================================================
CREATE TABLE public.breeding_records (
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

-- ============================================================
-- 10. CROPS
-- ============================================================
CREATE TABLE public.crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(100),
    field_name VARCHAR(150),
    field_size VARCHAR(50),
    planting_date DATE,
    expected_harvest_date DATE,
    status VARCHAR(50) DEFAULT 'Planted',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 11. PLANTING RECORDS
-- ============================================================
CREATE TABLE public.planting_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    seed_type VARCHAR(100),
    quantity_used NUMERIC(10, 2),
    planting_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 12. HARVEST RECORDS
-- ============================================================
CREATE TABLE public.harvest_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    harvest_date DATE,
    quantity NUMERIC(10, 2),
    unit VARCHAR(50),
    quality VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 13. TASKS
-- ============================================================
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE,
    time TIME,
    assigned_person VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 14. INVENTORY
-- ============================================================
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    quantity NUMERIC(10, 2) DEFAULT 0,
    unit VARCHAR(50),
    minimum_stock_level NUMERIC(10, 2) DEFAULT 0,
    stock_status VARCHAR(50) DEFAULT 'In Stock',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 15. INVENTORY TRANSACTIONS (Stock History)
-- ============================================================
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    item_name VARCHAR(150),
    change_amount NUMERIC(10, 2),
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_created_at
    ON public.inventory_transactions(item_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_inventory_stock(
    p_item_id UUID,
    p_user_id UUID,
    p_change_amount NUMERIC,
    p_reason TEXT
)
RETURNS SETOF public.inventory
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    current_item public.inventory%ROWTYPE;
    new_quantity NUMERIC(10, 2);
BEGIN
    IF p_change_amount IS NULL THEN
        RAISE EXCEPTION 'A numeric stock change is required'
            USING ERRCODE = '22023';
    END IF;

    SELECT inventory.*
    INTO current_item
    FROM public.inventory AS inventory
    WHERE inventory.id = p_item_id
      AND inventory.user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item not found'
            USING ERRCODE = 'P0002';
    END IF;

    new_quantity := COALESCE(current_item.quantity, 0) + p_change_amount;
    IF new_quantity < 0 THEN
        RAISE EXCEPTION 'Stock quantity cannot be negative'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.inventory AS inventory
    SET quantity = new_quantity,
        stock_status = CASE
            WHEN new_quantity <= COALESCE(current_item.minimum_stock_level, 0)
                THEN 'Low Stock'
            ELSE 'In Stock'
        END,
        updated_at = NOW()
    WHERE inventory.id = p_item_id
      AND inventory.user_id = p_user_id
    RETURNING inventory.* INTO current_item;

    INSERT INTO public.inventory_transactions (
        item_id,
        item_name,
        change_amount,
        reason
    )
    VALUES (
        p_item_id,
        current_item.name,
        p_change_amount,
        p_reason
    );

    RETURN NEXT current_item;
END;
$function$;

-- ============================================================
-- 16. TRANSACTIONS (Finance)
-- ============================================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 17. MARKETPLACE PRODUCTS
-- ============================================================
CREATE TABLE public.marketplace_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    quantity_available NUMERIC(10, 2),
    unit VARCHAR(50),
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 18. MARKETPLACE ORDERS
-- ============================================================
CREATE TABLE public.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    customer_name VARCHAR(150),
    phone VARCHAR(50),
    delivery_location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 19. ORDER ITEMS
-- ============================================================
CREATE TABLE public.marketplace_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.marketplace_products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 20. DISEASE SCANS
-- ============================================================
CREATE TABLE public.disease_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    detected_disease VARCHAR(150),
    confidence NUMERIC(5, 4),
    image_url TEXT,
    prediction JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 21. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 22. BLOCKCHAIN RECORDS
-- ============================================================
CREATE TABLE public.blockchain_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    record_type VARCHAR(50),
    record_ref VARCHAR(150),
    record_hash VARCHAR(100),
    transaction_hash VARCHAR(100),
    block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 23. AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 24. ROLE PERMISSIONS
-- ============================================================
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, module)
);

-- ============================================================
-- 25. PRIVACY REQUESTS (GDPR)
-- ============================================================
CREATE TABLE public.privacy_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- 'access', 'erasure', 'portability', 'rectification'
    status VARCHAR(50) DEFAULT 'Pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Livestock: users can only access their own animals
CREATE POLICY "Users can access own livestock" ON public.livestock FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own animal health records" ON public.animal_health_records FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.livestock
    WHERE livestock.id = animal_health_records.animal_id
      AND livestock.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.livestock
    WHERE livestock.id = animal_health_records.animal_id
      AND livestock.user_id = auth.uid()
));

CREATE POLICY "Users can access own vaccination records" ON public.vaccination_records FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.livestock
    WHERE livestock.id = vaccination_records.animal_id
      AND livestock.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.livestock
    WHERE livestock.id = vaccination_records.animal_id
      AND livestock.user_id = auth.uid()
));

CREATE POLICY "Users can access own feeding records" ON public.feeding_records FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.livestock
    WHERE livestock.id = feeding_records.animal_id
      AND livestock.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.livestock
    WHERE livestock.id = feeding_records.animal_id
      AND livestock.user_id = auth.uid()
));

CREATE POLICY "Users can access own breeding records" ON public.breeding_records FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.livestock
    WHERE livestock.id = breeding_records.animal_id
      AND livestock.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.livestock
    WHERE livestock.id = breeding_records.animal_id
      AND livestock.user_id = auth.uid()
));

-- Crops: users can only access their own crops
CREATE POLICY "Users can access own crops" ON public.crops FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own planting records" ON public.planting_records FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.crops
    WHERE crops.id = planting_records.crop_id
      AND crops.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.crops
    WHERE crops.id = planting_records.crop_id
      AND crops.user_id = auth.uid()
));

CREATE POLICY "Users can access own harvest records" ON public.harvest_records FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.crops
    WHERE crops.id = harvest_records.crop_id
      AND crops.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.crops
    WHERE crops.id = harvest_records.crop_id
      AND crops.user_id = auth.uid()
));

-- Tasks: users can only access their own tasks
CREATE POLICY "Users can access own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- Inventory: users can only access their own inventory
CREATE POLICY "Users can access own inventory" ON public.inventory FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own inventory transactions" ON public.inventory_transactions FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.inventory
    WHERE inventory.id = inventory_transactions.item_id
      AND inventory.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.inventory
    WHERE inventory.id = inventory_transactions.item_id
      AND inventory.user_id = auth.uid()
));

-- Transactions: users can only access their own transactions
CREATE POLICY "Users can access own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Products: everyone can view, but only seller can edit
CREATE POLICY "Anyone can view products" ON public.marketplace_products FOR SELECT USING (TRUE);
CREATE POLICY "Sellers can manage own products" ON public.marketplace_products FOR ALL USING (auth.uid() = seller_id);

-- Disease scans: users can only access their own
CREATE POLICY "Users can access own scans" ON public.disease_scans FOR ALL USING (auth.uid() = user_id);

-- Notifications: users can only access their own
CREATE POLICY "Users can access own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Audit logs: only admins can view
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_livestock_user ON public.livestock(user_id);
CREATE INDEX idx_crops_user ON public.crops(user_id);
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_inventory_user ON public.inventory(user_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_disease_scans_user ON public.disease_scans(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_marketplace_products_seller ON public.marketplace_products(seller_id);

-- ============================================================
-- TRIGGERS (auto-update timestamps)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON public.livestock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================