-- ============================================================
-- AGRIHERD CONSOLIDATED SCHEMA (v3.0)
-- This drops all existing tables to remove duplicates and
-- rebuilds the database cleanly.
-- ============================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (References Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    farm_name VARCHAR(150),
    location VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'buyer', 'admin')),
    account_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FARMS
CREATE TABLE public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    size_hectares NUMERIC(10, 2),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LIVESTOCK & RELATED
CREATE TABLE public.livestock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    animal_id VARCHAR(100),
    name VARCHAR(100),
    type VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    gender VARCHAR(20),
    age INTEGER,
    weight NUMERIC(10, 2),
    health_status VARCHAR(50) DEFAULT 'Healthy',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.animal_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    condition VARCHAR(255),
    treatment TEXT,
    date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.vaccination_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(150),
    date_administered DATE,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.feeding_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    date DATE,
    feed_type VARCHAR(150),
    quantity VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.breeding_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    status VARCHAR(50),
    outcome VARCHAR(100),
    breeding_date DATE,
    expected_birth_date DATE,
    actual_birth_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CROPS & RELATED
CREATE TABLE public.crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(100),
    field_name VARCHAR(150),
    field_size VARCHAR(50),
    planting_date DATE,
    expected_harvest_date DATE,
    status VARCHAR(50) DEFAULT 'Planted',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.planting_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    seed_type VARCHAR(100),
    quantity_used NUMERIC(10, 2),
    planting_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.harvest_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    harvest_date DATE,
    quantity NUMERIC(10, 2),
    unit VARCHAR(50),
    quality VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TASKS & INVENTORY
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE,
    time TIME,
    assigned_person VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    quantity NUMERIC(10, 2) DEFAULT 0,
    unit VARCHAR(50),
    minimum_stock_level NUMERIC(10, 2) DEFAULT 0,
    stock_status VARCHAR(50) DEFAULT 'In Stock',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    item_name VARCHAR(150),
    change_amount NUMERIC(10, 2),
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FINANCE
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    date DATE,
    source VARCHAR(50) DEFAULT 'MANUAL' CHECK (source IN ('MANUAL','MARKETPLACE_SALE','REFUND')),
    reference_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MARKETPLACE
CREATE TABLE public.marketplace_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (name, parent_id)
);

CREATE TABLE public.marketplace_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    quantity_available NUMERIC(10, 2),
    unit VARCHAR(50),
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CARTS & ORDERS
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cart_id, product_id)
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    checkout_group UUID NOT NULL,
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REJECTED','PREPARING','READY','COMPLETED','CANCELLED')),
    customer_name VARCHAR(150),
    phone VARCHAR(50),
    delivery_location VARCHAR(255),
    notes TEXT,
    status_updated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.marketplace_products(id),
    product_name VARCHAR(150) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    method VARCHAR(30) NOT NULL CHECK (method IN ('CASH','MOBILE_MONEY','CARD')),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED')),
    is_simulated BOOLEAN NOT NULL DEFAULT FALSE,
    reference VARCHAR(120),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- 9. AI, BLOCKCHAIN, NOTIFICATIONS, AUDIT
CREATE TABLE public.disease_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    detected_disease VARCHAR(150),
    confidence NUMERIC(5, 4),
    image_url TEXT,
    prediction JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    category VARCHAR(30) DEFAULT 'GENERAL',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    crop_updates BOOLEAN NOT NULL DEFAULT TRUE,
    livestock_updates BOOLEAN NOT NULL DEFAULT TRUE,
    low_stock_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    marketplace_updates BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.blockchain_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    record_type VARCHAR(50),
    record_ref VARCHAR(150),
    record_hash VARCHAR(100),
    transaction_hash VARCHAR(100),
    block_number BIGINT,
    network VARCHAR(100),
    status VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(255),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin','farmer','buyer')),
    module VARCHAR(100) NOT NULL,
    permission VARCHAR(50) NOT NULL CHECK (permission IN ('allowed','restricted')),
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (role, module, action)
);

CREATE TABLE public.data_classification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classification VARCHAR(30) NOT NULL CHECK (classification IN ('public','private','confidential','restricted')),
    title VARCHAR(150) NOT NULL,
    items TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('terms','privacy')),
    policy_version VARCHAR(20) NOT NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(64),
    user_agent TEXT
);

CREATE TABLE public.revoked_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jti VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BLOCKCHAIN CUSTOM ENGINE TABLES
-- ============================================================
CREATE TABLE public.chain_blocks (
    block_number BIGINT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL UNIQUE,
    transactions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.chain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_number BIGINT NOT NULL REFERENCES public.chain_blocks(block_number) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    record_ref VARCHAR(150) NOT NULL,
    record_hash VARCHAR(64) NOT NULL UNIQUE,
    tx_hash VARCHAR(64) NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL
);

-- ============================================================
-- SEED DATA (DEFAULTS)
-- ============================================================
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('require_farmer_approval', 'false', 'If true, new farmer accounts need admin approval.'),
    ('password_min_length', '8', 'Minimum password length.'),
    ('password_require_uppercase', 'true', 'Passwords must contain an uppercase letter.'),
    ('password_require_lowercase', 'true', 'Passwords must contain a lowercase letter.'),
    ('password_require_number', 'true', 'Passwords must contain a number.'),
    ('password_require_special', 'true', 'Passwords must contain a special character.'),
    ('password_expiry_days', '90', 'Force password change after this many days.'),
    ('session_auto_logout_minutes', '15', 'Auto-logout after this many minutes.'),
    ('session_token_lifetime_minutes', '60', 'Access token lifetime in minutes.'),
    ('login_rate_limit_per_minute', '5', 'Maximum login attempts per minute.'),
    ('api_rate_limit_per_minute', '120', 'Maximum API requests per minute.'),
    ('enforce_mfa_for_admins', 'false', 'Require multi-factor authentication for admins.')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, module, permission, action)
SELECT r.role, m.module, 
    CASE
        WHEN r.role = 'admin' THEN CASE WHEN m.module IN ('Farm Data', 'Private Farm Records') THEN 'restricted' ELSE 'allowed' END
        WHEN r.role = 'farmer' AND m.module IN ('My Farms', 'Marketplace', 'Farm Data') THEN 'allowed'
        WHEN r.role = 'buyer' AND m.module = 'Marketplace' THEN 'allowed'
        ELSE 'restricted'
    END,
    a.action
FROM (VALUES ('admin'), ('farmer'), ('buyer')) AS r(role)
CROSS JOIN (VALUES 
    ('Platform Dashboard'), ('User Management'), ('Farm Management'), ('Marketplace Monitor'), 
    ('Categories'), ('AI Monitoring'), ('Blockchain Monitoring'), ('Roles & Permissions'), 
    ('Data Classification'), ('Audit Logs'), ('Security Settings'), ('My Farms'), 
    ('Marketplace'), ('Farm Data'), ('Private Farm Records')
) AS m(module)
CROSS JOIN (VALUES ('Read'), ('Write')) AS a(action)
ON CONFLICT DO NOTHING;

INSERT INTO public.data_classification (classification, title, items) VALUES
    ('public', 'Public Data', 'Marketplace listings, product prices, farm names.'),
    ('private', 'Private Data', 'User profiles, farm locations, contact details.'),
    ('confidential', 'Confidential Data', 'Crop yields, livestock health, AI scan results.'),
    ('restricted', 'Restricted Data', 'Financial transactions, passwords, blockchain keys.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON public.livestock FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Create profile and farm automatically when auth.users registers
CREATE OR REPLACE FUNCTION public.create_profile_for_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    metadata JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    profile_role TEXT := lower(COALESCE(metadata->>'role', 'farmer'));
    approval_setting TEXT;
    profile_farm_name TEXT := NULLIF(BTRIM(metadata->>'farm_name'), '');
BEGIN
    IF profile_role NOT IN ('farmer', 'buyer') THEN
        RAISE EXCEPTION 'Registration role must be farmer or buyer.';
    END IF;

    SELECT setting_value INTO approval_setting FROM public.system_settings WHERE setting_key = 'require_farmer_approval';

    INSERT INTO public.profiles (
        id, full_name, email, phone, farm_name, location, role, account_status
    ) VALUES (
        NEW.id, BTRIM(metadata->>'full_name'), NEW.email, NULLIF(BTRIM(metadata->>'phone'), ''),
        CASE WHEN profile_role = 'farmer' THEN profile_farm_name ELSE NULL END,
        CASE WHEN profile_role = 'farmer' THEN NULLIF(BTRIM(metadata->>'location'), '') ELSE NULL END,
        profile_role,
        CASE WHEN profile_role = 'farmer' AND lower(approval_setting) = 'true' THEN 'PENDING' ELSE 'ACTIVE' END
    );

    IF profile_role = 'farmer' AND profile_farm_name IS NOT NULL THEN
        INSERT INTO public.farms (owner_id, farm_name, location) VALUES (NEW.id, profile_farm_name, NULLIF(BTRIM(metadata->>'location'), ''));
    END IF;

    INSERT INTO public.consent_records (user_id, policy_type, policy_version) VALUES
        (NEW.id, 'privacy', '1.0'), (NEW.id, 'terms', '1.0');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agriherd_create_profile_on_auth_user ON auth.users;
CREATE TRIGGER agriherd_create_profile_on_auth_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_auth_user();

-- Function: Atomic stock update for inventory
CREATE OR REPLACE FUNCTION public.update_inventory_stock(
    p_item_id UUID, p_user_id UUID, p_change_amount NUMERIC, p_reason TEXT
) RETURNS SETOF public.inventory LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
    current_item public.inventory%ROWTYPE;
    new_quantity NUMERIC(10, 2);
BEGIN
    SELECT inventory.* INTO current_item FROM public.inventory WHERE inventory.id = p_item_id AND inventory.user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Inventory item not found'; END IF;

    new_quantity := COALESCE(current_item.quantity, 0) + p_change_amount;
    IF new_quantity < 0 THEN RAISE EXCEPTION 'Stock quantity cannot be negative'; END IF;

    UPDATE public.inventory SET quantity = new_quantity,
        stock_status = CASE WHEN new_quantity <= COALESCE(current_item.minimum_stock_level, 0) THEN 'Low Stock' ELSE 'In Stock' END,
        updated_at = NOW()
    WHERE inventory.id = p_item_id AND inventory.user_id = p_user_id RETURNING inventory.* INTO current_item;

    INSERT INTO public.inventory_transactions (item_id, item_name, change_amount, reason)
    VALUES (p_item_id, current_item.name, p_change_amount, p_reason);

    RETURN NEXT current_item;
END;
$$;

-- Function: Add item to cart (Atomic)
CREATE OR REPLACE FUNCTION public.add_marketplace_cart_item(
    p_buyer_id UUID, p_product_id UUID, p_quantity NUMERIC
) RETURNS UUID LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
    v_cart_id UUID;
    product_row public.marketplace_products%ROWTYPE;
    current_quantity NUMERIC(10, 2);
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;

    INSERT INTO public.carts (buyer_id) VALUES (p_buyer_id)
    ON CONFLICT (buyer_id) DO UPDATE SET updated_at = NOW() RETURNING id INTO v_cart_id;

    SELECT products.* INTO product_row FROM public.marketplace_products AS products WHERE products.id = p_product_id FOR UPDATE;
    IF NOT FOUND OR product_row.status <> 'Available' THEN RAISE EXCEPTION 'Product is not available'; END IF;

    SELECT items.quantity INTO current_quantity FROM public.cart_items AS items WHERE items.cart_id = v_cart_id AND items.product_id = p_product_id FOR UPDATE;
    IF COALESCE(current_quantity, 0) + p_quantity > COALESCE(product_row.quantity_available, 0) THEN RAISE EXCEPTION 'Not enough stock available'; END IF;

    INSERT INTO public.cart_items (cart_id, product_id, quantity) VALUES (v_cart_id, p_product_id, p_quantity)
    ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity;

    UPDATE public.carts SET updated_at = NOW() WHERE id = v_cart_id;
    RETURN v_cart_id;
END;
$$;

-- Function: Update cart quantity (Atomic)
CREATE OR REPLACE FUNCTION public.set_marketplace_cart_item_quantity(
    p_buyer_id UUID, p_item_id UUID, p_quantity NUMERIC
) RETURNS UUID LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
    v_cart_id UUID;
    v_product_id UUID;
    available NUMERIC(10, 2);
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;

    SELECT carts.id INTO v_cart_id FROM public.carts WHERE carts.buyer_id = p_buyer_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cart item not found'; END IF;

    SELECT items.product_id INTO v_product_id FROM public.cart_items AS items WHERE items.id = p_item_id AND items.cart_id = v_cart_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cart item not found'; END IF;

    SELECT products.quantity_available INTO available FROM public.marketplace_products AS products WHERE products.id = v_product_id AND products.status = 'Available' FOR UPDATE;
    IF NOT FOUND OR p_quantity > COALESCE(available, 0) THEN RAISE EXCEPTION 'Not enough stock available'; END IF;

    UPDATE public.cart_items SET quantity = p_quantity WHERE id = p_item_id AND cart_id = v_cart_id;
    UPDATE public.carts SET updated_at = NOW() WHERE id = v_cart_id;
    RETURN v_cart_id;
END;
$$;

-- Function: Multi-farmer Checkout (Atomic & Idempotent)
CREATE TABLE public.marketplace_checkout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    idempotency_key UUID NOT NULL,
    response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (buyer_id, idempotency_key)
);

CREATE OR REPLACE FUNCTION public.checkout_marketplace_cart(
    p_buyer_id UUID, p_idempotency_key UUID, p_customer_name TEXT, p_phone TEXT, p_delivery_location TEXT, p_notes TEXT, p_payment_method TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
    v_cart_id UUID;
    v_checkout_group UUID := public.uuid_generate_v4();
    v_request_response JSONB;
    v_inserted_rows INTEGER;
    seller_row RECORD;
    item_row RECORD;
    v_order_id UUID;
    v_order_total NUMERIC(12, 2);
    v_orders_json JSONB;
    v_total_amount NUMERIC(12, 2);
BEGIN
    IF p_payment_method NOT IN ('CASH', 'MOBILE_MONEY', 'CARD') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;

    INSERT INTO public.marketplace_checkout_requests (buyer_id, idempotency_key)
    VALUES (p_buyer_id, p_idempotency_key) ON CONFLICT (buyer_id, idempotency_key) DO NOTHING;
    GET DIAGNOSTICS v_inserted_rows = ROW_COUNT;

    IF v_inserted_rows = 0 THEN
        SELECT requests.response INTO v_request_response FROM public.marketplace_checkout_requests AS requests WHERE requests.buyer_id = p_buyer_id AND requests.idempotency_key = p_idempotency_key;
        IF v_request_response IS NOT NULL THEN RETURN v_request_response; END IF;
        RAISE EXCEPTION 'Checkout request is already being processed';
    END IF;

    SELECT carts.id INTO v_cart_id FROM public.carts WHERE carts.buyer_id = p_buyer_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Your cart is empty'; END IF;

    FOR seller_row IN
        SELECT DISTINCT products.seller_id FROM public.cart_items AS items
        JOIN public.marketplace_products AS products ON products.id = items.product_id
        WHERE items.cart_id = v_cart_id ORDER BY products.seller_id
    LOOP
        SELECT SUM(products.price * items.quantity) INTO v_order_total
        FROM public.cart_items AS items JOIN public.marketplace_products AS products ON products.id = items.product_id
        WHERE items.cart_id = v_cart_id AND products.seller_id = seller_row.seller_id;

        INSERT INTO public.orders (buyer_id, seller_id, checkout_group, total, status, customer_name, phone, delivery_location, notes)
        VALUES (p_buyer_id, seller_row.seller_id, v_checkout_group, v_order_total, 'PENDING', BTRIM(p_customer_name), BTRIM(p_phone), BTRIM(p_delivery_location), p_notes)
        RETURNING id INTO v_order_id;

        FOR item_row IN
            SELECT products.id, products.name, products.price, items.quantity
            FROM public.cart_items AS items JOIN public.marketplace_products AS products ON products.id = items.product_id
            WHERE items.cart_id = v_cart_id AND products.seller_id = seller_row.seller_id ORDER BY products.id
        LOOP
            INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price)
            VALUES (v_order_id, item_row.id, item_row.name, item_row.quantity, item_row.price);

            UPDATE public.marketplace_products AS products SET quantity_available = products.quantity_available - item_row.quantity
            WHERE products.id = item_row.id AND products.status = 'Available' AND products.quantity_available >= item_row.quantity;
            IF NOT FOUND THEN RAISE EXCEPTION 'A product no longer has enough stock'; END IF;
        END LOOP;

        INSERT INTO public.payments (order_id, amount, method, status, is_simulated, reference)
        VALUES (v_order_id, v_order_total, p_payment_method, 'PENDING', p_payment_method <> 'CASH', LEFT(p_idempotency_key::TEXT, 8) || '-' || LEFT(v_order_id::TEXT, 8));
    END LOOP;

    DELETE FROM public.cart_items WHERE public.cart_items.cart_id = v_cart_id;
    UPDATE public.carts SET updated_at = NOW() WHERE public.carts.id = v_cart_id;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(orders)), '[]'::JSONB), COALESCE(SUM(orders.total), 0)
    INTO v_orders_json, v_total_amount FROM public.orders AS orders WHERE orders.checkout_group = v_checkout_group;

    v_request_response := JSONB_BUILD_OBJECT(
        'checkout_group', v_checkout_group, 'orders', v_orders_json, 'total', v_total_amount,
        'payment_method', p_payment_method, 'is_simulated', p_payment_method <> 'CASH'
    );

    UPDATE public.marketplace_checkout_requests AS requests SET response = v_request_response
    WHERE requests.buyer_id = p_buyer_id AND requests.idempotency_key = p_idempotency_key;

    RETURN v_request_response;
END;
$$;

-- ============================================================
-- RLS POLICIES (STRICTLY ENFORCED)
-- ============================================================

-- Disable RLS on backend-only tables (the backend bypasses this with service_role)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_health_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planting_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_classification DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.revoked_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_transactions DISABLE ROW LEVEL SECURITY;

-- Lock down function execution to backend only
REVOKE ALL ON FUNCTION public.add_marketplace_cart_item(UUID, UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_marketplace_cart_item_quantity(UUID, UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_marketplace_cart(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.add_marketplace_cart_item(UUID, UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_marketplace_cart_item_quantity(UUID, UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.checkout_marketplace_cart(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;