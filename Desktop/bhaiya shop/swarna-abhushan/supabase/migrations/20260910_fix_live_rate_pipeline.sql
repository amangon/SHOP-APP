-- ============================================================
-- LIVE RATE PIPELINE FIX: cleanup invalid rows + backfill
-- ============================================================
-- Run this AFTER deploying the fixed provider code.
-- It removes rows produced by the broken normalization
-- and backfills any remaining NULL columns.

BEGIN;

-- 1. Delete rows where price IS NULL (produced by the broken insertion path)
DELETE FROM public.live_rate_history
WHERE price IS NULL;

-- 2. Delete invalid Silver rows produced by the broken conversion:
--    - Silver should never be <= 10 INR/g or <= 100 INR/10g
--    - Current market Silver is ~80-95 INR/g (≈800-950 INR/10g in base metals,
--      or ~8,000-9,500 INR/kg; either way <= 10/g and <= 100/10g is garbage)
DELETE FROM public.live_rate_history
WHERE
  metal = 'silver'
  AND (
    price_per_gram IS NULL
    OR price_per_10_gram IS NULL
    OR price_per_gram <= 10
    OR price_per_10_gram <= 100
    OR price <= 100
  );

-- 3. Backfill missing columns for any remaining rows.
--    Invariant: price MUST equal price_per_10_gram.
UPDATE public.live_rate_history
SET
  price_per_10_gram = COALESCE(
    NULLIF(price_per_10_gram, 0),
    price
  ),
  price_per_gram = COALESCE(
    NULLIF(price_per_gram, 0),
    ROUND(price / 10, 2)
  ),
  price = COALESCE(
    price,
    price_per_10_gram
  )
WHERE
  price IS NULL
  OR price_per_gram IS NULL
  OR price_per_gram = 0
  OR price_per_10_gram IS NULL
  OR price_per_10_gram = 0;

-- 4. Final invariant enforcement: price must equal price_per_10_gram
UPDATE public.live_rate_history
SET price = price_per_10_gram
WHERE price <> price_per_10_gram;

COMMIT;
