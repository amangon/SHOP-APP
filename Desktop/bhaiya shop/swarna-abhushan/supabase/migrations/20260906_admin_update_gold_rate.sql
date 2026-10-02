CREATE OR REPLACE FUNCTION public.admin_update_gold_rate(
  p_rate_id UUID,
  p_price NUMERIC,
  p_unit TEXT,
  p_effective_date TIMESTAMPTZ,
  p_is_current BOOLEAN
)
RETURNS public.gold_rates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_rate public.gold_rates;
  updated_rate public.gold_rates;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update rates';
  END IF;

  SELECT * INTO current_rate
  FROM public.gold_rates
  WHERE id = p_rate_id
  FOR UPDATE;

  IF current_rate.id IS NULL THEN
    RAISE EXCEPTION 'Rate not found';
  END IF;

  INSERT INTO public.gold_rate_history (
    rate_id,
    metal_name,
    purity,
    price,
    unit,
    effective_date,
    recorded_at,
    created_by
  ) VALUES (
    current_rate.id,
    current_rate.metal_name,
    current_rate.purity,
    current_rate.price,
    current_rate.unit,
    current_rate.effective_date,
    NOW(),
    auth.uid()
  );

  UPDATE public.gold_rates
  SET price = p_price,
      unit = p_unit,
      effective_date = p_effective_date,
      is_current = p_is_current,
      updated_at = NOW()
  WHERE id = p_rate_id
  RETURNING * INTO updated_rate;

  RETURN updated_rate;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_gold_rate(UUID, NUMERIC, TEXT, TIMESTAMPTZ, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_gold_rate(UUID, NUMERIC, TEXT, TIMESTAMPTZ, BOOLEAN) TO authenticated;
