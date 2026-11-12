-- Non-destructive repair for marketplace checkout projects where the
-- uuid-ossp extension function is not installed in the public schema.
CREATE OR REPLACE FUNCTION public.checkout_marketplace_cart(
    p_buyer_id UUID,
    p_idempotency_key UUID,
    p_customer_name TEXT,
    p_phone TEXT,
    p_delivery_location TEXT,
    p_notes TEXT,
    p_payment_method TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_cart_id UUID;
    v_checkout_group UUID := pg_catalog.gen_random_uuid();
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
        RAISE EXCEPTION 'Invalid payment method';
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
        RAISE EXCEPTION 'Checkout request is already being processed';
    END IF;

    SELECT carts.id
    INTO v_cart_id
    FROM public.carts
    WHERE carts.buyer_id = p_buyer_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Your cart is empty';
    END IF;

    FOR seller_row IN
        SELECT DISTINCT products.seller_id
        FROM public.cart_items AS items
        JOIN public.marketplace_products AS products ON products.id = items.product_id
        WHERE items.cart_id = v_cart_id
        ORDER BY products.seller_id
    LOOP
        SELECT SUM(products.price * items.quantity)
        INTO v_order_total
        FROM public.cart_items AS items
        JOIN public.marketplace_products AS products ON products.id = items.product_id
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
            JOIN public.marketplace_products AS products ON products.id = items.product_id
            WHERE items.cart_id = v_cart_id
              AND products.seller_id = seller_row.seller_id
            ORDER BY products.id
        LOOP
            INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price)
            VALUES (v_order_id, item_row.id, item_row.name, item_row.quantity, item_row.price);

            UPDATE public.marketplace_products AS products
            SET quantity_available = products.quantity_available - item_row.quantity
            WHERE products.id = item_row.id
              AND products.status = 'Available'
              AND products.quantity_available >= item_row.quantity;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'A product no longer has enough stock';
            END IF;
        END LOOP;

        INSERT INTO public.payments (order_id, amount, method, status, is_simulated, reference)
        VALUES (
            v_order_id, v_order_total, p_payment_method, 'PENDING',
            p_payment_method <> 'CASH',
            LEFT(p_idempotency_key::TEXT, 8) || '-' || LEFT(v_order_id::TEXT, 8)
        );
    END LOOP;

    DELETE FROM public.cart_items WHERE cart_items.cart_id = v_cart_id;
    UPDATE public.carts SET updated_at = NOW() WHERE carts.id = v_cart_id;

    SELECT
        COALESCE(JSONB_AGG(TO_JSONB(orders)), '[]'::JSONB),
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
$$;
