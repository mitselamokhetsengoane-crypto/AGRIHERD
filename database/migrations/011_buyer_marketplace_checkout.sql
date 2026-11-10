ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('farmer', 'worker', 'buyer', 'admin'));

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can access own carts" ON public.carts;
CREATE POLICY "Buyers can access own carts" ON public.carts
    FOR ALL
    USING (
        buyer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'buyer'
        )
    )
    WITH CHECK (
        buyer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'buyer'
        )
    );

DROP POLICY IF EXISTS "Buyers can access own cart items" ON public.cart_items;
CREATE POLICY "Buyers can access own cart items" ON public.cart_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
              AND carts.buyer_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
              AND carts.buyer_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.marketplace_products
            WHERE marketplace_products.id = cart_items.product_id
              AND marketplace_products.status = 'Available'
              AND marketplace_products.quantity_available >= cart_items.quantity
        )
    );

DROP POLICY IF EXISTS "Users can view related marketplace orders" ON public.orders;
CREATE POLICY "Users can view related marketplace orders" ON public.orders
    FOR SELECT
    USING (
        buyer_id = auth.uid()
        OR seller_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view related marketplace order items" ON public.order_items;
CREATE POLICY "Users can view related marketplace order items" ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND (
                  orders.buyer_id = auth.uid()
                  OR orders.seller_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.profiles
                      WHERE profiles.id = auth.uid()
                        AND profiles.role = 'admin'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Users can view related marketplace payments" ON public.payments;
CREATE POLICY "Users can view related marketplace payments" ON public.payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
              AND (
                  orders.buyer_id = auth.uid()
                  OR orders.seller_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.profiles
                      WHERE profiles.id = auth.uid()
                        AND profiles.role = 'admin'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Anyone can view available marketplace products"
    ON public.marketplace_products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Sellers can manage own products" ON public.marketplace_products;
CREATE POLICY "Anyone can view available marketplace products"
    ON public.marketplace_products
    FOR SELECT
    USING (
        (status = 'Available' AND COALESCE(quantity_available, 0) > 0)
        OR seller_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Sellers can manage own marketplace products"
    ON public.marketplace_products;
CREATE POLICY "Sellers can manage own marketplace products"
    ON public.marketplace_products
    FOR ALL
    USING (
        (
            seller_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                  AND profiles.role = 'farmer'
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        (
            seller_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                  AND profiles.role = 'farmer'
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION public.add_marketplace_cart_item(
    p_buyer_id UUID,
    p_product_id UUID,
    p_quantity NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_cart_id UUID;
    product_row public.marketplace_products%ROWTYPE;
    current_quantity NUMERIC(10, 2);
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.carts (buyer_id)
    VALUES (p_buyer_id)
    ON CONFLICT (buyer_id) DO UPDATE
        SET updated_at = NOW()
    RETURNING id INTO v_cart_id;

    PERFORM 1 FROM public.carts WHERE id = v_cart_id FOR UPDATE;

    SELECT products.*
    INTO product_row
    FROM public.marketplace_products AS products
    WHERE products.id = p_product_id
    FOR UPDATE;

    IF NOT FOUND OR product_row.status <> 'Available' THEN
        RAISE EXCEPTION 'Product is not available'
            USING ERRCODE = 'P0002';
    END IF;

    SELECT items.quantity
    INTO current_quantity
    FROM public.cart_items AS items
    WHERE items.cart_id = v_cart_id
      AND items.product_id = p_product_id
    FOR UPDATE;

    IF COALESCE(current_quantity, 0) + p_quantity
       > COALESCE(product_row.quantity_available, 0) THEN
        RAISE EXCEPTION 'Not enough stock available'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.cart_items (cart_id, product_id, quantity)
    VALUES (v_cart_id, p_product_id, p_quantity)
    ON CONFLICT (cart_id, product_id) DO UPDATE
        SET quantity = cart_items.quantity + EXCLUDED.quantity;

    UPDATE public.carts SET updated_at = NOW() WHERE id = v_cart_id;
    RETURN v_cart_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_marketplace_cart_item_quantity(
    p_buyer_id UUID,
    p_item_id UUID,
    p_quantity NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_cart_id UUID;
    v_product_id UUID;
    available NUMERIC(10, 2);
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero'
            USING ERRCODE = '22023';
    END IF;

    SELECT carts.id
    INTO v_cart_id
    FROM public.carts
    WHERE carts.buyer_id = p_buyer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cart item not found'
            USING ERRCODE = 'P0002';
    END IF;

    SELECT items.product_id
    INTO v_product_id
    FROM public.cart_items AS items
    WHERE items.id = p_item_id
      AND items.cart_id = v_cart_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cart item not found'
            USING ERRCODE = 'P0002';
    END IF;

    SELECT products.quantity_available
    INTO available
    FROM public.marketplace_products AS products
    WHERE products.id = v_product_id
      AND products.status = 'Available'
    FOR UPDATE;

    IF NOT FOUND OR p_quantity > COALESCE(available, 0) THEN
        RAISE EXCEPTION 'Not enough stock available'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.cart_items
    SET quantity = p_quantity
    WHERE id = p_item_id
      AND cart_id = v_cart_id;

    UPDATE public.carts SET updated_at = NOW() WHERE id = v_cart_id;
    RETURN v_cart_id;
END;
$function$;

CREATE TABLE IF NOT EXISTS public.marketplace_checkout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    idempotency_key UUID NOT NULL,
    response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (buyer_id, idempotency_key)
);

ALTER TABLE public.marketplace_checkout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can view own checkout requests"
    ON public.marketplace_checkout_requests;
CREATE POLICY "Buyers can view own checkout requests"
    ON public.marketplace_checkout_requests
    FOR SELECT
    USING (buyer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.checkout_marketplace_cart(
    p_buyer_id UUID,
    p_idempotency_key UUID,
    p_customer_name TEXT,
    p_phone TEXT,
    p_delivery_location TEXT,
    p_notes TEXT,
    p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
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
    IF p_payment_method NOT IN ('CASH', 'MOBILE_MONEY', 'CARD') THEN
        RAISE EXCEPTION 'Invalid payment method'
            USING ERRCODE = '22023';
    END IF;

    IF NULLIF(BTRIM(p_customer_name), '') IS NULL
       OR NULLIF(BTRIM(p_phone), '') IS NULL
       OR NULLIF(BTRIM(p_delivery_location), '') IS NULL THEN
        RAISE EXCEPTION 'Customer name, phone and delivery location are required'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.marketplace_checkout_requests (buyer_id, idempotency_key)
    VALUES (p_buyer_id, p_idempotency_key)
    ON CONFLICT (buyer_id, idempotency_key) DO NOTHING;
    GET DIAGNOSTICS v_inserted_rows = ROW_COUNT;

    IF v_inserted_rows = 0 THEN
        SELECT requests.response
        INTO v_request_response
        FROM public.marketplace_checkout_requests AS requests
        WHERE requests.buyer_id = p_buyer_id
          AND requests.idempotency_key = p_idempotency_key;

        IF v_request_response IS NOT NULL THEN
            RETURN v_request_response;
        END IF;

        RAISE EXCEPTION 'Checkout request is already being processed'
            USING ERRCODE = '40001';
    END IF;

    SELECT carts.id
    INTO v_cart_id
    FROM public.carts
    WHERE carts.buyer_id = p_buyer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Your cart is empty'
            USING ERRCODE = '22023';
    END IF;

    PERFORM items.id
    FROM public.cart_items AS items
    WHERE items.cart_id = v_cart_id
    ORDER BY items.id
    FOR UPDATE OF items;

    IF NOT EXISTS (
        SELECT 1
        FROM public.cart_items AS items
        WHERE items.cart_id = v_cart_id
    ) THEN
        RAISE EXCEPTION 'Your cart is empty'
            USING ERRCODE = '22023';
    END IF;

    PERFORM products.id
    FROM public.marketplace_products AS products
    JOIN public.cart_items AS items ON items.product_id = products.id
    WHERE items.cart_id = v_cart_id
    ORDER BY products.id
    FOR UPDATE OF products;

    IF EXISTS (
        SELECT 1
        FROM public.cart_items AS items
        LEFT JOIN public.marketplace_products AS products
          ON products.id = items.product_id
        WHERE items.cart_id = v_cart_id
          AND (
              products.id IS NULL
              OR products.status <> 'Available'
              OR COALESCE(products.quantity_available, 0) < items.quantity
          )
    ) THEN
        RAISE EXCEPTION 'A product is unavailable or no longer has enough stock'
            USING ERRCODE = '22023';
    END IF;

    FOR seller_row IN
        SELECT DISTINCT products.seller_id
        FROM public.cart_items AS items
        JOIN public.marketplace_products AS products
          ON products.id = items.product_id
        WHERE items.cart_id = v_cart_id
        ORDER BY products.seller_id
    LOOP
        SELECT SUM(products.price * items.quantity)
        INTO v_order_total
        FROM public.cart_items AS items
        JOIN public.marketplace_products AS products
          ON products.id = items.product_id
        WHERE items.cart_id = v_cart_id
          AND products.seller_id = seller_row.seller_id;

        INSERT INTO public.orders (
            buyer_id, seller_id, checkout_group, total, status,
            customer_name, phone, delivery_location, notes
        )
        VALUES (
            p_buyer_id, seller_row.seller_id, v_checkout_group, v_order_total, 'PENDING',
            BTRIM(p_customer_name), BTRIM(p_phone), BTRIM(p_delivery_location), p_notes
        )
        RETURNING id INTO v_order_id;

        FOR item_row IN
            SELECT products.id, products.name, products.price, items.quantity
            FROM public.cart_items AS items
            JOIN public.marketplace_products AS products
              ON products.id = items.product_id
            WHERE items.cart_id = v_cart_id
              AND products.seller_id = seller_row.seller_id
            ORDER BY products.id
        LOOP
            INSERT INTO public.order_items (
                order_id, product_id, product_name, quantity, unit_price
            )
            VALUES (
                v_order_id, item_row.id, item_row.name, item_row.quantity, item_row.price
            );

            UPDATE public.marketplace_products AS products
            SET quantity_available = products.quantity_available - item_row.quantity
            WHERE products.id = item_row.id
              AND products.status = 'Available'
              AND products.quantity_available >= item_row.quantity;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'A product no longer has enough stock'
                    USING ERRCODE = '22023';
            END IF;
        END LOOP;

        INSERT INTO public.payments (
            order_id, amount, method, status, is_simulated, reference
        )
        VALUES (
            v_order_id,
            v_order_total,
            p_payment_method,
            'PENDING',
            p_payment_method <> 'CASH',
            LEFT(p_idempotency_key::TEXT, 8) || '-' || LEFT(v_order_id::TEXT, 8)
        );
    END LOOP;

    DELETE FROM public.cart_items WHERE public.cart_items.cart_id = v_cart_id;
    UPDATE public.carts SET updated_at = NOW() WHERE public.carts.id = v_cart_id;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(orders)), '[]'::JSONB),
           COALESCE(SUM(orders.total), 0)
    INTO v_orders_json, v_total_amount
    FROM public.orders AS orders
    WHERE orders.checkout_group = v_checkout_group;

    v_request_response := JSONB_BUILD_OBJECT(
        'checkout_group', v_checkout_group,
        'orders', v_orders_json,
        'total', v_total_amount,
        'payment_method', p_payment_method,
        'is_simulated', p_payment_method <> 'CASH'
    );

    UPDATE public.marketplace_checkout_requests AS requests
    SET response = v_request_response
    WHERE requests.buyer_id = p_buyer_id
      AND requests.idempotency_key = p_idempotency_key;

    RETURN v_request_response;
END;
$function$;

REVOKE ALL ON FUNCTION public.add_marketplace_cart_item(UUID, UUID, NUMERIC)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_marketplace_cart_item_quantity(UUID, UUID, NUMERIC)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_marketplace_cart(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_marketplace_cart_item(UUID, UUID, NUMERIC)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.set_marketplace_cart_item_quantity(UUID, UUID, NUMERIC)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.checkout_marketplace_cart(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
    TO service_role;
