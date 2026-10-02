-- ============================================================
-- CLEANUP INVALID SILVER HISTORY
-- ============================================================

-- Remove invalid silver rows
DELETE FROM public.live_rate_history
WHERE
  metal = 'silver'
  AND (
    price IS NULL
    OR price_per_gram IS NULL
    OR price_per_10_gram IS NULL
    OR price_per_gram <= 0
    OR price_per_10_gram <= 0
    OR price <= 0
  );

-- Backfill missing columns for any remaining rows that might still have nulls
UPDATE public.live_rate_history
SET
  price = COALESCE(price, price_per_10_gram),
  price_per_gram = COALESCE(price_per_gram, price / 10),
  price_per_10_gram = COALESCE(price_per_10_gram, price)
WHERE
  price IS NULL
  OR price_per_gram IS NULL
  OR price_per_10_gram IS NULL;
