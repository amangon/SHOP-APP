-- ============================================================
-- SWARNA ABHUSHAN
-- Complete Supabase schema + RLS + Storage
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ADMIN / TECH CHECK FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_tech()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
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
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================
-- 1. PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  frames_name TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'tech')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS frames_name TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'tech'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- ADMIN CHECK FUNCTION
-- SECURITY DEFINER avoids RLS recursion
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ============================================================
-- ADMIN / TECH CHECK FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_tech()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
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
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ============================================================
-- PROFILES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================
-- 2. CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin_or_tech())
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin_or_tech());


-- ============================================================
-- 3. PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  short_description TEXT,
  full_description TEXT,
  metal_type TEXT,
  purity TEXT,
  weight TEXT,
  image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin_or_tech())
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin_or_tech());


-- ============================================================
-- 4. GOLD RATES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gold_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metal_name TEXT NOT NULL,
  purity TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT '10g',
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gold_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view current gold rates" ON public.gold_rates;
DROP POLICY IF EXISTS "Anyone can view gold rates" ON public.gold_rates;
DROP POLICY IF EXISTS "Admins can view all gold rates" ON public.gold_rates;
DROP POLICY IF EXISTS "Admins can insert rates" ON public.gold_rates;
DROP POLICY IF EXISTS "Admins can update rates" ON public.gold_rates;
DROP POLICY IF EXISTS "Admins can delete rates" ON public.gold_rates;

CREATE POLICY "Anyone can view current gold rates"
ON public.gold_rates
FOR SELECT
USING (is_current = TRUE);

CREATE POLICY "Admins can view all gold rates"
ON public.gold_rates
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert rates"
ON public.gold_rates
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can update rates"
ON public.gold_rates
FOR UPDATE
TO authenticated
USING (public.is_admin_or_tech())
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can delete rates"
ON public.gold_rates
FOR DELETE
TO authenticated
USING (public.is_admin_or_tech());


-- ============================================================
-- 5. HOME BANNERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.home_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins can update banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON public.home_banners;

CREATE POLICY "Anyone can view active banners"
ON public.home_banners
FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can insert banners"
ON public.home_banners
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can update banners"
ON public.home_banners
FOR UPDATE
TO authenticated
USING (public.is_admin_or_tech())
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can delete banners"
ON public.home_banners
FOR DELETE
TO authenticated
USING (public.is_admin_or_tech());


-- ============================================================
-- 6. APP SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.app_settings;

CREATE POLICY "Anyone can view public settings"
ON public.app_settings
FOR SELECT
USING (is_public = TRUE);

CREATE POLICY "Admins can insert settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can update settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (public.is_admin_or_tech())
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can delete settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (public.is_admin_or_tech());


-- ============================================================
-- 7. TESTIMONIALS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;

CREATE POLICY "Anyone can view active testimonials"
ON public.testimonials
FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can insert testimonials"
ON public.testimonials
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
TO authenticated
USING (public.is_admin_or_tech())
WITH CHECK (public.is_admin_or_tech());

CREATE POLICY "Admins can delete testimonials"
ON public.testimonials
FOR DELETE
TO authenticated
USING (public.is_admin_or_tech());


-- ============================================================
-- 8. UPDATED_AT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_categories_updated_at ON public.categories;
CREATE TRIGGER handle_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_gold_rates_updated_at ON public.gold_rates;
CREATE TRIGGER handle_gold_rates_updated_at
BEFORE UPDATE ON public.gold_rates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_home_banners_updated_at ON public.home_banners;
CREATE TRIGGER handle_home_banners_updated_at
BEFORE UPDATE ON public.home_banners
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER handle_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER handle_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- 8. AUTO CREATE PROFILE AFTER SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    frames_name,
    photo_url,
    role
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'frames_name',
    NULL,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(
      EXCLUDED.full_name,
      public.profiles.full_name
    ),
    frames_name = COALESCE(
      EXCLUDED.frames_name,
      public.profiles.frames_name
    ),
    photo_url = COALESCE(
      EXCLUDED.photo_url,
      public.profiles.photo_url
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 9. CREATE PROFILES FOR EXISTING AUTH USERS
-- ============================================================

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  frames_name,
  photo_url,
  role
)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'frames_name',
  NULL,
  'user'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(
    EXCLUDED.full_name,
    public.profiles.full_name
  ),
  frames_name = COALESCE(
    EXCLUDED.frames_name,
    public.profiles.frames_name
  ),
  photo_url = COALESCE(
    EXCLUDED.photo_url,
    public.profiles.photo_url
  );


-- ============================================================
-- 10. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', TRUE),
  ('banner-images', 'banner-images', TRUE),
  ('brand-assets', 'brand-assets', TRUE),
  ('category-images', 'category-images', TRUE),
  ('profile-photos', 'profile-photos', TRUE)
ON CONFLICT (id)
DO UPDATE SET
  public = EXCLUDED.public;


-- ============================================================
-- STORAGE POLICIES (public read; admin/tech upload/update/delete)
-- ============================================================

-- Product images
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;

CREATE POLICY "Public read product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admin upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_admin_or_tech()
);

CREATE POLICY "Admin update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_admin_or_tech()
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_admin_or_tech()
);

CREATE POLICY "Admin delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_admin_or_tech()
);


-- Banner images
DROP POLICY IF EXISTS "Public read banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete banner images" ON storage.objects;

CREATE POLICY "Public read banner images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banner-images');

CREATE POLICY "Admin upload banner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banner-images'
  AND public.is_admin_or_tech()
);

CREATE POLICY "Admin update banner images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banner-images'
  AND public.is_admin_or_tech()
)
WITH CHECK (
  bucket_id = 'banner-images'
  AND public.is_admin_or_tech()
);

CREATE POLICY "Admin delete banner images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'banner-images'
  AND public.is_admin_or_tech()
);


-- Brand assets
DROP POLICY IF EXISTS "Public read brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin update brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete brand assets" ON storage.objects;

CREATE POLICY "Public read brand assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-assets');

CREATE POLICY "Admin upload brand assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.is_admin_or_tech()
);

CREATE POLICY "Admin update brand assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND public.is_admin_or_tech()
)
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.is_admin_or_tech()
);

CREATE POLICY "Admin delete brand assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND public.is_admin_or_tech()
);


-- Category images
DROP POLICY IF EXISTS "Public read category images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload category images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update category images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete category images" ON storage.objects;

CREATE POLICY "Public read category images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Admin upload category images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'category-images'
  AND public.is_admin_or_tech()
);

CREATE POLICY "Admin update category images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'category-images'
  AND public.is_admin_or_tech()
)
WITH CHECK (
  bucket_id = 'category-images'
  AND public.is_admin_or_tech()
);

CREATE POLICY "Admin delete category images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'category-images'
  AND public.is_admin_or_tech()
);


-- Profile photos
DROP POLICY IF EXISTS "Public read profile photos" ON storage.objects;
DROP POLICY IF EXISTS "User upload profile photo" ON storage.objects;
DROP POLICY IF EXISTS "User update profile photo" ON storage.objects;
DROP POLICY IF EXISTS "User delete profile photo" ON storage.objects;

CREATE POLICY "Public read profile photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "User upload profile photo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
);

CREATE POLICY "User update profile photo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
)
WITH CHECK (
  bucket_id = 'profile-photos'
);

CREATE POLICY "User delete profile photo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
);


-- ============================================================
-- 11. DEFAULT APP SETTING
-- ============================================================

INSERT INTO public.app_settings (
  setting_key,
  setting_value,
  is_public
)
VALUES (
  'login_logo_url',
  NULL,
  TRUE
)
ON CONFLICT (setting_key)
DO NOTHING;


-- ============================================================
-- 12. DEFAULT GOLD & SILVER RATES
-- ============================================================

INSERT INTO public.gold_rates (
  metal_name,
  purity,
  price,
  unit,
  effective_date,
  is_current
)
VALUES
  ('Gold 24K', '99.9%', 7250.00, '10g', NOW(), TRUE),
  ('Gold 22K', '91.6%', 6625.00, '10g', NOW(), TRUE),
  ('Gold 18K', '75.0%', 5450.00, '10g', NOW(), TRUE),
  ('Gold 14K', '58.5%', 4225.00, '10g', NOW(), TRUE),
  ('Silver', '99.9%', 980.00, 'kg', NOW(), TRUE),
  ('Silver', '99.9%', 110.00, '10g', NOW(), TRUE)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 12. DEFAULT CATEGORIES
-- ============================================================

INSERT INTO public.categories (
  name,
  is_active,
  display_order
)
VALUES
  ('Necklaces', TRUE, 1),
  ('Earrings', TRUE, 2),
  ('Bangles', TRUE, 3),
  ('Rings', TRUE, 4),
  ('Bridal Jewellery', TRUE, 5),
  ('Traditional Jewellery', TRUE, 6)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 13. DEFAULT TESTIMONIALS
-- ============================================================

INSERT INTO public.testimonials (
  customer_name,
  rating,
  review_text,
  is_active,
  display_order
)
VALUES
  ('Priya Sharma', 5, 'Exquisite craftsmanship and attention to detail. My wedding necklace is simply breathtaking.', TRUE, 1),
  ('Rajesh Kumar', 4, 'The quality of gold and finish is outstanding. Highly recommend Swarna Abhushan.', TRUE, 2),
  ('Anjali Mehta', 5, 'A masterpiece of traditional Indian jewellery. Every piece tells a story of heritage.', TRUE, 3)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 14. DEFAULT PRODUCTS (demo data)
-- ============================================================

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Meenakshi Temple Necklace',
  c.id,
  'Handcrafted temple jewellery necklace',
  'Exquisitely crafted with traditional South Indian temple design. This 22K gold necklace features intricate meenakari work and sparkling polki stones, perfect for weddings and special occasions.',
  'Gold',
  '22K / 91.6%',
  '45.2g',
  NULL,
  TRUE,
  TRUE,
  TRUE,
  1
FROM public.categories c
WHERE c.name = 'Necklaces'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Mangalsutra Classic',
  c.id,
  'Traditional married woman''s talisman',
  'A timeless mangalsutra with intricate gold work and a beautifully set diamond pendant. Crafted in 22K gold with premium finish.',
  'Gold',
  '22K / 91.6%',
  '12.5g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  2
FROM public.categories c
WHERE c.name = 'Necklaces'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Kundan Bridal Set',
  c.id,
  'Complete bridal jewellery ensemble',
  'An exquisite Kundan bridal set including necklace, earrings, and maang tikka. Features polki stones, pearls, and Meenakari work in 22K gold.',
  'Gold',
  '22K / 91.6%',
  '120.0g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  3
FROM public.categories c
WHERE c.name = 'Bridal Jewellery'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Polki Jhumkas',
  c.id,
  'Traditional dangling earrings',
  'Handcrafted polki jhumkas with kundan work. These elegant earrings feature traditional Indian design with sparkling stones and a perfect finish.',
  'Gold',
  '22K / 91.6%',
  '18.5g',
  NULL,
  FALSE,
  TRUE,
  TRUE,
  1
FROM public.categories c
WHERE c.name = 'Earrings'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Pearl Drop Earrings',
  c.id,
  'Elegant pearl and gold earrings',
  'Sophisticated earrings featuring freshwater pearls set in 18K gold with delicate handcrafted details. Perfect for both casual and formal wear.',
  'Gold',
  '18K / 75.0%',
  '8.2g',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  2
FROM public.categories c
WHERE c.name = 'Earrings'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Royal Bangles',
  c.id,
  'Traditional gold bangles set',
  'A stunning set of 6 royal gold bangles crafted in 22K gold with intricate etching work. Each bangle features traditional Jaipuri patterns.',
  'Gold',
  '22K / 91.6%',
  '85.0g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  1
FROM public.categories c
WHERE c.name = 'Bangles'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Kada Bracelet',
  c.id,
  'Men''s gold kada',
  'A bold and elegant gold kada for men, crafted in 22K gold with a smooth finish. Represents strength and tradition.',
  'Gold',
  '22K / 91.6%',
  '135.0g',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  2
FROM public.categories c
WHERE c.name = 'Bangles'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Diamond Solitaire Ring',
  c.id,
  'Classic solitaire engagement ring',
  'A timeless diamond solitaire ring in 18K gold. Features a brilliant-cut diamond set in a prong setting with a polished band.',
  'Gold',
  '18K / 75.0%',
  '3.2g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  1
FROM public.categories c
WHERE c.name = 'Rings'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Men''s Signet Ring',
  c.id,
  'Personalized signet ring',
  'A sophisticated signet ring in 22K gold with a flat surface perfect for engraving initials or a family crest.',
  'Gold',
  '22K / 91.6%',
  '8.5g',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  2
FROM public.categories c
WHERE c.name = 'Rings'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Jadau Haar',
  c.id,
  'Traditional jadau neckpiece',
  'A magnificent jadau haar featuring traditional Indian craftsmanship. Set with colored stones and pearls in 22K gold framework.',
  'Gold',
  '22K / 91.6%',
  '65.0g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  1
FROM public.categories c
WHERE c.name = 'Traditional Jewellery'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Temple Jada',
  c.id,
  'Bridal hair ornament',
  'An intricate temple jada for brides, crafted in 22K gold with traditional motifs and sparkling stones. Essential for South Indian brides.',
  'Gold',
  '22K / 91.6%',
  '28.0g',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  2
FROM public.categories c
WHERE c.name = 'Bridal Jewellery'
ON CONFLICT DO NOTHING;

-- Additional demo products
INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Pootharekulu Chain',
  c.id,
  'Delicate temple chain',
  'A lightweight temple chain inspired by traditional Pootharekulu designs. Perfect for daily wear with a touch of tradition.',
  'Gold',
  '22K / 91.6%',
  '3.5g',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  3
FROM public.categories c
WHERE c.name = 'Necklaces'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Jadau Choker',
  c.id,
  'Short traditional choker',
  'An elegant jadau choker set with traditional meenakari work. Features uncut diamonds and emeralds in a 22K gold frame.',
  'Gold',
  '22K / 91.6%',
  '18.0g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  4
FROM public.categories c
WHERE c.name = 'Necklaces'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Pearl Jhumkas',
  c.id,
  'Classic pearl earrings',
  'Timeless pearl jhumkas with gold detailing. These versatile earrings complement both traditional and contemporary attire.',
  'Gold',
  '22K / 91.6%',
  '12.0g',
  NULL,
  FALSE,
  TRUE,
  TRUE,
  3
FROM public.categories c
WHERE c.name = 'Earrings'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Kundan Studs',
  c.id,
  'Festive stud earrings',
  'Exquisite kundan stud earrings with diamond accents. Perfect for festive occasions and weddings.',
  'Gold',
  '18K / 75.0%',
  '5.5g',
  NULL,
  FALSE,
  TRUE,
  TRUE,
  4
FROM public.categories c
WHERE c.name = 'Earrings'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Temple Bangles',
  c.id,
  'Traditional temple bangles',
  'A pair of beautifully crafted temple bangles with traditional South Indian motifs. Made in 22K gold with a polished finish.',
  'Gold',
  '22K / 91.6%',
  '30.0g',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  3
FROM public.categories c
WHERE c.name = 'Bangles'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Meenakari Bangles',
  c.id,
  'Colorful enamel bangles',
  'Handcrafted meenakari bangles with intricate enamel work in vibrant colors. A perfect blend of tradition and artistry.',
  'Gold',
  '22K / 91.6%',
  '42.0g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  4
FROM public.categories c
WHERE c.name = 'Bangles'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Solitaire Ring',
  c.id,
  'Elegant diamond ring',
  'A stunning solitaire ring featuring a premium diamond in 18K white gold setting. The epitome of timeless elegance.',
  'Gold',
  '18K / 75.0%',
  '2.8g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  3
FROM public.categories c
WHERE c.name = 'Rings'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Cocktail Ring',
  c.id,
  'Statement cocktail ring',
  'A bold and beautiful cocktail ring with a stunning stone centerpiece set in 18K gold. Perfect for special evening events.',
  'Gold',
  '18K / 75.0%',
  '6.0g',
  NULL,
  FALSE,
  TRUE,
  TRUE,
  4
FROM public.categories c
WHERE c.name = 'Rings'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Bandhani Dupatta Set',
  c.id,
  'Traditional dupatta set',
  'An exquisite Bandhani dupatta set with 22K gold embroidery. Includes a beautiful neckpiece and matching earrings.',
  'Gold',
  '22K / 91.6%',
  '180.0g',
  NULL,
  TRUE,
  FALSE,
  TRUE,
  2
FROM public.categories c
WHERE c.name = 'Bridal Jewellery'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Kundan Maang Tikka',
  c.id,
  'Bridal forehead ornament',
  'An elegant kundan maang tikka for brides, featuring traditional design with sparkling stones and pearls.',
  'Gold',
  '22K / 91.6%',
  '15.0g',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  3
FROM public.categories c
WHERE c.name = 'Bridal Jewellery'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'Gold Waist Belt',
  c.id,
  'Traditional kamar band',
  'A traditional gold kamar band (waist belt) with intricate jali work. Perfect for classical dance performances and bridal wear.',
  'Gold',
  '22K / 91.6%',
  '55.0g',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  1
FROM public.categories c
WHERE c.name = 'Traditional Jewellery'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'VISIBLE TEST PRODUCT 1 - GOLD NECKLACE',
  c.id,
  'A test product to verify database insertion',
  'This is a test product to confirm products are being inserted correctly into the database. If you see this, the products table is working.',
  'Gold',
  '22K / 91.6%',
  '25.0g',
  NULL,
  TRUE,
  TRUE,
  TRUE,
  1
FROM public.categories c
WHERE c.name = 'Necklaces'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  name,
  category_id,
  short_description,
  full_description,
  metal_type,
  purity,
  weight,
  image_url,
  is_featured,
  is_new_arrival,
  is_active,
  display_order
)
SELECT
  'VISIBLE TEST PRODUCT 2 - SILVER BRACELET',
  c.id,
  'Another test product for verification',
  'This is a second test product to ensure multiple products can be inserted. Visible in both featured and new arrivals sections.',
  'Silver',
  '99.9%',
  '15.0g',
  NULL,
  TRUE,
  TRUE,
  TRUE,
  2
FROM public.categories c
WHERE c.name = 'Bangles'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 15. DEFAULT HOME BANNERS
-- ============================================================

INSERT INTO public.home_banners (
  title,
  subtitle,
  image_url,
  is_active,
  display_order
)
VALUES
  ('Elegance Crafted in Gold', 'Timeless jewellery for every celebration', NULL, TRUE, 1),
  ('Festive Collection 2026', 'Celebrate with our new arrivals', NULL, TRUE, 2)
ON CONFLICT DO NOTHING,


-- ============================================================
-- COMPLETE
-- ============================================================