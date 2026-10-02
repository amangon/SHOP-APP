-- ============================================================
-- LIVE RATE HISTORY TABLE - ADD MISSING COLUMNS
-- ============================================================

ALTER TABLE public.live_rate_history
  ADD COLUMN IF NOT EXISTS purity TEXT NOT NULL DEFAULT '999',
  ADD COLUMN IF NOT EXISTS price_per_gram DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_10_gram DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'Live market reference rate for Lucknow';

-- Update existing rows with default values
UPDATE public.live_rate_history
SET
  purity = COALESCE(purity, '999'),
  price_per_gram = COALESCE(price_per_gram, price),
  price_per_10_gram = COALESCE(price_per_10_gram, price * 10),
  source = COALESCE(source, 'Live market reference rate for Lucknow')
WHERE
  purity IS NULL
  OR price_per_gram IS NULL
  OR price_per_10_gram IS NULL
  OR source IS NULL;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_live_rate_history_metal_recorded_at ON public.live_rate_history(metal, recorded_at);
CREATE INDEX IF NOT EXISTS idx_live_rate_history_purity ON public.live_rate_history(purity);
