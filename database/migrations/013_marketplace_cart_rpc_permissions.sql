-- The backend calls this RPC with its server-side service-role key.
-- Keep browser roles from calling it directly; cart ownership remains enforced
-- by the backend-authenticated buyer ID and the RPC's buyer_id parameter.
REVOKE ALL ON FUNCTION public.add_marketplace_cart_item(UUID, UUID, NUMERIC)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.add_marketplace_cart_item(UUID, UUID, NUMERIC)
    TO service_role;
