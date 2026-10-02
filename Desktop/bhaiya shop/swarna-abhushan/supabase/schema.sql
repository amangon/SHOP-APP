-- Supabase Database Schema for Swarna Abhushan
-- Sync of supabase/migrations/20260905_complete_schema.sql
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================================================
-- PROFILES
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  frames_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'tech')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ===========================================================================
-- ADMIN / TECH CHECK FUNCTION
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.is_admin_or_tech()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'tech')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_tech() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_tech() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ===========================================================================
-- CATEGORIES
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (
  public.is_admin_or_tech()
);

-- ===========================================================================
-- PRODUCTS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  short_description TEXT,
  full_description TEXT,
  metal_type TEXT,
  purity TEXT,
  weight TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  price DECIMAL(12,2),
  original_price DECIMAL(12,2),
  making_charges DECIMAL(12,2),
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (
  public.is_admin_or_tech()
);

-- ===========================================================================
-- GOLD_RATES
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.gold_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metal_name TEXT NOT NULL,
  purity TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT '10g',
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_current BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.gold_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view gold rates" ON public.gold_rates;
DROP POLICY IF EXISTS "Admins can insert rates" ON public.gold_rates;
DROP POLICY IF EXISTS "Admins can update rates" ON public.gold_rates;
DROP POLICY IF EXISTS "Admins can delete rates" ON public.gold_rates;

CREATE POLICY "Anyone can view current gold rates" ON public.gold_rates FOR SELECT USING (is_current = true);
CREATE POLICY "Admins can view all gold rates" ON public.gold_rates FOR SELECT USING (
  public.is_admin()
);
CREATE POLICY "Admins can insert rates" ON public.gold_rates FOR INSERT WITH CHECK (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can update rates" ON public.gold_rates FOR UPDATE USING (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can delete rates" ON public.gold_rates FOR DELETE USING (
  public.is_admin_or_tech()
);

-- ===========================================================================
-- GOLD RATE HISTORY
-- ===========================================================================

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

-- ===========================================================================
-- RPC FUNCTION: admin_append_gold_rate
-- ===========================================================================
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

-- ===========================================================================
-- HOME_BANNERS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.home_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins can update banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON public.home_banners;

CREATE POLICY "Anyone can view active banners" ON public.home_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert banners" ON public.home_banners FOR INSERT WITH CHECK (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can update banners" ON public.home_banners FOR UPDATE USING (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can delete banners" ON public.home_banners FOR DELETE USING (
  public.is_admin_or_tech()
);

-- ===========================================================================
-- APP_SETTINGS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.app_settings;

CREATE POLICY "Anyone can view public settings" ON public.app_settings FOR SELECT USING (is_public = true OR setting_key = 'login_logo_url');
CREATE POLICY "Admins can insert settings" ON public.app_settings FOR INSERT WITH CHECK (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE USING (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can delete settings" ON public.app_settings FOR DELETE USING (
  public.is_admin_or_tech()
);

-- ===========================================================================
-- TESTIMONIALS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;

CREATE POLICY "Anyone can view active testimonials" ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert testimonials" ON public.testimonials FOR INSERT WITH CHECK (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can update testimonials" ON public.testimonials FOR UPDATE USING (
  public.is_admin_or_tech()
);
CREATE POLICY "Admins can delete testimonials" ON public.testimonials FOR DELETE USING (
  public.is_admin_or_tech()
);

-- ===========================================================================
-- FAVOURITES
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.favourites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can insert own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can delete own favourites" ON public.favourites;

CREATE POLICY "Users can view own favourites" ON public.favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favourites" ON public.favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favourites" ON public.favourites FOR DELETE USING (auth.uid() = user_id);

-- ===========================================================================
-- NOTIFICATIONS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_route TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  public.is_admin_or_tech()
);

-- ===========================================================================
-- TRIGGERS
-- ===========================================================================
-- Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, frames_name, photo_url, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'frames_name', NULL, 'user')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    frames_name = COALESCE(EXCLUDED.frames_name, public.profiles.frames_name),
    photo_url = COALESCE(EXCLUDED.photo_url, public.profiles.photo_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS handle_categories_updated_at ON public.categories;
CREATE TRIGGER handle_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS handle_home_banners_updated_at ON public.home_banners;
CREATE TRIGGER handle_home_banners_updated_at BEFORE UPDATE ON public.home_banners FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS handle_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER handle_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS handle_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER handle_testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS handle_gold_rates_updated_at ON public.gold_rates;
CREATE TRIGGER handle_gold_rates_updated_at BEFORE UPDATE ON public.gold_rates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================================================
-- STORAGE BUCKETS
-- ===========================================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', true),
  ('banner-images', 'banner-images', true),
  ('brand-assets', 'brand-assets', true),
  ('category-images', 'category-images', true),
  ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Storage policies for all buckets
DO $$
DECLARE
  bucket_id TEXT;
BEGIN
  FOR bucket_id IN VALUES ('product-images'), ('banner-images'), ('brand-assets'), ('category-images'), ('profile-photos') LOOP
    DROP POLICY IF EXISTS "Public read " || bucket_id ON storage.objects;
    DROP POLICY IF EXISTS "Admin upload " || bucket_id ON storage.objects;
    DROP POLICY IF EXISTS "Admin update " || bucket_id ON storage.objects;
    DROP POLICY IF EXISTS "Admin delete " || bucket_id ON storage.objects;

    EXECUTE 'CREATE POLICY "Public read ' || bucket_id || '" ON storage.objects FOR SELECT USING (bucket_id = ''' || bucket_id || ''')';
    EXECUTE 'CREATE POLICY "Admin upload ' || bucket_id || '" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''' || bucket_id || ''' AND public.is_admin_or_tech())';
    EXECUTE 'CREATE POLICY "Admin update ' || bucket_id || '" ON storage.objects FOR UPDATE USING (bucket_id = ''' || bucket_id || ''' AND public.is_admin_or_tech())';
    EXECUTE 'CREATE POLICY "Admin delete ' || bucket_id || '" ON storage.objects FOR DELETE USING (bucket_id = ''' || bucket_id || ''' AND public.is_admin_or_tech())';
  END LOOP;
END $$;

-- ===========================================================================
-- DEFAULT DATA
-- ===========================================================================
INSERT INTO public.gold_rates (metal_name, purity, price, unit, effective_date, is_current) VALUES
  ('Gold 24K', '99.9%', 7250.00, '10g', NOW(), true),
  ('Gold 22K', '91.6%', 6625.00, '10g', NOW(), true),
  ('Gold 18K', '75.0%', 5450.00, '10g', NOW(), true),
  ('Gold 14K', '58.5%', 4225.00, '10g', NOW(), true),
  ('Silver', '99.9%', 980.00, 'kg', NOW(), true),
  ('Silver', '99.9%', 110.00, '10g', NOW(), true)
ON CONFLICT DO NOTHING;

INSERT INTO public.app_settings (setting_key, setting_value, is_public) VALUES
   ('login_logo_url', NULL, true),
   ('app_name', 'Swarna Abhushan', true),
   ('hindi_brand_name', 'स्वरना अभूषण', true),
   ('english_brand_name', 'Swarna Abhushan', true),
   ('main_logo_url', NULL, true),
   ('splash_logo_url', NULL, true),
   ('brand_description', 'Premium gold and diamond jewellery crafted with traditional techniques and modern designs.', true),
   ('about_description', 'Swarna Abhushan is a renowned jewellery brand specializing in exquisite gold and diamond jewellery. Our pieces are crafted with attention to detail, blending traditional Indian craftsmanship with contemporary designs.', true),
   ('contact_email', 'info@swarnaabhushan.com', true),
   ('contact_phone', '+91-123-456-7890', true),
   ('whatsapp_number', '+91-123-456-7890', true),
   ('address', '123 Jewellery Street, Mumbai, Maharashtra 400001, India', true),
   ('facebook_url', 'https://facebook.com/swarnaabhushan', true),
   ('instagram_url', 'https://instagram.com/swarnaabhushan', true),
   ('twitter_url', 'https://twitter.com/swarnaabhushan', true),
   ('youtube_url', 'https://youtube.com/@swarnaabhushan', true),
   ('hero_brand_hindi', 'स्वर्ण आभूषण', true),
   ('hero_headline', 'Elegance Crafted in Gold', true),
   ('hero_subtitle', 'Discover timeless jewellery crafted with elegance, tradition and precision.', true),
   ('hero_cta_text', 'Explore Collection', true),
   ('section_live_rates_title', 'Live Rates', true),
   ('section_live_rates_subtitle', 'Real-time metal prices', true),
   ('section_explore_collections_title', 'Explore Collections', true),
   ('section_explore_collections_subtitle', 'Browse by category', true),
   ('section_featured_jewellery_title', 'Featured Jewellery', true),
   ('section_featured_jewellery_subtitle', 'Handpicked for you', true),
   ('section_new_arrivals_title', 'New Arrivals', true),
   ('section_new_arrivals_subtitle', 'Latest additions', true),
   ('section_testimonials_title', 'What Our Customers Say', true),
   ('section_testimonials_subtitle', 'Customer testimonials', true),
   ('section_about_title', 'About Swarna Abhushan', true),
   ('about_section_text', 'Swarna Abhushan brings you the finest collection of traditional and contemporary jewellery. Each piece is crafted with precision, using the highest quality gold and precious stones.', true),
   ('footer_text_hindi', 'स्वर्ण आभूषण', true),
   ('footer_text_english', 'Swarna Abhushan', true),
   ('footer_version', 'Version 1.0.0', true),
   ('visibility_hero', 'true', true),
   ('visibility_live_rates', 'true', true),
   ('visibility_explore_collections', 'true', true),
   ('visibility_featured_jewellery', 'true', true),
   ('visibility_new_arrivals', 'true', true),
   ('visibility_testimonials', 'true', true),
   ('visibility_about', 'true', true);
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.categories (name, is_active, display_order) VALUES
  ('Necklaces', true, 1),
  ('Earrings', true, 2),
  ('Bangles', true, 3),
  ('Rings', true, 4),
  ('Bridal Jewellery', true, 5),
  ('Traditional Jewellery', true, 6)
ON CONFLICT DO NOTHING;

INSERT INTO public.testimonials (customer_name, rating, review_text, is_active, display_order) VALUES
  ('Priya Sharma', 5, 'Exquisite craftsmanship and attention to detail. My wedding necklace is simply breathtaking.', true, 1),
  ('Rajesh Kumar', 4, 'The quality of gold and finish is outstanding. Highly recommend Swarna Abhushan.', true, 2),
  ('Anjali Mehta', 5, 'A masterpiece of traditional Indian jewellery. Every piece tells a story of heritage.', true, 3)
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- DEFAULT PRODUCTS (demo data)
-- ===========================================================================
INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Meenakshi Temple Necklace', c.id, 'Handcrafted temple jewellery necklace', 'Exquisitely crafted with traditional South Indian temple design. This 22K gold necklace features intricate meenakari work and sparkling polki stones, perfect for weddings and special occasions.', 'Gold', '22K / 91.6%', '45.2g', NULL, TRUE, TRUE, TRUE, 1
FROM public.categories c WHERE c.name = 'Necklaces' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Mangalsutra Classic', c.id, 'Traditional married woman''s talisman', 'A timeless mangalsutra with intricate gold work and a beautifully set diamond pendant. Crafted in 22K gold with premium finish.', 'Gold', '22K / 91.6%', '12.5g', NULL, TRUE, FALSE, TRUE, 2
FROM public.categories c WHERE c.name = 'Necklaces' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Kundan Bridal Set', c.id, 'Complete bridal jewellery ensemble', 'An exquisite Kundan bridal set including necklace, earrings, and maang tikka. Features polki stones, pearls, and Meenakari work in 22K gold.', 'Gold', '22K / 91.6%', '120.0g', NULL, TRUE, FALSE, TRUE, 3
FROM public.categories c WHERE c.name = 'Bridal Jewellery' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Polki Jhumkas', c.id, 'Traditional dangling earrings', 'Handcrafted polki jhumkas with kundan work. These elegant earrings feature traditional Indian design with sparkling stones and a perfect finish.', 'Gold', '22K / 91.6%', '18.5g', NULL, FALSE, TRUE, TRUE, 1
FROM public.categories c WHERE c.name = 'Earrings' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Pearl Drop Earrings', c.id, 'Elegant pearl and gold earrings', 'Sophisticated earrings featuring freshwater pearls set in 18K gold with delicate handcrafted details. Perfect for both casual and formal wear.', 'Gold', '18K / 75.0%', '8.2g', NULL, FALSE, FALSE, TRUE, 2
FROM public.categories c WHERE c.name = 'Earrings' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Royal Bangles', c.id, 'Traditional gold bangles set', 'A stunning set of 6 royal gold bangles crafted in 22K gold with intricate etching work. Each bangle features traditional Jaipuri patterns.', 'Gold', '22K / 91.6%', '85.0g', NULL, TRUE, FALSE, TRUE, 1
FROM public.categories c WHERE c.name = 'Bangles' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Kada Bracelet', c.id, 'Men''s gold kada', 'A bold and elegant gold kada for men, crafted in 22K gold with a smooth finish. Represents strength and tradition.', 'Gold', '22K / 91.6%', '135.0g', NULL, FALSE, FALSE, TRUE, 2
FROM public.categories c WHERE c.name = 'Bangles' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Diamond Solitaire Ring', c.id, 'Classic solitaire engagement ring', 'A timeless diamond solitaire ring in 18K gold. Features a brilliant-cut diamond set in a prong setting with a polished band.', 'Gold', '18K / 75.0%', '3.2g', NULL, TRUE, FALSE, TRUE, 1
FROM public.categories c WHERE c.name = 'Rings' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Men''s Signet Ring', c.id, 'Personalized signet ring', 'A sophisticated signet ring in 22K gold with a flat surface perfect for engraving initials or a family crest.', 'Gold', '22K / 91.6%', '8.5g', NULL, FALSE, FALSE, TRUE, 2
FROM public.categories c WHERE c.name = 'Rings' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Jadau Haar', c.id, 'Traditional jadau neckpiece', 'A magnificent jadau haar featuring traditional Indian craftsmanship. Set with colored stones and pearls in 22K gold framework.', 'Gold', '22K / 91.6%', '65.0g', NULL, TRUE, FALSE, TRUE, 1
FROM public.categories c WHERE c.name = 'Traditional Jewellery' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Temple Jada', c.id, 'Bridal hair ornament', 'An intricate temple jada for brides, crafted in 22K gold with traditional motifs and sparkling stones. Essential for South Indian brides.', 'Gold', '22K / 91.6%', '28.0g', NULL, FALSE, FALSE, TRUE, 2
FROM public.categories c WHERE c.name = 'Bridal Jewellery' ON CONFLICT DO NOTHING;

-- Additional demo products
INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Pootharekulu Chain', c.id, 'Delicate temple chain', 'A lightweight temple chain inspired by traditional Pootharekulu designs. Perfect for daily wear with a touch of tradition.', 'Gold', '22K / 91.6%', '3.5g', NULL, FALSE, FALSE, TRUE, 3
FROM public.categories c WHERE c.name = 'Necklaces' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Jadau Choker', c.id, 'Short traditional choker', 'An elegant jadau choker set with traditional meenakari work. Features uncut diamonds and emeralds in a 22K gold frame.', 'Gold', '22K / 91.6%', '18.0g', NULL, TRUE, FALSE, TRUE, 4
FROM public.categories c WHERE c.name = 'Necklaces' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Pearl Jhumkas', c.id, 'Classic pearl earrings', 'Timeless pearl jhumkas with gold detailing. These versatile earrings complement both traditional and contemporary attire.', 'Gold', '22K / 91.6%', '12.0g', NULL, FALSE, TRUE, TRUE, 3
FROM public.categories c WHERE c.name = 'Earrings' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Kundan Studs', c.id, 'Festive stud earrings', 'Exquisite kundan stud earrings with diamond accents. Perfect for festive occasions and weddings.', 'Gold', '18K / 75.0%', '5.5g', NULL, FALSE, TRUE, TRUE, 4
FROM public.categories c WHERE c.name = 'Earrings' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Temple Bangles', c.id, 'Traditional temple bangles', 'A pair of beautifully crafted temple bangles with traditional South Indian motifs. Made in 22K gold with a polished finish.', 'Gold', '22K / 91.6%', '30.0g', NULL, FALSE, FALSE, TRUE, 3
FROM public.categories c WHERE c.name = 'Bangles' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Meenakari Bangles', c.id, 'Colorful enamel bangles', 'Handcrafted meenakari bangles with intricate enamel work in vibrant colors. A perfect blend of tradition and artistry.', 'Gold', '22K / 91.6%', '42.0g', NULL, TRUE, FALSE, TRUE, 4
FROM public.categories c WHERE c.name = 'Bangles' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Solitaire Ring', c.id, 'Elegant diamond ring', 'A stunning solitaire ring featuring a premium diamond in 18K white gold setting. The epitome of timeless elegance.', 'Gold', '18K / 75.0%', '2.8g', NULL, TRUE, FALSE, TRUE, 3
FROM public.categories c WHERE c.name = 'Rings' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Cocktail Ring', c.id, 'Statement cocktail ring', 'A bold and beautiful cocktail ring with a stunning stone centerpiece set in 18K gold. Perfect for special evening events.', 'Gold', '18K / 75.0%', '6.0g', NULL, FALSE, TRUE, TRUE, 4
FROM public.categories c WHERE c.name = 'Rings' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Bandhani Dupatta Set', c.id, 'Traditional dupatta set', 'An exquisite Bandhani dupatta set with 22K gold embroidery. Includes a beautiful neckpiece and matching earrings.', 'Gold', '22K / 91.6%', '180.0g', NULL, TRUE, FALSE, TRUE, 2
FROM public.categories c WHERE c.name = 'Bridal Jewellery' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Kundan Maang Tikka', c.id, 'Bridal forehead ornament', 'An elegant kundan maang tikka for brides, featuring traditional design with sparkling stones and pearls.', 'Gold', '22K / 91.6%', '15.0g', NULL, FALSE, FALSE, TRUE, 3
FROM public.categories c WHERE c.name = 'Bridal Jewellery' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'Gold Waist Belt', c.id, 'Traditional kamar band', 'A traditional gold kamar band (waist belt) with intricate jali work. Perfect for classical dance performances and bridal wear.', 'Gold', '22K / 91.6%', '55.0g', NULL, FALSE, FALSE, TRUE, 1
FROM public.categories c WHERE c.name = 'Traditional Jewellery' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'VISIBLE TEST PRODUCT 1 - GOLD NECKLACE', c.id, 'A test product to verify database insertion', 'This is a test product to confirm products are being inserted correctly into the database. If you see this, the products table is working.', 'Gold', '22K / 91.6%', '25.0g', NULL, TRUE, TRUE, TRUE, 1
FROM public.categories c WHERE c.name = 'Necklaces' ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, category_id, short_description, full_description, metal_type, purity, weight, image_url, is_featured, is_new_arrival, is_active, display_order)
SELECT 'VISIBLE TEST PRODUCT 2 - SILVER BRACELET', c.id, 'Another test product for verification', 'This is a second test product to ensure multiple products can be inserted. Visible in both featured and new arrivals sections.', 'Silver', '99.9%', '15.0g', NULL, TRUE, TRUE, TRUE, 2
FROM public.categories c WHERE c.name = 'Bangles' ON CONFLICT DO NOTHING;

-- ===========================================================================
-- DEFAULT HOME BANNERS
-- ===========================================================================
INSERT INTO public.home_banners (title, subtitle, image_url, is_active, display_order) VALUES
  ('Elegance Crafted in Gold', 'Timeless jewellery for every celebration', NULL, TRUE, 1),
  ('Festive Collection 2026', 'Celebrate with our new arrivals', NULL, TRUE, 2)
ON CONFLICT DO NOTHING;
