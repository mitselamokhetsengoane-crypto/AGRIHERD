CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    item_name VARCHAR(150),
    change_amount NUMERIC(10, 2),
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_created_at
    ON public.inventory_transactions(item_id, created_at DESC);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own inventory transactions"
    ON public.inventory_transactions;
CREATE POLICY "Users can access own inventory transactions"
    ON public.inventory_transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory
            WHERE inventory.id = inventory_transactions.item_id
              AND inventory.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inventory
            WHERE inventory.id = inventory_transactions.item_id
              AND inventory.user_id = auth.uid()
        )
    );

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
