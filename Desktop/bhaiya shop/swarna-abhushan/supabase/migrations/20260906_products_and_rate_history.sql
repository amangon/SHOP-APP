ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS making_charges NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;

CREATE POLICY "Anyone can view product images"
ON public.product_images FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.products
  WHERE products.id = product_images.product_id
    AND products.is_active = TRUE
));

CREATE POLICY "Admins can insert product images"
ON public.product_images FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can update product images"
ON public.product_images FOR UPDATE TO authenticated
USING (public.is_admin_or_tech())
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can delete product images"
ON public.product_images FOR DELETE TO authenticated
USING (public.is_admin_or_tech());

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
ON public.product_images(product_id, display_order);

CREATE INDEX IF NOT EXISTS idx_products_best_seller
ON public.products(is_best_seller) WHERE is_active = TRUE;
