-- ============================================================
-- GOLD RATE HISTORY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gold_rate_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate_id UUID REFERENCES public.gold_rates(id) ON DELETE CASCADE,
  metal_name TEXT NOT NULL,
  purity TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT '10g',
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.gold_rate_history ENABLE ROW LEVEL SECURITY;

-- Policies for gold_rate_history
DROP POLICY IF EXISTS "Anyone can view gold rate history" ON public.gold_rate_history;
DROP POLICY IF EXISTS "Admins can view all gold rate history" ON public.gold_rate_history;
DROP POLICY IF EXISTS "Admins can insert gold rate history" ON public.gold_rate_history;

CREATE POLICY "Anyone can view gold rate history"
ON public.gold_rate_history
FOR SELECT
USING (true);

CREATE POLICY "Admins can view all gold rate history"
ON public.gold_rate_history
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert gold rate history"
ON public.gold_rate_history
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_tech());

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gold_rate_history_rate_id ON public.gold_rate_history(rate_id);
CREATE INDEX IF NOT EXISTS idx_gold_rate_history_recorded_at ON public.gold_rate_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_gold_rate_history_metal_purity ON public.gold_rate_history(metal_name, purity);