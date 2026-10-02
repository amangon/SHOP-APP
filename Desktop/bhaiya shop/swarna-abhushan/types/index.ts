export interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name: string | null;
  firm_name?: string | null;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  status?: 'active' | 'inactive' | null;
  frames_name: string | null;
  photo_url?: string | null;
  role: 'user' | 'admin' | 'tech';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  short_description: string;
  full_description: string;
  metal_type: string | null;
  purity: string | null;
  weight: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  price?: number | null;
  original_price?: number | null;
  making_charges?: number | null;
  stock_quantity?: number;
  sku?: string | null;
  is_best_seller?: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface Favourite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  target_route: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ProductWithCategory extends Product {
  category?: Category | null;
}

export interface GoldRate {
  id: string;
  metal_name: string;
  purity: string;
  price: number;
  unit: string;
  effective_date: string;
  is_current: boolean;
  updated_at: string;
  previous_price?: number | null;
  price_difference?: number | null;
  price_difference_percent?: number | null;
}

export interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  is_public: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface GoldRateHistory {
  id: string;
  rate_id: string;
  metal_name: string;
  purity: string;
  price: number;
  unit: string;
  effective_date: string;
  recorded_at: string;
  created_by: string | null;
}

export interface RateHistoryPoint {
  price: number;
  recorded_at: string;
}

export type SettingKey = 'login_logo_url' | string;

export interface LoginLogoResponse {
  url: string | null;
}

export interface AuthState {
  user: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTech: boolean;
  canManageContent: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  lastRateUpdate: string | null;
}
