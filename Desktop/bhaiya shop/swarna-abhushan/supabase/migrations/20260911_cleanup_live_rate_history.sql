-- ============================================================
-- CLEANUP LIVE RATE HISTORY FOR GOLDAPI REWRITE
-- ============================================================
-- Removes obviously invalid rows and backfills missing columns.
-- Run this AFTER deploying the fixed provider code.

BEGIN;

-- 1. Delete rows with NULL price (produced by broken insertion paths)
DELETE FROM public.live_rate_history
WHERE price IS NULL;

-- 2. Delete invalid Silver rows
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

-- 3. Delete any gold rows with nonsensical values
DELETE FROM public.live_rate_history
WHERE
  metal IN ('gold24k', 'gold22k', 'gold18k')
  AND (
    price_per_gram IS NULL
    OR price_per_10_gram IS NULL
    OR price_per_gram <= 0
    OR price_per_10_gram <= 0
    OR price <= 0
  );

-- 4. Backfill missing columns for any remaining rows.
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

-- 5. Final invariant enforcement: price must equal price_per_10_gram
UPDATE public.live_rate_history
SET price = price_per_10_gram
WHERE price <> price_per_10_gram;

-- 6. Fix old purity default '999' to 'Silver' for silver rows
UPDATE public.live_rate_history
SET purity = 'Silver'
WHERE metal = 'silver' AND purity = '999';

COMMIT;
