CREATE TABLE IF NOT EXISTS public.favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can add own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can remove own favourites" ON public.favourites;

CREATE POLICY "Users can view own favourites"
ON public.favourites FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can add own favourites"
ON public.favourites FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own favourites"
ON public.favourites FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON public.favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_product_id ON public.favourites(product_id);
