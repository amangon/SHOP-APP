-- ============================================================
-- LIVE RATE HISTORY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.live_rate_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metal TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.live_rate_history ENABLE ROW LEVEL SECURITY;

-- Policies for live_rate_history
DROP POLICY IF EXISTS "Anyone can view live rate history" ON public.live_rate_history;
DROP POLICY IF EXISTS "Anyone can insert live rate history" ON public.live_rate_history;

CREATE POLICY "Anyone can view live rate history"
ON public.live_rate_history
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert live rate history"
ON public.live_rate_history
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_live_rate_history_metal_recorded_at ON public.live_rate_history(metal, recorded_at);
