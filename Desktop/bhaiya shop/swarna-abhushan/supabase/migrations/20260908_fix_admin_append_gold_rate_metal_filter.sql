CREATE OR REPLACE FUNCTION public.admin_append_gold_rate(
  p_rate_id UUID,
  p_metal_name TEXT,
  p_purity TEXT,
  p_price NUMERIC,
  p_unit TEXT,
  p_effective_date TIMESTAMPTZ
)
RETURNS public.gold_rates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_rate public.gold_rates;
  new_rate public.gold_rates;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can manage rates';
  END IF;

  IF p_rate_id IS NOT NULL THEN
    SELECT * INTO old_rate FROM public.gold_rates WHERE id = p_rate_id FOR UPDATE;
    IF old_rate.id IS NULL THEN RAISE EXCEPTION 'Rate not found'; END IF;
    INSERT INTO public.gold_rate_history (rate_id, metal_name, purity, price, unit, effective_date, recorded_at, created_by)
    VALUES (old_rate.id, old_rate.metal_name, old_rate.purity, old_rate.price, old_rate.unit, old_rate.effective_date, NOW(), auth.uid());
  END IF;

  UPDATE public.gold_rates
  SET is_current = FALSE, updated_at = NOW()
  WHERE metal_name = p_metal_name AND purity = p_purity AND is_current = TRUE;

  INSERT INTO public.gold_rates (metal_name, purity, price, unit, effective_date, is_current, updated_at)
  VALUES (p_metal_name, p_purity, p_price, p_unit, p_effective_date, TRUE, NOW())
  RETURNING * INTO new_rate;

  RETURN new_rate;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_append_gold_rate(UUID, TEXT, TEXT, NUMERIC, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_append_gold_rate(UUID, TEXT, TEXT, NUMERIC, TEXT, TIMESTAMPTZ) TO authenticated;
