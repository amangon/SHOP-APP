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
CREATE POLICY "Users can view own favourites" ON public.favourites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can add own favourites" ON public.favourites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove own favourites" ON public.favourites FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Users can view own contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins manage contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can send contact messages" ON public.contact_messages FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can view own contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage contact messages" ON public.contact_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.categories (name, image_url, is_active, display_order)
SELECT seed.name, seed.image_url, TRUE, seed.display_order
FROM (VALUES
  ('Rings', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900', 1),
  ('Necklaces', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900', 2),
  ('Earrings', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900', 3),
  ('Bracelets', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900', 4),
  ('Bangles', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900', 5),
  ('Pendants', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900', 6),
  ('Chains', 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=900', 7),
  ('Mangalsutra', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=900', 8),
  ('Gold Jewellery', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900', 9),
  ('Diamond Jewellery', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=900', 10)
) AS seed(name, image_url, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.name = seed.name);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS making_charges NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO public.products (
  name, category_id, short_description, full_description, metal_type, purity, weight,
  image_url, price, original_price, making_charges, stock_quantity, sku,
  is_featured, is_new_arrival, is_best_seller, is_active, display_order
)
SELECT seed.name, c.id, seed.short_description, seed.full_description, seed.metal_type, seed.purity, seed.weight,
  seed.image_url, seed.price, seed.original_price, seed.making_charges, seed.stock_quantity, seed.sku,
  seed.is_featured, seed.is_new_arrival, seed.is_best_seller, TRUE, seed.display_order
FROM (VALUES
  ('Royal Diamond Necklace', 'Necklaces', 'A brilliant diamond necklace for grand occasions.', 'Hand-finished 18K gold necklace with a refined diamond setting.', 'Gold', '18K', '18.4g', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200', 189000, 215000, 18000, 4, 'SA-NK-001', TRUE, TRUE, TRUE, 1),
  ('Traditional Gold Necklace', 'Necklaces', 'Classic 22K craftsmanship with timeless detailing.', 'A traditional handcrafted necklace designed for festive celebrations.', 'Gold', '22K', '24.8g', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200', 168500, 182000, 14500, 6, 'SA-NK-002', TRUE, FALSE, TRUE, 2),
  ('Diamond Drop Earrings', 'Earrings', 'Elegant diamond drops with a luminous finish.', 'Contemporary drop earrings in 18K gold with natural diamond accents.', 'Gold', '18K', '4.2g', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200', 48500, 56000, 5200, 9, 'SA-ER-001', TRUE, TRUE, TRUE, 3),
  ('Gold Jhumka Earrings', 'Earrings', 'A festive jhumka silhouette in polished 22K gold.', 'Detailed dome-shaped jhumkas with delicate hanging beads.', 'Gold', '22K', '8.6g', 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=1200', 62500, 71000, 6500, 8, 'SA-ER-002', FALSE, TRUE, TRUE, 4),
  ('Ruby Gold Ring', 'Rings', 'Rich ruby colour framed in warm yellow gold.', 'A statement 18K gold ring set with a vivid ruby centre stone.', 'Gold', '18K', '5.1g', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200', 38500, 45000, 4200, 7, 'SA-RG-001', TRUE, FALSE, TRUE, 5),
  ('Diamond Engagement Ring', 'Rings', 'A graceful solitaire-inspired engagement ring.', 'Minimal 18K gold setting with a brilliant diamond focal stone.', 'Gold', '18K', '3.8g', 'https://images.unsplash.com/photo-1603561596112-db8d5c1e3c50?w=1200', 89500, 104000, 8500, 5, 'SA-RG-002', TRUE, TRUE, TRUE, 6),
  ('Classic Gold Bracelet', 'Bracelets', 'Polished everyday bracelet with a refined profile.', 'A versatile 22K gold bracelet for daily wear and gifting.', 'Gold', '22K', '12.2g', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200', 82500, 93000, 7600, 5, 'SA-BR-001', FALSE, FALSE, TRUE, 7),
  ('Diamond Tennis Bracelet', 'Bracelets', 'A continuous line of sparkle for evening styling.', 'Elegant 18K gold tennis bracelet with carefully matched diamonds.', 'Gold', '18K', '14.6g', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1200', 246000, 279000, 22000, 2, 'SA-BR-002', TRUE, TRUE, TRUE, 8),
  ('Traditional Gold Mangalsutra', 'Mangalsutra', 'A modern interpretation of a cherished tradition.', '22K gold mangalsutra with a balanced black-bead chain and pendant.', 'Gold', '22K', '10.8g', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1200', 73500, 82000, 6800, 6, 'SA-MG-001', TRUE, FALSE, TRUE, 9),
  ('Premium Diamond Pendant', 'Pendants', 'A refined pendant designed to catch the light.', '18K gold pendant with a fine diamond halo and matching bail.', 'Gold', '18K', '3.1g', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200', 54500, 62000, 4800, 10, 'SA-PD-001', TRUE, TRUE, TRUE, 10),
  ('Classic Gold Chain', 'Chains', 'An everyday chain with enduring gold polish.', 'A lightweight 22K chain with secure clasp and clean links.', 'Gold', '22K', '15.5g', 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=1200', 98500, 109000, 8900, 7, 'SA-CH-001', FALSE, FALSE, TRUE, 11),
  ('Diamond Stud Earrings', 'Earrings', 'Essential diamond studs for every wardrobe.', 'Classic four-prong 18K gold diamond studs with secure backs.', 'Gold', '18K', '2.4g', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1200', 42000, 49000, 3900, 12, 'SA-ER-003', TRUE, TRUE, TRUE, 12),
  ('Antique Gold Bangle', 'Bangles', 'Heritage-inspired texture with a rich antique finish.', 'A broad 22K bangle with traditional hand-carved motifs.', 'Gold', '22K', '20.7g', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200', 139500, 154000, 12500, 4, 'SA-BG-001', FALSE, FALSE, TRUE, 13),
  ('Emerald Gold Pendant', 'Pendants', 'A graceful emerald accent in warm gold.', '18K gold pendant featuring a vivid emerald and diamond surround.', 'Gold', '18K', '4.6g', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200', 67500, 76000, 5900, 6, 'SA-PD-002', TRUE, TRUE, TRUE, 14),
  ('Luxury Wedding Necklace', 'Necklaces', 'A regal necklace created for the most memorable day.', 'A layered 22K bridal necklace with intricate motifs and polished finish.', 'Gold', '22K', '42.5g', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200', 298000, 335000, 26000, 2, 'SA-NK-003', TRUE, TRUE, TRUE, 15)
) AS seed(name, category_name, short_description, full_description, metal_type, purity, weight, image_url, price, original_price, making_charges, stock_quantity, sku, is_featured, is_new_arrival, is_best_seller, display_order)
JOIN public.categories c ON c.name = seed.category_name
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.sku = seed.sku OR p.name = seed.name);

INSERT INTO public.product_images (product_id, image_url, display_order)
SELECT p.id, p.image_url, 0
FROM public.products p
WHERE p.image_url IS NOT NULL
  AND p.sku LIKE 'SA-%'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images i WHERE i.product_id = p.id
  );

INSERT INTO public.gold_rates (metal_name, purity, price, unit, effective_date, is_current)
SELECT seed.metal_name, seed.purity, seed.price, seed.unit, NOW(), TRUE
FROM (VALUES ('Gold', '24K', 7250, 'gram'), ('Gold', '22K', 6650, 'gram'), ('Gold', '18K', 5450, 'gram'), ('Silver', '999', 92, 'gram')) AS seed(metal_name, purity, price, unit)
WHERE NOT EXISTS (SELECT 1 FROM public.gold_rates r WHERE r.metal_name = seed.metal_name AND r.purity = seed.purity AND r.is_current = TRUE);

INSERT INTO public.gold_rate_history (rate_id, metal_name, purity, price, unit, effective_date, recorded_at)
SELECT r.id, r.metal_name, r.purity, ROUND(r.price * factor, 2), r.unit, NOW() - interval '1 day', NOW() - interval '1 day'
FROM public.gold_rates r
CROSS JOIN (VALUES (0.982), (0.991), (1.008), (1.015), (0.997), (1.004), (1.011)) AS history(factor)
WHERE r.is_current = TRUE
  AND NOT EXISTS (SELECT 1 FROM public.gold_rate_history h WHERE h.rate_id = r.id);

DROP POLICY IF EXISTS "Anyone can view historical gold rates" ON public.gold_rates;
CREATE POLICY "Anyone can view historical gold rates"
ON public.gold_rates FOR SELECT
USING (TRUE);

INSERT INTO public.gold_rates (metal_name, purity, price, unit, effective_date, is_current)
SELECT r.metal_name, r.purity,
  ROUND(r.price * (1 - (day_number * 0.002)), 2),
  r.unit,
  NOW() - make_interval(days => day_number),
  FALSE
FROM public.gold_rates r
CROSS JOIN generate_series(1, 7) AS history(day_number)
WHERE r.is_current = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.gold_rates previous
    WHERE previous.purity = r.purity AND previous.is_current = FALSE
  );

INSERT INTO public.home_banners (title, subtitle, image_url, is_active, display_order)
SELECT seed.title, seed.subtitle, seed.image_url, TRUE, seed.display_order
FROM (VALUES
  ('Latest Gold Collection', 'Crafted for celebrations that stay with you.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600', 1),
  ('Wedding Jewellery Collection', 'Timeless details for your most beautiful moments.', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1600', 2),
  ('Exclusive Diamond Collection', 'A little more brilliance for every occasion.', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1600', 3)
) AS seed(title, subtitle, image_url, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.home_banners b WHERE b.title = seed.title);

INSERT INTO public.app_settings (setting_key, setting_value, is_public)
VALUES
  ('contact_phone', '+91 98765 43210', TRUE),
  ('contact_email', 'hello@swarnaabhushan.com', TRUE),
  ('shop_address', 'Main Market, Jaipur, Rajasthan', TRUE),
  ('business_hours', 'Mon - Sat, 10:00 AM - 7:00 PM', TRUE)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, is_public = TRUE;
